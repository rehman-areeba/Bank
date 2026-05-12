# Banking System

A production-ready banking application built with ASP.NET Core and React, featuring secure money transfers, account management, and comprehensive audit logging.

## Overview

This banking system implements core banking operations with enterprise-grade features including ACID-compliant transactions, optimistic concurrency control, JWT-based authentication, comprehensive audit logging, and role-based access control. The system is designed to handle concurrent operations safely while maintaining data integrity and providing a complete audit trail.

### Key Features

- **Secure Authentication & Authorization**: JWT-based authentication with role-based access control (Customer/Admin)
- **Money Transfers**: Real-time fund transfers with transaction isolation and concurrency control
- **Account Management**: Multiple account types (Savings, Checking, Business) with balance tracking
- **Audit Logging**: Immutable, append-only audit trail for all critical operations
- **Concurrency Control**: Optimistic locking using RowVersion to prevent lost updates
- **Transaction Safety**: ACID-compliant operations with Serializable isolation level for transfers
- **Rate Limiting**: Protection against abuse with configurable rate limits
- **Comprehensive Testing**: Integration tests using WebApplicationFactory and InMemory database

##  Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         React Frontend                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │Dashboard │  │Transfers │  │Accounts  │  │  Admin   │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │             │              │             │             │
│       └─────────────┴──────────────┴─────────────┘             │
│                          │                                      │
│                    Axios Client                                 │
└──────────────────────────┼──────────────────────────────────────┘
                           │ HTTPS/JWT
┌──────────────────────────┼──────────────────────────────────────┐
│                    ASP.NET Core API                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Controllers                           │   │
│  │  Auth │ Accounts │ Transfers │ Transactions │ Admin     │   │
│  └───┬───────┬──────────┬────────────┬─────────────┬───────┘   │
│      │       │          │            │             │           │
│  ┌───┴───────┴──────────┴────────────┴─────────────┴───────┐   │
│  │                    Services Layer                        │   │
│  │  AuthService │ AccountService │ TransferService │        │   │
│  │  AuditService │ NotificationService                      │   │
│  └───┬───────────────────┬──────────────────────────────────┘   │
│      │                   │                                      │
│  ┌───┴───────────────────┴──────────────────────────────────┐   │
│  │              Repository Pattern + UnitOfWork             │   │
│  │  AccountRepo │ TransactionRepo │ AuditRepo               │   │
│  └───┬──────────────────────────────────────────────────────┘   │
│      │                                                           │
│  ┌───┴───────────────────────────────────────────────────────┐   │
│  │              Entity Framework Core                        │   │
│  └───┬───────────────────────────────────────────────────────┘   │
└──────┼───────────────────────────────────────────────────────────┘
       │
┌──────┼───────────────────────────────────────────────────────────┐
│      │              SQL Server Database                          │
│  ┌───┴────┐  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Users  │  │ Accounts │  │ Transactions │  │  AuditLogs   │  │
│  └────────┘  └──────────┘  └──────────────┘  └──────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

##  Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | ASP.NET Core 8.0 | RESTful API framework |
| | Entity Framework Core | ORM for database operations |
| | SQL Server | Relational database |
| | JWT Bearer | Authentication & authorization |
| | FluentValidation | Request validation |
| | BCrypt.Net | Password hashing |
| **Frontend** | React 18 | UI framework |
| | TypeScript | Type-safe JavaScript |
| | Vite | Build tool & dev server |
| | TanStack Query | Server state management |
| | Zustand | Client state management |
| | Tailwind CSS | Utility-first CSS |
| | Recharts | Data visualization |
| **Testing** | xUnit | Test framework |
| | WebApplicationFactory | Integration testing |
| | InMemory Database | Test database |
| | Moq | Mocking framework |
| **DevOps** | Git | Version control |
| | GitHub Actions | CI/CD (optional) |

##  Getting Started

### Prerequisites

- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/) and npm
- [SQL Server](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) (Express or Developer Edition)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/banking-system.git
   cd banking-system
   ```

2. **Backend Setup**

   a. Navigate to the API project:
   ```bash
   cd BankingApi
   ```

   b. Create `appsettings.Development.json` from the example:
   ```bash
   cp appsettings.example.json appsettings.Development.json
   ```

   c. Update `appsettings.Development.json` with your configuration:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=BankingDb;Trusted_Connection=True;TrustServerCertificate=True"
     },
     "Jwt": {
       "Key": "your-secret-key-min-32-characters-long",
       "Issuer": "BankingApi",
       "Audience": "BankingClient",
       "ExpiryHours": 24
     }
   }
   ```

   d. Apply database migrations:
   ```bash
   dotnet ef database update
   ```

   e. Run the API:
   ```bash
   dotnet run
   ```
   API will be available at `https://localhost:7253` and `http://localhost:5245`

3. **Frontend Setup**

   a. Navigate to the frontend project:
   ```bash
   cd ../banking-ui
   ```

   b. Install dependencies:
   ```bash
   npm install
   ```

   c. Create `.env.development` (already configured):
   ```env
   VITE_API_URL=http://localhost:5245
   ```

   d. Start the development server:
   ```bash
   npm run dev
   ```
   Frontend will be available at `http://localhost:5173`

4. **Access the Application**
   - Open your browser and navigate to `http://localhost:5173`
   - Register a new account to get started
   - Default account is created automatically upon registration

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login and get JWT token |
| GET | `/api/auth/me` | Yes | Get current user info |

### Accounts

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/accounts` | Yes | Get user's accounts |
| GET | `/api/accounts/{id}` | Yes | Get account details |
| POST | `/api/accounts` | Yes | Create new account |
| POST | `/api/accounts/{id}/deposit` | Yes | Deposit money |
| POST | `/api/accounts/{id}/withdraw` | Yes | Withdraw money |

### Transfers

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/transfers` | Yes | Transfer money between accounts |
| GET | `/api/transfers/history` | Yes | Get transfer history |

### Transactions

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/transactions` | Yes | Get transaction history with filters |
| GET | `/api/transactions/recent` | Yes | Get recent transactions |

### Admin

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| GET | `/api/admin/failed-logins` | Yes | Admin | Get failed login attempts |
| POST | `/api/admin/freeze-account` | Yes | Admin | Freeze user account |
| GET | `/api/admin/audit-logs` | Yes | Admin | Get audit logs |

##  Key Design Decisions

### Optimistic Concurrency with RowVersion

**Why**: In a banking system, multiple users or processes might attempt to modify the same account simultaneously. Without proper concurrency control, this could lead to lost updates (e.g., two withdrawals processing against the same balance, both succeeding when only one should).

**Implementation**: 
- Each `Account` entity has a `RowVersion` property (timestamp in SQL Server)
- When updating an account, EF Core includes the original `RowVersion` in the WHERE clause
- If another transaction modified the record, the `RowVersion` changes, and the update fails
- The application catches `DbUpdateConcurrencyException` and can retry or notify the user

**Benefits**:
- No locks held during user think time
- Better scalability than pessimistic locking
- Prevents lost updates without blocking other transactions
- Suitable for web applications with high concurrency

### Append-Only Audit Log

**Why**: Audit logs must be immutable to maintain integrity and comply with regulatory requirements. Any modification or deletion of audit records would compromise the audit trail.

**Implementation**:
- `AuditLog` table has no UPDATE or DELETE operations
- Only INSERT operations are allowed
- Includes timestamp, user, action, entity type, and changes (JSON)
- Separate from transactional tables to avoid performance impact

**Benefits**:
- Complete, tamper-proof audit trail
- Simplified compliance with regulations (SOX, GDPR, etc.)
- Easy to query historical changes
- No risk of accidental data loss

### Serializable Isolation for Transfers

**Why**: Money transfers involve reading balances, validating, and updating multiple accounts. Without proper isolation, race conditions could allow overdrafts or double-spending.

**Implementation**:
```csharp
using var transaction = await _unitOfWork.BeginTransactionAsync(IsolationLevel.Serializable);
```

**Scenario Prevented**:
```
Time | Transaction A              | Transaction B
-----|----------------------------|---------------------------
T1   | Read Account X: $100       |
T2   |                            | Read Account X: $100
T3   | Withdraw $80 (Balance: $20)|
T4   |                            | Withdraw $80 (Balance: $20) 
T5   | Commit                     |
T6   |                            | Commit (Should fail!)
```

With Serializable isolation, Transaction B would be blocked or rolled back, preventing the overdraft.

**Trade-offs**:
- Higher isolation = Lower concurrency
- Potential for deadlocks (handled with retry logic)
- Acceptable for critical financial operations where correctness > performance

### Repository Pattern + Unit of Work

**Why**: Separates data access logic from business logic, making the codebase more maintainable and testable.

**Benefits**:
- Single transaction boundary across multiple repositories
- Easy to mock for unit testing
- Centralized database context management
- Consistent error handling

### Background Transaction Processing

**Why**: Some operations (like notifications, statement generation) don't need to block the user's request.

**Implementation**:
- `BackgroundTransactionProcessor` hosted service
- Processes queued tasks asynchronously
- Improves API response times
- Handles retries for failed operations

##  Running Tests

### Integration Tests

Run all tests:
```bash
cd BankingApi.Tests
dotnet test
```

Run specific test:
```bash
dotnet test --filter "FullyQualifiedName~AuthController_Register_ReturnsJwtToken"
```

Run with detailed output:
```bash
dotnet test --logger "console;verbosity=detailed"
```

Generate code coverage:
```bash
dotnet test /p:CollectCoverage=true
```

### Test Coverage

The test suite includes:
-  Authentication & Authorization (7 tests)
-  Money Transfers (4 tests)
-  Account Operations (4 tests)
-  Concurrency Control
-  Access Control (403 Forbidden)
-  Balance Verification

All tests use:
- WebApplicationFactory for full integration testing
- InMemory database for isolation
- JWT authentication testing
- Automatic test data seeding

## 📸 Screenshots

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)
*Main dashboard showing account balances, recent transactions, and financial overview*

### Money Transfer
![Transfer](docs/screenshots/transfer.png)
*Secure money transfer interface with real-time balance validation*

### Transaction History
![Transactions](docs/screenshots/transactions.png)
*Comprehensive transaction history with filtering and export options*

### Admin Panel
![Admin](docs/screenshots/admin.png)
*Admin dashboard for monitoring failed logins and managing accounts*

##  Project Structure

```
banking-system/
├── BankingApi/                 # Backend API
│   ├── Controllers/            # API endpoints
│   ├── Services/               # Business logic
│   ├── Repositories/           # Data access layer
│   ├── Models/                 # Domain entities
│   ├── DTOs/                   # Data transfer objects
│   ├── Data/                   # DbContext & migrations
│   ├── Middleware/             # Custom middleware
│   └── Program.cs              # Application entry point
├── BankingApi.Tests/           # Integration tests
│   ├── AuthControllerIntegrationTests.cs
│   ├── TransfersAndAccountsIntegrationTests.cs
│   └── BankingApiFactory.cs   # Test infrastructure
├── banking-ui/                 # Frontend application
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Page components
│   │   ├── hooks/              # Custom hooks
│   │   ├── services/           # API services
│   │   ├── store/              # State management
│   │   ├── types/              # TypeScript types
│   │   └── utils/              # Utility functions
│   └── public/                 # Static assets
└── docs/                       # Documentation
```

##  Security Features

- **Password Hashing**: BCrypt with salt rounds
- **JWT Authentication**: Secure token-based auth with expiration
- **Rate Limiting**: Protection against brute force attacks
- **CORS Configuration**: Restricted to allowed origins
- **Input Validation**: FluentValidation for all requests
- **SQL Injection Prevention**: Parameterized queries via EF Core
- **XSS Protection**: React's built-in escaping
- **HTTPS Enforcement**: Redirect HTTP to HTTPS in production

##  Rate Limiting

- **Auth Endpoints**: 10 requests per minute per IP
- **Transfer Endpoints**: 5 requests per minute per user
- **Configurable**: Adjust limits in `Program.cs`

##  Performance Considerations

- **Database Indexing**: Indexes on frequently queried columns
- **Query Optimization**: Efficient LINQ queries with proper includes
- **Connection Pooling**: Managed by EF Core
- **Async/Await**: Non-blocking I/O operations throughout
- **Caching**: Client-side caching with TanStack Query

##  Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request



---

**Note**: This is a demonstration project for educational purposes. For production use, additional security measures, compliance checks, and thorough testing are required.
