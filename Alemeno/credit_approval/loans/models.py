"""
Data models for the Credit Approval System.
"""

from django.db import models
from django.core.validators import MinValueValidator


class Customer(models.Model):
    """
    Customer model representing individuals who can apply for loans.
    """
    customer_id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    age = models.PositiveIntegerField(null=True, blank=True)
    phone_number = models.CharField(max_length=20)
    monthly_salary = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    approved_limit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    current_debt = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customers'
        ordering = ['customer_id']

    def __str__(self):
        return f"{self.first_name} {self.last_name} (ID: {self.customer_id})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class Loan(models.Model):
    """
    Loan model representing loans taken by customers.
    """
    loan_id = models.AutoField(primary_key=True)
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='loans'
    )
    loan_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    tenure = models.PositiveIntegerField(help_text="Loan tenure in months")
    interest_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    monthly_repayment = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    emis_paid_on_time = models.PositiveIntegerField(default=0)
    start_date = models.DateField()
    end_date = models.DateField()
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'loans'
        ordering = ['-start_date']

    def __str__(self):
        return f"Loan #{self.loan_id} - {self.customer.full_name}"

    @property
    def repayments_left(self):
        """Calculate the number of EMIs left to pay."""
        return max(0, self.tenure - self.emis_paid_on_time)

    @property
    def is_active(self):
        """Check if the loan is currently active (has remaining payments)."""
        from django.utils import timezone
        today = timezone.now().date()
        return self.end_date >= today and self.repayments_left > 0
