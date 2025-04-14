import NodeCache from 'node-cache';

export class Cache {
  private static stdTTL = 60;
  private static data = new NodeCache({ stdTTL: this.stdTTL });

  static get<T>(key: string) {
    return this.data.get<T>(key);
  }

  static set<T>(key: string, value: T, ttl?: number) {
    this.data.set(key, value, ttl ?? this.stdTTL);
  }

  static remove(key: string) {
    this.data.del(key);
  }

  static clear() {
    this.data.flushAll();
  }
}
