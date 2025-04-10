import NodeCache from 'node-cache';

export class Cache {
  private static data = new NodeCache({ stdTTL: 60 });

  static get<T>(key: string) {
    return this.data.get<T>(key);
  }

  static set<T>(key: string, value: T) {
    this.data.set(key, value);
  }

  static remove(key: string) {
    this.data.del(key);
  }

  static clear() {
    this.data.flushAll();
  }
}
