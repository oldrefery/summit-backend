export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

// Expo Push Notification API limits
export const EXPO_MAX_NOTIFICATIONS_PER_REQUEST = 100; // Technical limitation of Expo Push API - maximum notifications per single request
export const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';

// Mock data constants
export const MOCK_PUSH_STATISTICS = {
    ACTIVE_TOKENS: 100,
    ACTIVE_USERS: 50,
    TOTAL_NOTIFICATIONS: 1000,
    TOTAL_SENT: 500,
    TOTAL_DELIVERED: 450,
    TOTAL_OPENED: 200,
} as const;

export const MOCK_DEFAULT_ID = 1;
export const MOCK_DEFAULT_DATE = '2024-02-16';
export const MOCK_DEFAULT_DATETIME = '2024-02-16T00:00:00Z';
export const MOCK_DEFAULT_START_TIME = '10:00:00';
export const MOCK_DEFAULT_END_TIME = '11:00:00';

// Import dialog configuration
export const IMPORT_DIALOG = {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    EXPECTED_HEADERS: [
        'Name',
        'Role',
        'Title',
        'Company',
        'Country',
        'Email',
        'Mobile',
        'Bio',
    ] as const,
    DEFAULT_ROLE: 'attendee' as const,
} as const;

// Form validation
export const FORM_VALIDATION = {
    DATE_FORMAT: /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD format
    UNSAVED_CHANGES_MESSAGE: 'You have unsaved changes. Are you sure you want to leave?',
} as const;

// Authentication
export const AUTH = {
    SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    COOKIE_NAME: 'auth_session',
    COOKIE_OPTIONS: {
        httpOnly: true,
        sameSite: 'lax' as const,
    },
} as const;
