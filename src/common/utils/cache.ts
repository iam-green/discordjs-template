import NodeCache from 'node-cache';

export class Cache {
  private static stdTTL = 60;
  private static cache: NodeCache;

  static {
    this.cache = new NodeCache({ stdTTL: this.stdTTL });
    this.cache.on('expired', (key: string) => {
      Cache.cascadeInvalidateByKey(key);
      Cache._del(Cache.getMetaKey(key));
    });
  }

  // Change the code when using a different cache library
  private static _get<T>(key: string) {
    return this.cache.get<T>(key);
  }

  // Change the code when using a different cache library
  private static _set<T>(key: string, value: T, ttl?: number) {
    this.cache.set(key, value, ttl ?? this.stdTTL);
  }

  // Change the code when using a different cache library
  private static _del(key: string) {
    this.cache.del(key);
  }

  // Change the code when using a different cache library
  static clear() {
    this.cache.flushAll();
  }

  private static getTagKey(tag: string) {
    return `__tag__:${tag}`;
  }

  private static getMetaKey(key: string) {
    return `__meta__:${key}`;
  }

  static invalidateTag(tag: string) {
    const tagKey = this.getTagKey(tag);
    const keys = this._get<string[]>(tagKey);
    for (const cacheKey of keys ?? []) {
      this._del(cacheKey);
      this._del(this.getMetaKey(cacheKey));
    }
    this._del(tagKey);
  }

  private static cascadeInvalidateByKey(key: string): void {
    const metaTags = this.cache.get<string[]>(this.getMetaKey(key));
    for (const tag of metaTags ?? []) this.invalidateTag(tag);
  }

  static get<T>(key: string) {
    return this._get<T>(key);
  }

  static set<T>(key: string, value: T, tags?: string[], ttl?: number) {
    const beforeData = this._get<T>(key);
    if (beforeData) this.cascadeInvalidateByKey(key);
    this._set(key, value, ttl);
    this._set(this.getMetaKey(key), tags ?? []);
    for (const tag of tags ?? []) {
      const tagKey = this.getTagKey(tag);
      const tagKeys = this.cache.get<string[]>(tagKey) ?? [];
      if (!tagKeys.includes(key)) tagKeys.push(key);
      this._set(tagKey, tagKeys, 0);
    }
  }

  static remove(key: string) {
    this._del(key);
    this.cascadeInvalidateByKey(key);
  }
}
