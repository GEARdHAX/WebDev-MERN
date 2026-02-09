"""
API Views for the Credit Approval System.
"""

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import date
from dateutil.relativedelta import relativedelta

from .models import Customer, Loan
from .serializers import (
    CustomerRegistrationSerializer,
    CustomerRegistrationResponseSerializer,
    CheckEligibilityRequestSerializer,
    CheckEligibilityResponseSerializer,
    CreateLoanRequestSerializer,
    CreateLoanResponseSerializer,
    ViewLoanSerializer,
    ViewLoansListSerializer,
)
from .utils import (
    calculate_monthly_installment,
    calculate_credit_score,
    get_corrected_interest_rate,
    check_emi_constraint,
)


@api_view(['POST'])
def register_customer(request):
    """
    Register a new customer.
    
    POST /register
    
    Request Body:
        - first_name: First Name of customer (string)
        - last_name: Last Name of customer (string)
        - age: Age of customer (int)
        - monthly_income: Monthly income of individual (int)
        - phone_number: Phone number (int)
    
    Response:
        - customer_id: Id of customer (int)
        - name: Name of customer (string)
        - age: Age of customer (int)
        - monthly_income: Monthly income (int)
        - approved_limit: Approved credit limit (int)
        - phone_number: Phone number (int)
    """
    serializer = CustomerRegistrationSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    customer = serializer.save()
    response_serializer = CustomerRegistrationResponseSerializer(customer)
    
    return Response(response_serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def check_eligibility(request):
    """
    Check loan eligibility based on credit score.
    
    POST /check-eligibility
    
    Request Body:
        - customer_id: Id of customer (int)
        - loan_amount: Requested loan amount (float)
        - interest_rate: Interest rate on loan (float)
        - tenure: Tenure of loan in months (int)
    
    Response:
        - customer_id: Id of customer (int)
        - approval: Can loan be approved (bool)
        - interest_rate: Interest rate on loan (float)
        - corrected_interest_rate: Corrected interest rate based on credit rating (float)
        - tenure: Tenure of loan (int)
        - monthly_installment: Monthly installment to be paid (float)
    """
    serializer = CheckEligibilityRequestSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    data = serializer.validated_data
    customer_id = data['customer_id']
    loan_amount = data['loan_amount']
    interest_rate = data['interest_rate']
    tenure = data['tenure']
    
    # Get customer or return 404
    try:
        customer = Customer.objects.get(customer_id=customer_id)
    except Customer.DoesNotExist:
        return Response(
            {'error': f'Customer with id {customer_id} not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Calculate credit score
    credit_score = calculate_credit_score(customer)
    
    # Get corrected interest rate based on credit score
    is_eligible, corrected_rate = get_corrected_interest_rate(
        credit_score, interest_rate
    )
    
    # Calculate monthly installment using the corrected rate
    monthly_installment = calculate_monthly_installment(
        loan_amount, corrected_rate, tenure
    )
    
    # Check EMI constraint (sum of all EMIs should not exceed 50% of salary)
    if is_eligible and not check_emi_constraint(customer, monthly_installment):
        is_eligible = False
    
    response_data = {
        'customer_id': customer_id,
        'approval': is_eligible,
        'interest_rate': interest_rate,
        'corrected_interest_rate': corrected_rate,
        'tenure': tenure,
        'monthly_installment': monthly_installment,
    }
    
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['POST'])
def create_loan(request):
    """
    Process a new loan based on eligibility.
    
    POST /create-loan
    
    Request Body:
        - customer_id: Id of customer (int)
        - loan_amount: Requested loan amount (float)
        - interest_rate: Interest rate on loan (float)
        - tenure: Tenure of loan in months (int)
    
    Response:
        - loan_id: Id of approved loan, null otherwise (int)
        - customer_id: Id of customer (int)
        - loan_approved: Is the loan approved (bool)
        - message: Appropriate message if loan is not approved (string)
        - monthly_installment: Monthly installment to be paid (float)
    """
    serializer = CreateLoanRequestSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    data = serializer.validated_data
    customer_id = data['customer_id']
    loan_amount = data['loan_amount']
    interest_rate = data['interest_rate']
    tenure = data['tenure']
    
    # Get customer or return 404
    try:
        customer = Customer.objects.get(customer_id=customer_id)
    except Customer.DoesNotExist:
        return Response(
            {'error': f'Customer with id {customer_id} not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Calculate credit score
    credit_score = calculate_credit_score(customer)
    
    # Get corrected interest rate based on credit score
    is_eligible, corrected_rate = get_corrected_interest_rate(
        credit_score, interest_rate
    )
    
    # Calculate monthly installment using the corrected rate
    monthly_installment = calculate_monthly_installment(
        loan_amount, corrected_rate, tenure
    )
    
    # Prepare rejection message
    rejection_message = ""
    
    if not is_eligible:
        rejection_message = f"Loan not approved due to low credit score ({credit_score})"
    
    # Check EMI constraint
    if is_eligible and not check_emi_constraint(customer, monthly_installment):
        is_eligible = False
        rejection_message = "Loan not approved: Total EMIs would exceed 50% of monthly salary"
    
    if is_eligible:
        # Create the loan
        start_date = date.today()
        end_date = start_date + relativedelta(months=tenure)
        
        loan = Loan.objects.create(
            customer=customer,
            loan_amount=loan_amount,
            tenure=tenure,
            interest_rate=corrected_rate,
            monthly_repayment=monthly_installment,
            emis_paid_on_time=0,
            start_date=start_date,
            end_date=end_date,
            is_approved=True
        )
        
        response_data = {
            'loan_id': loan.loan_id,
            'customer_id': customer_id,
            'loan_approved': True,
            'message': "Loan approved successfully",
            'monthly_installment': monthly_installment,
        }
    else:
        response_data = {
            'loan_id': None,
            'customer_id': customer_id,
            'loan_approved': False,
            'message': rejection_message,
            'monthly_installment': monthly_installment,
        }
    
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['GET'])
def view_loan(request, loan_id):
    """
    View loan details and customer details.
    
    GET /view-loan/<loan_id>
    
    Response:
        - loan_id: Id of approved loan (int)
        - customer: JSON containing id, first_name, last_name, phone_number, age
        - loan_amount: Loan amount (float)
        - interest_rate: Interest rate of the approved loan (float)
        - monthly_installment: Monthly installment to be paid (float)
        - tenure: Tenure of loan (int)
    """
    try:
        loan = Loan.objects.select_related('customer').get(loan_id=loan_id)
    except Loan.DoesNotExist:
        return Response(
            {'error': f'Loan with id {loan_id} not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = ViewLoanSerializer(loan)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
def view_loans_by_customer(request, customer_id):
    """
    View all current loan details by customer id.
    
    GET /view-loans/<customer_id>
    
    Response: List of loan items, each containing:
        - loan_id: Id of approved loan (int)
        - loan_amount: Loan amount (float)
        - interest_rate: Interest rate of the approved loan (float)
        - monthly_installment: Monthly installment to be paid (float)
        - repayments_left: Number of EMIs left (int)
    """
    # Check if customer exists
    try:
        customer = Customer.objects.get(customer_id=customer_id)
    except Customer.DoesNotExist:
        return Response(
            {'error': f'Customer with id {customer_id} not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get current loans (end_date >= today)
    current_date = timezone.now().date()
    loans = Loan.objects.filter(
        customer=customer,
        end_date__gte=current_date
    )
    
    serializer = ViewLoansListSerializer(loans, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)
