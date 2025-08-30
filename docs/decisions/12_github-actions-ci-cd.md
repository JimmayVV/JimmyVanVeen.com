# 12. GitHub Actions CI/CD Pipeline

Date: 2025-06-26

## Status

Accepted

## Context

The portfolio website lacked automated quality assurance and dependency
management processes. Manual testing and code review were the only gates before
deployment, creating potential for:

- Inconsistent code quality and formatting
- Type errors reaching production
- Build failures discovered late in the process
- Outdated dependencies with security vulnerabilities
- Manual overhead for routine dependency updates

As the project grows and potentially involves more contributors, we need
automated processes to maintain code quality and reduce manual maintenance
overhead.

## Decision

We will implement a comprehensive GitHub Actions CI/CD pipeline with the
following components:

### 1. Continuous Integration Workflow

A multi-stage pipeline (`ci.yml`) that runs on:

- Every push to `main` branch
- Every pull request against `main` branch

**Pipeline Stages:**

1. **Lint & Type Check Stage**
   - ESLint validation
   - Prettier formatting verification
   - TypeScript type checking
2. **Build Stage** (depends on stage 1)
   - Full application build with test environment variables
   - Validates deployment readiness

### 2. Automated Dependency Management

**Dependabot Configuration** (`dependabot.yml`):

- Weekly dependency scans (Mondays at 9 AM)
- Grouped updates by ecosystem (React, dev tools, build tools)
- Rate limiting (max 5 concurrent PRs)
- Safety controls (blocks major React updates)

**Auto-merge Workflow** (`dependabot-auto-merge.yml`):

- Automatically merges patch and minor dependency updates
- Requires CI pipeline to pass before merge
- Uses squash merge strategy for clean history

## Alternatives Considered

### Alternative 1: Manual Process

- **Pros**: Full control, no configuration overhead
- **Cons**: Doesn't scale, error-prone, time-consuming
- **Rejected**: Manual processes don't provide consistent quality gates

### Alternative 2: Pre-commit Hooks Only

- **Pros**: Fast feedback, catches issues before commit
- **Cons**: Can be bypassed, doesn't validate builds, no dependency automation
- **Rejected**: Insufficient coverage for comprehensive quality assurance

### Alternative 3: CircleCI/TravisCI

- **Pros**: Feature-rich, established platforms
- **Cons**: Additional service dependency, cost, complexity
- **Rejected**: GitHub Actions provides sufficient functionality with better
  integration

## Technical Implementation

### CI Pipeline Configuration

```yaml
# Concurrency control prevents redundant runs
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

# Fixed Node.js v20 for consistency with .nvmrc
node-version: "20"
cache: "npm"

# Test environment variables for builds
env:
  JVV_ALLOW_EMAILS: false
  JVV_RECAPTCHA_SITE_KEY: test-key
```

### Dependabot Grouping Strategy

```yaml
groups:
  react-ecosystem: ["react*", "@types/react*"]
  dev-tools: ["eslint*", "prettier*", "@types/*", "typescript*"]
  build-tools: ["vite*", "@react-router/*", "tailwindcss*"]
```

### Security Considerations

- Minimal workflow permissions
- Dependabot auto-merge limited to patch/minor updates
- Test environment variables prevent production side effects
- GitHub token scoped to repository access only

## Benefits

### Immediate Benefits

- **Quality Assurance**: Automated validation of every code change
- **Build Verification**: Prevents broken deployments
- **Dependency Security**: Regular updates with automated patches
- **Developer Experience**: Fast feedback on code quality issues

### Long-term Benefits

- **Scalability**: Process supports multiple contributors
- **Maintainability**: Reduced manual overhead for routine tasks
- **Reliability**: Consistent quality gates prevent regressions
- **Security**: Up-to-date dependencies reduce vulnerability surface

## Testing Results

All pipeline components tested locally before implementation:

- ✅ ESLint validation (0 errors)
- ✅ Prettier formatting verification
- ✅ TypeScript type checking (0 errors)
- ✅ Build process (successful with test env vars)

Build output: ~1.4MB total assets, 76.63 kB SSR bundle, 177.65 kB client entry.

## Monitoring and Maintenance

### Success Metrics

- CI pipeline success rate (target: >95%)
- Dependabot PR auto-merge rate
- Time to feedback on code quality issues
- Reduction in manual dependency update PRs

### Maintenance Tasks

- Monitor workflow performance and optimize as needed
- Review and adjust Dependabot grouping strategy
- Update Node.js version in workflows when .nvmrc changes
- Periodic review of ignored dependencies

## Consequences

### Positive

- Consistent code quality across all contributions
- Earlier detection of build and type issues
- Automated dependency maintenance
- Improved developer confidence in deployments

### Negative

- Additional complexity in repository configuration
- Potential for CI bottlenecks if not properly optimized
- Learning curve for contributors unfamiliar with GitHub Actions

### Mitigations

- Clear documentation of CI requirements
- Reasonable timeout limits (10 minutes) prevent hung workflows
- Concurrency controls prevent resource waste
- Grouped Dependabot updates reduce PR noise

## Implementation Notes

The pipeline integrates seamlessly with existing development workflow:

- Leverages existing npm scripts (`lint`, `format:check`, `typecheck`, `build`)
- Uses same Node.js version as specified in `.nvmrc`
- Respects existing `.prettierrc` and ESLint configuration
- Maintains compatibility with Netlify deployment process
