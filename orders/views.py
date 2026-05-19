import logging
from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from accounts.permissions import IsStaffOrAdmin
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)

from .models import Order, OrderItem, OrderStatusEvent
from catalog.models import Product
from clinic.models import Device, PatientAssignment
from inventory.models import InventoryBalance, InventoryMovement
from .serializers import (
    OrderSerializer,
    PublicOrderSerializer,
    CreateOrderSerializer,
    OrderStatusChangeSerializer,
    OrderCancelSerializer,
    StaffCreateOrderSerializer
)


class PublicOrderViewSet(viewsets.ViewSet):
    """
    Public ViewSet for orders (Kiosk/iPad)
    No authentication required - uses device_uid
    """
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'], url_path='create')
    def create_order(self, request):
        """
        Create a new order from kiosk
        POST /api/public/orders/create
        {
            "device_uid": "ipad-room-101",
            "items": [
                {"product_id": 1, "quantity": 2},
                {"product_id": 2, "quantity": 1}
            ]
        }
        """
        serializer = CreateOrderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        device_uid = serializer.validated_data['device_uid']
        items_data = serializer.validated_data['items']

        try:
            with transaction.atomic():
                # Get device and validate it's active
                device = Device.objects.select_for_update().get(device_uid=device_uid, is_active=True)

                # Get active patient assignment for this device
                from clinic.models import PatientAssignment
                patient_assignment = PatientAssignment.objects.filter(
                    device=device,
                    is_active=True
                ).select_related('patient', 'room').first()

                if not patient_assignment:
                    return Response({
                        'error': 'No active patient assigned to this device'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Check if patient can create orders
                if not patient_assignment.can_patient_order:
                    return Response({
                        'error': 'No puedes crear nuevas órdenes. Espera la confirmación de encuesta.',
                        'survey_enabled': patient_assignment.survey_enabled,
                        'can_patient_order': False
                    }, status=status.HTTP_403_FORBIDDEN)

                # Anti doble-envio (kiosko tactil): si ya existe una orden
                # identica (mismos productos/cantidades) para esta asignacion
                # creada hace muy poco, es un re-toque -> devolver esa orden
                # como exito en vez de duplicar. Igual filosofia que el fix
                # de doble-envio de la encuesta.
                recent_cutoff = timezone.now() - timedelta(seconds=30)
                requested_items = sorted(
                    (item['product_id'], item['quantity']) for item in items_data
                )
                recent_orders = Order.objects.filter(
                    patient_assignment=patient_assignment,
                    status='PLACED',
                    placed_at__gte=recent_cutoff,
                ).prefetch_related('items')
                for existing_order in recent_orders:
                    existing_items = sorted(
                        (oi.product_id, oi.quantity)
                        for oi in existing_order.items.all()
                    )
                    if existing_items == requested_items:
                        return Response({
                            'success': True,
                            'message': 'Orden duplicada ignorada',
                            'order': PublicOrderSerializer(existing_order).data,
                            'duplicate': True,
                        }, status=status.HTTP_200_OK)

                # Update device last_seen_at
                device.last_seen_at = timezone.now()
                device.save(update_fields=['last_seen_at'])

                # VALIDATE ORDER LIMITS BY CATEGORY TYPE
                order_limits = patient_assignment.order_limits or {}
                category_counts = {}

                # Count items by category type
                for item_data in items_data:
                    product = Product.objects.select_related('category').get(
                        id=item_data['product_id'],
                        is_active=True
                    )
                    category_type = product.category.category_type
                    if category_type not in category_counts:
                        category_counts[category_type] = 0
                    category_counts[category_type] += item_data['quantity']

                # Check against limits
                for category_type, count in category_counts.items():
                    max_allowed = order_limits.get(category_type, 999)  # 999 = no limit
                    if count > max_allowed:
                        category_label = {
                            'DRINK': 'bebidas',
                            'SNACK': 'snacks',
                            'OTHER': 'productos'
                        }.get(category_type, 'productos')

                        return Response({
                            'error': f'Has alcanzado tu límite de {category_label}. Máximo permitido: {max_allowed}',
                            'limit_reached': True,
                            'category_type': category_type,
                            'max_allowed': max_allowed,
                            'requested': count
                        }, status=status.HTTP_400_BAD_REQUEST)

                # Sort product IDs to acquire locks in deterministic order (avoid deadlocks)
                product_ids = sorted(set([item['product_id'] for item in items_data]))

                # Acquire locks on all products in sorted order
                products = {
                    p.id: p
                    for p in Product.objects.select_for_update().filter(
                        id__in=product_ids, is_active=True
                    ).select_related('category')
                }

                # Validate all requested products exist and are active
                for pid in product_ids:
                    if pid not in products:
                        raise Product.DoesNotExist()

                # Acquire locks on all inventory balances in sorted order
                balances = {
                    b.product_id: b
                    for b in InventoryBalance.objects.select_for_update().filter(
                        product_id__in=product_ids
                    )
                }

                # Ensure balances exist for all products (create if missing)
                for pid in product_ids:
                    if pid not in balances:
                        balance, _ = InventoryBalance.objects.select_for_update().get_or_create(
                            product=products[pid],
                            defaults={'on_hand': 0, 'reserved': 0}
                        )
                        balances[pid] = balance

                # Validate inventory availability for all items INSIDE the lock
                inventory_checks = []
                for item_data in items_data:
                    product = products[item_data['product_id']]
                    balance = balances[item_data['product_id']]
                    requested_qty = item_data['quantity']

                    available = balance.on_hand - balance.reserved
                    if available < requested_qty:
                        return Response({
                            'error': f'Insufficient inventory for {product.name}. Available: {available}, Requested: {requested_qty}'
                        }, status=status.HTTP_400_BAD_REQUEST)

                    inventory_checks.append({
                        'product': product,
                        'balance': balance,
                        'quantity': requested_qty
                    })

                # Reserve inventory INSIDE the same atomic block
                for check in inventory_checks:
                    check['balance'].reserved += check['quantity']
                    check['balance'].save(update_fields=['reserved', 'updated_at'])

                # Create order
                order = Order.objects.create(
                    assignment=device,
                    patient_assignment=patient_assignment,
                    patient=patient_assignment.patient,
                    room=patient_assignment.room,
                    status='PLACED'
                )

                # Create order items and inventory movements
                for check in inventory_checks:
                    product = check['product']
                    quantity = check['quantity']

                    # Create order item
                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        quantity=quantity,
                        unit_label=product.unit_label  # Snapshot unit_label
                    )

                    # Create inventory movement for reservation
                    InventoryMovement.objects.create(
                        product=product,
                        movement_type='RESERVE',
                        quantity=quantity,
                        order=order,
                        note=f'Reserved for order #{order.id}'
                    )

                # Create initial status event
                OrderStatusEvent.objects.create(
                    order=order,
                    from_status='',
                    to_status='PLACED',
                    note='Order placed from kiosk'
                )

                # Broadcast new order to staff via WebSocket
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    'staff_orders',
                    {
                        'type': 'new_order',
                        'order_id': order.id,
                        'room_code': order.room.code if order.room else None,
                        'device_uid': device.device_uid,
                        'placed_at': order.placed_at.isoformat(),
                    }
                )

                return Response({
                    'success': True,
                    'message': 'Order created successfully',
                    'order': PublicOrderSerializer(order).data
                }, status=status.HTTP_201_CREATED)

        except Device.DoesNotExist:
            return Response({
                'error': 'Device not found or inactive'
            }, status=status.HTTP_404_NOT_FOUND)
        except Product.DoesNotExist:
            return Response({
                'error': 'Product not found or inactive'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error('Error creating order from kiosk', exc_info=True)
            return Response({
                'error': 'Error interno del servidor. Intente nuevamente.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], url_path='active')
    def active_orders(self, request):
        """
        Get active orders for the current patient on this device.
        Only returns orders from the current patient assignment so that when
        a new patient is registered, previous patient's orders are not shown.
        GET /api/public/orders/active?device_uid=ipad-room-101
        """
        device_uid = request.query_params.get('device_uid')
        if not device_uid:
            return Response({
                'error': 'device_uid parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            device = Device.objects.get(device_uid=device_uid)

            # Get the active patient assignment for this device (only one at a time)
            active_assignment = PatientAssignment.objects.filter(
                device=device,
                is_active=True
            ).first()

            # If no active assignment (e.g. just registered new patient, or no patient), return no orders
            if not active_assignment:
                return Response({
                    'success': True,
                    'orders': []
                }, status=status.HTTP_200_OK)

            # Only orders belonging to this patient assignment (current session)
            orders = Order.objects.filter(
                assignment=device,
                patient_assignment=active_assignment,
                status__in=['PLACED', 'PREPARING', 'READY', 'DELIVERED']
            ).prefetch_related('items', 'items__product').order_by('-placed_at')

            return Response({
                'success': True,
                'orders': PublicOrderSerializer(orders, many=True, context={'request': request}).data
            }, status=status.HTTP_200_OK)

        except Device.DoesNotExist:
            return Response({
                'error': 'Device not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error('Error fetching active orders', exc_info=True)
            return Response({
                'error': 'Error interno del servidor. Intente nuevamente.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], url_path='by-assignment/(?P<assignment_id>[^/.]+)')
    def orders_by_assignment(self, request, assignment_id=None):
        """
        Get all delivered orders for a patient assignment
        GET /api/public/orders/by-assignment/{assignment_id}/
        """
        try:
            from clinic.models import PatientAssignment
            
            # Get patient assignment
            assignment = PatientAssignment.objects.select_related(
                'patient', 'device', 'room'
            ).get(id=assignment_id, is_active=True)
            
            # Get all delivered orders for this assignment
            orders = Order.objects.filter(
                patient_assignment=assignment,
                status='DELIVERED'
            ).prefetch_related('items', 'items__product').order_by('-delivered_at')
            
            serializer = PublicOrderSerializer(orders, many=True, context={'request': request})
            
            return Response({
                'success': True,
                'count': orders.count(),
                'orders': serializer.data
            }, status=status.HTTP_200_OK)
            
        except PatientAssignment.DoesNotExist:
            return Response({
                'error': 'Patient assignment not found or not active'
            }, status=status.HTTP_404_NOT_FOUND)
        except ValueError:
            return Response({
                'error': 'Invalid assignment ID'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error('Error fetching orders by assignment', exc_info=True)
            return Response({
                'error': 'Error interno del servidor. Intente nuevamente.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OrderManagementViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for managing orders (Staff only)
    """
    serializer_class = OrderSerializer
    permission_classes = [IsStaffOrAdmin]
    queryset = Order.objects.all().prefetch_related(
        'items',
        'items__product',
        'status_events',
        'assignment',
        'room',
        'patient'
    ).order_by('-placed_at')

    def get_queryset(self):
        """
        Filter orders based on staff's active patient assignment
        Superusers (admins) can see all orders without filtering
        """
        from clinic.models import PatientAssignment

        queryset = super().get_queryset()

        # Superusers can see all orders, no filtering needed
        if self.request.user.is_superuser:
            return queryset

        # If 'my_orders' param is present, filter by current user's active patient assignment
        if self.request.query_params.get('my_orders') == 'true':
            # Get the active patient assignment for this staff member
            active_assignment = PatientAssignment.objects.filter(
                staff=self.request.user,
                is_active=True
            ).first()

            if active_assignment:
                # Filter orders to only show those from the assigned patient's device
                queryset = queryset.filter(
                    assignment=active_assignment.device,
                    patient=active_assignment.patient
                )
            else:
                # If no active assignment, show no orders
                queryset = queryset.none()

        return queryset

    @action(detail=False, methods=['get'], url_path='queue')
    def order_queue(self, request):
        """
        Get orders in queue (PLACED or PREPARING)
        GET /api/orders/queue?status=PLACED,PREPARING&my_orders=true
        """
        status_filter = request.query_params.get('status', 'PLACED,PREPARING')
        statuses = [s.strip() for s in status_filter.split(',')]

        # Validate statuses
        valid_statuses = ['PLACED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']
        statuses = [s for s in statuses if s in valid_statuses]

        if not statuses:
            statuses = ['PLACED', 'PREPARING']

        # Use get_queryset() to apply my_orders filter
        orders = self.get_queryset().filter(status__in=statuses)

        page = self.paginate_queryset(orders)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], url_path='status')
    def change_status(self, request, pk=None):
        """
        Change order status
        PATCH /api/orders/{id}/status
        {
            "to_status": "PREPARING",
            "note": "Started preparing order"
        }
        """
        serializer = OrderStatusChangeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        to_status = serializer.validated_data['to_status']
        note = serializer.validated_data.get('note', '')

        try:
            with transaction.atomic():
                order = Order.objects.select_for_update().get(pk=pk)
                from_status = order.status

                # Validate status transition
                if from_status == 'DELIVERED':
                    return Response({
                        'error': 'Cannot change status of delivered order'
                    }, status=status.HTTP_400_BAD_REQUEST)

                if from_status == 'CANCELLED':
                    return Response({
                        'error': 'Cannot change status of cancelled order'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # If changing to DELIVERED, consume inventory
                if to_status == 'DELIVERED':
                    # Get all order items with products
                    items = order.items.select_related('product').all()

                    for item in items:
                        # Get inventory balance with lock
                        balance = InventoryBalance.objects.select_for_update().get(
                            product=item.product
                        )

                        # Consume inventory: reserved -= qty, on_hand -= qty
                        balance.reserved -= item.quantity
                        balance.on_hand -= item.quantity
                        balance.save(update_fields=['reserved', 'on_hand', 'updated_at'])

                        # Create inventory movement for consumption
                        InventoryMovement.objects.create(
                            product=item.product,
                            movement_type='CONSUME',
                            quantity=item.quantity,
                            order=order,
                            created_by=request.user if request.user.is_authenticated else None,
                            note=f'Consumed for order #{order.id} delivery'
                        )

                    order.delivered_at = timezone.now()

                    # Block patient from creating new orders when order is delivered
                    # Check if there are any other active orders (PLACED, PREPARING, READY)
                    from clinic.models import PatientAssignment
                    if order.patient_assignment:
                        other_active_orders = Order.objects.filter(
                            patient_assignment=order.patient_assignment,
                            status__in=['PLACED', 'PREPARING', 'READY']
                        ).exclude(id=order.id).exists()
                        
                        # Only block patient orders if there are no other active orders
                        if not other_active_orders:
                            order.patient_assignment.can_patient_order = False
                            order.patient_assignment.save(update_fields=['can_patient_order', 'updated_at'])

                # Update order status
                order.status = to_status

                # Update timestamps
                if to_status == 'CANCELLED':
                    order.cancelled_at = timezone.now()

                order.save(update_fields=['status', 'delivered_at', 'cancelled_at', 'updated_at'])

                # Create status event
                status_event = OrderStatusEvent.objects.create(
                    order=order,
                    from_status=from_status,
                    to_status=to_status,
                    changed_by=request.user if request.user.is_authenticated else None,
                    note=note
                )

                # Broadcast status change to kiosk via WebSocket
                if order.assignment:
                    channel_layer = get_channel_layer()
                    async_to_sync(channel_layer.group_send)(
                        f'device_{order.assignment.id}',
                        {
                            'type': 'order_status_changed',
                            'order_id': order.id,
                            'status': to_status,
                            'from_status': from_status,
                            'changed_at': status_event.changed_at.isoformat(),
                        }
                    )

                return Response({
                    'success': True,
                    'message': f'Order status changed from {from_status} to {to_status}',
                    'order': OrderSerializer(order).data
                }, status=status.HTTP_200_OK)

        except Order.DoesNotExist:
            return Response({
                'error': 'Order not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except InventoryBalance.DoesNotExist:
            return Response({
                'error': 'Inventory balance not found for one or more products'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            logger.error('Error changing order status', exc_info=True)
            return Response({
                'error': 'Error interno del servidor. Intente nuevamente.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel_order(self, request, pk=None):
        """
        Cancel an order
        POST /api/orders/{id}/cancel
        {
            "note": "Customer requested cancellation"
        }
        """
        serializer = OrderCancelSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        note = serializer.validated_data.get('note', '')

        try:
            with transaction.atomic():
                order = Order.objects.select_for_update().get(pk=pk)
                from_status = order.status

                # Validate can cancel
                if from_status == 'DELIVERED':
                    return Response({
                        'error': 'Cannot cancel delivered order'
                    }, status=status.HTTP_400_BAD_REQUEST)

                if from_status == 'CANCELLED':
                    return Response({
                        'error': 'Order is already cancelled'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Release reserved inventory
                items = order.items.select_related('product').all()

                for item in items:
                    # Get inventory balance with lock
                    balance = InventoryBalance.objects.select_for_update().get(
                        product=item.product
                    )

                    # Release reservation: reserved -= qty
                    balance.reserved -= item.quantity
                    balance.save(update_fields=['reserved', 'updated_at'])

                    # Create inventory movement for release
                    InventoryMovement.objects.create(
                        product=item.product,
                        movement_type='RELEASE',
                        quantity=item.quantity,
                        order=order,
                        created_by=request.user if request.user.is_authenticated else None,
                        note=f'Released from cancelled order #{order.id}'
                    )

                # Update order status
                order.status = 'CANCELLED'
                order.cancelled_at = timezone.now()
                order.save(update_fields=['status', 'cancelled_at', 'updated_at'])

                # Create status event
                status_event = OrderStatusEvent.objects.create(
                    order=order,
                    from_status=from_status,
                    to_status='CANCELLED',
                    changed_by=request.user if request.user.is_authenticated else None,
                    note=note or 'Order cancelled'
                )

                # Broadcast cancellation to kiosk via WebSocket
                if order.assignment:
                    channel_layer = get_channel_layer()
                    async_to_sync(channel_layer.group_send)(
                        f'device_{order.assignment.id}',
                        {
                            'type': 'order_status_changed',
                            'order_id': order.id,
                            'status': 'CANCELLED',
                            'from_status': from_status,
                            'changed_at': status_event.changed_at.isoformat(),
                        }
                    )

                return Response({
                    'success': True,
                    'message': 'Order cancelled successfully',
                    'order': OrderSerializer(order).data
                }, status=status.HTTP_200_OK)

        except Order.DoesNotExist:
            return Response({
                'error': 'Order not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except InventoryBalance.DoesNotExist:
            return Response({
                'error': 'Inventory balance not found for one or more products'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            logger.error('Error cancelling order', exc_info=True)
            return Response({
                'error': 'Error interno del servidor. Intente nuevamente.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='create-order')
    def create_order_for_patient(self, request, pk=None):
        """
        Staff creates an order for their assigned patient (no limits)
        POST /api/staff/patient-assignments/{id}/create-order/
        {
            "items": [
                {"product_id": 1, "quantity": 2},
                {"product_id": 3, "quantity": 1}
            ]
        }
        """
        serializer = StaffCreateOrderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        items = serializer.validated_data['items']

        try:
            with transaction.atomic():
                from clinic.models import PatientAssignment

                # Get the patient assignment
                assignment = PatientAssignment.objects.select_related(
                    'patient', 'staff', 'room', 'device'
                ).select_for_update().get(id=pk)

                # Validate assignment is active
                if not assignment.is_active:
                    return Response({
                        'error': 'Patient assignment is not active'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Validate staff owns this assignment (unless superuser)
                if assignment.staff != request.user and not request.user.is_superuser:
                    return Response({
                        'error': 'You can only create orders for your own assigned patients'
                    }, status=status.HTTP_403_FORBIDDEN)

                # Sort product IDs to acquire locks in deterministic order (avoid deadlocks)
                product_ids = sorted(set([item['product_id'] for item in items]))

                # Acquire locks on all products in sorted order
                products = {
                    p.id: p
                    for p in Product.objects.select_for_update().filter(
                        id__in=product_ids, is_active=True
                    ).select_related('category')
                }

                # Validate all requested products exist and are active
                for pid in product_ids:
                    if pid not in products:
                        raise Product.DoesNotExist()

                # Acquire locks on all inventory balances in sorted order
                balances = {
                    b.product_id: b
                    for b in InventoryBalance.objects.select_for_update().filter(
                        product_id__in=product_ids
                    )
                }

                # Validate inventory availability INSIDE the lock
                inventory_checks = []
                for item in items:
                    product = products[item['product_id']]
                    quantity = int(item['quantity'])
                    balance = balances.get(item['product_id'])

                    if balance:
                        available = balance.on_hand - balance.reserved
                        if available < quantity:
                            return Response({
                                'error': f'Insufficient inventory for {product.name}. Available: {available}, Requested: {quantity}'
                            }, status=status.HTTP_400_BAD_REQUEST)

                    inventory_checks.append({
                        'product': product,
                        'balance': balance,
                        'quantity': quantity,
                    })

                # Reserve inventory INSIDE the same atomic block
                for check in inventory_checks:
                    if check['balance']:
                        check['balance'].reserved += check['quantity']
                        check['balance'].save(update_fields=['reserved', 'updated_at'])

                # Create the order
                order = Order.objects.create(
                    assignment=assignment.device,
                    room=assignment.room,
                    patient=assignment.patient,
                    patient_assignment=assignment,
                    status='PLACED',
                    placed_at=timezone.now()
                )

                # Create order items and inventory movements
                for check in inventory_checks:
                    product = check['product']
                    quantity = check['quantity']

                    # Create order item
                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        quantity=quantity,
                        unit_label=product.unit_label
                    )

                    # Create inventory movement if product is tracked
                    if check['balance']:
                        InventoryMovement.objects.create(
                            product=product,
                            movement_type='RESERVE',
                            quantity=quantity,
                            order=order,
                            created_by=request.user,
                            note=f'Reserved for Order #{order.id} (created by staff)'
                        )

                # Create status event
                OrderStatusEvent.objects.create(
                    order=order,
                    from_status='',
                    to_status='PLACED',
                    changed_by=request.user,
                    note='Order created by staff for patient'
                )

                # Broadcast via WebSocket
                try:
                    channel_layer = get_channel_layer()
                    if channel_layer:
                        # Notify staff dashboard
                        async_to_sync(channel_layer.group_send)(
                            'staff_orders',
                            {
                                'type': 'new_order',
                                'order_id': order.id,
                                'room_code': assignment.room.code if assignment.room else None,
                                'device_uid': assignment.device.device_uid if assignment.device else None,
                                'placed_at': order.placed_at.isoformat()
                            }
                        )

                        # Notify kiosk (patient device) to redirect to order status
                        if assignment.device:
                            async_to_sync(channel_layer.group_send)(
                                f'device_{assignment.device.id}',
                                {
                                    'type': 'order_created_by_staff',
                                    'order_id': order.id,
                                    'placed_at': order.placed_at.isoformat()
                                }
                            )
                except Exception as ws_error:
                    # Log but don't fail the request
                    logger.error('WebSocket broadcast failed', exc_info=True)

                return Response({
                    'success': True,
                    'message': 'Order created successfully for patient',
                    'order': PublicOrderSerializer(order, context={'request': request}).data
                }, status=status.HTTP_201_CREATED)

        except PatientAssignment.DoesNotExist:
            return Response({
                'error': 'Patient assignment not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Product.DoesNotExist:
            return Response({
                'error': 'One or more products not found or inactive'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error('Error creating order for patient', exc_info=True)
            return Response({
                'error': 'Error interno del servidor. Intente nuevamente.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
