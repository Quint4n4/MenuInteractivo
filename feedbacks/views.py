from django.db import transaction
from django.db.models import Avg, Count, Q
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from accounts.permissions import IsStaffOrAdmin

from .models import Feedback
from orders.models import Order
from clinic.models import Device
from .serializers import CreateFeedbackSerializer, FeedbackSerializer


class PublicFeedbackViewSet(viewsets.ViewSet):
    """
    Public ViewSet for feedback (Kiosk/iPad)
    No authentication required - uses device_uid
    """
    permission_classes = [AllowAny]

    def create_feedback(self, request):
        """
        Create feedback for a patient assignment (all orders)
        POST /api/public/feedbacks/
        {
            "patient_assignment_id": 1,
            "product_ratings": {
                "1": {"1": 5, "2": 4},  # order_id: {product_id: rating (0-5)}
                "2": {"3": 5}
            },
            "staff_rating": 5,
            "stay_rating": 4,
            "comment": "Great service!" (optional)
        }
        """
        from clinic.models import PatientAssignment
        from catalog.models import Product
        
        serializer = CreateFeedbackSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        patient_assignment_id = serializer.validated_data['patient_assignment_id']
        product_ratings = serializer.validated_data['product_ratings']
        staff_rating = serializer.validated_data['staff_rating']
        stay_rating = serializer.validated_data['stay_rating']
        comment = serializer.validated_data.get('comment', '')

        try:
            with transaction.atomic():
                # Get and validate patient assignment
                patient_assignment = PatientAssignment.objects.select_related(
                    'patient', 'staff', 'room', 'device'
                ).get(id=patient_assignment_id, is_active=True)

                # Check if survey is enabled
                if not patient_assignment.survey_enabled:
                    return Response({
                        'error': 'Survey is not enabled for this patient assignment'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Check if feedback already exists for this assignment
                if Feedback.objects.filter(patient_assignment=patient_assignment).exists():
                    return Response({
                        'error': 'Feedback already submitted for this patient assignment'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Validate product_ratings structure and orders exist
                orders = Order.objects.filter(
                    patient_assignment=patient_assignment,
                    status='DELIVERED'
                ).prefetch_related('items')

                if not orders.exists():
                    return Response({
                        'error': 'No delivered orders found for this patient assignment'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Validate that all delivered orders have ratings
                for order in orders:
                    if str(order.id) not in product_ratings:
                        return Response({
                            'error': f'Missing ratings for order #{order.id}'
                        }, status=status.HTTP_400_BAD_REQUEST)

                # Create feedback
                feedback = Feedback.objects.create(
                    patient_assignment=patient_assignment,
                    room=patient_assignment.room,
                    patient=patient_assignment.patient,
                    staff=patient_assignment.staff,
                    product_ratings=product_ratings,
                    staff_rating=staff_rating,
                    stay_rating=stay_rating,
                    comment=comment if comment else None
                )
                
                # Automatically end patient assignment session after feedback is submitted
                patient_assignment.end_care()
                
                # Broadcast session ended to kiosk via WebSocket
                try:
                    if patient_assignment.device:
                        from channels.layers import get_channel_layer
                        from asgiref.sync import async_to_sync
                        channel_layer = get_channel_layer()
                        async_to_sync(channel_layer.group_send)(
                            f'device_{patient_assignment.device.id}',
                            {
                                'type': 'session_ended',
                                'assignment_id': patient_assignment.id,
                                'ended_at': patient_assignment.ended_at.isoformat(),
                            }
                        )
                except Exception as ws_error:
                    # Log but don't fail the request
                    print(f'WebSocket broadcast failed: {ws_error}')

                # Broadcast session ended to staff via WebSocket
                try:
                    from channels.layers import get_channel_layer
                    from asgiref.sync import async_to_sync
                    channel_layer = get_channel_layer()
                    async_to_sync(channel_layer.group_send)(
                        'staff_orders',
                        {
                            'type': 'patient_assignment_ended',
                            'assignment_id': patient_assignment.id,
                            'staff_id': patient_assignment.staff.id if patient_assignment.staff else None,
                            'ended_at': patient_assignment.ended_at.isoformat(),
                        }
                    )
                except Exception as ws_error:
                    # Log but don't fail the request
                    print(f'WebSocket broadcast to staff failed: {ws_error}')

                # Calculate and update product ratings averages
                self._update_product_ratings(product_ratings)

                return Response({
                    'success': True,
                    'message': '¡Gracias por tu feedback!',
                    'feedback': FeedbackSerializer(feedback).data
                }, status=status.HTTP_201_CREATED)

        except PatientAssignment.DoesNotExist:
            return Response({
                'error': 'Patient assignment not found or inactive'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _update_product_ratings(self, product_ratings):
        """
        Calculate and update product rating averages from all feedbacks
        product_ratings format: {order_id: {product_id: rating (0-5)}}
        """
        from catalog.models import Product
        
        # Get all unique product IDs from this feedback
        product_ids = set()
        for order_id, order_ratings in product_ratings.items():
            for product_id_str in order_ratings.keys():
                try:
                    product_ids.add(int(product_id_str))
                except (ValueError, TypeError):
                    continue

        # Update each product's rating average
        for product_id in product_ids:
            try:
                product = Product.objects.get(id=product_id)
                
                # Get all ratings for this product from all feedbacks
                all_ratings = []
                all_feedbacks = Feedback.objects.exclude(product_ratings={})
                
                for feedback in all_feedbacks:
                    # Extract ratings for this product from all orders in this feedback
                    for order_id, order_ratings in feedback.product_ratings.items():
                        product_id_str = str(product_id)
                        if product_id_str in order_ratings:
                            rating = order_ratings[product_id_str]
                            if rating is not None and 0 <= rating <= 5:
                                all_ratings.append(rating)
                
                # Calculate average
                if all_ratings:
                    avg_rating = sum(all_ratings) / len(all_ratings)
                    product.rating = round(avg_rating, 2)
                    product.rating_count = len(all_ratings)
                    product.save(update_fields=['rating', 'rating_count'])
            except Product.DoesNotExist:
                continue


class FeedbackManagementViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing feedback (Staff/Admin only)
    """
    serializer_class = FeedbackSerializer
    permission_classes = [IsStaffOrAdmin]
    queryset = Feedback.objects.all().select_related(
        'patient_assignment',
        'room',
        'patient',
        'staff'
    ).order_by('-created_at')

    def get_queryset(self):
        """
        Optionally filter feedbacks by query parameters
        """
        queryset = super().get_queryset()

        # Filter by staff rating
        staff_rating = self.request.query_params.get('staff_rating', None)
        if staff_rating:
            queryset = queryset.filter(staff_rating=staff_rating)
        
        # Filter by stay rating
        stay_rating = self.request.query_params.get('stay_rating', None)
        if stay_rating:
            queryset = queryset.filter(stay_rating=stay_rating)

        # Filter by staff
        staff_id = self.request.query_params.get('staff', None)
        if staff_id:
            queryset = queryset.filter(staff_id=staff_id)

        # Filter by room
        room_id = self.request.query_params.get('room', None)
        if room_id:
            queryset = queryset.filter(room_id=room_id)

        # Filter by date range
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)

        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)

        return queryset

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get feedback statistics
        GET /api/admin/feedbacks/stats/
        Returns:
        - Total feedbacks
        - Average rating
        - Today's feedbacks count
        - Response rate (feedbacks / delivered orders)
        - Rating distribution
        """
        # Get base queryset
        feedbacks = Feedback.objects.all()

        # Total feedbacks
        total_feedbacks = feedbacks.count()

        # Average staff and stay ratings
        avg_staff_rating = feedbacks.aggregate(avg=Avg('staff_rating'))['avg'] or 0
        avg_stay_rating = feedbacks.aggregate(avg=Avg('stay_rating'))['avg'] or 0
        # Calculate overall average (average of staff and stay ratings)
        if avg_staff_rating and avg_stay_rating:
            average_rating = (avg_staff_rating + avg_stay_rating) / 2
        elif avg_staff_rating:
            average_rating = avg_staff_rating
        elif avg_stay_rating:
            average_rating = avg_stay_rating
        else:
            average_rating = 0

        # Today's feedbacks
        today = timezone.now().date()
        today_start = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.min.time()))
        today_feedbacks = feedbacks.filter(created_at__gte=today_start).count()

        # Response rate calculation (based on patient assignments)
        from clinic.models import PatientAssignment
        total_ended_assignments = PatientAssignment.objects.filter(is_active=False).count()
        response_rate = (total_feedbacks / total_ended_assignments * 100) if total_ended_assignments > 0 else 0

        # Staff rating distribution
        staff_rating_distribution = {}
        for i in range(0, 6):
            count = feedbacks.filter(staff_rating=i).count()
            staff_rating_distribution[str(i)] = count

        # Stay rating distribution
        stay_rating_distribution = {}
        for i in range(0, 6):
            count = feedbacks.filter(stay_rating=i).count()
            stay_rating_distribution[str(i)] = count

        # Top rated staff
        top_staff = feedbacks.filter(staff__isnull=False).values(
            'staff__id',
            'staff__full_name'
        ).annotate(
            avg_rating=Avg('staff_rating'),
            feedback_count=Count('id')
        ).order_by('-avg_rating')[:5]

        # Recent trends (last 7 days)
        seven_days_ago = timezone.now() - timedelta(days=7)
        recent_feedbacks = feedbacks.filter(created_at__gte=seven_days_ago)
        recent_avg_staff = recent_feedbacks.aggregate(avg=Avg('staff_rating'))['avg'] or 0
        recent_avg_stay = recent_feedbacks.aggregate(avg=Avg('stay_rating'))['avg'] or 0

        return Response({
            'total_feedbacks': total_feedbacks,
            'average_rating': round(average_rating, 2),  # Overall average for compatibility
            'average_staff_rating': round(avg_staff_rating, 2),
            'average_stay_rating': round(avg_stay_rating, 2),
            'today_feedbacks': today_feedbacks,
            'response_rate': round(response_rate, 2),
            'staff_rating_distribution': staff_rating_distribution,
            'stay_rating_distribution': stay_rating_distribution,
            'top_staff': list(top_staff),
            'recent_average_staff': round(recent_avg_staff, 2),
            'recent_average_stay': round(recent_avg_stay, 2),
            'recent_feedbacks_count': recent_feedbacks.count()
        })
