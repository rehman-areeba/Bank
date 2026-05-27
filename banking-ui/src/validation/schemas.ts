import { z } from 'zod';

// Login Schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Register Schema
export const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Full name can only contain letters and spaces'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[\W_]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// Transfer Schema
export const transferSchema = z.object({
  fromAccountId: z
    .string()
    .min(1, 'Please select a source account')
    .regex(/^\d+$/, 'Invalid account ID'),
  toAccountNumber: z
    .string()
    .length(10, 'Account number must be exactly 10 digits')
    .regex(/^\d{10}$/, 'Account number must contain only digits'),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than 0')
    .min(1, 'Minimum transfer amount is 1')
    .max(1000000, 'Maximum transfer amount is 1,000,000'),
  description: z
    .string()
    .max(200, 'Description must not exceed 200 characters')
    .optional()
});

export type TransferFormData = z.infer<typeof transferSchema>;

// Create Account Schema
export const createAccountSchema = z.object({
  type: z.enum(['Savings', 'Current'], {
    errorMap: () => ({ message: 'Please select a valid account type' })
  }),
  agreedToTerms: z
    .boolean()
    .refine((val) => val === true, {
      message: 'You must agree to the terms and conditions'
    })
});

export type CreateAccountFormData = z.infer<typeof createAccountSchema>;

// Password strength helper
export const getPasswordStrength = (password: string): { strength: 'weak' | 'medium' | 'strong'; color: string; label: string } => {
  if (password.length < 8) {
    return { strength: 'weak', color: 'red', label: 'Weak' };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  
  const criteriaCount = [hasUpperCase, hasLowerCase, hasNumber, hasSymbol].filter(Boolean).length;
  
  if (criteriaCount >= 4) {
    return { strength: 'strong', color: 'green', label: 'Strong' };
  } else if (criteriaCount >= 3) {
    return { strength: 'medium', color: 'yellow', label: 'Medium' };
  } else if (criteriaCount >= 2) {
    return { strength: 'weak', color: 'red', label: 'Weak' };
  }
  
  return { strength: 'weak', color: 'red', label: 'Weak' };
};