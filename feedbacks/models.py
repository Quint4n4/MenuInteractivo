from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from orders.models import Order
from clinic.models import Room, Patient, PatientAssignment


class Feedback(models.Model):
    """
    Feedback model for patient assignment ratings
    Each patient assignment can have one feedback with ratings for all orders
    """
    patient_assignment = models.ForeignKey(
        PatientAssignment,
        on_delete=models.CASCADE,
        related_name='feedbacks',
        null=True,
        blank=True,
        verbose_name=_('patient assignment'),
        help_text=_('The patient assignment this feedback is for')
    )
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='feedbacks',
        verbose_name=_('room'),
        help_text=_('The room where the orders were delivered')
    )
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='feedbacks',
        verbose_name=_('patient'),
        help_text=_('The patient who provided the feedback (optional)')
    )
    staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='received_feedbacks',
        verbose_name=_('staff member'),
        help_text=_('Staff member (nurse) who attended the orders')
    )
    # Product ratings: {order_id: {product_id: rating (0-5)}}
    product_ratings = models.JSONField(
        _('product ratings'),
        default=dict,
        blank=True,
        help_text=_('Ratings for products in each order: {order_id: {product_id: rating (0-5)}}')
    )
    # Staff interaction rating (0-5)
    staff_rating = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        verbose_name=_('staff rating'),
        help_text=_('Rating for staff interaction (0-5 stars)')
    )
    # Stay experience rating (0-5)
    stay_rating = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        verbose_name=_('stay rating'),
        help_text=_('Rating for stay experience (0-5 stars)')
    )
    comment = models.TextField(
        null=True,
        blank=True,
        verbose_name=_('comment'),
        help_text=_('Optional feedback comment')
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('created at')
    )

    class Meta:
        verbose_name = _('feedback')
        verbose_name_plural = _('feedbacks')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['room', '-created_at']),
            models.Index(fields=['staff', '-created_at']),
            models.Index(fields=['patient_assignment', '-created_at']),
        ]

    def __str__(self):
        staff_name = self.staff.full_name if self.staff else 'Unknown'
        return f'Feedback for Assignment #{self.patient_assignment.id} - Staff: {self.staff_rating}/5 - Stay: {self.stay_rating}/5 - Attended by {staff_name}'
