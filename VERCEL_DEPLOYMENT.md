# Vercel Deployment Guide

This guide explains how to deploy the banking-ui React application to Vercel using GitHub Actions.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code must be in a GitHub repository
3. **Vercel Project**: Create a new project in Vercel dashboard

## 🔧 Setup Instructions

### Step 1: Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `banking-ui`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 2: Get Vercel Credentials

#### Get Vercel Token
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Generate token at: https://vercel.com/account/tokens
# Create a new token with appropriate scope
```

#### Get Organization ID and Project ID
```bash
# Navigate to your project directory
cd banking-ui

# Link to Vercel project
vercel link

# This creates .vercel/project.json with your IDs
cat .vercel/project.json
```

The file will contain:
```json
{
  "orgId": "team_xxxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxxx"
}
```

### Step 3: Configure GitHub Secrets

Add these secrets to your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add the following secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `VERCEL_TOKEN` | Vercel authentication token | `xxxxxxxxxxxxxx` |
| `VERCEL_ORG_ID` | Your Vercel organization/team ID | `team_xxxxxxxxxxxxx` |
| `VERCEL_PROJECT_ID` | Your Vercel project ID | `prj_xxxxxxxxxxxxx` |
| `VITE_API_URL` | Backend API URL (optional) | `https://your-api.com` |

### Step 4: Configure Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variable:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `VITE_API_URL` | Your production API URL | Production |

**Example**: `https://bankingapi.azurewebsites.net` or `https://your-api.onrender.com`

## 🚀 Deployment Process

### Automatic Deployment

The workflow automatically triggers when:
- You push to the `main` branch
- Changes are made in `banking-ui/` directory
- Changes are made to the workflow file itself

### Manual Deployment

You can also deploy manually using Vercel CLI:

```bash
# Navigate to frontend directory
cd banking-ui

# Deploy to production
vercel --prod
```

## 📁 Project Structure

```
banking-ui/
├── src/
├── public/
├── dist/              # Build output (generated)
├── .vercel/           # Vercel config (generated, gitignored)
├── package.json
├── vite.config.ts
└── vercel.json        # Optional: Vercel configuration
```

## ⚙️ Optional: Custom Vercel Configuration

Create `banking-ui/vercel.json` for advanced configuration:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

## 🔍 Workflow Explanation

The GitHub Actions workflow (`.github/workflows/vercel-deploy.yml`) performs these steps:

1. **Checkout code**: Gets the latest code from repository
2. **Setup Node.js**: Installs Node.js 18.x
3. **Install Vercel CLI**: Installs the latest Vercel CLI globally
4. **Pull Vercel environment**: Downloads project configuration and environment variables
5. **Build project**: Builds the React app with Vite
6. **Deploy to Vercel**: Deploys the pre-built application to production

## 🧪 Testing the Deployment

After deployment:

1. Check the **Actions** tab in GitHub to see workflow status
2. Visit your Vercel dashboard to see deployment logs
3. Access your deployed app at: `https://your-project.vercel.app`
4. Verify environment variables are working:
   - Open browser console
   - Check if API calls are going to correct backend URL

## 🐛 Troubleshooting

### Build Fails

**Error**: `Build failed with exit code 1`

**Solution**: Check build logs in GitHub Actions. Common issues:
- TypeScript errors: Run `npm run build` locally first
- Missing dependencies: Ensure `package-lock.json` is committed
- Environment variables: Verify `VITE_API_URL` is set in Vercel

### Deployment Fails

**Error**: `Error: Invalid token`

**Solution**: 
- Regenerate Vercel token at https://vercel.com/account/tokens
- Update `VERCEL_TOKEN` secret in GitHub

**Error**: `Error: Project not found`

**Solution**:
- Verify `VERCEL_PROJECT_ID` matches your project
- Run `vercel link` locally to get correct IDs

### API Calls Fail

**Error**: `Network Error` or `CORS Error`

**Solution**:
- Verify `VITE_API_URL` is set correctly in Vercel environment variables
- Ensure backend CORS allows your Vercel domain
- Check backend is deployed and accessible

### Routing Issues (404 on Refresh)

**Error**: Page refreshes return 404

**Solution**: Add `vercel.json` with rewrite rules (see Optional Configuration above)

## 📊 Monitoring

### View Deployment Status

- **GitHub Actions**: Check workflow runs in Actions tab
- **Vercel Dashboard**: View deployment logs and analytics
- **Vercel CLI**: Run `vercel logs` to see runtime logs

### Rollback

If deployment has issues:

```bash
# List deployments
vercel ls

# Promote a previous deployment
vercel promote <deployment-url>
```

Or use Vercel dashboard to rollback to previous deployment.

## 🔒 Security Best Practices

1. **Never commit secrets**: Keep `.vercel/` in `.gitignore`
2. **Rotate tokens**: Regenerate Vercel tokens periodically
3. **Limit token scope**: Use project-specific tokens when possible
4. **Environment variables**: Store sensitive data in Vercel environment variables, not in code
5. **HTTPS only**: Vercel enforces HTTPS by default

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [GitHub Actions with Vercel](https://vercel.com/guides/how-can-i-use-github-actions-with-vercel)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

## 🎯 Next Steps

After successful deployment:

1. ✅ Set up custom domain in Vercel dashboard
2. ✅ Configure production environment variables
3. ✅ Enable Vercel Analytics for monitoring
4. ✅ Set up preview deployments for pull requests
5. ✅ Configure backend CORS to allow Vercel domain

---

**Note**: The first deployment may take 2-3 minutes. Subsequent deployments are typically faster due to caching.
