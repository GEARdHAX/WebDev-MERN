"""
Celery tasks for background data ingestion.
"""

import os
import logging
from celery import shared_task
from django.conf import settings

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def ingest_customer_data(self):
    """
    Background task to ingest customer data from Excel file.
    """
    import pandas as pd
    from loans.models import Customer
    
    try:
        file_path = os.path.join(settings.DATA_DIR, 'customer_data.xlsx')
        
        if not os.path.exists(file_path):
            logger.error(f"Customer data file not found: {file_path}")
            return {"status": "error", "message": "File not found"}
        
        df = pd.read_excel(file_path)
        
        customers_created = 0
        customers_updated = 0
        
        for _, row in df.iterrows():
            customer_id = row.get('Customer ID') or row.get('customer_id')
            
            customer_data = {
                'first_name': row.get('First Name') or row.get('first_name', ''),
                'last_name': row.get('Last Name') or row.get('last_name', ''),
                'phone_number': str(row.get('Phone Number') or row.get('phone_number', '')),
                'monthly_salary': float(row.get('Monthly Salary') or row.get('monthly_salary', 0)),
                'approved_limit': float(row.get('Approved Limit') or row.get('approved_limit', 0)),
                'current_debt': float(row.get('Current Debt') or row.get('current_debt', 0)),
            }
            
            customer, created = Customer.objects.update_or_create(
                customer_id=customer_id,
                defaults=customer_data
            )
            
            if created:
                customers_created += 1
            else:
                customers_updated += 1
        
        logger.info(f"Customer data ingestion complete: {customers_created} created, {customers_updated} updated")
        return {
            "status": "success",
            "customers_created": customers_created,
            "customers_updated": customers_updated
        }
        
    except Exception as e:
        logger.error(f"Error ingesting customer data: {str(e)}")
        raise self.retry(exc=e, countdown=60)


@shared_task(bind=True, max_retries=3)
def ingest_loan_data(self):
    """
    Background task to ingest loan data from Excel file.
    """
    import pandas as pd
    from loans.models import Customer, Loan
    from datetime import datetime
    
    try:
        file_path = os.path.join(settings.DATA_DIR, 'loan_data.xlsx')
        
        if not os.path.exists(file_path):
            logger.error(f"Loan data file not found: {file_path}")
            return {"status": "error", "message": "File not found"}
        
        df = pd.read_excel(file_path)
        
        loans_created = 0
        loans_updated = 0
        loans_skipped = 0
        
        for _, row in df.iterrows():
            customer_id = row.get('Customer ID') or row.get('customer_id')
            loan_id = row.get('Loan ID') or row.get('loan_id')
            
            try:
                customer = Customer.objects.get(customer_id=customer_id)
            except Customer.DoesNotExist:
                logger.warning(f"Customer {customer_id} not found for loan {loan_id}")
                loans_skipped += 1
                continue
            
            # Parse dates
            start_date = row.get('Date of Approval') or row.get('start_date')
            end_date = row.get('End Date') or row.get('end_date')
            
            if isinstance(start_date, str):
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            elif hasattr(start_date, 'date'):
                start_date = start_date.date()
            
            if isinstance(end_date, str):
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            elif hasattr(end_date, 'date'):
                end_date = end_date.date()
            
            loan_data = {
                'customer': customer,
                'loan_amount': float(row.get('Loan Amount') or row.get('loan_amount', 0)),
                'tenure': int(row.get('Tenure') or row.get('tenure', 12)),
                'interest_rate': float(row.get('Interest Rate') or row.get('interest_rate', 0)),
                'monthly_repayment': float(row.get('Monthly payment') or row.get('monthly_repayment', 0)),
                'emis_paid_on_time': int(row.get('EMIs paid on Time') or row.get('emis_paid_on_time', 0)),
                'start_date': start_date,
                'end_date': end_date,
            }
            
            loan, created = Loan.objects.update_or_create(
                loan_id=loan_id,
                defaults=loan_data
            )
            
            if created:
                loans_created += 1
            else:
                loans_updated += 1
        
        logger.info(f"Loan data ingestion complete: {loans_created} created, {loans_updated} updated, {loans_skipped} skipped")
        return {
            "status": "success",
            "loans_created": loans_created,
            "loans_updated": loans_updated,
            "loans_skipped": loans_skipped
        }
        
    except Exception as e:
        logger.error(f"Error ingesting loan data: {str(e)}")
        raise self.retry(exc=e, countdown=60)


@shared_task
def ingest_all_data():
    """
    Master task to ingest both customer and loan data.
    Customers must be ingested first, then loans.
    """
    # First ingest customers
    customer_result = ingest_customer_data.delay()
    
    # Then ingest loans (chained after customers)
    from celery import chain
    workflow = chain(
        ingest_customer_data.s(),
        ingest_loan_data.s()
    )
    
    return workflow()
