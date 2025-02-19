# Testing Plan and Guidelines

## General Instructions and Principles

### Code Style and Communication
- All code comments must be in English
- Team communication in Russian
- Follow SOLID principles:
  - Single Responsibility Principle
  - Open/Closed Principle
  - Liskov Substitution Principle
  - Interface Segregation Principle
  - Dependency Inversion Principle
- Apply DRY (Don't Repeat Yourself) principle
- Follow KISS (Keep It Simple, Stupid) principle
- Use Clean Architecture patterns
- Use Best Practices for everything
- Use TypeScript for all code
- Use ESLint for code quality


### Testing Guidelines
- Write tests using AAA pattern (Arrange-Act-Assert)
- Keep tests simple and focused
- Use meaningful test descriptions
- Avoid test interdependence
- Use proper mocking strategies
- Follow TDD where applicable

## Implementation Plan

### Critical Improvements (Priority 1)

#### Testing Infrastructure
- [✅] Update @testing-library/react (updated to 14.2.1)
- [✅] Update @testing-library/dom (updated to 9.3.4)
- [✅] Update jsdom (updated to 24.0.0)
- [ ] Fix security vulnerabilities in dependencies
- [✅] Set up GitHub Actions for automated testing
- [ ] Configure pre-commit hooks for tests

#### Notes
- Using legacy-peer-deps due to React 19 compatibility
- Remaining security issues are related to development dependencies
- GitHub Actions configured with:
  - Automated testing on push and PR
  - Coverage reports generation
  - Coverage threshold check (80%)
  - Node.js 18.x environment

#### Critical Component Coverage
- [ ] Authentication/Authorization tests
- [ ] Supabase integration tests
- [ ] Excel data processing tests (read-excel-file)
- [ ] Markdown editor tests (@uiw/react-md-editor)

### High Priority (Priority 2)

#### Existing Tests Improvement
- [ ] Radix UI components tests
- [ ] React Query hooks tests
- [ ] API error handling tests
- [ ] Form validation tests

#### Integration Testing
- [ ] E2E tests for main user scenarios
- [ ] date-fns integration tests
- [ ] Notification system (toast) tests

### Medium Priority (Priority 3)

#### Code Quality
- [ ] Add eslint-plugin-testing-library rules
- [ ] Create common test helpers
- [ ] Add tests for tailwind/styling utilities

#### Documentation
- [ ] Create testing infrastructure README.md
- [ ] Add JSDoc comments to test utilities
- [ ] Create testing examples for different component types

### Low Priority (Priority 4)

#### Optimization
- [ ] Optimize test execution time
- [ ] Configure parallel test execution
- [ ] Add UI component visual testing

## Current Issues

### Security and Dependencies
- [ ] Fix moderate severity vulnerabilities in esbuild
- [ ] Update vite and related packages
- [ ] Review and update other dependencies with known issues
- [ ] Resolve React version compatibility issues

### Outdated Dependencies
- [✅] @testing-library/react (updated to 14.2.1)
- [✅] @testing-library/dom (updated to 9.3.4)
- [✅] jsdom (updated to 24.0.0)

### Missing Tests
- [ ] Radix UI components
- [ ] React Query integration
- [ ] Excel file handling
- [ ] Markdown editor
- [ ] Notification system

### Infrastructure Improvements
- [✅] CI/CD automation (GitHub Actions)
- [ ] Pre-commit hooks
- [ ] Visual testing setup

## Implementation Recommendations

### 1. Dependencies Update
```bash
npm update @testing-library/react @testing-library/dom jsdom
```

### 2. Pre-commit Hooks Setup
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test",
      "pre-push": "npm run coverage"
    }
  }
}
```

### 3. Base Test Utilities
- [ ] Supabase mocks
- [ ] React Query mocks
- [ ] Form testing utilities
- [ ] Notification testing utilities

### 4. GitHub Actions Configuration
```yaml
# Configuration has been moved to .github/workflows/tests.yml
# Features:
# - Runs on push to main/develop
# - Runs on PR to main/develop
# - Includes coverage reports
# - Enforces 80% coverage threshold
# - Uses Node.js 18.x
# - Caches npm dependencies
```

## Progress Tracking
- ✅ - Completed
- 🚧 - In Progress
- ❌ - Blocked
- ⏳ - Pending

Last Updated: February 18, 2024 