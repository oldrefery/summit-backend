// File size limits
export const FILE_LIMITS = {
    /** Maximum file size for general uploads (2MB) */
    DEFAULT: 2 * 1024 * 1024,
    /** Maximum file size for Excel imports (5MB) */
    EXCEL_IMPORT: 5 * 1024 * 1024,
} as const;

// API configurations
export const API = {
    EXPO: {
        /** Maximum number of notifications that can be sent in a single request */
        BATCH_SIZE: 100,
        /** Base URL for Expo Push Notification service */
        PUSH_URL: 'https://exp.host/--/api/v2/push/send',
    },
} as const;

// Form configurations
export const FORM = {
    /** Regular expression for validating date format (YYYY-MM-DD) */
    DATE_PATTERN: /^\d{4}-\d{2}-\d{2}$/,
    MESSAGES: {
        UNSAVED_CHANGES: 'You have unsaved changes. Are you sure you want to leave?',
    },
    TOAST: {
        /** Duration for error notifications (ms) */
        ERROR_DURATION: 5000,
        /** Duration for success notifications (ms) */
        SUCCESS_DURATION: 3000,
    },
} as const;

// Form validation rules and messages
export const FORM_VALIDATION = {
    /** Regular expression for validating date format (YYYY-MM-DD) */
    DATE_FORMAT: /^\d{4}-\d{2}-\d{2}$/,
    /** Message shown when there are unsaved changes */
    UNSAVED_CHANGES_MESSAGE: 'You have unsaved changes. Are you sure you want to leave?',
    /** Message shown when date format is invalid */
    INVALID_DATE_FORMAT_MESSAGE: 'Invalid date format. Use YYYY-MM-DD',
    /** Message shown when name is required */
    NAME_REQUIRED_MESSAGE: 'Name is required',
    /** Message shown when date is required */
    DATE_REQUIRED_MESSAGE: 'Date is required',
} as const;

// Authentication settings
export const AUTH = {
    /** Session duration in milliseconds (24 hours) */
    SESSION_DURATION: 24 * 60 * 60 * 1000,
    COOKIE: {
        /** Name of the authentication cookie */
        NAME: 'auth_session',
        /** Cookie security options */
        OPTIONS: {
            httpOnly: true,
            sameSite: 'lax' as const,
        },
    },
} as const;

// Excel import configuration
export const EXCEL_IMPORT = {
    /** Required columns for people import */
    REQUIRED_HEADERS: [
        'Name',
        'Role',
        'Title',
        'Company',
        'Country',
        'Email',
        'Mobile',
        'Bio',
    ] as const,
    /** Default role for imported users */
    DEFAULT_ROLE: 'attendee' as const,
} as const;

// Type definitions for better type inference
export type DatePattern = typeof FORM.DATE_PATTERN;
export type ExcelHeaders = typeof EXCEL_IMPORT.REQUIRED_HEADERS[number];
