# Testing Plan and Guidelines

## Status Indicators
- ✅ - Completed
- 🚧 - In Progress (Started working on it)
- ❌ - Blocked/Failed
- ⏳ - Pending
- 🔄 - In Review/Testing
- ✔️ - Verified (Tests & Build passed)

## Workflow Requirements
1. Mark task with 🚧 before starting work
2. Implement changes
3. Run tests and build
4. If successful - mark with ✅
5. Before moving to the next task:
   - Run all tests: `npx vitest run`
   - Run build: `npm run build`
   - Fix any errors if found
   - Only proceed if both tests and build pass without errors

## General Instructions and Principles

### Code Style and Communication
- All code comments must be in English
- Team communication in Russian (as per project requirements)
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
- NEVER ignore TypeScript or ESLint errors

### Testing Guidelines
- Write tests using AAA pattern (Arrange-Act-Assert)
- Keep tests simple and focused
- Use meaningful test descriptions
- Avoid test interdependence
- Use proper mocking strategies
- Follow TDD where applicable

## Current Issues and Tasks

### Critical Issues (Priority 1)


### Test Execution Instructions

#### Running All Tests
```bash
npx vitest run
```

#### Running Specific Tests
```bash
# Run specific test file
npx vitest run src/lib/__tests__/rate-limiter.test.ts

# Run tests by pattern
npx vitest run src/lib/__tests__/*.test.ts

# Run tests by name
npx vitest run --test-name="RateLimiter"
```

### Notes for Next Session
1. Start with fixing mock implementation in test-submit-setup.tsx
2. Then move to section-form.test.tsx fixes
3. Finally address sections-table.test.tsx issues
4. Run full test suite after each fix to ensure no regressions

### Dependencies to Check
- @testing-library/react
- @testing-library/dom
- @tanstack/react-query
- vitest

### Environment Setup
- Ensure Node.js version is compatible
- Check for any conflicting dependencies
- Verify test runner configuration

## Implementation Plan

### Phase 1: Mock Fixes
1. Update test-submit-setup.tsx
2. Verify mock types
3. Test mock behavior

### Phase 2: Form Tests
1. Fix section creation test
2. Fix section update test
3. Verify form behavior

### Phase 3: Table Tests
1. Fix date formatting
2. Update table tests
3. Verify display logic

## Test Execution

### Running Tests During Development
```bash
# Watch mode for specific file
npx vitest src/components/sections/__tests__/section-form.test.tsx

# Watch mode for all tests
npx vitest
```

### Critical Improvements (Priority 1)

#### Testing Infrastructure
- ✅ Update @testing-library/react (updated to 14.2.1)
- ✅ Update @testing-library/dom (updated to 9.3.4)
- ✅ Update jsdom (updated to 24.0.0)
- ⏳ Fix security vulnerabilities in dependencies
- ✔️ Set up GitHub Actions for automated testing
- ⏳ Configure pre-commit hooks for tests
- ✅ Fix build issues with test files

#### Notes
- Using legacy-peer-deps due to React 19 compatibility
- Remaining security issues are related to development dependencies
- GitHub Actions configured with:
  - Automated testing on push and PR
  - Coverage reports generation
  - Coverage threshold check (70%)
  - Node.js 18.x environment
- Build issues fixed:
  - Resolved type issues in Supabase mocks
  - Fixed cookies() implementation
  - Cleaned up unused imports
  - Added proper error handling

#### Critical Component Coverage
- ✅ Authentication/Authorization tests
  - ✅ Login API tests
  - ✅ Rate limiting tests
  - ✅ Cookie handling tests
  - ✅ Protected routes tests
- 🚧 Supabase integration tests
  - ✅ Basic CRUD operations
  - ✅ Authentication flows
  - ✅ Storage operations
  - ✅ Type issues:
    - ✅ AuthError implementation
    - ✅ StorageFileApi interface
    - ✅ PostgrestQueryBuilder types
    - ✅ MFA API methods
- ⏳ Excel data processing tests (read-excel-file)
- ⏳ Markdown editor tests (@uiw/react-md-editor)

### High Priority (Priority 2)

#### Existing Tests Improvement
- ⏳ Radix UI components tests
- ⏳ React Query hooks tests
- ⏳ API error handling tests
- ⏳ Form validation tests

#### Integration Testing
- ⏳ E2E tests for main user scenarios
- ⏳ date-fns integration tests
- ⏳ Notification system (toast) tests

### Medium Priority (Priority 3)

#### Code Quality
- ⏳ Add eslint-plugin-testing-library rules
- ⏳ Create common test helpers
- ⏳ Add tests for tailwind/styling utilities

#### Documentation
- ⏳ Create testing infrastructure README.md
- ⏳ Add JSDoc comments to test utilities
- ⏳ Create testing examples for different component types

### Low Priority (Priority 4)

#### Optimization
- ⏳ Optimize test execution time
- ⏳ Configure parallel test execution
- ⏳ Add UI component visual testing

## Current Issues

### Security and Dependencies
- ⏳ Fix moderate severity vulnerabilities in esbuild
- ⏳ Update vite and related packages
- ⏳ Review and update other dependencies with known issues
- ⏳ Resolve React version compatibility issues

### Outdated Dependencies
- ✅ @testing-library/react (updated to 14.2.1)
- ✅ @testing-library/dom (updated to 9.3.4)
- ✅ jsdom (updated to 24.0.0)

### Missing Tests
- ⏳ Radix UI components
- ⏳ React Query integration
- ⏳ Excel file handling
- ⏳ Markdown editor
- ⏳ Notification system

### Infrastructure Improvements
- ✅ CI/CD automation (GitHub Actions)
- ⏳ Pre-commit hooks
- ⏳ Visual testing setup

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
- 🚧 Supabase mocks
- ⏳ React Query mocks
- ⏳ Form testing utilities
- ⏳ Notification testing utilities

### 4. GitHub Actions Configuration
```yaml
# Configuration has been moved to .github/workflows/tests.yml
# Features:
# - Runs on push to main/develop
# - Runs on PR to main/develop
# - Includes coverage reports
# - Enforces 70% coverage threshold
# - Uses Node.js 18.x
# - Caches npm dependencies
```

## Session Requirements