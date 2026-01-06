import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from './env';
import * as schema from '@shared/schema';

// Create postgres connection with pooling
const sql = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create drizzle instance with schema
export const db = drizzle(sql, { schema });

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Closing database connections...');
  await sql.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Closing database connections...');
  await sql.end();
  process.exit(0);
});
