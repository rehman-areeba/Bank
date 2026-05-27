# Environment Variables - Quick Reference

## 🚀 Quick Start

### Development (Default)
```bash
npm run dev
# Uses: http://localhost:5245
```

### Development (Custom Backend)
```bash
# Create .env.local
echo VITE_API_URL=http://localhost:8080 > .env.local
npm run dev
```

### Production Build
```bash
npm run build
# Uses: https://api.yourdomain.com (from .env.production)
```

## 📋 Available Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5245` |

## 📁 Environment Files

| File | Priority | Committed | Purpose |
|------|----------|-----------|---------|
| `.env.production.local` | 1 (Highest) | ❌ No | Production local overrides |
| `.env.local` | 2 | ❌ No | Local overrides (any mode) |
| `.env.production` | 3 | ✅ Yes | Production defaults |
| `.env.development` | 3 | ✅ Yes | Development defaults |
| `.env` | 4 (Lowest) | ✅ Yes | Base defaults |

## 💻 Usage in Code

```typescript
// ✅ Recommended: Use config module
import { config } from './config';
console.log(config.apiUrl);

// ❌ Not recommended: Direct access
const url = import.meta.env.VITE_API_URL;
```

## 🔍 Debugging

Check browser console for:
```
[App Config] { apiUrl: 'http://localhost:5245', mode: 'development' }
[API Config] Base URL: http://localhost:5245
```

## 📚 Full Documentation

- `ENVIRONMENT_VARIABLES.md` - Complete guide
- `ENVIRONMENT_SETUP_SUMMARY.md` - All changes made
- `src/config/README.md` - Config module docs
