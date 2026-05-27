# Configuration Module

This module provides centralized configuration management for the Banking UI application.

## Usage

Import the config object in your components or services:

```typescript
import { config } from './config';

// Access configuration values
console.log(config.apiUrl);        // API base URL
console.log(config.isDevelopment); // true in dev mode
console.log(config.isProduction);  // true in production
console.log(config.mode);          // 'development' or 'production'
```

## Benefits

1. **Type Safety**: All configuration values are typed
2. **Centralized**: Single source of truth for all config
3. **Validation**: Warns if required variables are missing
4. **Development Logging**: Automatically logs config in dev mode

## Adding New Configuration

To add a new environment variable:

1. Add it to `.env.example`:
   ```env
   VITE_NEW_VARIABLE=value
   ```

2. Update the `AppConfig` interface in `config/index.ts`:
   ```typescript
   interface AppConfig {
     apiUrl: string;
     newVariable: string; // Add new property
     // ...
   }
   ```

3. Add it to the config object:
   ```typescript
   export const config: AppConfig = {
     apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5245',
     newVariable: import.meta.env.VITE_NEW_VARIABLE || 'default',
     // ...
   };
   ```

4. Use it in your code:
   ```typescript
   import { config } from './config';
   console.log(config.newVariable);
   ```
