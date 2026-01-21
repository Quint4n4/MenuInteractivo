import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model
from clinic.models import Device

User = get_user_model()


class StaffOrderConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for staff to receive real-time order notifications
    Requires JWT authentication
    """

    async def connect(self):
        """
        Handle WebSocket connection
        Validates JWT token and adds user to staff_orders group
        """
        # Get token from query string
        token = self.scope['query_string'].decode().split('token=')[-1] if b'token=' in self.scope['query_string'] else None

        if not token:
            await self.close(code=4001)
            return

        # Validate token and get user
        user = await self.get_user_from_token(token)
        if not user:
            await self.close(code=4001)
            return

        # Check if user is staff or admin
        is_authorized = await self.check_user_authorization(user)
        if not is_authorized:
            await self.close(code=4003)
            return

        self.user = user
        self.group_name = 'staff_orders'

        # Join staff_orders group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        """
        Handle WebSocket disconnection
        """
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        """
        Handle incoming WebSocket messages (not used in this implementation)
        """
        pass

    async def new_order(self, event):
        """
        Handle new_order event from channel layer
        Send new order notification to WebSocket
        """
        await self.send(text_data=json.dumps({
            'type': 'new_order',
            'order_id': event['order_id'],
            'room_code': event.get('room_code'),
            'placed_at': event['placed_at'],
            'device_uid': event.get('device_uid'),
        }))

    async def order_updated(self, event):
        """
        Handle order_updated event from channel layer
        Send order update notification to WebSocket
        """
        await self.send(text_data=json.dumps({
            'type': 'order_updated',
            'order_id': event['order_id'],
            'status': event.get('status'),
            'from_status': event.get('from_status'),
            'changed_at': event.get('changed_at'),
        }))

    async def patient_assignment_ended(self, event):
        """
        Handle patient_assignment_ended event from channel layer
        Notifies staff that a patient assignment session has ended
        """
        await self.send(text_data=json.dumps({
            'type': 'patient_assignment_ended',
            'assignment_id': event.get('assignment_id'),
            'staff_id': event.get('staff_id'),
            'ended_at': event.get('ended_at'),
        }))

    @database_sync_to_async
    def get_user_from_token(self, token):
        """
        Validate JWT token and return user
        """
        try:
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            user = User.objects.get(id=user_id)
            return user
        except (InvalidToken, TokenError, User.DoesNotExist):
            return None

    @database_sync_to_async
    def check_user_authorization(self, user):
        """
        Check if user has staff or admin role
        """
        return user.has_role('STAFF') or user.has_role('ADMIN') or user.is_staff or user.is_superuser


class KioskOrderConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for kiosk/iPad to receive order status updates
    Uses device_uid for authentication (no JWT required)
    """

    async def connect(self):
        """
        Handle WebSocket connection
        Validates device_uid and adds to room-specific group
        """
        # Get device_uid from query string
        device_uid = self.scope['query_string'].decode().split('device_uid=')[-1] if b'device_uid=' in self.scope['query_string'] else None

        if not device_uid:
            await self.close(code=4001)
            return

        # Validate device and get room
        device = await self.get_device_and_validate(device_uid)
        if not device:
            await self.close(code=4001)
            return

        self.device = device
        self.device_uid = device_uid

        # Join device-specific group
        self.group_name = f'device_{device.id}'

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        """
        Handle WebSocket disconnection
        """
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        """
        Handle incoming WebSocket messages (not used in this implementation)
        """
        pass

    async def order_status_changed(self, event):
        """
        Handle order_status_changed event from channel layer
        Send status update to WebSocket
        """
        await self.send(text_data=json.dumps({
            'type': 'order_status_changed',
            'order_id': event['order_id'],
            'status': event['status'],
            'from_status': event.get('from_status'),
            'changed_at': event.get('changed_at'),
        }))

    async def order_created_by_staff(self, event):
        """
        Handle order_created_by_staff event from channel layer
        Notifies kiosk that staff created an order for the patient
        """
        await self.send(text_data=json.dumps({
            'type': 'order_created_by_staff',
            'order_id': event['order_id'],
            'placed_at': event.get('placed_at'),
        }))

    async def patient_assigned(self, event):
        """
        Handle patient_assigned event from channel layer
        Notifies kiosk that a new patient has been assigned
        """
        await self.send(text_data=json.dumps({
            'type': 'patient_assigned',
            'assignment_id': event['assignment_id'],
            'patient_id': event['patient_id'],
            'patient_name': event['patient_name'],
            'room_code': event.get('room_code'),
            'started_at': event.get('started_at'),
        }))

    async def limits_updated(self, event):
        """
        Handle limits_updated event from channel layer
        Notifies kiosk that order limits have been updated by staff
        """
        await self.send(text_data=json.dumps({
            'type': 'limits_updated',
            'assignment_id': event['assignment_id'],
            'order_limits': event['order_limits'],
        }))

    async def survey_enabled(self, event):
        """
        Handle survey_enabled event from channel layer
        Notifies kiosk that survey has been enabled by staff
        """
        await self.send(text_data=json.dumps({
            'type': 'survey_enabled',
            'assignment_id': event['assignment_id'],
            'patient_id': event.get('patient_id'),
            'survey_enabled': event.get('survey_enabled', True),
        }))

    async def session_ended(self, event):
        """
        Handle session_ended event from channel layer
        Notifies kiosk that the patient session has been ended by staff
        """
        await self.send(text_data=json.dumps({
            'type': 'session_ended',
            'assignment_id': event['assignment_id'],
            'ended_at': event.get('ended_at'),
        }))

    @database_sync_to_async
    def get_device_and_validate(self, device_uid):
        """
        Validate device_uid and return device if active
        """
        try:
            device = Device.objects.get(device_uid=device_uid, is_active=True)
            return device
        except Device.DoesNotExist:
            return None
