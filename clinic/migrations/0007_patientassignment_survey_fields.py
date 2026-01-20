# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('clinic', '0006_patient_email'),
    ]

    operations = [
        migrations.AddField(
            model_name='patientassignment',
            name='survey_enabled',
            field=models.BooleanField(default=False, help_text='Whether survey is enabled for this patient assignment', verbose_name='survey enabled'),
        ),
        migrations.AddField(
            model_name='patientassignment',
            name='survey_enabled_at',
            field=models.DateTimeField(blank=True, help_text='When the survey was enabled', null=True, verbose_name='survey enabled at'),
        ),
        migrations.AddField(
            model_name='patientassignment',
            name='can_patient_order',
            field=models.BooleanField(default=True, help_text='Whether patient can create new orders', verbose_name='can patient order'),
        ),
    ]
