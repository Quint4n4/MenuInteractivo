# Generated manually

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('clinic', '0007_patientassignment_survey_fields'),
        ('feedbacks', '0003_rename_feedbacks_f_staff_i_idx_feedbacks_f_staff_i_5ee187_idx_and_more'),
    ]

    operations = [
        # First, add new fields with null=True to allow existing data
        migrations.AddField(
            model_name='feedback',
            name='patient_assignment',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='feedbacks', to='clinic.patientassignment', verbose_name='patient assignment'),
        ),
        migrations.AddField(
            model_name='feedback',
            name='product_ratings',
            field=models.JSONField(blank=True, default=dict, help_text='Ratings for products in each order: {order_id: {product_id: rating (0-5)}}', verbose_name='product ratings'),
        ),
        migrations.AddField(
            model_name='feedback',
            name='staff_rating',
            field=models.IntegerField(blank=True, help_text='Rating for staff interaction (0-5 stars)', null=True, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(5)], verbose_name='staff rating'),
        ),
        migrations.AddField(
            model_name='feedback',
            name='stay_rating',
            field=models.IntegerField(blank=True, help_text='Rating for stay experience (0-5 stars)', null=True, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(5)], verbose_name='stay rating'),
        ),
        # Then remove old fields
        migrations.RemoveField(
            model_name='feedback',
            name='order',
        ),
        migrations.RemoveField(
            model_name='feedback',
            name='satisfaction_rating',
        ),
        # Note: patient_assignment is kept as nullable to allow old feedbacks without assignment
        # New feedbacks should always have a patient_assignment, but we don't enforce it at DB level
        # to preserve existing data
    ]
