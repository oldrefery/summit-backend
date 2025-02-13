// src/lib/rate-limiter.ts
export class RateLimiter {
  private attempts: Map<string, { count: number; timestamp: number }>;
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.attempts = new Map();
  }

  async isRateLimited(key: string): Promise<boolean> {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt) {
      return false;
    }

    // Clear old attempts
    if (now - attempt.timestamp > this.WINDOW_MS) {
      this.attempts.delete(key);
      return false;
    }

    return attempt.count >= this.MAX_ATTEMPTS;
  }

  async increment(key: string): Promise<void> {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt) {
      this.attempts.set(key, { count: 1, timestamp: now });
      return;
    }

    // Update the existing record
    if (now - attempt.timestamp <= this.WINDOW_MS) {
      attempt.count += 1;
    } else {
      // Reset the count if the window has expired
      this.attempts.set(key, { count: 1, timestamp: now });
    }
  }
}
