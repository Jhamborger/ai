interface KeyState {
  key: string;
  disabledUntil: number | null;
}

const COOLDOWN_MS = 60_000;

class ApiKeyRotation {
  private keys: KeyState[] = [];
  private currentIndex = 0;

  constructor() {
    this.loadKeys();
  }

  private loadKeys() {
    const envKeys = [
      process.env.GEMMA_API_KEY_1,
      process.env.GEMMA_API_KEY_2,
      process.env.GEMMA_API_KEY_3,
    ].filter((k): k is string => Boolean(k));

    this.keys = envKeys.map((key) => ({ key, disabledUntil: null }));
  }

  getActiveKey(): string | null {
    if (this.keys.length === 0) return null;

    const now = Date.now();
    for (let i = 0; i < this.keys.length; i++) {
      const idx = (this.currentIndex + i) % this.keys.length;
      const keyState = this.keys[idx];
      if (!keyState.disabledUntil || keyState.disabledUntil <= now) {
        this.currentIndex = idx;
        return keyState.key;
      }
    }
    return null;
  }

  markKeyFailed(key: string, statusCode?: number) {
    const keyState = this.keys.find((k) => k.key === key);
    if (!keyState) return;

    const isRateLimit =
      statusCode === 429 ||
      statusCode === 503;

    keyState.disabledUntil = Date.now() + (isRateLimit ? COOLDOWN_MS * 5 : COOLDOWN_MS);
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
  }

  isQuotaError(status: number, body: string): boolean {
    if (status === 429 || status === 503) return true;
    const lower = body.toLowerCase();
    return (
      lower.includes("quota") ||
      lower.includes("rate limit") ||
      lower.includes("resource exhausted") ||
      lower.includes("too many requests")
    );
  }

  getKeyCount(): number {
    return this.keys.length;
  }
}

export const apiKeyRotation = new ApiKeyRotation();
