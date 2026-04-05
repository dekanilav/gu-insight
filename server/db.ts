import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import * as schema from '@shared/schema';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set in your .env file");
}

// Create or connect to the SQLite database
const sqlite = new Database(process.env.DATABASE_URL);

// Export drizzle instance with schema
export const db = drizzle(sqlite, { schema });
