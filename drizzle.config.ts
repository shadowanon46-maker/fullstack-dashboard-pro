import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment
const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.local';
dotenv.config({ path: envFile });

if (!process.env.DATABASE_URL) {
  throw new Error(`DATABASE_URL not set in ${envFile}`);
}

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});