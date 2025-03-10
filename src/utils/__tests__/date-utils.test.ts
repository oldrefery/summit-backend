import { describe, it, expect } from 'vitest';
import { formatTime, createUTCTimeString, extractTimeForForm, calculateDuration } from '../date-utils';

describe('date-utils', () => {
    describe('calculateDuration', () => {
        it('should calculate hours only', () => {
            const start = '2024-03-07T10:00:00+00:00';
            const end = '2024-03-07T12:00:00+00:00';
            expect(calculateDuration(start, end)).toBe('2 hrs');
        });

        it('should calculate minutes only', () => {
            const start = '2024-03-07T10:00:00+00:00';
            const end = '2024-03-07T10:30:00+00:00';
            expect(calculateDuration(start, end)).toBe('30 mins');
        });

        it('should calculate hours and minutes', () => {
            const start = '2024-03-07T10:00:00+00:00';
            const end = '2024-03-07T12:30:00+00:00';
            expect(calculateDuration(start, end)).toBe('2 hrs 30 mins');
        });

        it('should handle exactly one hour', () => {
            const start = '2024-03-07T10:00:00+00:00';
            const end = '2024-03-07T11:00:00+00:00';
            expect(calculateDuration(start, end)).toBe('1 hrs');
        });

        it('should handle less than one hour', () => {
            const start = '2024-03-07T10:00:00+00:00';
            const end = '2024-03-07T10:45:00+00:00';
            expect(calculateDuration(start, end)).toBe('45 mins');
        });

        it('should handle dates across days', () => {
            const start = '2024-03-07T23:00:00+00:00';
            const end = '2024-03-08T01:30:00+00:00';
            expect(calculateDuration(start, end)).toBe('2 hrs 30 mins');
        });

        it('should return empty string for invalid dates', () => {
            expect(calculateDuration('invalid', '2024-03-07T10:00:00+00:00')).toBe('');
            expect(calculateDuration('2024-03-07T10:00:00+00:00', 'invalid')).toBe('');
        });

        it('should handle exactly 24 hours', () => {
            const start = '2024-03-07T10:00:00+00:00';
            const end = '2024-03-08T10:00:00+00:00';
            expect(calculateDuration(start, end)).toBe('24 hrs');
        });

        it('should handle more than 24 hours', () => {
            const start = '2024-03-07T10:00:00+00:00';
            const end = '2024-03-09T10:00:00+00:00';
            expect(calculateDuration(start, end)).toBe('48 hrs');
        });

        it('should handle different timezones', () => {
            const start = '2024-03-07T10:00:00+02:00';
            const end = '2024-03-07T12:00:00+02:00';
            expect(calculateDuration(start, end)).toBe('2 hrs');
        });

        it('should handle zero duration', () => {
            const time = '2024-03-07T10:00:00+00:00';
            expect(calculateDuration(time, time)).toBe('0 mins');
        });

        it('should handle null or undefined inputs', () => {
            expect(calculateDuration(null, '2024-03-07T10:00:00+00:00')).toBe('');
            expect(calculateDuration('2024-03-07T10:00:00+00:00', null)).toBe('');
            expect(calculateDuration(undefined, '2024-03-07T10:00:00+00:00')).toBe('');
            expect(calculateDuration('2024-03-07T10:00:00+00:00', undefined)).toBe('');
        });
    });

    describe('formatTime', () => {
        it('should format ISO time with timezone', () => {
            expect(formatTime('2024-03-07T15:30:00+00:00')).toBe('15:30');
        });

        it('should format ISO time without timezone', () => {
            expect(formatTime('2024-03-07T15:30:00Z')).toBe('15:30');
        });

        it('should handle HH:MM:SS format', () => {
            expect(formatTime('15:30:00')).toBe('15:30');
        });

        it('should handle HH:MM format', () => {
            expect(formatTime('15:30')).toBe('15:30');
        });

        it('should handle invalid time', () => {
            expect(formatTime('invalid')).toBe('Invalid time');
            expect(formatTime(null)).toBe('Invalid time');
            expect(formatTime(undefined)).toBe('Invalid time');
        });
    });

    describe('createUTCTimeString', () => {
        it('should create UTC time string', () => {
            expect(createUTCTimeString('2024-03-07', '15:30')).toBe('2024-03-07T15:30:00+00:00');
        });
    });

    describe('extractTimeForForm', () => {
        it('should extract time for form', () => {
            expect(extractTimeForForm('2024-03-07T15:30:00+00:00')).toBe('15:30');
        });

        it('should handle null or undefined', () => {
            expect(extractTimeForForm(null)).toBe('');
            expect(extractTimeForForm(undefined)).toBe('');
        });
    });
}); 