/**
 * Extracts time (HH:MM) from various time formats
 * @param time - Time string in ISO format or HH:MM:SS
 * @returns Formatted time as HH:MM
 */
export function formatTime(time: string | null | undefined): string {
    if (!time || time === 'invalid') {
        return 'Invalid time';
    }

    try {
        // Handle ISO string with timezone (e.g. 2025-05-17T15:00:00+00:00)
        if (time.includes('+')) {
            return time.split('T')[1].slice(0, 5);
        }

        // Handle ISO string without timezone (e.g. 2025-05-17T15:00:00Z)
        if (time.includes('T')) {
            return time.split('T')[1].slice(0, 5);
        }

        // Handle HH:MM:SS format
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
        if (timeRegex.test(time)) {
            return time.slice(0, 5);
        }

        // Handle HH:MM format (already formatted)
        const shortTimeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (shortTimeRegex.test(time)) {
            return time;
        }

        return 'Invalid time';
    } catch (error) {
        console.error('Error formatting time:', error);
        return 'Invalid time';
    }
}

/**
 * Creates a UTC ISO string with +00:00 timezone
 * @param date - Date string in YYYY-MM-DD format
 * @param time - Time string in HH:MM format
 * @returns UTC ISO string with +00:00 timezone
 */
export function createUTCTimeString(date: string, time: string): string {
    return `${date}T${time}:00+00:00`;
}

/**
 * Extracts time from UTC string for form display
 * @param utcTime - UTC time string
 * @returns Time in HH:MM format
 */
export function extractTimeForForm(utcTime: string | null | undefined): string {
    if (!utcTime) {
        return '';
    }

    return formatTime(utcTime);
}

/**
 * Calculates duration between start and end time
 * @param startTime - Start time in ISO format
 * @param endTime - End time in ISO format
 * @returns Formatted duration string (e.g. "2 hrs", "30 mins", "2 hrs 30 mins", "0 mins")
 */
export function calculateDuration(startTime: string | null | undefined, endTime: string | null | undefined): string {
    if (!startTime || !endTime) {
        return '';
    }

    try {
        const start = new Date(startTime);
        const end = new Date(endTime);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return '';
        }

        const diffMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));

        if (diffMinutes === 0) {
            return '0 mins';
        }

        const hours = Math.floor(Math.abs(diffMinutes) / 60);
        const minutes = Math.abs(diffMinutes) % 60;

        if (hours > 0) {
            return minutes > 0 ? `${hours} hrs ${minutes} mins` : `${hours} hrs`;
        } else {
            return `${minutes} mins`;
        }
    } catch (error) {
        console.error('Error calculating duration:', error);
        return '';
    }
} 