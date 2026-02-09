"""
Utility functions for the Credit Approval System.
"""

from decimal import Decimal, ROUND_HALF_UP
from datetime import date
from django.utils import timezone


def calculate_monthly_installment(principal, annual_interest_rate, tenure_months):
    """
    Calculate monthly installment using compound interest scheme.
    
    EMI = [P x R x (1+R)^N] / [(1+R)^N - 1]
    
    Where:
    P = Principal loan amount
    R = Monthly interest rate (annual rate / 12 / 100)
    N = Number of monthly installments (tenure)
    
    Args:
        principal: Loan amount (principal)
        annual_interest_rate: Annual interest rate in percentage
        tenure_months: Loan tenure in months
        
    Returns:
        Monthly EMI amount
    """
    principal = Decimal(str(principal))
    annual_interest_rate = Decimal(str(annual_interest_rate))
    tenure_months = int(tenure_months)
    
    if annual_interest_rate == 0:
        # Simple division if no interest
        return float((principal / tenure_months).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
    
    # Monthly interest rate
    monthly_rate = annual_interest_rate / Decimal('12') / Decimal('100')
    
    # Calculate EMI using compound interest formula
    # EMI = [P x R x (1+R)^N] / [(1+R)^N - 1]
    one_plus_r_power_n = (1 + monthly_rate) ** tenure_months
    
    emi = (principal * monthly_rate * one_plus_r_power_n) / (one_plus_r_power_n - 1)
    
    return float(emi.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))


def calculate_credit_score(customer):
    """
    Calculate credit score for a customer based on their loan history.
    
    Components considered:
    1. Past Loans paid on time
    2. Number of loans taken in past
    3. Loan activity in current year
    4. Loan approved volume
    5. If sum of current loans > approved limit, credit score = 0
    
    Args:
        customer: Customer object
        
    Returns:
        Credit score (0-100)
    """
    from .models import Loan
    
    # Get all loans for the customer
    all_loans = Loan.objects.filter(customer=customer)
    
    if not all_loans.exists():
        # No loan history, give a default moderate score
        return 50
    
    # Check if current loans exceed approved limit
    current_date = timezone.now().date()
    current_loans = all_loans.filter(end_date__gte=current_date)
    
    total_current_loan_amount = sum(
        loan.loan_amount for loan in current_loans
    )
    
    if total_current_loan_amount > customer.approved_limit:
        return 0
    
    score = 0
    
    # Component 1: Past Loans paid on time (max 35 points)
    total_emis_expected = sum(loan.tenure for loan in all_loans)
    total_emis_on_time = sum(loan.emis_paid_on_time for loan in all_loans)
    
    if total_emis_expected > 0:
        on_time_ratio = total_emis_on_time / total_emis_expected
        score += on_time_ratio * 35
    
    # Component 2: Number of loans taken in past (max 20 points)
    # More loans (successfully managed) = better score
    num_loans = all_loans.count()
    if num_loans >= 5:
        score += 20
    elif num_loans >= 3:
        score += 15
    elif num_loans >= 1:
        score += 10
    
    # Component 3: Loan activity in current year (max 20 points)
    current_year = current_date.year
    loans_this_year = all_loans.filter(start_date__year=current_year)
    
    # Some activity is good, too much activity in one year can be risky
    loans_this_year_count = loans_this_year.count()
    if loans_this_year_count == 0:
        score += 15  # No new loans this year, stable
    elif loans_this_year_count <= 2:
        score += 20  # Moderate activity
    elif loans_this_year_count <= 4:
        score += 10  # Higher activity
    else:
        score += 5   # Too many loans in current year
    
    # Component 4: Loan approved volume relative to limit (max 25 points)
    total_loan_volume = sum(loan.loan_amount for loan in all_loans)
    volume_ratio = float(total_loan_volume / customer.approved_limit) if customer.approved_limit > 0 else 1
    
    if volume_ratio <= 0.3:
        score += 25  # Using less than 30% of limit
    elif volume_ratio <= 0.5:
        score += 20  # Using 30-50% of limit
    elif volume_ratio <= 0.7:
        score += 15  # Using 50-70% of limit
    elif volume_ratio <= 0.9:
        score += 10  # Using 70-90% of limit
    else:
        score += 5   # Using more than 90% of limit
    
    return min(100, max(0, int(score)))


def get_corrected_interest_rate(credit_score, requested_rate):
    """
    Get the corrected interest rate based on credit score.
    
    Rules:
    - If credit_score > 50: approve with any rate
    - If 50 > credit_score > 30: minimum rate is 12%
    - If 30 > credit_score > 10: minimum rate is 16%
    - If credit_score <= 10: don't approve
    
    Args:
        credit_score: Customer's credit score (0-100)
        requested_rate: Interest rate requested by customer
        
    Returns:
        Tuple of (is_eligible, corrected_rate)
    """
    requested_rate = float(requested_rate)
    
    if credit_score > 50:
        return (True, requested_rate)
    elif credit_score > 30:
        # Minimum 12%
        if requested_rate >= 12:
            return (True, requested_rate)
        return (True, 12.0)
    elif credit_score > 10:
        # Minimum 16%
        if requested_rate >= 16:
            return (True, requested_rate)
        return (True, 16.0)
    else:
        # Credit score <= 10, don't approve
        return (False, requested_rate)


def check_emi_constraint(customer, new_monthly_emi):
    """
    Check if sum of all current EMIs > 50% of monthly salary.
    
    Args:
        customer: Customer object
        new_monthly_emi: The new EMI to be added
        
    Returns:
        True if constraint is satisfied (loan can be approved), False otherwise
    """
    from .models import Loan
    
    current_date = timezone.now().date()
    current_loans = Loan.objects.filter(
        customer=customer,
        end_date__gte=current_date
    )
    
    total_current_emis = sum(
        float(loan.monthly_repayment) for loan in current_loans
    )
    
    total_emis_with_new = total_current_emis + float(new_monthly_emi)
    monthly_salary = float(customer.monthly_salary)
    
    # If sum of all current EMIs > 50% of monthly salary, don't approve
    return total_emis_with_new <= (monthly_salary * 0.5)
