import { defineConfig } from 'drizzle-kit'

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://lexhub:lexhub_password@localhost:5432/lexhub'

function isRemoteDb(url: string): boolean {
  try {
    const hostname = new URL(url).hostname
    return hostname !== 'localhost' && hostname !== '127.0.0.1'
  } catch {
    return false
  }
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: connectionString,
    ssl: isRemoteDb(connectionString) ? 'require' : false,
  },
})
