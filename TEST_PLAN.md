# Testing Plan

## Current Status
✅ All hooks tests are completed and working:
- use-announcements.test.ts
- use-changes.test.ts
- use-events.test.ts
- use-locations.test.ts
- use-markdown.test.ts
- use-people.test.ts
- use-push.test.ts
- use-resources.test.ts
- use-sections.test.ts
- use-sort-filter.test.ts
- use-versions.test.ts

## Verification Process
For each component, we must verify:
1. Tests pass successfully without warnings: `npx vitest run [test-file]`
2. Production build succeeds: `npm run build` (includes ESLint and TypeScript checks)

Only after all these checks pass, we can mark the component as completed.

## Testing Roadmap

### 1. UI Components Testing
Priority: High
These components are used throughout the application and should be tested first.

Components to test:
- [x] button.tsx ✅ (all checks passed)
- [x] input.tsx ✅ (all checks passed)
- [x] select.tsx ✅ (all checks passed)
- [x] textarea.tsx ✅ (all checks passed)
- [x] table.tsx ✅ (all checks passed)
- [x] dialog.tsx ✅ (all checks passed)
- [x] toast.tsx ✅ (all checks passed)
- [x] image-upload.tsx ✅ (all checks passed)
- [x] badge.tsx ✅ (all checks passed)
- [x] confirm-delete.tsx ✅ (all checks passed)
- [x] alert-dialog.tsx ✅ (all checks passed)
- [x] skeleton.tsx ✅ (all checks passed)
- [x] label.tsx ✅ (all checks passed)
- [x] input-search.tsx ✅ (all checks passed)
- [x] card.tsx ✅ (all checks passed)
- [x] toaster.tsx ✅ (all checks passed)

### 2. Feature Components Testing
Priority: Medium
Test forms and components in each functional area.

#### Sections
- [x] section-form.tsx ✅ (all checks passed)
- [x] sections-table.tsx ✅ (all checks passed)
- [x] section-filters.tsx ✅ (all checks passed)

#### Locations
- [x] location-form.tsx ✅ (all checks passed)
- [x] locations-table.tsx ✅ (all checks passed)
- [x] location-filters.tsx ✅ (all checks passed)

#### Events
- [ ] event-form.tsx
- [ ] events-table.tsx
- [ ] event-filters.tsx

#### Resources
- [ ] resource-form.tsx
- [ ] resources-table.tsx

### 3. Provider Components Testing
Priority: High
Test application providers as they are crucial for app functionality.

- [ ] toast-provider
- [ ] Other providers

### 4. Page Components Testing
Priority: Medium
Test page components in /app/ directory.

- [ ] Layout components
- [ ] Page components
- [ ] Client components

### 5. Utility Functions Testing
Priority: Medium
Test helper functions in /lib/ directory.

- [ ] supabase.ts
- [ ] Other utility functions

## Testing Guidelines

1. Each component test should include:
   - Rendering tests
   - User interaction tests
   - Props validation
   - State management tests
   - Error handling tests
   - Accessibility requirements:
     - Dialog components must include DialogTitle and DialogDescription
     - Test proper ARIA attributes and roles
     - Verify screen reader compatibility

2. Use best practices:
   - Mock external dependencies
   - Use beforeEach for test isolation
   - Follow AAA pattern (Arrange, Act, Assert)
   - Test edge cases
   - Ensure proper error handling

3. Maintain high test coverage:
   - Aim for >80% coverage
   - Focus on critical paths
   - Include error scenarios

4. Use consistent testing patterns:
   - Use React Testing Library
   - Follow component testing best practices
   - Maintain consistent test structure 