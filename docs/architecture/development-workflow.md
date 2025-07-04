# Development Workflow Architecture

This document describes the development workflow and tooling that powers the
creation and maintenance of this application.

## Overview

The development workflow integrates traditional software engineering practices
with AI-assisted development through Claude Code, creating a hybrid approach
that maximizes both velocity and quality.

## Workflow Components

### AI-Assisted Development

#### Claude Code Integration

- **Role**: Primary development partner for architecture, coding, and
  documentation
- **Usage**: Feature planning, implementation, refactoring, and technical
  writing
- **Benefits**: Accelerated development, consistent patterns, comprehensive
  documentation

#### Collaboration Pattern

```
Planning → AI Discussion → Implementation → Human Review → Integration
```

### Version Control Workflow

#### Git Strategy

- **Main Branch**: `main` (stable, production-ready)
- **Branch Naming**: Organized by type and correlated with GitHub issues
- **Pull Requests**: Required for all changes with AI assistance documented

#### Branch Naming Convention

**Format**: `<type>/<issue-number>-<short-description>` or
`<type>/<short-description>`

**Branch Types:**

- `feature/` - New features and functionality
- `enhancement/` - Improvements to existing features
- `fix/` - Bug fixes and corrections
- `hotfix/` - Urgent production fixes
- `refactor/` - Code restructuring without functionality changes
- `test/` - Adding or updating tests
- `docs/` - Documentation updates
- `chore/` - Maintenance tasks, dependency updates, tooling
- `ci/` - CI/CD pipeline changes
- `security/` - Security-related fixes and improvements
- `perf/` - Performance optimizations

**Examples:**

```bash
feature/67-prettier-setup
fix/123-sidebar-mobile-responsive
docs/architecture-decision-records
chore/dependency-security-updates
```

#### Commit Standards

- Descriptive commit messages
- Atomic commits when possible
- Co-authoring with Claude documented in ADR 11
- Branch names correlate with GitHub issue labels

#### Branch Automation Options

**Git Aliases for Quick Branch Creation:**

```bash
# Add to ~/.gitconfig
[alias]
    feature = "!f() { git checkout -b feature/$1; }; f"
    fix = "!f() { git checkout -b fix/$1; }; f"
    docs = "!f() { git checkout -b docs/$1; }; f"
    chore = "!f() { git checkout -b chore/$1; }; f"

# Usage examples:
# git feature "67-prettier-setup"
# git fix "sidebar-mobile-responsive"
```

**GitHub Actions for Branch Name Validation:**

```yaml
# .github/workflows/branch-naming.yml
name: Branch Naming
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  check-branch-name:
    runs-on: ubuntu-latest
    steps:
      - name: Check branch name
        run: |
          if [[ ! "${{ github.head_ref }}" =~ ^(feature|fix|docs|chore|enhancement|refactor|test|ci|security|perf|hotfix)/.+ ]]; then
            echo "Branch name must start with allowed prefix"
            exit 1
          fi
```

**Optional Git Hook for Local Validation:**

```bash
# .git/hooks/pre-push (make executable with chmod +x)
#!/bin/bash
branch=$(git rev-parse --abbrev-ref HEAD)
valid_pattern="^(feature|fix|docs|chore|enhancement|refactor|test|ci|security|perf|hotfix)/.+"

if [[ ! $branch =~ $valid_pattern ]] && [[ $branch != "main" ]]; then
    echo "Error: Branch name '$branch' does not follow naming convention"
    echo "Use: <type>/<description> where type is one of:"
    echo "  feature, fix, docs, chore, enhancement, refactor, test, ci, security, perf, hotfix"
    exit 1
fi
```

**Recommended GitHub Issue Labels:**

- `type: feature` → `feature/` branches
- `type: bug` → `fix/` branches
- `type: documentation` → `docs/` branches
- `type: maintenance` → `chore/` branches
- `type: enhancement` → `enhancement/` branches

### Code Quality Pipeline

#### Pre-commit Hooks

1. **lint-staged**: Runs on staged files only
2. **ESLint**: Type checking and code quality
3. **Prettier**: Automatic code formatting
4. **TypeScript**: Type validation

#### Continuous Integration

**GitHub Actions Pipeline** (ADR 12):

- **Multi-stage validation**: Lint → TypeScript → Build
- **Automatic builds**: Every push to main and PR creation
- **Quality gates**: Must pass all stages before merge
- **Environment testing**: Build validation with test configuration
- **Performance optimized**: 10-minute timeouts, npm caching, concurrency
  control

**Dependabot Automation**:

- **Weekly scans**: Monday 9 AM dependency updates
- **Grouped updates**: Logical ecosystem groupings (React, dev tools, build
  tools)
- **Auto-merge**: Patch/minor updates automatically merged after CI passes
- **Safety controls**: Major React updates blocked for manual review

### Development Environment

#### Local Development

```bash
npm run dev     # Start development server
npm run lint    # Check code quality
npm run format  # Format code
npm run typecheck # Type validation
```

#### AI-Enhanced Development Flow

1. **Context Sharing**: Provide Claude with relevant codebase context
2. **Collaborative Planning**: Discuss architecture and approach
3. **Guided Implementation**: AI-assisted coding with human oversight
4. **Iterative Refinement**: Multiple rounds of improvement
5. **Documentation**: AI-generated docs with human review

## Feature Development Process

### Phase 1: Planning

- Define requirements and constraints
- Discuss architectural approach with Claude
- Create or update relevant ADRs
- Plan implementation strategy

### Phase 2: Implementation

- Create feature branch
- Implement with AI assistance
- Follow established patterns and conventions
- Write tests for new functionality

### Phase 3: Quality Assurance

- **Automated CI pipeline**: GitHub Actions validates all changes
- **Local validation**: Run full test suite, lint, format, and type checking
- **Build verification**: Ensure successful build with test environment
- **Manual testing**: Feature validation and user experience testing

### Phase 4: Review and Integration

- Create pull request with detailed description
- Code review (human + AI insights)
- Address feedback and iterate
- Merge to main branch

### Phase 5: Deployment

- Automatic Netlify deployment
- Monitor for issues
- Update documentation if needed

## Documentation Workflow

### AI-Assisted Documentation

- Technical documentation generated with Claude
- Architecture diagrams and explanations
- Decision rationale and tradeoff analysis
- Code examples and patterns

### Documentation Standards

- Keep docs in sync with code changes
- Include context for decision making
- Provide examples for complex concepts
- Cross-reference related documentation

## Quality Assurance

### Code Quality

- TypeScript strict mode for type safety
- ESLint rules for consistency
- Prettier for formatting
- Pre-commit hooks prevent bad code

### AI Code Review

- Human validation of all AI-generated code
- Pattern consistency verification
- Performance consideration review
- Security and accessibility checks

### Testing Strategy

- Unit tests for business logic
- Integration tests for API endpoints
- Manual testing for user workflows
- Continuous monitoring in production

## Tool Integration

### Development Tools

- **VS Code**: Primary IDE with relevant extensions
- **Vite**: Fast development server and building
- **Git**: Version control with descriptive commits
- **Netlify CLI**: Local testing of production environment

### AI Tools

- **Claude Code**: Primary AI development assistant
- **Integration Points**: Architecture, coding, documentation, refactoring

### Quality Tools

- **ESLint**: Code quality and consistency
- **Prettier**: Automatic code formatting
- **TypeScript**: Type safety and developer experience
- **Husky**: Git hooks for quality gates

## Performance Monitoring

### Development Performance

- Build time optimization
- Development server speed
- Hot module replacement efficiency
- Type checking performance

### AI Collaboration Metrics

- Feature implementation velocity
- Documentation coverage improvement
- Code quality consistency
- Learning acceleration

## Best Practices

### AI Collaboration

1. **Provide Context**: Share relevant code and requirements
2. **Iterate Gradually**: Work through problems step by step
3. **Validate Output**: Always review AI-generated code
4. **Document Decisions**: Record rationale for future reference
5. **Learn Continuously**: Use AI to understand new patterns

### Code Quality

1. **Type Everything**: Use TypeScript strictly
2. **Test Consistently**: Write tests for new features
3. **Format Automatically**: Let Prettier handle formatting
4. **Review Thoroughly**: Human oversight for all changes
5. **Document Changes**: Keep architecture docs current

## Related Documentation

- [Architecture Overview](./overview.md) - System architecture
- [Component Architecture](./components.md) - Component patterns
- [ADR 11: Claude Code](../decisions/11_claude-code.md) - AI tooling decision
