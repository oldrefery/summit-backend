/**
 * Constants used for testing purposes
 * This file contains all mock data and test-specific constants
 */

// Date utilities for tests
/**
 * Returns base test date (tomorrow at 00:00:00)
 * @example
 * // If today is 2024-03-15, returns:
 * // Date object: 2024-03-16T00:00:00.000Z
 */
const getBaseTestDate = () => {
    const now = new Date();
    // Set time to start of the day to ensure consistency
    now.setHours(0, 0, 0, 0);
    // Add one day to ensure the date is always in the future
    now.setDate(now.getDate() + 1);
    return now;
};

/**
 * Returns test date with optional offset in days
 * @param daysOffset - Number of days to add (can be negative)
 * @example
 * // getTestDate(2) - If base date is 2024-03-16, returns:
 * // Date object: 2024-03-18T00:00:00.000Z
 */
const getTestDate = (daysOffset = 0) => {
    const date = new Date(getBaseTestDate());
    date.setDate(date.getDate() + daysOffset);
    return date;
};

/**
 * Formats date to YYYY-MM-DD string
 * @example
 * // Input: new Date('2024-03-16T15:30:00.000Z')
 * // Output: '2024-03-16'
 */
const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
};

/**
 * Formats date to ISO string
 * @example
 * // Input: new Date('2024-03-16T15:30:00.000Z')
 * // Output: '2024-03-16T15:30:00.000Z'
 */
const formatDateTime = (date: Date) => {
    return date.toISOString();
};

/**
 * Formats date to HH:MM:SS string
 * @example
 * // Input: new Date('2024-03-16T15:30:45.000Z')
 * // Output: '15:30:45'
 */
const formatTime = (date: Date) => {
    return date.toTimeString().split(' ')[0];
};

export const TEST_DATA = {
    /** Mock statistics for push notifications */
    PUSH_STATISTICS: {
        ACTIVE_TOKENS: 100,
        ACTIVE_USERS: 50,
        TOTAL_NOTIFICATIONS: 1000,
        TOTAL_SENT: 500,
        TOTAL_DELIVERED: 450,
        TOTAL_OPENED: 200,
    },

    /** Default values for test data */
    DEFAULTS: {
        ID: 1,
        // Base test date (always tomorrow)
        get BASE_DATE() {
            return getBaseTestDate();
        },
        // Formatted dates for different purposes
        get DATE() {
            return formatDate(this.BASE_DATE);
        },
        get DATETIME() {
            return formatDateTime(this.BASE_DATE);
        },
        get TIME() {
            const baseDate = getTestDate();
            const endDate = new Date(baseDate);
            endDate.setHours(baseDate.getHours() + 1);

            return {
                START: formatTime(baseDate),
                END: formatTime(endDate),
            };
        },
        // Helper functions for generating test dates
        getDate: getTestDate,
        formatDate,
        formatDateTime,
        formatTime,
    },

    /** Mock response data */
    RESPONSES: {
        SUCCESS: { success: true, error: null },
        ERROR: { success: false, error: 'Mock error' },
    },

    /** Test user data */
    USER: {
        EMAIL: 'test@example.com',
        PASSWORD: 'test-password',
    },
} as const;

// Type definitions for better type inference
export type TestDefaults = typeof TEST_DATA.DEFAULTS;
export type TestUser = typeof TEST_DATA.USER;

// Export date utilities for direct use in tests
export const TestDateUtils = {
    getBaseTestDate,
    getTestDate,
    formatDate,
    formatDateTime,
    formatTime,
} as const; 