import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@shared/schema";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Get it from https://neon.tech");
}

// Neon serverless HTTP driver — works in both Node and Vercel edge/serverless
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
