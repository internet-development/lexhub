import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://lexhub:lexhub_password@localhost:5432/lexhub'

// Create postgres client for Drizzle
const client = postgres(connectionString)

// Create Drizzle instance with schema
export const db = drizzle(client, { schema })

// Export schema for convenience
export { schema }
