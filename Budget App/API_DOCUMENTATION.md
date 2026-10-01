# Budget App (PG Finance Manager) - API Documentation

This document describes all RESTful API endpoints available in the Budget App backend.

---

## Base URL

```text
http://localhost:5000/api
```

Production deployment will replace `localhost:5000` with the deployed domain name.

---

## Authentication & Headers

Protected routes require a JSON Web Token (JWT) sent via HTTP Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

All requests containing a body must include:

```http
Content-Type: application/json
```

---

## Standard Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]
}
```

### HTTP Status Codes
* **200 OK**: Request completed successfully.
* **201 Created**: Resource created successfully.
* **400 Bad Request**: Invalid inputs or validation failure.
* **401 Unauthorized**: Missing, expired, or invalid JWT token.
* **403 Forbidden**: Access denied to this resource.
* **404 Not Found**: Requested resource does not exist.
* **409 Conflict**: Duplicate key or constraint violation (e.g. email already exists).
* **500 Server Error**: Internal server error.

---

## 1. Health Check Endpoint

### GET `/api/health`
Check if the API and database are running.

* **Auth**: None
* **Example Request**:
  ```http
  GET /api/health
  ```
* **Example Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Budget App API is running",
    "timestamp": "2026-10-01T10:00:00.000Z",
    "database": "connected",
    "env": "development"
  }
  ```

---

## 2. Authentication APIs

### POST `/api/auth/register`
Register a new user account.

* **Auth**: None
* **Request Body**:
  ```json
  {
    "name": "Deepraj Mukhopadhyay",
    "email": "deepraj@example.com",
    "password": "Password123!",
    "members": ["Deepraj", "Anant", "Ravi", "Baijnath", "Kunal"],
    "currency": "INR"
  }
  ```
* **Example Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully.",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "_id": "6724fa218820c4ab68192a01",
        "name": "Deepraj Mukhopadhyay",
        "email": "deepraj@example.com",
        "members": ["Deepraj", "Anant", "Ravi", "Baijnath", "Kunal"],
        "currency": "INR",
        "archivedMonths": [],
        "createdAt": "2026-10-01T10:00:00.000Z",
        "updatedAt": "2026-10-01T10:00:00.000Z"
      }
    }
  }
  ```
* **Possible Errors**:
  * `400 Bad Request`: Missing name, email, or password length < 6.
  * `409 Conflict`: Email already exists.

---

### POST `/api/auth/login`
Authenticate existing user and return JWT token.

* **Auth**: None
* **Request Body**:
  ```json
  {
    "email": "deepraj@example.com",
    "password": "Password123!"
  }
  ```
* **Example Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logged in successfully.",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "_id": "6724fa218820c4ab68192a01",
        "name": "Deepraj Mukhopadhyay",
        "email": "deepraj@example.com",
        "members": ["Deepraj", "Anant", "Ravi", "Baijnath", "Kunal"],
        "currency": "INR"
      }
    }
  }
  ```
* **Possible Errors**:
  * `400 Bad Request`: Missing email or password.
  * `401 Unauthorized`: Invalid email or password.

---

### GET `/api/auth/me`
Retrieve authenticated user profile.

* **Auth**: Bearer token (Required)
* **Example Request**:
  ```http
  GET /api/auth/me
  Authorization: Bearer <token>
  ```
* **Example Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User profile retrieved successfully.",
    "data": {
      "user": {
        "_id": "6724fa218820c4ab68192a01",
        "name": "Deepraj Mukhopadhyay",
        "email": "deepraj@example.com",
        "members": ["Deepraj", "Anant", "Ravi", "Baijnath", "Kunal"],
        "currency": "INR",
        "archivedMonths": []
      }
    }
  }
  ```
* **Possible Errors**:
  * `401 Unauthorized`: Invalid or expired token.

---

### PUT `/api/auth/me`
Update profile settings, member list, or currency preference.

* **Auth**: Bearer token (Required)
* **Request Body**:
  ```json
  {
    "name": "Deepraj M",
    "members": ["Deepraj", "Anant", "Ravi", "Baijnath", "Kunal", "Rahul"],
    "currency": "INR"
  }
  ```
* **Example Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Profile updated successfully.",
    "data": {
      "user": { ... }
    }
  }
  ```

---

## 3. Transaction APIs

Transactions record all financial events (contributions to fund, room expenses, settlements, corrections).

### POST `/api/transactions`
Record a new transaction.

* **Auth**: Bearer token (Required)
* **Request Body (Contribution Example)**:
  ```json
  {
    "type": "contribution",
    "amount": 2500,
    "person": "Deepraj",
    "date": "2026-10-01",
    "paymentMethod": "upi",
    "note": "October room fund",
    "description": "Contribution by Deepraj"
  }
  ```
* **Request Body (Expense Example)**:
  ```json
  {
    "type": "expense",
    "description": "Vegetables & Milk",
    "amount": 450,
    "category": "grocery",
    "paidBy": "Anant",
    "sharedBy": ["Deepraj", "Anant", "Ravi", "Baijnath", "Kunal"],
    "date": "2026-10-01",
    "note": "Local market"
  }
  ```
* **Example Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Transaction recorded successfully.",
    "data": {
      "_id": "6724fc918820c4ab68192a10",
      "userId": "6724fa218820c4ab68192a01",
      "clientTxnId": "TXN-MH71PQ",
      "type": "expense",
      "description": "Vegetables & Milk",
      "amount": 450,
      "category": "grocery",
      "person": "Anant",
      "paidBy": "Anant",
      "sharedBy": ["Deepraj", "Anant", "Ravi", "Baijnath", "Kunal"],
      "paymentMethod": "cash",
      "date": "2026-10-01",
      "note": "Local market",
      "reversed": false,
      "createdAt": "2026-10-01T10:15:00.000Z",
      "updatedAt": "2026-10-01T10:15:00.000Z"
    }
  }
  ```
* **Possible Errors**:
  * `400 Bad Request`: Missing type, date, or invalid amount.

---

### GET `/api/transactions`
Retrieve transactions with powerful filters and sorting.

* **Auth**: Bearer token (Required)
* **Query Parameters**:
  * `type`: Filter by type (`contribution`, `expense`, `income`, `settlement`, `all`)
  * `category`: Filter by category (`grocery`, `food`, `electricity`, etc.)
  * `person`: Filter by member name
  * `date`: Exact date `YYYY-MM-DD`
  * `month`: Number (1-12)
  * `year`: Number (e.g. 2026)
  * `startDate`: Range start `YYYY-MM-DD`
  * `endDate`: Range end `YYYY-MM-DD`
  * `search`: Case-insensitive search on description
  * `page`: Page number (default: 1)
  * `limit`: Results per page (default: 0 = all)
  * `sortBy`: `date` or `amount` (default: `date`)
  * `sortOrder`: `asc` or `desc` (default: `desc`)
* **Example Request**:
  ```http
  GET /api/transactions?type=expense&category=grocery&month=10&year=2026
  Authorization: Bearer <token>
  ```
* **Example Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Transactions retrieved successfully.",
    "data": [
      {
        "_id": "6724fc918820c4ab68192a10",
        "type": "expense",
        "description": "Vegetables & Milk",
        "amount": 450,
        "category": "grocery",
        "paidBy": "Anant",
        "date": "2026-10-01"
      }
    ],
    "total": 1,
    "page": 1,
    "totalPages": 1
  }
  ```

---

### GET `/api/transactions/:id`
Get a single transaction by its MongoDB `_id` or client transaction ID (`TXN-...`).

* **Auth**: Bearer token (Required)
* **Example Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Transaction retrieved successfully.",
    "data": { ... }
  }
  ```
* **Possible Errors**:
  * `404 Not Found`: Transaction does not exist or belongs to another user.

---

### PUT `/api/transactions/:id`
Update an existing transaction.

* **Auth**: Bearer token (Required)
* **Request Body**:
  ```json
  {
    "amount": 500,
    "description": "Vegetables, Milk & Snacks"
  }
  ```
* **Example Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Transaction updated successfully.",
    "data": { ... }
  }
  ```

---

### DELETE `/api/transactions/:id`
Delete a transaction by ID.

* **Auth**: Bearer token (Required)
* **Example Request**:
  ```http
  DELETE /api/transactions/6724fc918820c4ab68192a10
  Authorization: Bearer <token>
  ```
* **Example Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Transaction deleted successfully.",
    "data": {
      "deletedId": "6724fc918820c4ab68192a10"
    }
  }
  ```

---

### POST `/api/transactions/sync`
Batch sync or import multiple transactions (useful for backup restoration).

* **Auth**: Bearer token (Required)
* **Request Body**:
  ```json
  {
    "transactions": [
      {
        "id": "TXN-1",
        "type": "contribution",
        "amount": 2000,
        "person": "Ravi",
        "date": "2026-10-01"
      }
    ]
  }
  ```

---

## 4. Budget APIs

### POST `/api/budgets`
Set or update monthly budget for a category.

* **Auth**: Bearer token (Required)
* **Request Body**:
  ```json
  {
    "category": "grocery",
    "amount": 6000,
    "month": 10,
    "year": 2026
  }
  ```
* **Example Response (201 Created / 200 OK)**:
  ```json
  {
    "success": true,
    "message": "Budget created successfully.",
    "data": {
      "_id": "6724fd118820c4ab68192a20",
      "category": "grocery",
      "amount": 6000,
      "month": 10,
      "year": 2026,
      "period": "2026-10"
    }
  }
  ```

---

### GET `/api/budgets`
Retrieve all budgets with real-time spending comparisons and percentage calculations.

* **Auth**: Bearer token (Required)
* **Query Parameters**:
  * `month`: Number (1-12)
  * `year`: Number (e.g. 2026)
  * `category`: Filter by category
* **Example Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Budgets retrieved successfully.",
    "data": [
      {
        "_id": "6724fd118820c4ab68192a20",
        "category": "grocery",
        "amount": 6000,
        "month": 10,
        "year": 2026,
        "spent": 1450,
        "remaining": 4550,
        "percentageUsed": 24.2,
        "isOverBudget": false
      }
    ]
  }
  ```

---

### GET `/api/budgets/:id`
Get single budget details with spending status.

* **Auth**: Bearer token (Required)

---

### PUT `/api/budgets/:id`
Modify budget limit.

* **Auth**: Bearer token (Required)
* **Request Body**:
  ```json
  {
    "amount": 7500
  }
  ```

---

### DELETE `/api/budgets/:id`
Delete budget limit.

* **Auth**: Bearer token (Required)

---

## 5. Dashboard APIs

### GET `/api/dashboard/summary`
Calculates overview statistics via MongoDB aggregation.

* **Auth**: Bearer token (Required)
* **Example Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Dashboard summary retrieved successfully.",
    "data": {
      "fundBalance": 8500,
      "totalContributions": 15000,
      "totalExpenses": 6500,
      "currentMonthContributions": 10000,
      "currentMonthExpenses": 4200,
      "pendingSettlement": 1250,
      "memberBalances": [
        {
          "member": "Deepraj",
          "paid": 2500,
          "share": 1300,
          "balance": 1200
        },
        {
          "member": "Anant",
          "paid": 1000,
          "share": 1300,
          "balance": -300
        }
      ],
      "recentTransactions": [ ... ]
    }
  }
  ```

---

### GET `/api/dashboard/monthly`
Historical monthly aggregations.

* **Auth**: Bearer token (Required)
* **Example Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Monthly analytics retrieved successfully.",
    "data": [
      {
        "month": "2026-10",
        "income": 10000,
        "expenses": 4200,
        "savings": 5800,
        "transactionCount": 18
      }
    ]
  }
  ```

---

### GET `/api/dashboard/category-expenses`
Category-wise spending breakdown with percentages.

* **Auth**: Bearer token (Required)
* **Query Parameters**: `month`, `year`
* **Example Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Category expenses retrieved successfully.",
    "data": {
      "totalExpense": 4200,
      "categories": [
        {
          "category": "grocery",
          "total": 2100,
          "count": 6,
          "percentage": 50.0
        },
        {
          "category": "electricity",
          "total": 1200,
          "count": 1,
          "percentage": 28.6
        }
      ]
    }
  }
  ```

---

### GET `/api/dashboard/budget-usage`
Comprehensive monthly budget comparison.

* **Auth**: Bearer token (Required)
* **Query Parameters**: `month`, `year`

---

## 6. Category APIs

### GET `/api/categories`
Get standard categories plus custom user categories.

* **Auth**: Bearer token (Required)

### POST `/api/categories`
Create custom category.

* **Auth**: Bearer token (Required)
* **Request Body**:
  ```json
  {
    "name": "Internet & WiFi",
    "icon": "📶"
  }
  ```

### DELETE `/api/categories/:id`
Delete custom category.

* **Auth**: Bearer token (Required)

---

## 7. App Data Hydration & Sync APIs

### GET `/api/app-data`
Returns complete account state in a single call (transactions, contributions, expenses, members, archived months, budgets).

* **Auth**: Bearer token (Required)

### POST `/api/app-data/sync`
Sync entire state or imported backup JSON into MongoDB.

* **Auth**: Bearer token (Required)
* **Request Body**:
  ```json
  {
    "contributions": [ ... ],
    "expenses": [ ... ],
    "archivedMonths": [ "2026-09" ]
  }
  ```
