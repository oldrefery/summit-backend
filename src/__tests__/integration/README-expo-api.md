# Expo Push API Integration Tests

This document explains the approach for testing the integration between our application and the Expo Push Notifications API.

## Overview

These integration tests verify that our application correctly interacts with the Expo Push Notifications API by:

1. Mocking the Expo API server to simulate various response scenarios
2. Testing direct API interactions using our utility functions
3. Testing database integration through Supabase RPC calls
4. Verifying error handling and recovery mechanisms

## Test Components

### ExpoApiMock

The `ExpoApiMock` class creates a lightweight HTTP server that simulates the Expo Push Notifications API. It can be configured to return different types of responses:

- `success` - Successful notification delivery
- `deviceNotRegistered` - Simulates an expired or invalid push token
- `invalidCredentials` - Simulates authentication errors
- `messageTooLarge` - Simulates messages that exceed size limits
- `mixed` - Alternates between success and failure responses (useful for testing mixed results)

### ExpoIntegrationTest

This test class extends the `BaseApiTest` class and provides:

- Setup and teardown of the mock Expo API server
- Helper methods for creating test users with valid push tokens
- Tests for direct API integration
- Tests for database integration via RPC calls

## Running the Tests

These tests are included in the integration test suite and can be run with:

```bash
pnpm test:integration
```

Or to run only the Expo API tests:

```bash
pnpm test src/__tests__/integration/api/expo_integration.test.ts
```

## Implementation Details

The tests temporarily override the Expo API URL in the application constants to point to the mock server. After tests complete, the original URL is restored.

Each test configures the mock server to return specific responses and then verifies that our application:

1. Correctly interprets the API responses
2. Updates the database appropriately (e.g., marking invalid tokens)
3. Records notification history with accurate success/failure counts

## Key Test Cases

1. **Successful Notification Delivery**: Verifies that notifications are sent successfully and tracked correctly
2. **Device Not Registered Handling**: Tests that invalid tokens are properly identified and marked in the database
3. **Error Handling**: Validates our application's response to various API errors
4. **Partial Success**: Confirms that mixed results (some tokens succeed, some fail) are handled appropriately

## Notes for Developers

When modifying the push notification functionality, ensure these tests continue to pass. They serve as a contract for how our application should interact with the Expo Push Notifications API.

If the Expo API changes its response format or adds new error types, these tests should be updated to reflect those changes. 