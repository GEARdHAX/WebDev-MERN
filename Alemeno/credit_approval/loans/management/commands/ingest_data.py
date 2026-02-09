"""
Management command to ingest data from Excel files.
Can be run synchronously or trigger background tasks.
"""

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
import os
import pandas as pd
from loans.models import Customer, Loan
from datetime import datetime


class Command(BaseCommand):
    help = 'Ingest customer and loan data from Excel files'

    def add_arguments(self, parser):
        parser.add_argument(
            '--async',
            action='store_true',
            dest='async_mode',
            help='Run ingestion as background Celery tasks',
        )
        parser.add_argument(
            '--customers-only',
            action='store_true',
            help='Only ingest customer data',
        )
        parser.add_argument(
            '--loans-only',
            action='store_true',
            help='Only ingest loan data',
        )

    def handle(self, *args, **options):
        async_mode = options.get('async_mode', False)
        customers_only = options.get('customers_only', False)
        loans_only = options.get('loans_only', False)

        if async_mode:
            self.handle_async(customers_only, loans_only)
        else:
            self.handle_sync(customers_only, loans_only)

    def handle_async(self, customers_only, loans_only):
        """Trigger background Celery tasks for data ingestion."""
        from loans.tasks import ingest_customer_data, ingest_loan_data, ingest_all_data
        
        if customers_only:
            ingest_customer_data.delay()
            self.stdout.write(self.style.SUCCESS('Customer data ingestion task queued'))
        elif loans_only:
            ingest_loan_data.delay()
            self.stdout.write(self.style.SUCCESS('Loan data ingestion task queued'))
        else:
            ingest_all_data.delay()
            self.stdout.write(self.style.SUCCESS('All data ingestion tasks queued'))

    def handle_sync(self, customers_only, loans_only):
        """Run data ingestion synchronously."""
        if not loans_only:
            self.ingest_customers()
        
        if not customers_only:
            self.ingest_loans()

    def ingest_customers(self):
        """Ingest customer data from Excel file."""
        file_path = os.path.join(settings.DATA_DIR, 'customer_data.xlsx')
        
        if not os.path.exists(file_path):
            raise CommandError(f'Customer data file not found: {file_path}')
        
        self.stdout.write(f'Reading customer data from {file_path}')
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
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Customer data ingestion complete: {customers_created} created, {customers_updated} updated'
            )
        )

    def ingest_loans(self):
        """Ingest loan data from Excel file."""
        file_path = os.path.join(settings.DATA_DIR, 'loan_data.xlsx')
        
        if not os.path.exists(file_path):
            raise CommandError(f'Loan data file not found: {file_path}')
        
        self.stdout.write(f'Reading loan data from {file_path}')
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
                self.stdout.write(
                    self.style.WARNING(f'Customer {customer_id} not found for loan {loan_id}')
                )
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
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Loan data ingestion complete: {loans_created} created, {loans_updated} updated, {loans_skipped} skipped'
            )
        )
