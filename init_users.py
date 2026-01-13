"""
Script to initialize users and roles on first deployment
This runs automatically and is idempotent (safe to run multiple times)
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinic_service.settings')
django.setup()

from django.contrib.auth import get_user_model
from accounts.models import Role, UserRole

User = get_user_model()

def init_users():
    print("=" * 60)
    print("INITIALIZING USERS AND ROLES")
    print("=" * 60)

    # Create roles if they don't exist
    admin_role, created = Role.objects.get_or_create(
        name='ADMIN',
        defaults={'description': 'Administrator with full access'}
    )
    if created:
        print('✓ Created ADMIN role')
    else:
        print('✓ ADMIN role already exists')

    staff_role, created = Role.objects.get_or_create(
        name='STAFF',
        defaults={'description': 'Staff member with limited access'}
    )
    if created:
        print('✓ Created STAFF role')
    else:
        print('✓ STAFF role already exists')

    # Create admin user if doesn't exist
    admin_email = 'admin@clinicacamsa.com'
    if not User.objects.filter(email=admin_email).exists():
        admin_user = User.objects.create_superuser(
            email=admin_email,
            password='AdminCamsa2024',
            full_name='Administrador CAMSA'
        )
        print(f'✓ Created admin user: {admin_email}')

        # Assign ADMIN role
        UserRole.objects.get_or_create(
            user=admin_user,
            role=admin_role
        )
        print(f'✓ Assigned ADMIN role to {admin_email}')
    else:
        admin_user = User.objects.get(email=admin_email)
        print(f'✓ Admin user already exists: {admin_email}')

        # Ensure admin has ADMIN role
        UserRole.objects.get_or_create(
            user=admin_user,
            role=admin_role
        )

    # Create 4 staff users (enfermeras)
    for i in range(1, 5):
        staff_email = f'enfermera{i}@clinicacamsa.com'
        if not User.objects.filter(email=staff_email).exists():
            staff_user = User.objects.create_user(
                email=staff_email,
                password='Enfermera2024',
                full_name=f'Enfermera {i}',
                is_staff=True
            )
            print(f'✓ Created staff user: {staff_email}')

            # Assign STAFF role
            UserRole.objects.get_or_create(
                user=staff_user,
                role=staff_role
            )
            print(f'✓ Assigned STAFF role to {staff_email}')
        else:
            print(f'✓ Staff user already exists: {staff_email}')

    print("\n" + "=" * 60)
    print("USER INITIALIZATION COMPLETE")
    print("=" * 60)
    print(f"\nTotal users: {User.objects.count()}")
    print(f"Admin users: {User.objects.filter(is_superuser=True).count()}")
    print(f"Staff users: {User.objects.filter(is_staff=True, is_superuser=False).count()}")
    print("\nCredentials:")
    print(f"  Admin: {admin_email} / AdminCamsa2024")
    print(f"  Staff: enfermera[1-4]@clinicacamsa.com / Enfermera2024")
    print("=" * 60 + "\n")

if __name__ == '__main__':
    init_users()
