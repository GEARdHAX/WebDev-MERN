"""
Unit tests for the Credit Approval System.
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from decimal import Decimal
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta

from .models import Customer, Loan
from .utils import (
    calculate_monthly_installment,
    calculate_credit_score,
    get_corrected_interest_rate,
    check_emi_constraint,
)


class UtilityFunctionTests(TestCase):
    """Tests for utility functions."""

    def test_calculate_monthly_installment_with_interest(self):
        """Test EMI calculation with compound interest."""
        # Example: 100000 principal, 12% annual interest, 12 months tenure
        emi = calculate_monthly_installment(100000, 12, 12)
        # Expected EMI is approximately 8884.88
        self.assertAlmostEqual(emi, 8884.88, places=2)

    def test_calculate_monthly_installment_zero_interest(self):
        """Test EMI calculation with zero interest."""
        emi = calculate_monthly_installment(120000, 0, 12)
        self.assertEqual(emi, 10000.00)

    def test_get_corrected_interest_rate_high_score(self):
        """Test interest rate correction for high credit score (>50)."""
        is_eligible, rate = get_corrected_interest_rate(60, 8)
        self.assertTrue(is_eligible)
        self.assertEqual(rate, 8)

    def test_get_corrected_interest_rate_medium_score(self):
        """Test interest rate correction for medium credit score (30-50)."""
        is_eligible, rate = get_corrected_interest_rate(40, 8)
        self.assertTrue(is_eligible)
        self.assertEqual(rate, 12)  # Corrected to minimum 12%

    def test_get_corrected_interest_rate_low_score(self):
        """Test interest rate correction for low credit score (10-30)."""
        is_eligible, rate = get_corrected_interest_rate(20, 8)
        self.assertTrue(is_eligible)
        self.assertEqual(rate, 16)  # Corrected to minimum 16%

    def test_get_corrected_interest_rate_very_low_score(self):
        """Test interest rate correction for very low credit score (<=10)."""
        is_eligible, rate = get_corrected_interest_rate(5, 20)
        self.assertFalse(is_eligible)


class CustomerModelTests(TestCase):
    """Tests for Customer model."""

    def setUp(self):
        self.customer = Customer.objects.create(
            first_name="John",
            last_name="Doe",
            age=30,
            phone_number="1234567890",
            monthly_salary=50000,
            approved_limit=1800000,
            current_debt=0
        )

    def test_customer_creation(self):
        """Test customer creation."""
        self.assertEqual(self.customer.first_name, "John")
        self.assertEqual(self.customer.full_name, "John Doe")

    def test_customer_str(self):
        """Test customer string representation."""
        self.assertIn("John Doe", str(self.customer))


class LoanModelTests(TestCase):
    """Tests for Loan model."""

    def setUp(self):
        self.customer = Customer.objects.create(
            first_name="Jane",
            last_name="Smith",
            phone_number="9876543210",
            monthly_salary=75000,
            approved_limit=2700000,
            current_debt=0
        )
        self.loan = Loan.objects.create(
            customer=self.customer,
            loan_amount=500000,
            tenure=24,
            interest_rate=12,
            monthly_repayment=23536.74,
            emis_paid_on_time=10,
            start_date=date.today() - timedelta(days=300),
            end_date=date.today() + timedelta(days=430)
        )

    def test_loan_creation(self):
        """Test loan creation."""
        self.assertEqual(self.loan.loan_amount, 500000)
        self.assertEqual(self.loan.tenure, 24)

    def test_repayments_left(self):
        """Test repayments left calculation."""
        self.assertEqual(self.loan.repayments_left, 14)  # 24 - 10


class RegisterAPITests(APITestCase):
    """Tests for /register endpoint."""

    def test_register_customer_success(self):
        """Test successful customer registration."""
        data = {
            "first_name": "Test",
            "last_name": "User",
            "age": 25,
            "monthly_income": 50000,
            "phone_number": 9999999999
        }
        response = self.client.post('/register', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], "Test User")
        self.assertEqual(response.data['age'], 25)
        # 36 * 50000 = 1800000, rounded to nearest lakh = 1800000
        self.assertEqual(response.data['approved_limit'], 1800000)

    def test_register_customer_approved_limit_rounding(self):
        """Test that approved limit is rounded to nearest lakh."""
        data = {
            "first_name": "Test",
            "last_name": "User",
            "age": 25,
            "monthly_income": 55000,
            "phone_number": 9999999998
        }
        response = self.client.post('/register', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # 36 * 55000 = 1980000, rounded to nearest lakh = 2000000
        self.assertEqual(response.data['approved_limit'], 2000000)

    def test_register_customer_missing_fields(self):
        """Test registration with missing required fields."""
        data = {
            "first_name": "Test"
        }
        response = self.client.post('/register', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class CheckEligibilityAPITests(APITestCase):
    """Tests for /check-eligibility endpoint."""

    def setUp(self):
        self.customer = Customer.objects.create(
            first_name="Test",
            last_name="Customer",
            age=30,
            phone_number="1234567890",
            monthly_salary=100000,
            approved_limit=3600000,
            current_debt=0
        )

    def test_check_eligibility_new_customer(self):
        """Test eligibility check for customer with no loan history."""
        data = {
            "customer_id": self.customer.customer_id,
            "loan_amount": 500000,
            "interest_rate": 10,
            "tenure": 24
        }
        response = self.client.post('/check-eligibility', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('approval', response.data)
        self.assertIn('monthly_installment', response.data)

    def test_check_eligibility_customer_not_found(self):
        """Test eligibility check for non-existent customer."""
        data = {
            "customer_id": 99999,
            "loan_amount": 500000,
            "interest_rate": 10,
            "tenure": 24
        }
        response = self.client.post('/check-eligibility', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class CreateLoanAPITests(APITestCase):
    """Tests for /create-loan endpoint."""

    def setUp(self):
        self.customer = Customer.objects.create(
            first_name="Test",
            last_name="Customer",
            age=30,
            phone_number="1234567890",
            monthly_salary=100000,
            approved_limit=3600000,
            current_debt=0
        )

    def test_create_loan_success(self):
        """Test successful loan creation."""
        data = {
            "customer_id": self.customer.customer_id,
            "loan_amount": 200000,
            "interest_rate": 10,
            "tenure": 12
        }
        response = self.client.post('/create-loan', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['loan_approved'])
        self.assertIsNotNone(response.data['loan_id'])

    def test_create_loan_customer_not_found(self):
        """Test loan creation for non-existent customer."""
        data = {
            "customer_id": 99999,
            "loan_amount": 500000,
            "interest_rate": 10,
            "tenure": 24
        }
        response = self.client.post('/create-loan', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class ViewLoanAPITests(APITestCase):
    """Tests for /view-loan/<loan_id> endpoint."""

    def setUp(self):
        self.customer = Customer.objects.create(
            first_name="Test",
            last_name="Customer",
            age=30,
            phone_number="1234567890",
            monthly_salary=100000,
            approved_limit=3600000,
            current_debt=0
        )
        self.loan = Loan.objects.create(
            customer=self.customer,
            loan_amount=500000,
            tenure=24,
            interest_rate=12,
            monthly_repayment=23536.74,
            emis_paid_on_time=5,
            start_date=date.today(),
            end_date=date.today() + relativedelta(months=24)
        )

    def test_view_loan_success(self):
        """Test viewing existing loan."""
        response = self.client.get(f'/view-loan/{self.loan.loan_id}')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['loan_id'], self.loan.loan_id)
        self.assertIn('customer', response.data)

    def test_view_loan_not_found(self):
        """Test viewing non-existent loan."""
        response = self.client.get('/view-loan/99999')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class ViewLoansAPITests(APITestCase):
    """Tests for /view-loans/<customer_id> endpoint."""

    def setUp(self):
        self.customer = Customer.objects.create(
            first_name="Test",
            last_name="Customer",
            age=30,
            phone_number="1234567890",
            monthly_salary=100000,
            approved_limit=3600000,
            current_debt=0
        )
        # Create active loan
        self.loan1 = Loan.objects.create(
            customer=self.customer,
            loan_amount=300000,
            tenure=12,
            interest_rate=10,
            monthly_repayment=26374.00,
            emis_paid_on_time=3,
            start_date=date.today() - timedelta(days=90),
            end_date=date.today() + timedelta(days=270)
        )
        # Create another active loan
        self.loan2 = Loan.objects.create(
            customer=self.customer,
            loan_amount=200000,
            tenure=6,
            interest_rate=8,
            monthly_repayment=34195.00,
            emis_paid_on_time=2,
            start_date=date.today() - timedelta(days=60),
            end_date=date.today() + timedelta(days=120)
        )

    def test_view_loans_success(self):
        """Test viewing all loans for a customer."""
        response = self.client.get(f'/view-loans/{self.customer.customer_id}')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_view_loans_customer_not_found(self):
        """Test viewing loans for non-existent customer."""
        response = self.client.get('/view-loans/99999')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
