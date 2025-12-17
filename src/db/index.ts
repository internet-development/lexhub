import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://lexhub:lexhub_password@localhost:5432/lexhub'

function resolveSslOption(conn: string): postgres.Options<{}>['ssl'] {
  const env = (process.env.DATABASE_SSL ?? '').toLowerCase()
  if (env === 'disable' || env === 'false' || env === '0') return false
  if (env === 'require' || env === 'true' || env === '1') return 'require'

  // Respect sslmode if present in the URL.
  try {
    const url = new URL(conn)
    const sslmode = (url.searchParams.get('sslmode') ?? '').toLowerCase()
    if (sslmode === 'disable') return false
    if (sslmode === 'require') return 'require'

    const hostname = url.hostname
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1'
    return isLocal ? false : 'require'
  } catch {
    return false
  }
}

const ssl = resolveSslOption(connectionString)

// Create postgres client for Drizzle
const client = postgres(connectionString, {
  ssl,
})

// Create Drizzle instance with schema
export const db = drizzle(client, { schema })

// Export schema for convenience
export { schema }
