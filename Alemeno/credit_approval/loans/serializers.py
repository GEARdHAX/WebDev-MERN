"""
Serializers for the Credit Approval System API.
"""

from rest_framework import serializers
from .models import Customer, Loan
from .utils import calculate_monthly_installment


class CustomerRegistrationSerializer(serializers.Serializer):
    """Serializer for customer registration request."""
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    age = serializers.IntegerField(min_value=18)
    monthly_income = serializers.IntegerField(min_value=0)
    phone_number = serializers.IntegerField()

    def create(self, validated_data):
        """Create a new customer with calculated approved limit."""
        monthly_income = validated_data['monthly_income']
        
        # Calculate approved limit: 36 * monthly_salary rounded to nearest lakh
        approved_limit_raw = 36 * monthly_income
        # Round to nearest lakh (100000)
        approved_limit = round(approved_limit_raw / 100000) * 100000
        
        customer = Customer.objects.create(
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            age=validated_data['age'],
            monthly_salary=monthly_income,
            approved_limit=approved_limit,
            phone_number=str(validated_data['phone_number']),
            current_debt=0
        )
        return customer


class CustomerRegistrationResponseSerializer(serializers.ModelSerializer):
    """Serializer for customer registration response."""
    name = serializers.SerializerMethodField()
    monthly_income = serializers.DecimalField(
        source='monthly_salary',
        max_digits=12,
        decimal_places=2
    )

    class Meta:
        model = Customer
        fields = [
            'customer_id',
            'name',
            'age',
            'monthly_income',
            'approved_limit',
            'phone_number'
        ]

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"


class CheckEligibilityRequestSerializer(serializers.Serializer):
    """Serializer for check eligibility request."""
    customer_id = serializers.IntegerField()
    loan_amount = serializers.FloatField(min_value=0)
    interest_rate = serializers.FloatField(min_value=0)
    tenure = serializers.IntegerField(min_value=1)


class CheckEligibilityResponseSerializer(serializers.Serializer):
    """Serializer for check eligibility response."""
    customer_id = serializers.IntegerField()
    approval = serializers.BooleanField()
    interest_rate = serializers.FloatField()
    corrected_interest_rate = serializers.FloatField()
    tenure = serializers.IntegerField()
    monthly_installment = serializers.FloatField()


class CreateLoanRequestSerializer(serializers.Serializer):
    """Serializer for create loan request."""
    customer_id = serializers.IntegerField()
    loan_amount = serializers.FloatField(min_value=0)
    interest_rate = serializers.FloatField(min_value=0)
    tenure = serializers.IntegerField(min_value=1)


class CreateLoanResponseSerializer(serializers.Serializer):
    """Serializer for create loan response."""
    loan_id = serializers.IntegerField(allow_null=True)
    customer_id = serializers.IntegerField()
    loan_approved = serializers.BooleanField()
    message = serializers.CharField(allow_blank=True)
    monthly_installment = serializers.FloatField()


class CustomerDetailSerializer(serializers.ModelSerializer):
    """Serializer for customer details in loan view."""
    
    class Meta:
        model = Customer
        fields = ['customer_id', 'first_name', 'last_name', 'phone_number', 'age']
        
    def to_representation(self, instance):
        """Rename customer_id to id in output."""
        data = super().to_representation(instance)
        data['id'] = data.pop('customer_id')
        return data


class ViewLoanSerializer(serializers.ModelSerializer):
    """Serializer for viewing a single loan with customer details."""
    customer = CustomerDetailSerializer()
    
    class Meta:
        model = Loan
        fields = [
            'loan_id',
            'customer',
            'loan_amount',
            'interest_rate',
            'monthly_repayment',
            'tenure'
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['monthly_installment'] = data.pop('monthly_repayment')
        return data


class ViewLoansListSerializer(serializers.ModelSerializer):
    """Serializer for viewing list of loans by customer."""
    repayments_left = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Loan
        fields = [
            'loan_id',
            'loan_amount',
            'interest_rate',
            'monthly_repayment',
            'repayments_left'
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['monthly_installment'] = data.pop('monthly_repayment')
        return data
