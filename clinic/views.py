from rest_framework import viewsets, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from accounts.permissions import IsStaffOrAdmin
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.db.models import Count, Avg

from .models import Room, Patient, Device, PatientAssignment
from .serializers import (
    RoomSerializer,
    PatientSerializer,
    PatientDetailSerializer,
    DeviceSerializer,
    PatientAssignmentSerializer,
    PatientAssignmentCreateSerializer
)


class RoomViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Room model
    Provides CRUD operations for rooms

    list: Get all rooms
    retrieve: Get a specific room
    create: Create a new room
    update: Update a room
    partial_update: Partially update a room
    destroy: Delete a room
    """
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [IsStaffOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'floor']
    search_fields = ['code', 'floor']
    ordering_fields = ['code', 'floor', 'created_at']
    ordering = ['code']


class PatientViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Patient model
    Provides CRUD operations for patients

    list: Get all patients
    retrieve: Get a specific patient
    create: Create a new patient
    update: Update a patient
    partial_update: Partially update a patient
    destroy: Delete a patient
    """
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsStaffOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['full_name', 'phone_e164', 'email']
    ordering_fields = ['full_name', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        """Use detailed serializer for list and retrieve"""
        if self.action in ['list', 'retrieve']:
            return PatientDetailSerializer
        return PatientSerializer

    @action(detail=True, methods=['get'])
    def orders(self, request, pk=None):
        """
        Get all orders for a patient
        GET /api/clinic/patients/{id}/orders/
        """
        from orders.serializers import OrderSerializer
        
        patient = self.get_object()
        orders = patient.orders.all().prefetch_related('items', 'items__product').order_by('-placed_at')
        
        serializer = OrderSerializer(orders, many=True)
        return Response({
            'success': True,
            'count': orders.count(),
            'orders': serializer.data
        })

    @action(detail=True, methods=['get'])
    def feedbacks(self, request, pk=None):
        """
        Get all feedbacks for a patient
        GET /api/clinic/patients/{id}/feedbacks/
        """
        from feedbacks.serializers import FeedbackSerializer
        
        patient = self.get_object()
        feedbacks = patient.feedbacks.all().select_related(
            'patient_assignment', 'room', 'staff'
        ).order_by('-created_at')
        
        serializer = FeedbackSerializer(feedbacks, many=True)
        return Response({
            'success': True,
            'count': feedbacks.count(),
            'feedbacks': serializer.data
        })

    @action(detail=True, methods=['get'])
    def assignments(self, request, pk=None):
        """
        Get all assignments for a patient
        GET /api/clinic/patients/{id}/assignments/
        """
        patient = self.get_object()
        assignments = patient.assignments.all().select_related(
            'staff', 'device', 'room'
        ).order_by('-started_at')
        
        serializer = PatientAssignmentSerializer(assignments, many=True)
        return Response({
            'success': True,
            'count': assignments.count(),
            'assignments': serializer.data
        })

    @action(detail=True, methods=['get'])
    def full_details(self, request, pk=None):
        """
        Get complete patient information including orders, feedbacks, and assignments
        GET /api/clinic/patients/{id}/full_details/
        """
        from orders.serializers import OrderSerializer
        from feedbacks.serializers import FeedbackSerializer
        
        patient = self.get_object()
        
        # Get orders
        orders = patient.orders.all().prefetch_related('items', 'items__product').order_by('-placed_at')
        
        # Get feedbacks
        feedbacks = patient.feedbacks.all().select_related(
            'patient_assignment', 'room', 'staff'
        ).order_by('-created_at')
        
        # Get assignments
        assignments = patient.assignments.all().select_related(
            'staff', 'device', 'room'
        ).order_by('-started_at')
        
        # Calculate statistics
        total_orders = orders.count()
        total_feedbacks = feedbacks.count()
        
        # Average ratings from feedbacks
        avg_staff_rating = feedbacks.aggregate(avg=Avg('staff_rating'))['avg'] or 0
        avg_stay_rating = feedbacks.aggregate(avg=Avg('stay_rating'))['avg'] or 0
        
        return Response({
            'patient': PatientDetailSerializer(patient).data,
            'statistics': {
                'total_orders': total_orders,
                'total_feedbacks': total_feedbacks,
                'total_assignments': assignments.count(),
                'avg_staff_rating': round(avg_staff_rating, 2),
                'avg_stay_rating': round(avg_stay_rating, 2),
            },
            'orders': OrderSerializer(orders[:10], many=True).data,  # Last 10 orders
            'feedbacks': FeedbackSerializer(feedbacks[:10], many=True).data,  # Last 10 feedbacks
            'assignments': PatientAssignmentSerializer(assignments[:10], many=True).data,  # Last 10 assignments
        })


class DeviceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Device model
    Provides CRUD operations for devices

    list: Get all devices
    retrieve: Get a specific device
    create: Create a new device
    update: Update a device
    partial_update: Partially update a device
    destroy: Delete a device
    """
    queryset = Device.objects.all()
    serializer_class = DeviceSerializer
    permission_classes = [IsStaffOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'device_type']
    search_fields = ['device_uid', 'device_type']
    ordering_fields = ['device_uid', 'last_seen_at', 'created_at']
    ordering = ['-last_seen_at']

    def get_queryset(self):
        """
        Optionally filter devices by assigned staff
        """
        queryset = super().get_queryset()

        # If 'my_devices' param is present, filter by current user's assigned devices
        if self.request.query_params.get('my_devices') == 'true':
            queryset = queryset.filter(assigned_staff=self.request.user)

        return queryset


class PatientAssignmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for PatientAssignment model
    Manages patient-staff-device-room assignments

    list: Get all patient assignments
    retrieve: Get a specific assignment
    create: Create a new patient assignment
    update: Update an assignment
    destroy: Delete an assignment
    """
    queryset = PatientAssignment.objects.select_related(
        'patient', 'staff', 'device', 'room'
    ).all()
    serializer_class = PatientAssignmentSerializer
    permission_classes = [IsStaffOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'staff', 'device', 'room', 'patient']
    search_fields = ['patient__full_name', 'patient__phone_e164', 'staff__full_name']
    ordering_fields = ['started_at', 'ended_at', 'created_at']
    ordering = ['-started_at']

    def get_serializer_class(self):
        """Use different serializer for create action"""
        if self.action == 'create':
            return PatientAssignmentCreateSerializer
        return PatientAssignmentSerializer

    def perform_create(self, serializer):
        """
        Create patient assignment and broadcast via WebSocket
        """
        assignment = serializer.save()

        # Broadcast new patient assignment to kiosk
        try:
            if assignment.device:
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f'device_{assignment.device.id}',
                    {
                        'type': 'patient_assigned',
                        'assignment_id': assignment.id,
                        'patient_id': assignment.patient.id,
                        'patient_name': assignment.patient.full_name,
                        'room_code': assignment.room.code if assignment.room else None,
                        'started_at': assignment.started_at.isoformat(),
                    }
                )
        except Exception as ws_error:
            # Log but don't fail the request
            print(f'WebSocket broadcast failed: {ws_error}')

    def get_queryset(self):
        """
        Optionally filter assignments by current staff member
        """
        queryset = super().get_queryset()

        # If 'my_assignments' param is present, filter by current user
        if self.request.query_params.get('my_assignments') == 'true':
            queryset = queryset.filter(staff=self.request.user)

        # If 'active_only' param is present, filter active assignments
        if self.request.query_params.get('active_only') == 'true':
            queryset = queryset.filter(is_active=True)

        return queryset

    @action(detail=False, methods=['get'])
    def my_active(self, request):
        """
        Get the current user's active patient assignment
        GET /api/clinic/patient-assignments/my_active/
        """
        assignment = PatientAssignment.objects.filter(
            staff=request.user,
            is_active=True
        ).select_related('patient', 'device', 'room').first()

        if not assignment:
            return Response(
                {'detail': 'No active patient assignment found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(assignment)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def end_care(self, request, pk=None):
        """
        End care for a patient assignment
        POST /api/clinic/patient-assignments/{id}/end_care/
        """
        assignment = self.get_object()

        # Check if assignment is already ended
        if not assignment.is_active:
            return Response(
                {'detail': 'This assignment has already ended'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if current user is the assigned staff
        if assignment.staff != request.user and not request.user.is_superuser:
            return Response(
                {'detail': 'You can only end your own patient assignments'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Store device info before ending care
        device_id = assignment.device.id if assignment.device else None

        # End the care
        assignment.end_care()

        # Broadcast session ended to kiosk
        try:
            if device_id:
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f'device_{device_id}',
                    {
                        'type': 'session_ended',
                        'assignment_id': assignment.id,
                        'ended_at': assignment.ended_at.isoformat(),
                    }
                )
        except Exception as ws_error:
            # Log but don't fail the request
            print(f'WebSocket broadcast failed: {ws_error}')

        # Broadcast session ended to staff via WebSocket
        try:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                'staff_orders',
                {
                    'type': 'patient_assignment_ended',
                    'assignment_id': assignment.id,
                    'staff_id': assignment.staff.id if assignment.staff else None,
                    'ended_at': assignment.ended_at.isoformat(),
                }
            )
        except Exception as ws_error:
            # Log but don't fail the request
            print(f'WebSocket broadcast to staff failed: {ws_error}')

        serializer = self.get_serializer(assignment)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def update_limits(self, request, pk=None):
        """
        Update order limits for a patient assignment
        PATCH /api/clinic/patient-assignments/{id}/update_limits/
        Body: {"DRINK": 1, "SNACK": 1}
        """
        assignment = self.get_object()

        # Check if assignment is active
        if not assignment.is_active:
            return Response(
                {'detail': 'Cannot update limits for an ended assignment'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if current user is the assigned staff
        if assignment.staff != request.user and not request.user.is_superuser:
            return Response(
                {'detail': 'You can only update limits for your own patient assignments'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get limits from request
        order_limits = request.data

        # Validate limits
        if not isinstance(order_limits, dict):
            return Response(
                {'detail': 'order_limits must be a dictionary'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Ensure DRINK and SNACK are integers
        for key in ['DRINK', 'SNACK']:
            if key in order_limits:
                try:
                    order_limits[key] = int(order_limits[key])
                    if order_limits[key] < 0:
                        return Response(
                            {'detail': f'{key} limit must be a non-negative integer'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                except (ValueError, TypeError):
                    return Response(
                        {'detail': f'{key} limit must be a valid integer'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

        # Update limits and reactivate patient orders
        assignment.order_limits = order_limits
        assignment.can_patient_order = True  # Reactivate patient orders when limits are updated
        assignment.save(update_fields=['order_limits', 'can_patient_order', 'updated_at'])

        # Broadcast limits update to kiosk
        try:
            if assignment.device:
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f'device_{assignment.device.id}',
                    {
                        'type': 'limits_updated',
                        'assignment_id': assignment.id,
                        'order_limits': order_limits,
                        'can_patient_order': True,
                    }
                )
        except Exception as ws_error:
            # Log but don't fail the request
            print(f'WebSocket broadcast failed: {ws_error}')

        serializer = self.get_serializer(assignment)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def enable_survey(self, request, pk=None):
        """
        Enable survey for a patient assignment
        POST /api/clinic/patient-assignments/{id}/enable_survey/
        This will block patient from creating new orders until survey is completed
        """
        from django.utils import timezone
        
        assignment = self.get_object()

        # Check if assignment is active
        if not assignment.is_active:
            return Response(
                {'detail': 'Cannot enable survey for an ended assignment'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if current user is the assigned staff
        if assignment.staff != request.user and not request.user.is_superuser:
            return Response(
                {'detail': 'You can only enable survey for your own patient assignments'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Enable survey and block patient orders
        assignment.survey_enabled = True
        assignment.survey_enabled_at = timezone.now()
        assignment.can_patient_order = False  # Block patient from creating new orders
        assignment.save(update_fields=['survey_enabled', 'survey_enabled_at', 'can_patient_order', 'updated_at'])

        # Broadcast survey enabled to kiosk
        try:
            if assignment.device:
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f'device_{assignment.device.id}',
                    {
                        'type': 'survey_enabled',
                        'assignment_id': assignment.id,
                        'patient_id': assignment.patient.id,
                        'survey_enabled': True,
                    }
                )
        except Exception as ws_error:
            # Log but don't fail the request
            print(f'WebSocket broadcast failed: {ws_error}')

        serializer = self.get_serializer(assignment)
        return Response(serializer.data)


# Public endpoints for Kiosk

@api_view(['GET'])
@permission_classes([AllowAny])
def get_active_patient_by_device(request, device_uid):
    """
    Get active patient assignment for a device (Public endpoint for Kiosk)
    GET /api/public/kiosk/device/{device_uid}/active-patient/

    Returns the patient currently assigned to this device.
    """
    try:
        # Get the device
        device = Device.objects.get(device_uid=device_uid, is_active=True)

        # Get the active patient assignment for this device
        assignment = PatientAssignment.objects.filter(
            device=device,
            is_active=True
        ).select_related('patient', 'room', 'staff').first()

        if not assignment:
            return Response({
                'error': 'No active patient assigned to this device',
                'device_uid': device_uid,
                'device_type': device.get_device_type_display(),
                'room_code': device.room.code if device.room else None
            }, status=status.HTTP_404_NOT_FOUND)

        # Return patient and assignment info
        return Response({
            'success': True,
            'device_uid': device_uid,
            'device_type': device.get_device_type_display(),
            'patient': {
                'id': assignment.patient.id,
                'full_name': assignment.patient.full_name,
                'phone': assignment.patient.phone_e164,
            },
            'room': {
                'code': assignment.room.code,
                'floor': assignment.room.floor
            },
            'staff': {
                'full_name': assignment.staff.full_name,
                'email': assignment.staff.email,
            },
            'id': assignment.id,
            'assignment_id': assignment.id,
            'started_at': assignment.started_at.isoformat(),
            'order_limits': assignment.order_limits or {},
            'survey_enabled': assignment.survey_enabled,
            'survey_enabled_at': assignment.survey_enabled_at.isoformat() if assignment.survey_enabled_at else None,
            'can_patient_order': assignment.can_patient_order,
        }, status=status.HTTP_200_OK)

    except Device.DoesNotExist:
        return Response({
            'error': 'Device not found or inactive',
            'device_uid': device_uid
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
