import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

import path from "node:path";
import { fileURLToPath } from "node:url";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  const possiblePaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(fileURLToPath(import.meta.url), "../../../.env"),
  ];
  for (const envPath of possiblePaths) {
    try {
      process.loadEnvFile(envPath);
      if (process.env.DATABASE_URL) break;
    } catch {
      // Ignore
    }
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export * from "./schema";
