# GitHub Actions CI/CD Pipelines

This directory contains GitHub Actions workflows and documentation for the Banking System project.

---

## 📁 Directory Structure

```
.github/
├── workflows/
│   ├── backend.yml           # Backend (ASP.NET Core) CI/CD
│   ├── frontend.yml          # Frontend (React) CI/CD
│   ├── full-stack.yml        # Full stack orchestration
│   └── pr-validation.yml     # Pull request validation
├── CI_CD_DOCUMENTATION.md    # Complete documentation
├── CI_CD_QUICK_REFERENCE.md  # Quick reference guide
├── CI_CD_SETUP_SUMMARY.md    # Setup summary
└── README.md                 # This file
```

---

## 🚀 Quick Start

### View Workflow Status

Visit the [Actions tab](../../actions) to see workflow runs.

### Run Workflows Manually

1. Go to [Actions tab](../../actions)
2. Select a workflow
3. Click "Run workflow"
4. Choose branch and run

### Add Status Badges

Add to your README.md:

```markdown
![Backend CI](https://github.com/YOUR_USERNAME/Bank/actions/workflows/backend.yml/badge.svg)
![Frontend CI](https://github.com/YOUR_USERNAME/Bank/actions/workflows/frontend.yml/badge.svg)
```

---

## 📋 Workflows

### 1. Backend Pipeline (`backend.yml`)

**Purpose:** Build, test, and validate ASP.NET Core API

**Runs on:**
- Push to main
- Pull requests to main
- Changes in `BankingApi/` or `BankingApi.Tests/`

**Jobs:**
- Build and test
- Code quality analysis
- Database migration check
- Build summary

### 2. Frontend Pipeline (`frontend.yml`)

**Purpose:** Build and validate React application

**Runs on:**
- Push to main
- Pull requests to main
- Changes in `banking-ui/`

**Jobs:**
- Build and test
- Security audit
- Build summary

### 3. Full Stack Pipeline (`full-stack.yml`)

**Purpose:** Orchestrate both backend and frontend

**Runs on:**
- Push to main
- Pull requests to main

**Jobs:**
- Backend pipeline
- Frontend pipeline
- Integration summary

### 4. PR Validation (`pr-validation.yml`)

**Purpose:** Comprehensive pull request validation

**Runs on:**
- Pull request opened/synchronized/reopened
- Targets main or develop

**Jobs:**
- PR metadata check
- Changed files analysis
- Code size check
- Backend tests
- Frontend build
- PR summary

---

## 📚 Documentation

### Complete Guides

- **[CI_CD_DOCUMENTATION.md](./CI_CD_DOCUMENTATION.md)**
  - Detailed workflow documentation
  - Configuration guide
  - Troubleshooting
  - Best practices

- **[CI_CD_QUICK_REFERENCE.md](./CI_CD_QUICK_REFERENCE.md)**
  - Quick commands
  - Common fixes
  - Status badges
  - Performance tips

- **[CI_CD_SETUP_SUMMARY.md](./CI_CD_SETUP_SUMMARY.md)**
  - Setup overview
  - Features list
  - Architecture diagram
  - Next steps

---

## 🎯 Key Features

### Backend
- ✅ .NET 8 build and test
- ✅ Unit test execution
- ✅ Code coverage collection
- ✅ Security vulnerability scanning
- ✅ Code formatting verification
- ✅ Database migration validation

### Frontend
- ✅ Node.js 18 build
- ✅ TypeScript type checking
- ✅ ESLint code linting
- ✅ Production build creation
- ✅ npm security audit
- ✅ Build size reporting

### Quality Gates
- ✅ Automated testing
- ✅ Code quality checks
- ✅ Security scanning
- ✅ PR validation
- ✅ Build summaries

---

## 📦 Artifacts

Workflows generate artifacts that can be downloaded:

| Artifact | Description | Retention |
|----------|-------------|-----------|
| `test-results` | Test execution results | 30 days |
| `code-coverage` | Code coverage reports | 30 days |
| `banking-api-artifacts` | Deployment-ready API | 7 days |
| `security-scan` | Vulnerability scan results | 30 days |
| `banking-ui-build` | Frontend production build | 7 days |
| `npm-audit-results` | npm security audit | 30 days |

---

## 🔧 Configuration

### Environment Variables

Set in workflow files or repository secrets:

**Backend:**
- `DOTNET_VERSION`: .NET SDK version (default: 8.0.x)
- `BUILD_CONFIGURATION`: Build config (default: Release)

**Frontend:**
- `NODE_VERSION`: Node.js version (default: 18.x)
- `VITE_API_URL`: API URL (optional secret)

### Adding Secrets

1. Go to repository **Settings**
2. Click **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add name and value

---

## 🐛 Troubleshooting

### Build Fails

1. Check workflow logs in Actions tab
2. Run commands locally to reproduce
3. Review error messages
4. Check [CI_CD_DOCUMENTATION.md](./CI_CD_DOCUMENTATION.md)

### Tests Fail

1. Run tests locally: `dotnet test`
2. Check test output in artifacts
3. Review test logs
4. Fix failing tests before pushing

### Artifacts Missing

1. Verify paths in workflow file
2. Check if build completed successfully
3. Ensure files exist before upload step

---

## 📈 Monitoring

### Check Build Status

```bash
# Using GitHub CLI
gh run list --workflow=backend.yml
gh run view <run-id>
gh run download <run-id>
```

### View in Browser

Visit: `https://github.com/YOUR_USERNAME/Bank/actions`

---

## 🎓 Best Practices

### Before Pushing

- ✅ Run tests locally
- ✅ Check code formatting
- ✅ Review changes
- ✅ Update documentation

### For Pull Requests

- ✅ Follow PR title conventions
- ✅ Add description
- ✅ Wait for checks to pass
- ✅ Address review comments

### After Merging

- ✅ Verify main branch builds
- ✅ Check artifacts
- ✅ Monitor for issues

---

## 🔗 Quick Links

- [Actions Tab](../../actions) - View workflow runs
- [Settings](../../settings) - Configure repository
- [Branches](../../settings/branches) - Branch protection
- [Secrets](../../settings/secrets/actions) - Manage secrets

---

## 📞 Need Help?

1. Check [CI_CD_DOCUMENTATION.md](./CI_CD_DOCUMENTATION.md)
2. Review [CI_CD_QUICK_REFERENCE.md](./CI_CD_QUICK_REFERENCE.md)
3. Check workflow logs
4. Create an issue

---

## 🎉 Getting Started

1. **First Time Setup**
   ```bash
   # Commit workflow files
   git add .github/
   git commit -m "ci: add GitHub Actions workflows"
   git push origin main
   ```

2. **Verify Workflows**
   - Go to Actions tab
   - Check all workflows run successfully
   - Download and inspect artifacts

3. **Add Status Badges**
   - Copy badge markdown from above
   - Add to main README.md
   - Commit and push

4. **Configure Branch Protection**
   - Go to Settings → Branches
   - Add rule for main branch
   - Require status checks to pass

---

**Last Updated:** 2026-05-27  
**Version:** 1.0.0
