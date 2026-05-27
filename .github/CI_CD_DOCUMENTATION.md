# CI/CD Pipeline Documentation

## Overview

This repository includes a comprehensive CI/CD pipeline using GitHub Actions for both the backend (ASP.NET Core) and frontend (React) applications.

---

## 📁 Workflow Files

### 1. Backend Pipeline (`backend.yml`)

**Purpose:** Build, test, and validate the ASP.NET Core API

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch
- Changes in `BankingApi/` or `BankingApi.Tests/` directories

**Jobs:**
1. **build-and-test** - Main build and test job
   - Restores NuGet packages
   - Builds in Release mode
   - Runs unit tests with code coverage
   - Publishes deployment artifacts

2. **code-quality** - Code quality checks
   - Runs code formatting verification
   - Scans for security vulnerabilities
   - Checks for outdated packages

3. **migration-check** - Database migration validation
   - Verifies EF Core migrations
   - Lists pending migrations

4. **build-summary** - Generates build summary report

**Artifacts Generated:**
- `test-results` - Test execution results (.trx files)
- `code-coverage` - Code coverage reports
- `banking-api-artifacts` - Published API ready for deployment
- `security-scan` - Security vulnerability scan results

---

### 2. Frontend Pipeline (`frontend.yml`)

**Purpose:** Build, test, and validate the React application

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch
- Changes in `banking-ui/` directory

**Jobs:**
1. **build-and-test** - Main build and test job
   - Installs npm dependencies
   - Runs ESLint
   - Performs TypeScript type checking
   - Builds production bundle
   - Generates build size report

2. **security-audit** - Security checks
   - Runs npm audit
   - Checks for vulnerable dependencies

3. **build-summary** - Generates build summary report

**Artifacts Generated:**
- `banking-ui-build` - Production build artifacts (dist/)
- `npm-audit-results` - Security audit results

---

### 3. Full Stack Pipeline (`full-stack.yml`)

**Purpose:** Orchestrates both backend and frontend pipelines

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch

**Jobs:**
- Calls backend workflow
- Calls frontend workflow
- Generates integration summary

---

### 4. PR Validation (`pr-validation.yml`)

**Purpose:** Comprehensive validation for pull requests

**Triggers:**
- Pull request opened, synchronized, or reopened
- Targets `main` or `develop` branches

**Jobs:**
1. **pr-metadata** - Validates PR title and description
2. **changed-files** - Analyzes changed files
3. **code-size** - Checks code additions/deletions
4. **backend-tests** - Runs backend tests
5. **frontend-build** - Builds frontend
6. **pr-summary** - Generates validation summary

---

## 🚀 Usage

### Running Workflows Manually

You can manually trigger workflows from the GitHub Actions tab:

1. Go to **Actions** tab in GitHub
2. Select the workflow you want to run
3. Click **Run workflow**
4. Select the branch
5. Click **Run workflow** button

### Viewing Results

**Build Status:**
- Check the **Actions** tab for workflow runs
- Green checkmark = Success
- Red X = Failure
- Yellow dot = In progress

**Artifacts:**
- Click on a workflow run
- Scroll to **Artifacts** section
- Download artifacts for inspection

**Test Results:**
- View test results in the workflow summary
- Download test-results artifact for detailed analysis

**Code Coverage:**
- Download code-coverage artifact
- Open coverage.cobertura.xml in a coverage viewer

---

## 🔧 Configuration

### Environment Variables

**Backend (`backend.yml`):**
```yaml
DOTNET_VERSION: '8.0.x'
BUILD_CONFIGURATION: 'Release'
API_PROJECT_PATH: './BankingApi/BankingApi.csproj'
TEST_PROJECT_PATH: './BankingApi.Tests/BankingApi.Tests.csproj'
```

**Frontend (`frontend.yml`):**
```yaml
NODE_VERSION: '18.x'
WORKING_DIRECTORY: './banking-ui'
```

### Secrets Required

**For Frontend Build:**
- `VITE_API_URL` (optional) - API URL for production build

**To add secrets:**
1. Go to repository **Settings**
2. Click **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add secret name and value

---

## 📊 Pipeline Flow

### Backend Pipeline Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Trigger Event                        │
│         (Push to main or PR to main)                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Checkout Code (v4)                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           Setup .NET 8 SDK (v4)                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│          Restore NuGet Packages                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│      Build API Project (Release Mode)                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         Build Test Project                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│    Run Unit Tests + Code Coverage                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│      Upload Test Results & Coverage                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         Publish API Artifacts                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│      Upload Deployment Artifacts                        │
└─────────────────────────────────────────────────────────┘
```

### Frontend Pipeline Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Trigger Event                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Checkout Code                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           Setup Node.js 18                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│          Install Dependencies (npm ci)                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│            Run ESLint                                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│       TypeScript Type Check                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         Build Production Bundle                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│      Upload Build Artifacts                             │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing

### Backend Tests

**Run locally:**
```bash
cd BankingApi.Tests
dotnet test --configuration Release --logger "trx" --collect:"XPlat Code Coverage"
```

**View coverage:**
```bash
# Install ReportGenerator
dotnet tool install -g dotnet-reportgenerator-globaltool

# Generate HTML report
reportgenerator -reports:"TestResults/**/coverage.cobertura.xml" -targetdir:"coveragereport" -reporttypes:Html

# Open report
start coveragereport/index.html
```

### Frontend Tests

**Run locally:**
```bash
cd banking-ui
npm run lint
npx tsc --noEmit
npm run build
```

---

## 🔒 Security

### Vulnerability Scanning

**Backend:**
- Scans NuGet packages for known vulnerabilities
- Fails build if critical vulnerabilities found
- Results uploaded as artifacts

**Frontend:**
- Runs npm audit on dependencies
- Checks for moderate and higher severity issues
- Results uploaded as artifacts

### Best Practices

1. **Keep dependencies updated**
   ```bash
   # Backend
   dotnet list package --outdated
   
   # Frontend
   npm outdated
   ```

2. **Review security scan results**
   - Check artifacts after each build
   - Address vulnerabilities promptly

3. **Use Dependabot**
   - Enable Dependabot in repository settings
   - Automatically creates PRs for dependency updates

---

## 📈 Performance

### Build Times

**Typical build times:**
- Backend: 1-2 minutes
- Frontend: 2-3 minutes
- Full stack: 3-4 minutes

### Optimization Tips

1. **Use caching:**
   - npm cache is enabled for frontend
   - NuGet packages are cached automatically

2. **Parallel jobs:**
   - Backend and frontend run in parallel
   - Code quality checks run in parallel

3. **Conditional execution:**
   - Workflows only run when relevant files change
   - Use `paths` filter in triggers

---

## 🐛 Troubleshooting

### Common Issues

**1. Build fails with "dotnet: command not found"**
- Ensure `setup-dotnet@v4` step is present
- Check .NET version is correct

**2. Tests fail with "No test is available"**
- Verify test project path is correct
- Ensure test project builds successfully

**3. Frontend build fails with "Module not found"**
- Check `npm ci` completed successfully
- Verify package-lock.json is committed

**4. Artifacts not uploading**
- Check artifact path is correct
- Ensure files exist before upload step

### Debug Mode

Enable debug logging:
1. Go to repository **Settings**
2. **Secrets and variables** → **Actions**
3. Add secret: `ACTIONS_STEP_DEBUG` = `true`

---

## 📝 Maintenance

### Updating Workflows

**When to update:**
- .NET version changes
- Node.js version changes
- New test projects added
- New build steps required

**How to update:**
1. Edit workflow file in `.github/workflows/`
2. Commit and push changes
3. Test on a feature branch first
4. Merge to main after validation

### Monitoring

**Check regularly:**
- Workflow run history
- Artifact sizes
- Build times
- Test pass rates

---

## 🎯 Best Practices

1. **Always run tests before merging**
   - PR validation ensures this

2. **Keep workflows simple**
   - One responsibility per job
   - Use reusable workflows

3. **Use meaningful names**
   - Clear job and step names
   - Descriptive artifact names

4. **Add comments**
   - Explain complex steps
   - Document why, not just what

5. **Monitor build health**
   - Fix failing builds immediately
   - Don't ignore warnings

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [.NET CLI Reference](https://docs.microsoft.com/en-us/dotnet/core/tools/)
- [npm CLI Documentation](https://docs.npmjs.com/cli/)
- [Vite Build Documentation](https://vitejs.dev/guide/build.html)

---

## 🆘 Support

For issues with CI/CD pipelines:
1. Check workflow run logs
2. Review this documentation
3. Check GitHub Actions status page
4. Create an issue in the repository

---

**Last Updated:** 2026-05-27  
**Maintained by:** Development Team
