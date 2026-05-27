# CI/CD Quick Reference

## 🚀 Quick Commands

### Backend (ASP.NET Core)

```bash
# Restore packages
dotnet restore

# Build
dotnet build --configuration Release

# Run tests
dotnet test --configuration Release

# Run tests with coverage
dotnet test --collect:"XPlat Code Coverage"

# Publish
dotnet publish --configuration Release --output ./publish

# Check for vulnerabilities
dotnet list package --vulnerable --include-transitive

# Check for outdated packages
dotnet list package --outdated
```

### Frontend (React + Vite)

```bash
# Install dependencies
npm ci

# Lint
npm run lint

# Type check
npx tsc --noEmit

# Build
npm run build

# Preview build
npm run preview

# Security audit
npm audit

# Update dependencies
npm update
```

---

## 📋 Workflow Triggers

| Workflow | Trigger | Path Filter |
|----------|---------|-------------|
| `backend.yml` | Push/PR to main | `BankingApi/**`, `BankingApi.Tests/**` |
| `frontend.yml` | Push/PR to main | `banking-ui/**` |
| `full-stack.yml` | Push/PR to main | All paths |
| `pr-validation.yml` | PR to main/develop | All paths |

---

## 📦 Artifacts

| Artifact Name | Contents | Retention |
|---------------|----------|-----------|
| `test-results` | Test execution results (.trx) | 30 days |
| `code-coverage` | Code coverage reports | 30 days |
| `banking-api-artifacts` | Published API | 7 days |
| `security-scan` | Vulnerability scan results | 30 days |
| `banking-ui-build` | Frontend build (dist/) | 7 days |
| `npm-audit-results` | npm audit JSON | 30 days |

---

## ✅ Status Badges

Add to README.md:

```markdown
![Backend CI](https://github.com/YOUR_USERNAME/Bank/actions/workflows/backend.yml/badge.svg)
![Frontend CI](https://github.com/YOUR_USERNAME/Bank/actions/workflows/frontend.yml/badge.svg)
![Full Stack CI](https://github.com/YOUR_USERNAME/Bank/actions/workflows/full-stack.yml/badge.svg)
```

---

## 🔧 Environment Variables

### Backend
- `DOTNET_VERSION`: .NET SDK version (default: 8.0.x)
- `BUILD_CONFIGURATION`: Build configuration (default: Release)

### Frontend
- `NODE_VERSION`: Node.js version (default: 18.x)
- `VITE_API_URL`: API URL for build (optional)

---

## 🐛 Common Fixes

### Build Fails

```bash
# Clear caches
rm -rf ~/.nuget/packages  # Backend
rm -rf node_modules       # Frontend

# Reinstall
dotnet restore            # Backend
npm ci                    # Frontend
```

### Tests Fail

```bash
# Run tests locally first
dotnet test --verbosity detailed

# Check test output
cat TestResults/*.trx
```

### Artifacts Missing

```bash
# Verify paths exist
ls -la ./publish          # Backend
ls -la ./banking-ui/dist  # Frontend
```

---

## 📊 Monitoring

### Check Build Status

```bash
# Using GitHub CLI
gh run list --workflow=backend.yml
gh run list --workflow=frontend.yml

# View specific run
gh run view RUN_ID

# Download artifacts
gh run download RUN_ID
```

### View Logs

```bash
# Using GitHub CLI
gh run view RUN_ID --log

# Or visit:
# https://github.com/YOUR_USERNAME/Bank/actions
```

---

## 🔒 Security Checks

### Backend Security Scan

```bash
# Check for vulnerabilities
dotnet list package --vulnerable --include-transitive

# Update vulnerable packages
dotnet add package PACKAGE_NAME --version SAFE_VERSION
```

### Frontend Security Audit

```bash
# Run audit
npm audit

# Fix automatically (if possible)
npm audit fix

# Force fix (may break things)
npm audit fix --force
```

---

## 📈 Performance Tips

1. **Use caching**
   - npm cache enabled by default
   - NuGet packages cached automatically

2. **Run in parallel**
   - Backend and frontend jobs run in parallel
   - Use `needs:` to control dependencies

3. **Filter paths**
   - Only run workflows when relevant files change
   - Use `paths:` in workflow triggers

4. **Optimize builds**
   - Use `--no-restore` and `--no-build` flags
   - Cache node_modules between runs

---

## 🎯 Best Practices

✅ **DO:**
- Run tests locally before pushing
- Keep workflows simple and focused
- Use meaningful commit messages
- Review PR validation results
- Fix failing builds immediately

❌ **DON'T:**
- Commit without testing
- Ignore workflow failures
- Skip code reviews
- Merge failing PRs
- Disable security checks

---

## 📞 Quick Links

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [.NET CLI Docs](https://docs.microsoft.com/en-us/dotnet/core/tools/)
- [npm Docs](https://docs.npmjs.com/)
- [Vite Docs](https://vitejs.dev/)

---

## 🆘 Need Help?

1. Check workflow logs in GitHub Actions tab
2. Review [CI_CD_DOCUMENTATION.md](./CI_CD_DOCUMENTATION.md)
3. Run commands locally to reproduce
4. Create an issue with logs attached
