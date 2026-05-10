-- ===============================================
-- ADD BALANCE TO ACCOUNTS FOR TESTING
-- ===============================================

-- View all users and their accounts
SELECT 
    u.Id AS UserId,
    u.FullName,
    u.Email,
    a.Id AS AccountId,
    a.AccountNumber,
    a.Type AS AccountType,
    a.Balance,
    a.IsActive
FROM Users u
INNER JOIN Accounts a ON u.Id = a.UserId
ORDER BY u.CreatedAt DESC;

-- ===============================================
-- ADD 10,000 PKR TO YOUR ACCOUNT
-- ===============================================

-- Option 1: Update by Email
UPDATE Accounts
SET Balance = 10000
WHERE UserId IN (
    SELECT Id FROM Users WHERE Email = 'john@example.com'
);

-- Option 2: Update by Account Number (replace with your actual account number)
UPDATE Accounts
SET Balance = 10000
WHERE AccountNumber = 'XXXXXXXXXX';

-- Option 3: Update ALL accounts (for testing)
UPDATE Accounts
SET Balance = 10000;

-- ===============================================
-- VERIFY BALANCE UPDATE
-- ===============================================

SELECT 
    u.FullName,
    u.Email,
    a.AccountNumber,
    a.Balance
FROM Users u
INNER JOIN Accounts a ON u.Id = a.UserId;

-- ===============================================
-- CREATE SECOND TEST USER (for transfer testing)
-- ===============================================

-- Register a second user through the UI:
-- Email: jane@example.com
-- Password: Password123!

-- Then add balance to first user only:
UPDATE Accounts
SET Balance = 10000
WHERE UserId IN (
    SELECT Id FROM Users WHERE Email = 'john@example.com'
);

-- ===============================================
-- VIEW TRANSACTION HISTORY
-- ===============================================

SELECT 
    t.Id,
    t.Type,
    t.Amount,
    t.Description,
    t.CreatedAt,
    fa.AccountNumber AS FromAccount,
    ta.AccountNumber AS ToAccount
FROM Transactions t
LEFT JOIN Accounts fa ON t.FromAccountId = fa.Id
LEFT JOIN Accounts ta ON t.ToAccountId = ta.Id
ORDER BY t.CreatedAt DESC;

-- ===============================================
-- RESET BALANCES (if needed)
-- ===============================================

UPDATE Accounts SET Balance = 0;

-- ===============================================
-- DELETE TEST DATA (if needed)
-- ===============================================

DELETE FROM Transactions;
DELETE FROM Accounts;
DELETE FROM Users;

-- ===============================================
