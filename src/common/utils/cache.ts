import NodeCache from 'node-cache';

export class Cache {
  private static stdTTL = 60;
  private static cache: NodeCache;

  static {
    this.cache = new NodeCache({ stdTTL: this.stdTTL });
    this.cache.on('expired', async (key: string) => {
      await Cache.cascadeInvalidateByKey(key);
      await Cache._del(Cache.getMetaKey(key));
    });
  }

  // Change the code when using a different cache library
  private static async _get<T>(key: string) {
    return Promise.resolve(this.cache.get<T>(key));
  }

  // Change the code when using a different cache library
  private static async _set<T>(key: string, value: T, ttl?: number) {
    this.cache.set(key, value, ttl ?? this.stdTTL);
  }

  // Change the code when using a different cache library
  private static async _del(key: string) {
    this.cache.del(key);
  }

  // Change the code when using a different cache library
  static async clear() {
    this.cache.flushAll();
  }

  private static getTagKey(tag: string) {
    return `__tag__:${tag}`;
  }

  private static getMetaKey(key: string) {
    return `__meta__:${key}`;
  }

  static async invalidateTag(tag: string) {
    const tagKey = this.getTagKey(tag);
    const keys = await this._get<string[]>(tagKey);
    for (const cacheKey of keys ?? []) {
      await this._del(cacheKey);
      await this._del(this.getMetaKey(cacheKey));
    }
    await this._del(tagKey);
  }

  private static async cascadeInvalidateByKey(key: string) {
    const metaTags = await this._get<string[]>(this.getMetaKey(key));
    for (const tag of metaTags ?? []) await this.invalidateTag(tag);
  }

  static async get<T>(key: string) {
    return await this._get<T>(key);
  }

  static async set<T>(key: string, value: T, tags?: string[], ttl?: number) {
    const beforeData = await this._get<T>(key);
    if (beforeData) await this.cascadeInvalidateByKey(key);
    await this._set(key, value, ttl);
    await this._set(this.getMetaKey(key), tags ?? []);
    for (const tag of tags ?? []) {
      const tagKey = this.getTagKey(tag);
      const tagKeys = (await this._get<string[]>(tagKey)) ?? [];
      if (!tagKeys.includes(key)) tagKeys.push(key);
      await this._set(tagKey, tagKeys, 0);
    }
  }

  static async remove(key: string) {
    await this._del(key);
    await this.cascadeInvalidateByKey(key);
  }
}
