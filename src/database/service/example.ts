import { and, asc, between, desc, eq } from 'drizzle-orm';
import { db } from '..';
import { CreateExampleDto, FindExampleDto, UpdateExampleDto } from '../types';
import { example } from '../schema';

export class ExampleService {
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
    return await db.query.example.findMany({
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
  }

  static async get(id: string) {
    return await db.query.example.findFirst({
      where: eq(example.id, id),
    });
  }

  static async create(data: CreateExampleDto) {
    return (
      await db.insert(example).values(data).onConflictDoNothing().returning()
    )[0];
  }

  static async update(id: string, data: UpdateExampleDto) {
    return (
      await db.update(example).set(data).where(eq(example.id, id)).returning()
    )[0];
  }

  static async delete(id: string) {
    await db.delete(example).where(eq(example.id, id));
  }
}
