from rest_framework import serializers
from .models import Room, Patient, Device, PatientAssignment


class PatientDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for Patient with related orders and feedbacks
    """
    total_orders = serializers.SerializerMethodField()
    total_feedbacks = serializers.SerializerMethodField()
    assignments_count = serializers.SerializerMethodField()
    last_visit = serializers.SerializerMethodField()
    
    class Meta:
        model = Patient
        fields = [
            'id', 'full_name', 'phone_e164', 'email', 'is_active',
            'total_orders', 'total_feedbacks', 'assignments_count',
            'last_visit', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_total_orders(self, obj):
        """Get total orders count for this patient"""
        return obj.orders.count()
    
    def get_total_feedbacks(self, obj):
        """Get total feedbacks count for this patient"""
        return obj.feedbacks.count()
    
    def get_assignments_count(self, obj):
        """Get total assignments count"""
        return obj.assignments.count()
    
    def get_last_visit(self, obj):
        """Get last assignment date"""
        last_assignment = obj.assignments.order_by('-started_at').first()
        if last_assignment:
            return last_assignment.started_at.isoformat()
        return None


class RoomSerializer(serializers.ModelSerializer):
    """
    Serializer for Room model
    """
    class Meta:
        model = Room
        fields = ['id', 'code', 'floor', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class PatientSerializer(serializers.ModelSerializer):
    """
    Serializer for Patient model with phone validation
    """
    class Meta:
        model = Patient
        fields = ['id', 'full_name', 'phone_e164', 'email', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_email(self, value):
        """
        Convert empty string to None for optional email field
        """
        if value == '' or value is None:
            return None
        return value

    def validate_phone_e164(self, value):
        """
        Additional validation for phone number in E.164 format
        """
        # Remove whitespace
        value = value.strip()

        # Check it starts with +
        if not value.startswith('+'):
            raise serializers.ValidationError('Phone number must start with +')

        # Check it only contains + and digits
        if not all(c.isdigit() or c == '+' for c in value):
            raise serializers.ValidationError('Phone number can only contain + and digits')

        # Check length (E.164 allows max 15 digits after +)
        digits_only = value[1:]  # Remove +
        if len(digits_only) < 7 or len(digits_only) > 15:
            raise serializers.ValidationError('Phone number must have between 7 and 15 digits after +')

        return value


class DeviceSerializer(serializers.ModelSerializer):
    """
    Serializer for Device model
    """
    device_type_display = serializers.CharField(
        source='get_device_type_display',
        read_only=True
    )
    room_code = serializers.CharField(source='room.code', read_only=True, allow_null=True)
    assigned_staff_details = serializers.SerializerMethodField()

    class Meta:
        model = Device
        fields = [
            'id',
            'device_uid',
            'device_type',
            'device_type_display',
            'room',
            'room_code',
            'assigned_staff',
            'assigned_staff_details',
            'is_active',
            'last_seen_at',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_assigned_staff_details(self, obj):
        """Get details of assigned staff members"""
        return [
            {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name
            }
            for user in obj.assigned_staff.all()
        ]


class PatientAssignmentSerializer(serializers.ModelSerializer):
    """
    Serializer for PatientAssignment model with nested details
    """
    patient_details = PatientSerializer(source='patient', read_only=True)
    staff_details = serializers.SerializerMethodField()
    device_details = serializers.SerializerMethodField()
    room_details = RoomSerializer(source='room', read_only=True)

    class Meta:
        model = PatientAssignment
        fields = [
            'id',
            'patient',
            'patient_details',
            'staff',
            'staff_details',
            'device',
            'device_details',
            'room',
            'room_details',
            'order_limits',
            'survey_enabled',
            'survey_enabled_at',
            'can_patient_order',
            'is_active',
            'started_at',
            'ended_at',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'started_at', 'ended_at', 'created_at', 'updated_at']

    def get_staff_details(self, obj):
        """Get staff member details"""
        return {
            'id': obj.staff.id,
            'email': obj.staff.email,
            'full_name': obj.staff.full_name
        }

    def get_device_details(self, obj):
        """Get device details"""
        return {
            'id': obj.device.id,
            'device_uid': obj.device.device_uid,
            'device_type': obj.device.device_type,
            'device_type_display': obj.device.get_device_type_display()
        }

    def validate(self, attrs):
        """
        Validate that staff member is assigned to the device
        """
        staff = attrs.get('staff')
        device = attrs.get('device')

        if staff and device:
            if not device.assigned_staff.filter(id=staff.id).exists():
                raise serializers.ValidationError(
                    'Staff member is not assigned to this device'
                )

        return attrs


class PatientAssignmentCreateSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for creating patient assignments
    """
    class Meta:
        model = PatientAssignment
        fields = ['patient', 'staff', 'device', 'room']

    def validate(self, attrs):
        """
        Validate assignment constraints
        """
        staff = attrs.get('staff')
        device = attrs.get('device')
        room = attrs.get('room')

        # Check staff is assigned to device
        if staff and device:
            if not device.assigned_staff.filter(id=staff.id).exists():
                raise serializers.ValidationError(
                    'Staff member is not assigned to this device'
                )

        # Check device is in the specified room
        if device and room:
            if device.room_id != room.id:
                raise serializers.ValidationError(
                    'Device is not located in the specified room'
                )

        # Check if staff already has an active assignment
        if staff:
            active_assignment = PatientAssignment.objects.filter(
                staff=staff,
                is_active=True
            ).first()
            if active_assignment:
                raise serializers.ValidationError(
                    f'Staff member already has an active patient assignment: {active_assignment.patient.full_name}'
                )

        return attrs
