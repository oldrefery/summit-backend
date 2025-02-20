import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter } from '../rate-limiter';

describe('RateLimiter', () => {
    let limiter: RateLimiter;
    const testKey = 'test-ip';

    beforeEach(() => {
        limiter = new RateLimiter();
    });

    it('should allow first attempt', async () => {
        const isLimited = await limiter.isRateLimited(testKey);
        expect(isLimited).toBe(false);
    });

    it('should increment attempts counter', async () => {
        await limiter.increment(testKey);
        const isLimited = await limiter.isRateLimited(testKey);
        expect(isLimited).toBe(false);
    });

    it('should block after max attempts', async () => {
        // Make 5 attempts (max allowed)
        for (let i = 0; i < 5; i++) {
            await limiter.increment(testKey);
        }

        const isLimited = await limiter.isRateLimited(testKey);
        expect(isLimited).toBe(true);
    });

    it('should reset after window expires', async () => {
        // Mock Date.now() to control time
        const realDateNow = Date.now;
        const startTime = 1000000;
        let currentTime = startTime;

        Date.now = () => currentTime;

        try {
            // Make 5 attempts
            for (let i = 0; i < 5; i++) {
                await limiter.increment(testKey);
            }

            // Verify we're rate limited
            let isLimited = await limiter.isRateLimited(testKey);
            expect(isLimited).toBe(true);

            // Move time forward past the window (15 minutes + 1 second)
            currentTime = startTime + (15 * 60 * 1000) + 1000;

            // Should no longer be rate limited
            isLimited = await limiter.isRateLimited(testKey);
            expect(isLimited).toBe(false);
        } finally {
            // Restore original Date.now
            Date.now = realDateNow;
        }
    });

    it('should handle multiple keys independently', async () => {
        const key1 = 'ip1';
        const key2 = 'ip2';

        // Rate limit key1
        for (let i = 0; i < 5; i++) {
            await limiter.increment(key1);
        }

        // Make one attempt with key2
        await limiter.increment(key2);

        // key1 should be limited, key2 should not
        expect(await limiter.isRateLimited(key1)).toBe(true);
        expect(await limiter.isRateLimited(key2)).toBe(false);
    });
}); 