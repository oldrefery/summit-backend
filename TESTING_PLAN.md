# Testing Plan and Guidelines

## Status Indicators
- ✅ - Completed
- 🚧 - In Progress
- ⏳ - Pending
- ✔️ - Verified

## General Instructions and Principles
- All code comments in English
- Team communication in Russian
- Follow SOLID, DRY and KISS principles
- Use TypeScript
- Use ESLint
- NEVER ignore TypeScript or ESLint errors

## Test Environment
- Production Supabase: iabwkgppahudnaouwaep
- Test Supabase: vupwomxxfqjmwtbptkfu
- Test database is a full copy of production
- Sync from PROD to TEST available via `npm run sync:prod:test`

## Safety Rules
- Integration tests MUST run ONLY on Test Supabase
- NEVER run integration tests against Production
- Always verify Supabase project reference before test execution
- Test environment variables are stored in .env.test

## Project Structure
- Unit tests: Located in `__tests__` folder next to each component
- Integration tests: Located in `src/__tests__/integration`
- E2E tests: Located in `src/__tests__/e2e`

## Current Status

### Unit Tests
- ✅ Components tests
- ✅ Hooks tests
- ✅ API mocks

### Integration Environment
- ✅ Test Supabase project setup
- ✅ Sync script from PROD to TEST
- ✅ Test database configuration

## Integration Tests Implementation Plan

### Phase 1: Authentication and RLS
- 🚧 Basic authentication tests (starting with minimal smoke test)
- ⏳ RLS policy verification
- ⏳ User roles and permissions

### Phase 2: CRUD Operations
- ⏳ Create operations tests
- ⏳ Read operations tests
- ⏳ Update operations tests
- ⏳ Delete operations tests
- ⏳ Data validation tests

### Phase 3: Storage Operations
- ⏳ File upload tests
- ⏳ File retrieval tests
- ⏳ File deletion tests
- ⏳ Storage permissions tests

### Phase 4: Push Notifications
- ⏳ Notification sending tests
- ⏳ Notification receiving tests
- ⏳ Notification handling tests

### Test Infrastructure
- ⏳ Database cleanup script
- ⏳ Test data generation
- ⏳ CI/CD for integration tests

### Documentation
- ⏳ Testing process description
- ⏳ Test environment setup guide
- ⏳ Integration tests examples

## Test Execution

### Running Tests
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## Notes
- All tests should use real test database (copy of production)
- No mocking for Supabase operations
- Clear test data before and after test runs