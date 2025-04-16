import { and, asc, between, desc, eq } from 'drizzle-orm';
import { db } from '..';
import {
  CreateExampleDto,
  ExampleDto,
  FindExampleDto,
  UpdateExampleDto,
} from '../types';
import { example } from '../schema';
import { Cache } from '@/common';

export class ExampleService {
  private static cacheId = (id: string) => 'database:example:get:' + id;
  private static findCacheId = (data: FindExampleDto) =>
    'database:example:find:' + JSON.stringify(data);

  static async find(data: FindExampleDto) {
    const {
      id,
      created,
      sort = 'asc',
      page = 1,
      limit = Number.MAX_SAFE_INTEGER,
      from = 0,
      to = Date.now(),
    } = data;
    const cache = await Cache.get<ExampleDto[]>(this.findCacheId(data));
    if (cache) return cache;
    const result = await db.query.example.findMany({
      where: and(
        id ? eq(example.id, id) : undefined,
        created
          ? eq(example.created, created)
          : between(example.created, new Date(from), new Date(to)),
      ),
      orderBy: sort == 'asc' ? [asc(example.created)] : [desc(example.created)],
      offset: (page - 1) * limit,
      limit,
    });
    if (result.length)
      await Cache.set(
        this.findCacheId(data),
        result,
        result.map((v) => this.cacheId(v.id)),
      );
    return result;
  }

  static async get(id: string) {
    const cache = await Cache.get<ExampleDto>(this.cacheId(id));
    if (cache) return cache;
    const result = await db.query.example.findFirst({
      where: eq(example.id, id),
    });
    if (result) await Cache.set(this.cacheId(id), result, [this.cacheId(id)]);
    return result;
  }

  static async create(data: CreateExampleDto) {
    const result = (
      await db.insert(example).values(data).onConflictDoNothing().returning()
    )[0];
    await Cache.set(this.cacheId(result.id), result, [this.cacheId(result.id)]);
    return result;
  }

  static async update(id: string, data: UpdateExampleDto) {
    const result = (
      await db.update(example).set(data).where(eq(example.id, id)).returning()
    )[0];
    await Cache.set(this.cacheId(result.id), result, [this.cacheId(result.id)]);
    return result;
  }

  static async delete(id: string) {
    await db.delete(example).where(eq(example.id, id));
    await Cache.invalidateTag(this.cacheId(id));
  }
}
