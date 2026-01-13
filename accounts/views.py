from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .models import User, UserRole
from .serializers import LoginSerializer, UserDetailSerializer, UserSerializer
from .permissions import IsSuperAdmin


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    POST /api/auth/login
    Login with email and password, returns JWT tokens

    Request:
    {
        "email": "user@example.com",
        "password": "password123"
    }

    Response:
    {
        "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
        "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
        "user": {
            "id": 1,
            "email": "user@example.com",
            "full_name": "John Doe",
            "roles": ["staff"]
        }
    }
    """
    serializer = LoginSerializer(data=request.data, context={'request': request})

    try:
        serializer.is_valid(raise_exception=True)
    except Exception as e:
        return Response(
            {
                'error': 'Invalid credentials',
                'detail': str(e) if hasattr(e, 'detail') else 'Please check your email and password'
            },
            status=status.HTTP_401_UNAUTHORIZED
        )

    user = serializer.validated_data['user']

    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)

    # Prepare response
    user_serializer = UserDetailSerializer(user)

    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': user_serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """
    GET /api/auth/me
    Get current authenticated user information

    Headers:
    Authorization: Bearer <access_token>

    Response:
    {
        "id": 1,
        "email": "user@example.com",
        "full_name": "John Doe",
        "roles": ["staff"],
        "permissions": [...],
        "is_staff": true,
        "is_active": true,
        "date_joined": "2024-01-01T00:00:00.000Z",
        "last_login": "2024-01-15T10:30:00.000Z"
    }
    """
    serializer = UserDetailSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def init_database_view(request):
    """
    TEMPORARY ENDPOINT - Initialize database with default users and roles
    This endpoint should be removed after initial setup
    GET/POST /api/auth/init-db
    """
    from .models import Role

    result = {
        'roles_created': [],
        'users_created': [],
        'errors': []
    }

    try:
        # Create roles
        admin_role, created = Role.objects.get_or_create(
            name='ADMIN',
            defaults={'description': 'Administrator with full access'}
        )
        if created:
            result['roles_created'].append('ADMIN')

        staff_role, created = Role.objects.get_or_create(
            name='STAFF',
            defaults={'description': 'Staff member with limited access'}
        )
        if created:
            result['roles_created'].append('STAFF')

        # Create admin user
        admin_email = 'admin@clinicacamsa.com'
        if not User.objects.filter(email=admin_email).exists():
            admin_user = User.objects.create_superuser(
                email=admin_email,
                password='AdminCamsa2024',
                full_name='Administrador CAMSA'
            )
            UserRole.objects.get_or_create(user=admin_user, role=admin_role)
            result['users_created'].append(admin_email)

        # Create 4 staff users
        for i in range(1, 5):
            staff_email = f'enfermera{i}@clinicacamsa.com'
            if not User.objects.filter(email=staff_email).exists():
                staff_user = User.objects.create_user(
                    email=staff_email,
                    password='Enfermera2024',
                    full_name=f'Enfermera {i}',
                    is_staff=True
                )
                UserRole.objects.get_or_create(user=staff_user, role=staff_role)
                result['users_created'].append(staff_email)

        result['total_users'] = User.objects.count()
        result['message'] = 'Database initialized successfully'

        return Response(result, status=status.HTTP_200_OK)

    except Exception as e:
        result['errors'].append(str(e))
        return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    POST /api/auth/logout
    Logout user by blacklisting refresh token

    Request:
    {
        "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
    }

    Response:
    {
        "message": "Successfully logged out"
    }
    """
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        token = RefreshToken(refresh_token)
        token.blacklist()

        return Response(
            {'message': 'Successfully logged out'},
            status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {'error': 'Invalid token or token already blacklisted'},
            status=status.HTTP_400_BAD_REQUEST
        )


# Admin-only endpoints

class UserManagementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing users (superadmin only)
    Provides CRUD operations for staff/nurses

    list: Get all users
    retrieve: Get a specific user
    create: Create a new user
    update: Update a user
    partial_update: Partially update a user
    destroy: Delete a user
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'is_staff']
    search_fields = ['email', 'full_name', 'username']
    ordering_fields = ['date_joined', 'email', 'full_name']
    ordering = ['-date_joined']

    def create(self, request, *args, **kwargs):
        """Create a new user with password"""
        from .models import Role

        data = request.data.copy()
        password = data.pop('password', None)

        if not password:
            return Response(
                {'error': 'Password is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Set password
        user.set_password(password)
        user.save()

        # Add roles if provided
        roles = request.data.get('roles', [])
        if roles:
            for role_name in roles:
                # Get or create the Role object
                role_obj, created = Role.objects.get_or_create(name=role_name)
                UserRole.objects.create(user=user, role=role_obj, assigned_by=request.user)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'])
    def set_password(self, request, pk=None):
        """Set a new password for a user"""
        user = self.get_object()
        password = request.data.get('password')

        if not password:
            return Response(
                {'error': 'Password is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(password)
        user.save()

        return Response({'message': 'Password updated successfully'})

    @action(detail=True, methods=['post'])
    def assign_roles(self, request, pk=None):
        """Assign roles to a user"""
        from .models import Role

        user = self.get_object()
        roles = request.data.get('roles', [])

        if not roles:
            return Response(
                {'error': 'Roles array is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Remove existing roles
        UserRole.objects.filter(user=user).delete()

        # Add new roles
        for role_name in roles:
            # Get or create the Role object
            role_obj, created = Role.objects.get_or_create(name=role_name)
            UserRole.objects.create(user=user, role=role_obj, assigned_by=request.user)

        serializer = self.get_serializer(user)
        return Response(serializer.data)
