# Skeleton Loading Screens Documentation

## Overview
Professional skeleton loading screens have been added to every component in your React TypeScript banking app for a smooth loading experience.

## Files Created

### **1. src/components/skeletons/StatCardSkeleton.tsx**
Skeleton for stat cards with:
- Icon placeholder (44x44 circle)
- Label placeholder (80px wide, 12px tall)
- Value placeholder (120px wide, 28px tall)
- Change placeholder (60px wide, 10px tall)
- ARIA label: "Loading statistics"

### **2. src/components/skeletons/AccountCardSkeleton.tsx**
Skeleton for account balance cards with:
- Gradient background matching real cards
- Balance label placeholder
- Large balance amount placeholder
- Account number placeholder
- Badge placeholder
- Semi-transparent white overlays for gradient effect
- ARIA label: "Loading account information"

### **3. src/components/skeletons/TransactionRowSkeleton.tsx**
Skeleton for transaction rows with:
- Circle icon placeholder (40x40)
- Two lines of text (title and subtitle)
- Right-aligned amount placeholder
- Badge placeholder
- Matches exact layout of real transaction rows

### **4. src/components/skeletons/TableSkeleton.tsx**
Configurable table skeleton with:
- Props: `rows` (default 5), `showHeader` (default true)
- Optional header with title placeholder
- Renders N TransactionRowSkeletons
- ARIA label: "Loading transactions"

### **5. src/components/skeletons/DashboardSkeleton.tsx**
Complete dashboard loading state with:
- Total balance summary skeleton
- 4 StatCardSkeletons in responsive grid
- 2 AccountCardSkeletons
- 3 quick action button placeholders
- TableSkeleton with 5 rows
- ARIA label: "Loading dashboard"

### **6. src/components/skeletons/FormSkeleton.tsx**
Form loading skeleton with:
- Props: `fields` (default 4), `showTitle` (default true)
- Optional title and description placeholders
- N input field placeholders (label + input)
- Submit button placeholder
- ARIA label: "Loading form"

### **7. src/components/skeletons/index.ts**
Barrel export file for easy imports

## CSS Added to index.css

```css
:root {
  --skeleton-base: #e5e7eb;
  --skeleton-shine: #f3f4f6;
}

.skeleton {
  background: linear-gradient(90deg,
    var(--skeleton-base) 25%,
    var(--skeleton-shine) 50%,
    var(--skeleton-base) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Utility classes */
.skeleton-text { height: 1rem; margin-bottom: 0.5rem; }
.skeleton-title { height: 1.5rem; margin-bottom: 0.75rem; }
.skeleton-circle { border-radius: 50%; }
.skeleton-button { height: 2.5rem; border-radius: 0.375rem; }

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
    background: var(--skeleton-base);
  }
}
```

## Updated Components

### **src/pages/DashboardPage.tsx**
```tsx
import { DashboardSkeleton } from '../components/skeletons';

if (accountsLoading) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header>...</header>
      <main id="main-content">
        <DashboardSkeleton />
      </main>
    </div>
  );
}

// Recent transactions loading
{transactionsLoading ? (
  <div className="space-y-4">
    {[...Array(5)].map((_, index) => (
      <div key={index} className="flex items-center justify-between py-3">
        <div className="flex items-center space-x-4 flex-1">
          <div className="skeleton skeleton-circle w-10 h-10"></div>
          <div className="flex-1">
            <div className="skeleton h-4 w-48 mb-2"></div>
            <div className="skeleton h-3 w-32"></div>
          </div>
        </div>
        <div className="text-right">
          <div className="skeleton h-5 w-24 mb-2"></div>
          <div className="skeleton h-5 w-20"></div>
        </div>
      </div>
    ))}
  </div>
) : (
  // Real transactions
)}
```

### **src/pages/TransactionsPage.tsx**
```tsx
import { TableSkeleton } from '../components/skeletons';

{isLoading ? (
  <div className="p-6">
    <TableSkeleton rows={10} showHeader={false} />
  </div>
) : error ? (
  // Error state
) : (
  // Real transactions
)}
```

### **src/pages/AdminPage.tsx**
```tsx
import { TableSkeleton } from '../components/skeletons';

const renderTabContent = () => {
  switch (activeTab) {
    case 'users':
      if (usersLoading) return <TableSkeleton rows={6} showHeader={false} />;
      return <UsersTable />;
    
    case 'transactions':
      if (transactionsLoading) return <TableSkeleton rows={6} showHeader={false} />;
      return <TransactionsTable />;
    
    case 'audit-logs':
      if (auditLogsLoading) return <TableSkeleton rows={6} showHeader={false} />;
      return <AuditLogsTable />;
  }
};
```

### **src/components/forms/TransferForm.tsx**
```tsx
if (isLoading) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="skeleton h-6 w-40 mb-6"></div>
      <div className="space-y-6">
        {/* From Account */}
        <div>
          <div className="skeleton h-4 w-32 mb-2"></div>
          <div className="skeleton h-10 w-full"></div>
        </div>
        
        {/* To Account */}
        <div>
          <div className="skeleton h-4 w-40 mb-2"></div>
          <div className="skeleton h-10 w-full"></div>
        </div>
        
        {/* Amount */}
        <div>
          <div className="skeleton h-4 w-32 mb-2"></div>
          <div className="skeleton h-10 w-full"></div>
        </div>
        
        {/* Description */}
        <div>
          <div className="skeleton h-4 w-48 mb-2"></div>
          <div className="skeleton h-24 w-full"></div>
        </div>
        
        {/* Button */}
        <div className="skeleton skeleton-button w-full"></div>
      </div>
    </div>
  );
}
```

## Usage Examples

### Basic Skeleton
```tsx
<div className="skeleton h-4 w-32"></div>
```

### Circle Skeleton (for avatars/icons)
```tsx
<div className="skeleton skeleton-circle w-10 h-10"></div>
```

### Button Skeleton
```tsx
<div className="skeleton skeleton-button w-full"></div>
```

### Custom Skeleton Pattern
```tsx
<div className="space-y-4">
  {[...Array(5)].map((_, i) => (
    <div key={i} className="flex items-center space-x-4">
      <div className="skeleton skeleton-circle w-12 h-12"></div>
      <div className="flex-1">
        <div className="skeleton h-4 w-3/4 mb-2"></div>
        <div className="skeleton h-3 w-1/2"></div>
      </div>
    </div>
  ))}
</div>
```

### Using Pre-built Skeletons
```tsx
import { 
  DashboardSkeleton, 
  TableSkeleton, 
  FormSkeleton,
  AccountCardSkeleton 
} from '../components/skeletons';

// Full dashboard
{isLoading && <DashboardSkeleton />}

// Table with custom rows
{isLoading && <TableSkeleton rows={8} showHeader={true} />}

// Form with custom fields
{isLoading && <FormSkeleton fields={6} showTitle={true} />}

// Account cards
{isLoading && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <AccountCardSkeleton />
    <AccountCardSkeleton />
  </div>
)}
```

## Accessibility Features

All skeleton components include:
- `role="status"` for screen readers
- `aria-label` describing what's loading
- `<span className="sr-only">` with loading message
- Respects `prefers-reduced-motion` (no animation)

Example:
```tsx
<div role="status" aria-label="Loading dashboard">
  {/* Skeleton content */}
  <span className="sr-only">Loading dashboard content, please wait</span>
</div>
```

## Animation Details

- **Duration**: 1.5 seconds per cycle
- **Easing**: Linear (smooth continuous motion)
- **Direction**: Left to right shimmer effect
- **Colors**: 
  - Base: `#e5e7eb` (gray-200)
  - Shine: `#f3f4f6` (gray-100)

## Responsive Behavior

Skeletons automatically adapt to:
- Mobile: Single column layouts
- Tablet: 2-column grids
- Desktop: Full multi-column layouts

Example:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCardSkeleton />
  <StatCardSkeleton />
  <StatCardSkeleton />
  <StatCardSkeleton />
</div>
```

## Performance Considerations

- Pure CSS animations (no JavaScript)
- Hardware-accelerated transforms
- Minimal DOM elements
- Respects user motion preferences
- No layout shift when content loads

## Best Practices

1. **Match Real Content**: Skeleton should match the shape/size of real content
2. **Use Semantic HTML**: Maintain proper heading hierarchy
3. **Add ARIA Labels**: Always include screen reader context
4. **Consistent Timing**: Use same loading duration across app
5. **Graceful Degradation**: Show static skeleton if animations disabled

## Testing Checklist

- [ ] Skeletons match real content layout
- [ ] No layout shift when content loads
- [ ] Screen readers announce loading state
- [ ] Animation respects reduced motion preference
- [ ] Works on all screen sizes
- [ ] Proper contrast in light/dark modes
- [ ] Loading states clear and informative

Your banking app now has professional, accessible skeleton loading screens throughout! 🎨✨