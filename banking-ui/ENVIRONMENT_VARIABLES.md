# Environment Variables Configuration

This document explains how to configure environment variables for the Banking UI application.

## Overview

The application uses Vite's environment variable system. All environment variables must be prefixed with `VITE_` to be exposed to the client-side code.

## Environment Files

The project supports multiple environment files:

- `.env` - Default values (committed to git)
- `.env.local` - Local overrides (not committed, highest priority)
- `.env.development` - Development-specific values
- `.env.production` - Production-specific values
- `.env.example` - Template file for documentation

## Available Variables

### VITE_API_URL

**Description:** The base URL for the backend API server

**Required:** Yes

**Default:** `http://localhost:5245`

**Examples:**
- Development: `http://localhost:5245`
- Staging: `https://api-staging.yourdomain.com`
- Production: `https://api.yourdomain.com`

## Setup Instructions

### For Development

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your local backend URL if different from default:
   ```env
   VITE_API_URL=http://localhost:5245
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### For Production

1. Create `.env.production.local` or set environment variables in your hosting platform:
   ```env
   VITE_API_URL=https://api.yourdomain.com
   ```

2. Build the application:
   ```bash
   npm run build
   ```

## Environment Variable Priority

Vite loads environment variables in the following order (highest priority first):

1. `.env.[mode].local` (e.g., `.env.production.local`)
2. `.env.local` (not loaded in test mode)
3. `.env.[mode]` (e.g., `.env.production`)
4. `.env`

## Accessing Environment Variables

### In TypeScript/React Code

Use the centralized config module:

```typescript
import { config } from './config';

console.log(config.apiUrl); // Recommended
```

Or access directly (not recommended):

```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

### Type Safety

The `config` module provides TypeScript types for all configuration values, ensuring type safety throughout the application.

## Troubleshooting

### Environment variables not updating

1. Restart the Vite dev server after changing `.env` files
2. Clear browser cache
3. Check that variable names start with `VITE_`

### API calls failing

1. Verify `VITE_API_URL` is set correctly
2. Check browser console for the logged API URL
3. Ensure backend server is running on the specified URL
4. Check CORS configuration on the backend

## Security Notes

- Never commit `.env.local` or `.env.*.local` files
- Never store sensitive credentials in environment variables exposed to the client
- Use backend environment variables for secrets (API keys, database credentials, etc.)
- The `.env.example` file should only contain non-sensitive placeholder values

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Build
  env:
    VITE_API_URL: ${{ secrets.API_URL }}
  run: npm run build
```

### Docker Example

```dockerfile
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build
```

## Verification

To verify your environment configuration:

1. Start the application
2. Open browser DevTools console
3. Look for `[App Config]` and `[API Config]` log messages
4. Verify the API URL matches your expected value
