# Credit Approval System

A Django REST Framework-based credit approval system that handles customer registration, loan eligibility checks, and loan management with background data ingestion using Celery.

## Features

- **Customer Registration**: Register new customers with automatically calculated credit limits
- **Loan Eligibility Check**: Check loan eligibility based on credit score calculation
- **Loan Creation**: Create new loans with proper eligibility validation
- **Loan Management**: View individual loans and all loans by customer
- **Background Data Ingestion**: Ingest customer and loan data from Excel files using Celery workers
- **Dockerized**: Complete Docker setup with PostgreSQL and Redis

## Tech Stack

- **Backend**: Django 4.2+ with Django REST Framework
- **Database**: PostgreSQL 15
- **Task Queue**: Celery with Redis
- **Containerization**: Docker & Docker Compose

## Project Structure

```
Alemeno/
├── docker-compose.yml          # Docker Compose configuration
├── customer_data.xlsx          # Customer data file
├── loan_data.xlsx              # Loan data file
└── credit_approval/
    ├── Dockerfile              # Django app Dockerfile
    ├── requirements.txt        # Python dependencies
    ├── manage.py               # Django management script
    ├── credit_approval/        # Django project settings
    │   ├── settings.py
    │   ├── urls.py
    │   ├── celery.py
    │   └── ...
    └── loans/                  # Loans app
        ├── models.py           # Customer & Loan models
        ├── views.py            # API views
        ├── serializers.py      # DRF serializers
        ├── utils.py            # Utility functions
        ├── tasks.py            # Celery tasks
        ├── tests.py            # Unit tests
        └── management/
            └── commands/
                └── ingest_data.py  # Data ingestion command
```

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Git

### Running the Application

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Alemeno
   ```

2. **Start all services**:
   ```bash
   docker-compose up --build
   ```

   This will start:
   - PostgreSQL database on port 5432
   - Redis on port 6379
   - Django web server on port 8000
   - Celery worker for background tasks

3. **In a new terminal, run migrations and ingest data**:
   ```bash
   # Run migrations (if not already done)
   docker-compose exec web python manage.py migrate

   # Ingest data from Excel files (synchronously)
   docker-compose exec web python manage.py ingest_data

   # Or ingest data using background workers
   docker-compose exec web python manage.py ingest_data --async
   ```

4. **Access the API at**: `http://localhost:8000`

## API Endpoints

### 1. Register Customer
**POST** `/register`

Register a new customer with automatically calculated approved limit.

**Request Body**:
```json
{
    "first_name": "John",
    "last_name": "Doe",
    "age": 30,
    "monthly_income": 50000,
    "phone_number": 9876543210
}
```

**Response**:
```json
{
    "customer_id": 1,
    "name": "John Doe",
    "age": 30,
    "monthly_income": 50000,
    "approved_limit": 1800000,
    "phone_number": "9876543210"
}
```

### 2. Check Eligibility
**POST** `/check-eligibility`

Check loan eligibility based on credit score.

**Request Body**:
```json
{
    "customer_id": 1,
    "loan_amount": 500000,
    "interest_rate": 10,
    "tenure": 24
}
```

**Response**:
```json
{
    "customer_id": 1,
    "approval": true,
    "interest_rate": 10.0,
    "corrected_interest_rate": 10.0,
    "tenure": 24,
    "monthly_installment": 23072.65
}
```

### 3. Create Loan
**POST** `/create-loan`

Process and create a new loan based on eligibility.

**Request Body**:
```json
{
    "customer_id": 1,
    "loan_amount": 500000,
    "interest_rate": 10,
    "tenure": 24
}
```

**Response**:
```json
{
    "loan_id": 1,
    "customer_id": 1,
    "loan_approved": true,
    "message": "Loan approved successfully",
    "monthly_installment": 23072.65
}
```

### 4. View Loan
**GET** `/view-loan/{loan_id}`

View loan details with customer information.

**Response**:
```json
{
    "loan_id": 1,
    "customer": {
        "id": 1,
        "first_name": "John",
        "last_name": "Doe",
        "phone_number": "9876543210",
        "age": 30
    },
    "loan_amount": 500000,
    "interest_rate": 10.0,
    "monthly_installment": 23072.65,
    "tenure": 24
}
```

### 5. View Customer Loans
**GET** `/view-loans/{customer_id}`

View all current loans for a customer.

**Response**:
```json
[
    {
        "loan_id": 1,
        "loan_amount": 500000,
        "interest_rate": 10.0,
        "monthly_installment": 23072.65,
        "repayments_left": 20
    }
]
```

## Credit Score Calculation

The credit score is calculated based on:

1. **Past Loans paid on time** (max 35 points)
2. **Number of loans taken in past** (max 20 points)
3. **Loan activity in current year** (max 20 points)
4. **Loan approved volume relative to limit** (max 25 points)

**Important**: If sum of current loans > approved limit, credit score = 0

## Loan Approval Rules

Based on credit score:
- **Credit Score > 50**: Approve loan at requested interest rate
- **30 < Credit Score ≤ 50**: Approve loan with minimum 12% interest rate
- **10 < Credit Score ≤ 30**: Approve loan with minimum 16% interest rate
- **Credit Score ≤ 10**: Don't approve any loans

**Additional Constraint**: If sum of all current EMIs > 50% of monthly salary, don't approve the loan.

## EMI Calculation

Uses compound interest formula:

```
EMI = [P × R × (1+R)^N] / [(1+R)^N - 1]
```

Where:
- P = Principal loan amount
- R = Monthly interest rate (annual rate / 12 / 100)
- N = Number of monthly installments (tenure)

## Running Tests

```bash
# Run all tests
docker-compose exec web python manage.py test

# Run with verbosity
docker-compose exec web python manage.py test -v 2

# Run specific test class
docker-compose exec web python manage.py test loans.tests.RegisterAPITests
```

## Development

### Local Development (without Docker)

1. Create a virtual environment:
   ```bash
   cd credit_approval
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set environment variables:
   ```bash
   export POSTGRES_DB=credit_approval
   export POSTGRES_USER=postgres
   export POSTGRES_PASSWORD=postgres
   export POSTGRES_HOST=localhost
   export POSTGRES_PORT=5432
   export REDIS_URL=redis://localhost:6379/0
   ```

4. Run migrations:
   ```bash
   python manage.py migrate
   ```

5. Start the server:
   ```bash
   python manage.py runserver
   ```

## License

This project is created for the Alemeno Backend Internship Assignment.
