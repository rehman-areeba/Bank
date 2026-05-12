# 🏦 Banking System

> A full-stack banking application exploring production-grade backend patterns through ACID transactions, concurrency control, and comprehensive audit logging.

![.NET](https://img.shields.io/badge/ASP.NET_Core-8.0-512BD4?style=flat&logo=dotnet)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript)
![SQL Server](https://img.shields.io/badge/SQL_Server-EF_Core_8-CC2927?style=flat&logo=microsoftsqlserver)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat&logo=jsonwebtokens)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

---

## 📌 About This Project

This is a **learning and portfolio project** that explores real-world backend engineering concepts through the lens of a banking application. While inspired by production banking systems, this is not production-ready software—it's a demonstration of architectural patterns, transaction safety, and concurrent data handling that I built to deepen my understanding of distributed systems and financial software design.

Banking was chosen as the domain because it presents genuinely hard problems: money must never be lost or duplicated, concurrent operations must be handled safely, and every action must be auditable. These constraints force you to think carefully about transaction isolation, race conditions, and data integrity—concepts that apply far beyond banking.

If you're reading this code, you'll find implementations of ACID-compliant transactions with Serializable isolation, optimistic concurrency control using SQL Server's RowVersion, append-only audit logging, JWT-based authentication with role-based authorization, and a clean layered architecture that separates concerns effectively. This project demonstrates how to build systems where correctness matters more than speed.

---

## ✨ Features

### Core Features

- [x] **User Authentication & Authorization** — JWT-based auth with BCrypt password hashing, role-based access control (Customer/Admin)
- [x] **Account Management** — Create multiple accounts per user (Savings, Checking, Business), view balances and transaction history
- [x] **Fund Transfers** — Real-time money transfers between accounts with ACID guarantees and balance validation
- [x] **Transaction History** — Paginated transaction logs with filtering by date range, type, and status
- [x] **Audit Logging** — Immutable, append-only audit trail for all critical operations (transfers, withdrawals, deposits)
- [x] **Admin Dashboard** — View failed login attempts, freeze/unfreeze accounts, access audit logs for compliance
- [x] **Rate Limiting** — Protection against brute force attacks on authentication endpoints
- [x] **Dark Mode UI** — Full light/dark theme support with CSS variables and localStorage persistence

### Architecture & Engineering Concepts

- [x] **ACID-Compliant Transactions** — Fund transfers use Serializable isolation level to prevent race conditions, ensuring atomicity (all-or-nothing commits), consistency (balance constraints enforced), isolation (no dirty reads), and durability (committed data survives crashes)

- [x] **Optimistic Concurrency Control** — Each account has a RowVersion timestamp; updates fail if another transaction modified the row, preventing lost updates without holding locks during user think time

- [x] **Append-Only Audit Logging** — Audit records are never updated or deleted, only inserted, creating a tamper-proof historical record for compliance and debugging

- [x] **JWT Authentication** — Stateless authentication using JSON Web Tokens with 24-hour expiry, eliminating server-side session storage and enabling horizontal scaling

- [x] **Role-Based Authorization** — Policy-based authorization separates Customer and Admin capabilities, enforced at the controller level with [Authorize(Roles = "Admin")]

- [x] **Repository Pattern + Unit of Work** — Data access abstracted behind repositories, with UnitOfWork managing transaction boundaries across multiple repositories in a single database transaction

- [x] **Global Exception Middleware** — Centralized error handling catches unhandled exceptions, logs them, and returns consistent error responses without exposing stack traces to clients

- [x] **Rate Limiting** — Fixed window rate limiting on auth endpoints (10 requests/minute) and transfer endpoints (5 requests/minute per user) to prevent abuse

- [x] **Background Service** — Hosted service processes queued notifications asynchronously after transactions commit, keeping API response times fast

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│         React + TypeScript          │
│   (Vite, React Query, Zustand)      │
└──────────────┬──────────────────────┘
               │ HTTPS + JWT
┌──────────────▼──────────────────────┐
│      ASP.NET Core 8 Web API         │
│   Controllers → Services → Repos    │
└──────────────┬──────────────────────┘
               │ EF Core 8
┌──────────────▼──────────────────────┐
│         SQL Server Database         │
│  Users, Accounts, Transactions,     │
│  AuditLogs, ScheduledPayments       │
└─────────────────────────────────────┘
```

The architecture follows a clean layered approach:

- **Presentation Layer (React)**: Handles UI rendering, form validation, and client-side state management with Zustand and TanStack Query
- **API Layer (Controllers)**: Validates requests, enforces authorization, delegates to services
- **Business Logic Layer (Services)**: Implements domain logic, orchestrates transactions, enforces business rules
- **Data Access Layer (Repositories)**: Abstracts database operations, provides query interfaces
- **Database Layer (SQL Server)**: Stores persistent data with referential integrity and constraints

---

## 🔐 Security Implementation

Security is implemented at multiple layers:

- **Password Hashing**: BCrypt with configurable work factor (default 12 rounds) ensures passwords are never stored in plaintext
- **JWT Tokens**: Signed tokens with 24-hour expiry, validated on every request, containing user ID and role claims
- **Role-Based Authorization**: Separate Customer and Admin roles enforced via ASP.NET Core's policy-based authorization
- **Rate Limiting**: Fixed window rate limiting prevents brute force attacks (10 auth requests/minute, 5 transfers/minute per user)
- **Row-Level Locking**: Serializable isolation on transfers prevents concurrent modifications to the same account
- **Input Validation**: FluentValidation rules validate all incoming requests before they reach business logic
- **HTTPS Enforcement**: All production traffic redirected to HTTPS, preventing man-in-the-middle attacks

---

## 💸 Fund Transfer Flow

The transfer operation demonstrates how to handle concurrent money movement safely:

1. **Request Received + JWT Validated** — Controller validates JWT token, extracts user ID and role claims
2. **Business Rules Checked** — Service validates sufficient balance, account ownership, transfer limits, and account active status
3. **Database Transaction Opened** — UnitOfWork begins transaction with Serializable isolation level
4. **Row Lock Acquired** — EF Core's RowVersion triggers optimistic lock check on sender account
5. **Balance Re-Verified Inside Transaction** — Prevents TOCTOU (Time-Of-Check-Time-Of-Use) race conditions
6. **Sender Debited** — Sender account balance decreased, RowVersion incremented
7. **Receiver Credited** — Receiver account balance increased, RowVersion incremented
8. **Audit Log Entry Written** — Immutable audit record created in same transaction (atomic with transfer)
9. **Transaction Committed** — All changes committed atomically (all succeed or all fail)
10. **Notification Queued** — Background service notified to send email/SMS (fire-and-forget, after commit)

If any step fails (insufficient balance, concurrency conflict, database error), the entire transaction rolls back—no partial transfers.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | ASP.NET Core 8.0 | RESTful API framework with built-in DI, middleware pipeline |
| | Entity Framework Core 8 | ORM for database operations, migrations, change tracking |
| | SQL Server | Relational database with ACID guarantees, RowVersion support |
| | JWT Bearer | Stateless authentication with signed tokens |
| | FluentValidation | Declarative request validation with custom rules |
| | BCrypt.Net | Password hashing with configurable work factor |
| **Frontend** | React 18 | Component-based UI library with hooks |
| | TypeScript 5 | Type-safe JavaScript with interfaces and generics |
| | Vite | Fast build tool and dev server with HMR |
| | TanStack Query (React Query) | Server state management, caching, automatic refetching |
| | Zustand | Lightweight client state management (auth, theme) |
| | Tailwind CSS | Utility-first CSS framework |
| | Recharts | Composable charting library for transaction visualizations |
| **Testing** | xUnit | Test framework for unit and integration tests |
| | WebApplicationFactory | In-memory API testing with real HTTP requests |
| | InMemory Database | EF Core in-memory provider for isolated test data |
| | Moq | Mocking framework for unit tests |
| **DevOps** | Git | Version control |
| | GitHub | Repository hosting, issue tracking |

---

## 🚀 Getting Started

### Prerequisites

- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/) and npm
- [SQL Server](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) (Express or Developer Edition)
- [Git](https://git-scm.com/)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/rehman-areeba/Bank.git
cd Bank
```

**2. Backend Setup**

Navigate to the API project:

```bash
cd BankingApi
```

Create `appsettings.Development.json`:

```bash
cp appsettings.example.json appsettings.Development.json
```

Update the connection string and JWT settings in `appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=BankingDb;Trusted_Connection=True;TrustServerCertificate=True"
  },
  "Jwt": {
    "Key": "your-secret-key-at-least-32-characters-long-for-security",
    "Issuer": "BankingApi",
    "Audience": "BankingClient",
    "ExpiryHours": 24
  }
}
```

Apply database migrations:

```bash
dotnet ef database update
```

Run the API:

```bash
dotnet run
```

API will be available at `https://localhost:7253` and `http://localhost:5245`

**3. Frontend Setup**

Navigate to the frontend project:

```bash
cd ../banking-ui
```

Install dependencies:

```bash
npm install
```

Create `.env.development` (or verify it exists):

```env
VITE_API_URL=http://localhost:5245
```

Start the development server:

```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

**4. Access the Application**

- Open your browser and navigate to `http://localhost:5173`
- Register a new account to get started
- A default Savings account is created automatically upon registration
- Access Swagger documentation at `https://localhost:7253/swagger`

### Environment Setup

**Backend (`appsettings.Development.json`)**

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=BankingDb;Trusted_Connection=True;TrustServerCertificate=True"
  },
  "Jwt": {
    "Key": "your-secret-key-min-32-characters-long",
    "Issuer": "BankingApi",
    "Audience": "BankingClient",
    "ExpiryHours": 24
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

**Frontend (`.env.development`)**

```env
VITE_API_URL=http://localhost:5245
```

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/register` | No | Register new user with email and password |
| POST | `/api/auth/login` | No | Login and receive JWT token |
| GET | `/api/auth/me` | Yes | Get current authenticated user info |

### Accounts

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/accounts` | Yes | Get all accounts for authenticated user |
| GET | `/api/accounts/{id}` | Yes | Get specific account details |
| GET | `/api/accounts/{id}/balance` | Yes | Get current account balance |
| POST | `/api/accounts` | Yes | Create new account (Savings/Checking/Business) |
| POST | `/api/accounts/{id}/deposit` | Yes | Deposit money into account |
| POST | `/api/accounts/{id}/withdraw` | Yes | Withdraw money from account |

### Transfers

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/transfers` | Yes | Transfer money between accounts |
| GET | `/api/transfers/history` | Yes | Get transfer history for user's accounts |

### Transactions

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/accounts/{id}/transactions` | Yes | Get transaction history with pagination and filters |
| GET | `/api/transactions/recent` | Yes | Get recent transactions across all user accounts |

### Admin

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| GET | `/api/admin/audit-logs` | Yes | Admin | Get audit logs with filtering |
| GET | `/api/admin/audit-logs/{userId}` | Yes | Admin | Get audit logs for specific user |
| GET | `/api/admin/failed-logins` | Yes | Admin | Get failed login attempts (last 24 hours) |
| PUT | `/api/admin/accounts/{id}/freeze` | Yes | Admin | Freeze or unfreeze user account |

---

## 🧪 Testing

The project includes comprehensive tests demonstrating different testing strategies:

**Unit Tests**: Focus on business logic in isolation
- `TransferService` tests: Validates concurrency handling, ACID properties, balance validation
- `AccountService` tests: Validates deposit/withdrawal rules, account creation logic
- Uses Moq to mock repository dependencies

**Integration Tests**: Test the full API stack with real HTTP requests
- `AuthControllerIntegrationTests`: Registration, login, JWT validation
- `TransfersAndAccountsIntegrationTests`: End-to-end transfer flows, authorization checks
- Uses `WebApplicationFactory` with InMemory database for isolated test data

**Run all tests:**

```bash
cd BankingApi.Tests
dotnet test
```

**Run specific test:**

```bash
dotnet test --filter "FullyQualifiedName~TransferService"
```

**Run with detailed output:**

```bash
dotnet test --logger "console;verbosity=detailed"
```

**Generate code coverage:**

```bash
dotnet test /p:CollectCoverage=true
```

---

## 📂 Project Structure

**Backend (`BankingApi/`)**

```
BankingApi/
├── Controllers/           # API endpoints (Auth, Accounts, Transfers, Admin)
├── Services/              # Business logic layer
│   ├── AuthService.cs
│   ├── AccountService.cs
│   ├── TransferService.cs
│   ├── AuditService.cs
│   └── NotificationService.cs
├── Repositories/          # Data access layer
│   ├── IRepository.cs
│   ├── AccountRepository.cs
│   ├── TransactionRepository.cs
│   └── AuditLogRepository.cs
├── Models/                # Domain entities
│   ├── User.cs
│   ├── Account.cs
│   ├── Transaction.cs
│   └── AuditLog.cs
├── DTOs/                  # Data transfer objects
│   ├── Requests/
│   └── Responses/
├── Data/                  # DbContext and migrations
│   ├── ApplicationDbContext.cs
│   └── Migrations/
├── Middleware/            # Custom middleware
│   ├── ExceptionMiddleware.cs
│   └── RateLimitingMiddleware.cs
├── Validators/            # FluentValidation rules
├── BackgroundServices/    # Hosted services
│   └── NotificationProcessor.cs
└── Program.cs             # Application entry point
```

**Frontend (`banking-ui/src/`)**

```
banking-ui/src/
├── components/
│   ├── banking/           # Banking-specific components
│   │   ├── AccountCard.tsx
│   │   ├── TransferModal.tsx
│   │   ├── TransactionsTable.tsx
│   │   └── BalanceTrendChart.tsx
│   ├── layout/            # Layout components
│   │   ├── Navbar.tsx
│   │   └── Sidebar.tsx
│   └── ui/                # Reusable UI components
│       ├── Button.tsx
│       ├── Modal.tsx
│       ├── Toast.tsx
│       └── ThemeToggle.tsx
├── pages/                 # Page components
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── TransfersPage.tsx
│   ├── TransactionsPage.tsx
│   └── AdminPage.tsx
├── api/                   # API client functions
│   ├── axiosClient.ts
│   ├── auth.ts
│   ├── accounts.ts
│   ├── transfers.ts
│   └── admin.ts
├── store/                 # State management
│   ├── authStore.ts       # Zustand auth store
│   └── themeStore.ts
├── hooks/                 # Custom React hooks
│   ├── useAuth.ts
│   └── useToast.ts
├── types/                 # TypeScript interfaces
│   ├── auth.types.ts
│   ├── account.types.ts
│   └── transaction.types.ts
├── utils/                 # Utility functions
│   ├── formatters.ts
│   └── validators.ts
├── App.tsx                # Root component
├── main.tsx               # Application entry point
└── index.css              # Global styles with CSS variables
```

---

## 📸 Screenshots

<details>
<summary>Click to view screenshots</summary>

### Dashboard
![Dashboard](screenshots/dashboard.png)
*Account overview with balance cards, recent transactions, and financial summary charts*

### Transfer Flow
![Transfer](screenshots/transfer.png)
*Fund transfer interface with real-time balance validation and account selection*

### Transaction History
![Transactions](screenshots/transactions.png)
*Paginated transaction history with filtering by date range, type, and status badges*

### Admin Panel
![Admin](screenshots/admin.png)
*Admin dashboard showing audit logs, failed login attempts, and account management*

### Dark Mode
![Dark Mode](screenshots/darkmode.png)
*Full dark mode support with CSS variables across all views and components*

### Login Page
![Login](screenshots/login.png)
*Professional login interface with gradient background and form validation*

### Account Details
![Account Details](screenshots/account-details.png)
*Detailed account view with balance trends, transaction breakdown, and quick actions*

</details>

---

## 🔮 Potential Improvements

This project demonstrates core concepts but intentionally omits some features to keep scope manageable. Here's what could be added:

- **Refresh Token Rotation** — Currently JWT expires after 24 hours requiring re-login; refresh tokens would allow seamless token renewal
- **Real Email/SMS Notifications** — Notifications are currently logged only; integration with SendGrid/Twilio would enable actual delivery
- **Two-Factor Authentication (2FA)** — Add TOTP-based 2FA for enhanced security on sensitive operations
- **Interbank Transfer Simulation** — Implement two-phase commit (2PC) to simulate transfers between different banks
- **Scheduled/Recurring Payments** — Allow users to schedule future transfers or set up recurring payments
- **Docker Containerization** — Dockerfiles for API and frontend, docker-compose for local development
- **CI/CD Pipeline** — GitHub Actions workflow for automated testing and deployment
- **Deployed Live Demo** — Host on Azure/AWS with real database for portfolio demonstration
- **GraphQL API** — Alternative to REST for more flexible client queries
- **Microservices Architecture** — Split into separate services (Auth, Accounts, Transfers) with message queue

These omissions are intentional—this project focuses on demonstrating transaction safety, concurrency control, and clean architecture rather than being feature-complete.

---

## 🎓 What I Learned

Building this project deepened my understanding of several critical backend concepts:

- **Why Isolation Levels Matter** — I learned the hard way that default isolation levels (Read Committed) allow race conditions in concurrent transfers. Switching to Serializable isolation eliminated phantom reads and ensured true ACID compliance, though it required careful deadlock handling.

- **Optimistic vs Pessimistic Locking** — Initially I tried pessimistic locking with SELECT FOR UPDATE, but it caused terrible performance under load. Switching to optimistic concurrency with RowVersion improved throughput dramatically while still preventing lost updates.

- **Layered Architecture Makes Testing Easier** — Separating concerns into Controllers → Services → Repositories made unit testing trivial. I could mock repositories and test business logic in complete isolation, which caught several edge cases before integration testing.

- **Audit Logging is Harder Than It Looks** — My first attempt stored audit logs in a separate transaction, which meant they could succeed even if the transfer failed. Moving audit writes into the same transaction as the transfer ensured atomicity, but required careful transaction scope management.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/rehman-areeba/Bank/issues).

**To contribute:**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Development Guidelines:**

- Follow existing code style and naming conventions
- Add unit tests for new business logic
- Add integration tests for new API endpoints
- Update documentation for new features
- Ensure all tests pass before submitting PR

---

## 📧 Contact

Areeba Rehman - [@rehman-areeba](https://github.com/rehman-areeba)

Project Link: [https://github.com/rehman-areeba/Bank](https://github.com/rehman-areeba/Bank)

---

## 🙏 Acknowledgments

- Inspired by production banking systems and financial software architecture
- Built as a learning project to explore backend engineering concepts
- Thanks to the ASP.NET Core and React communities for excellent documentation

---

**Note**: This is a learning and portfolio project demonstrating production-grade patterns. For actual production use, additional security measures, compliance checks, regulatory requirements, and thorough auditing would be required.
