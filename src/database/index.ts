import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Log } from '@/common';
import { Client } from 'pg';
import * as schema from './schema';

const client = new Client(process.env.DATABASE_URL ?? '');

export const databaseInit = async () => {
  if (!process.env.DATABASE_URL) return;
  await client.connect();
  if (process.env.AUTO_MIGRATE == 'true')
    await migrate(db, { migrationsFolder: `./src/database/migration` });
  Log.info('Database Connected');
};

export const db = drizzle(client, { schema });
