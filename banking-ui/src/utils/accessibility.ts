/**
 * Accessibility utility functions for screen reader announcements
 * and keyboard navigation helpers
 */

/**
 * Announce a message to screen readers
 * @param message - The message to announce
 * @param priority - 'polite' for non-urgent, 'assertive' for urgent
 */
export const announceToScreenReader = (
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement is made
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Format currency for screen readers
 * @param amount - The amount to format
 * @param currency - Currency code (default: PKR)
 */
export const formatCurrencyForScreenReader = (
  amount: number,
  currency: string = 'PKR'
): string => {
  const formattedAmount = new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
  
  return `${formattedAmount} Pakistani Rupees`;
};

/**
 * Get all focusable elements within a container
 * @param container - The container element
 */
export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');
  
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
};

/**
 * Trap focus within a container (for modals, drawers, etc.)
 * @param container - The container element
 * @param event - The keyboard event
 */
export const trapFocus = (container: HTMLElement, event: KeyboardEvent): void => {
  if (event.key !== 'Tab') return;
  
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length === 0) return;
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  if (event.shiftKey) {
    // Shift + Tab
    if (document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }
  } else {
    // Tab
    if (document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
};

/**
 * Handle arrow key navigation for lists/tabs
 * @param event - The keyboard event
 * @param elements - Array of elements to navigate
 * @param currentIndex - Current focused element index
 * @param orientation - 'horizontal' or 'vertical'
 */
export const handleArrowKeyNavigation = (
  event: KeyboardEvent,
  elements: HTMLElement[],
  currentIndex: number,
  orientation: 'horizontal' | 'vertical' = 'horizontal'
): number => {
  const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
  const prevKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
  
  let newIndex = currentIndex;
  
  if (event.key === nextKey) {
    event.preventDefault();
    newIndex = (currentIndex + 1) % elements.length;
  } else if (event.key === prevKey) {
    event.preventDefault();
    newIndex = currentIndex === 0 ? elements.length - 1 : currentIndex - 1;
  } else if (event.key === 'Home') {
    event.preventDefault();
    newIndex = 0;
  } else if (event.key === 'End') {
    event.preventDefault();
    newIndex = elements.length - 1;
  }
  
  if (newIndex !== currentIndex) {
    elements[newIndex]?.focus();
  }
  
  return newIndex;
};

/**
 * Generate a unique ID for ARIA attributes
 * @param prefix - Prefix for the ID
 */
let idCounter = 0;
export const generateAriaId = (prefix: string = 'aria'): string => {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Date.now()}`;
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get appropriate ARIA label for transaction status
 * @param status - Transaction status
 */
export const getTransactionStatusAriaLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    completed: 'Transaction completed successfully',
    pending: 'Transaction pending',
    failed: 'Transaction failed',
    cancelled: 'Transaction cancelled'
  };
  
  return statusLabels[status.toLowerCase()] || `Transaction status: ${status}`;
};

/**
 * Get appropriate ARIA label for account type
 * @param type - Account type
 */
export const getAccountTypeAriaLabel = (type: string): string => {
  const typeLabels: Record<string, string> = {
    savings: 'Savings account',
    current: 'Current account',
    checking: 'Checking account',
    business: 'Business account'
  };
  
  return typeLabels[type.toLowerCase()] || `${type} account`;
};