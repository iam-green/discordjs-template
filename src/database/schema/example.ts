import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';

export const example = pgTable('example', {
  id: uuid().primaryKey().defaultRandom(),
  created: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
