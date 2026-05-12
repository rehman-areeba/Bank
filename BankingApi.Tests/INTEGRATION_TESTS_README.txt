===============================================
INTEGRATION TESTS DOCUMENTATION
===============================================

This document explains the integration test setup and how to run the tests.

===============================================
TEST STRUCTURE
===============================================

1. BankingApiFactory.cs
   - Custom WebApplicationFactory for testing
   - Configures InMemory database
   - Overrides DbContext registration
   - Ensures clean test environment

2. AuthControllerIntegrationTests.cs
   - Tests for user registration
   - Tests for user login
   - Tests for JWT token generation
   - Tests for authentication failures

3. TransfersAndAccountsIntegrationTests.cs
   - Tests for money transfers
   - Tests for account access control
   - Tests for balance verification
   - Tests for authorization

===============================================
KEY FEATURES
===============================================

✓ Uses WebApplicationFactory for full integration testing
✓ InMemory database for isolated test execution
✓ Automatic database seeding in test methods
✓ JWT token authentication testing
✓ Authorization and access control testing
✓ Balance verification after transactions
✓ Error handling and validation testing

===============================================
TEST COVERAGE
===============================================

AuthController Tests:
  ✓ Register - Returns JWT token
  ✓ Register - Duplicate email returns 400
  ✓ Login - Valid credentials returns JWT token
  ✓ Login - Invalid password returns 401
  ✓ Login - Non-existent user returns 401
  ✓ GetMe - With valid token returns user info
  ✓ GetMe - Without token returns 401

TransfersController Tests:
  ✓ Transfer - Without auth returns 401
  ✓ Transfer - Valid request returns 201 and debits balance
  ✓ Transfer - Insufficient balance returns 400
  ✓ Transfer - To non-existent account returns 404

AccountsController Tests:
  ✓ GetBalance - Own account returns 200
  ✓ GetBalance - Other user's account returns 403
  ✓ GetAccounts - Returns only user's accounts
  ✓ CreateAccount - Valid request returns 201

===============================================
RUNNING THE TESTS
===============================================

From Visual Studio:
  1. Open Test Explorer (Test > Test Explorer)
  2. Click "Run All Tests"
  3. View results in Test Explorer

From Command Line:
  cd BankingApi.Tests
  dotnet test

Run specific test:
  dotnet test --filter "FullyQualifiedName~AuthController_Register_ReturnsJwtToken"

Run with detailed output:
  dotnet test --logger "console;verbosity=detailed"

Generate code coverage:
  dotnet test /p:CollectCoverage=true

===============================================
TEST HELPER METHODS
===============================================

CreateUserWithAccount():
  - Registers a new user
  - Creates default account
  - Sets initial balance
  - Returns token, userId, and accountNumber
  - Used for test data seeding

Usage:
  var (token, userId, accountNumber) = 
      await CreateUserWithAccount("John Doe", "john@example.com", 5000);

===============================================
DATABASE SETUP
===============================================

InMemory Database:
  - Each test class gets a fresh database
  - Database name: "BankingTestDb"
  - Automatically created and seeded
  - No cleanup required

Seeding Strategy:
  - Data seeded per test method
  - Uses CreateUserWithAccount helper
  - Ensures test isolation
  - No shared state between tests

===============================================
AUTHENTICATION TESTING
===============================================

JWT Token Flow:
  1. Register user via /api/auth/register
  2. Extract token from response
  3. Add token to Authorization header
  4. Make authenticated requests

Example:
  _client.DefaultRequestHeaders.Authorization = 
      new AuthenticationHeaderValue("Bearer", token);

===============================================
BEST PRACTICES
===============================================

✓ DO:
  - Use descriptive test names
  - Follow Arrange-Act-Assert pattern
  - Test both success and failure scenarios
  - Verify database state after operations
  - Use helper methods for common setup

✗ DON'T:
  - Share state between tests
  - Depend on test execution order
  - Use real database for tests
  - Hard-code test data
  - Skip cleanup (InMemory handles this)

===============================================
TROUBLESHOOTING
===============================================

Issue: Tests fail with "Database not found"
Solution: Ensure EnsureCreated() is called in factory

Issue: Tests fail with "Unauthorized"
Solution: Verify token is added to Authorization header

Issue: Tests interfere with each other
Solution: Each test should seed its own data

Issue: "Cannot access disposed object"
Solution: Create new scope for database access

===============================================
EXTENDING THE TESTS
===============================================

To add new tests:

1. Create test method with [Fact] attribute
2. Use CreateUserWithAccount for setup
3. Make HTTP request to API endpoint
4. Assert response status and content
5. Verify database state if needed

Example:
  [Fact]
  public async Task MyNewTest()
  {
      // Arrange
      var (token, userId, accountNumber) = 
          await CreateUserWithAccount("Test User", "test@example.com");
      
      // Act
      var response = await _client.GetAsync("/api/endpoint");
      
      // Assert
      Assert.Equal(HttpStatusCode.OK, response.StatusCode);
  }

===============================================
CI/CD INTEGRATION
===============================================

GitHub Actions:
  - name: Run Tests
    run: dotnet test --no-build --verbosity normal

Azure DevOps:
  - task: DotNetCoreCLI@2
    inputs:
      command: 'test'
      projects: '**/*Tests.csproj'

===============================================
