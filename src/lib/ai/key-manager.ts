type ApiKey = {
  key: string;
  provider: string;
  status: 'active' | 'cooldown';
  disabledUntil?: Date;
};

class KeyManager {
  private keys: ApiKey[] = [];
  private currentKeyIndex: number = 0;

  constructor(keysConfig: { key: string; provider: string }[]) {
    this.keys = keysConfig.map(k => ({ ...k, status: 'active' }));
  }

  async getKey(): Promise<string | null> {
    const now = new Date();

    // Refresh cooldowns
    this.keys.forEach(k => {
      if (k.status === 'cooldown' && k.disabledUntil && now > k.disabledUntil) {
        k.status = 'active';
      }
    });

    const activeKeys = this.keys.filter(k => k.status === 'active');
    if (activeKeys.length === 0) return null;

    // Simple round-robin among active keys
    const key = activeKeys[this.currentKeyIndex % activeKeys.length];
    this.currentKeyIndex++;
    return key.key;
  }

  async markCooldown(key: string, durationMs: number = 60000) {
    const target = this.keys.find(k => k.key === key);
    if (target) {
      target.status = 'cooldown';
      target.disabledUntil = new Date(Date.now() + durationMs);
    }
  }
}

// Initialize with keys from environment variables
const GEMMA_KEYS = [
  process.env.GEMMA_API_KEY_1,
  process.env.GEMMA_API_KEY_2,
  process.env.GEMMA_API_KEY_3,
].filter(Boolean).map(key => ({ key, provider: 'gemma' }));

export const keyManager = new KeyManager(GEMMA_KEYS);
