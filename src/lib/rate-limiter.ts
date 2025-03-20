// src/lib/rate-limiter.ts
export class RateLimiter {
  private attempts: Map<string, { count: number; timestamp: number }> = new Map();
  private readonly maxAttempts = 5;
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.attempts = new Map();
  }

  public async isRateLimited(key: string): Promise<boolean> {
    const attempt = this.attempts.get(key);
    if (!attempt) return false;

    // If window time has expired, reset the counter
    if (Date.now() - attempt.timestamp > this.windowMs) {
      this.attempts.delete(key);
      return false;
    }

    return attempt.count >= this.maxAttempts;
  }

  public async increment(key: string): Promise<void> {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt) {
      this.attempts.set(key, { count: 1, timestamp: now });
      return;
    }

    // Update the existing record
    if (now - attempt.timestamp <= this.windowMs) {
      attempt.count += 1;
    } else {
      // Reset if window expired
      this.attempts.set(key, { count: 1, timestamp: now });
    }
  }
}
