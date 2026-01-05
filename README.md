# LexHub

A hub for aggregating and searching through AT (Authenticated Transfer) Protocol lexicons.

## Prerequisites

- [Node.js](https://nodejs.org/) v20 or later
- [Docker](https://www.docker.com/) and Docker Compose (for running PostgreSQL and TAP)
- npm (comes with Node.js)

## Project Architecture

LexHub consists of three main components:

- **LexHub (Next.js)** - The web application that serves the UI and API
- **PostgreSQL** - Database for storing lexicon data
- **[TAP](https://github.com/bluesky-social/indigo/tree/main/cmd/tap)** - AT Protocol firehose consumer that listens for lexicon records and delivers them to LexHub via webhook

## Development Setup

### Option 1: Local Development (Recommended)

This setup runs PostgreSQL and TAP in Docker while running the Next.js app locally for hot reloading.

1. **Clone the repository**

   ```bash
   git clone https://github.com/internet-development/lexhub.git
   cd lexhub
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   The default values in `.env.example` are configured for local development and should work out of the box.

4. **Start the infrastructure services**

   ```bash
   docker compose up -d
   ```

   This starts PostgreSQL and TAP. The `compose.override.yaml` automatically disables the lexhub container and configures services for development.

   > **Note for Linux users:** The default `TAP_WEBHOOK_URL` uses `host.docker.internal` which works on macOS/Windows. On Linux, edit `compose.override.yaml` and switch to the `localhost` URL instead (see comments in the file).

5. **Run database migrations**

   ```bash
   npm run db:migrate
   ```

6. **Start the development server**

   ```bash
   npm run dev
   ```

7. **Open your browser**

   Navigate to [http://localhost:10000](http://localhost:10000) to see the application.

### Option 2: Full Docker Development

Run everything in Docker containers:

```bash
# Start all services (lexhub, postgres, tap)
docker compose -f compose.yaml up -d
```

Note: This skips `compose.override.yaml`, so all services run in containers. The lexhub container will automatically run migrations on startup.

## Production Deployment

### Using Docker Compose

1. **Set up environment variables**

   Create a `.env` file with production values:

   ```bash
   DATABASE_URL=postgresql://lexhub:your_secure_password@postgres:5432/lexhub
   NODE_ENV=production
   PORT=10000
   TAP_ADMIN_PASSWORD=your_tap_admin_password
   ```

2. **Deploy with Docker Compose**

   ```bash
   docker compose -f compose.yaml up -d
   ```

   This runs the production configuration without development overrides. The entrypoint script will:

   - Wait for PostgreSQL to be ready
   - Run database migrations
   - Start the Next.js application

3. **Verify the deployment**

   ```bash
   docker compose ps
   curl http://localhost:10000
   ```

### Building the Docker Image Manually

```bash
docker build -t lexhub .
```

## Environment Variables

### LexHub

| Variable             | Description                                             | Default                                                     |
| -------------------- | ------------------------------------------------------- | ----------------------------------------------------------- |
| `DATABASE_URL`       | PostgreSQL connection string                            | `postgresql://lexhub:lexhub_password@localhost:5432/lexhub` |
| `DATABASE_SSL`       | SSL mode override: `require` or `disable` (optional)    | Auto-detected (disabled for localhost, required otherwise)  |
| `NODE_ENV`           | Environment: `development` or `production`              | `development`                                               |
| `PORT`               | Port for the Next.js server (production only)           | `10000`                                                     |
| `TAP_ADMIN_PASSWORD` | Shared secret for TAP webhook authentication (optional) | -                                                           |

> **Note:** The `PORT` environment variable only affects production mode (`npm run start`). In development, the port is hardcoded to `10000` in `package.json`.

> **Note:** If you set `TAP_ADMIN_PASSWORD`, it must match the `TAP_ADMIN_PASSWORD` configured on the TAP service (see TAP Configuration below).

### TAP Configuration

TAP must be configured to send webhooks to LexHub. The following environment variables configure TAP (set in `compose.yaml`):

| Variable                 | Description                                                  | Required Value                   |
| ------------------------ | ------------------------------------------------------------ | -------------------------------- |
| `TAP_WEBHOOK_URL`        | URL where TAP sends lexicon events                           | `http://lexhub:10000/api/ingest` |
| `TAP_SIGNAL_COLLECTION`  | Collection type to signal interest in                        | `com.atproto.lexicon.schema`     |
| `TAP_COLLECTION_FILTERS` | Collection types to filter and deliver                       | `com.atproto.lexicon.schema`     |
| `TAP_ADMIN_PASSWORD`     | Shared secret for webhook authentication (must match LexHub) | -                                |
| `TAP_LOG_LEVEL`          | Log verbosity (debug, info, warn, error)                     | `info`                           |

> **Important:** `TAP_SIGNAL_COLLECTION` and `TAP_COLLECTION_FILTERS` must be set to `com.atproto.lexicon.schema` for LexHub to receive lexicon records.

> **Note:** To enable webhook authentication, set `TAP_ADMIN_PASSWORD` to the same value on both the TAP and LexHub services. See `compose.yaml` for commented examples.

For a complete list of TAP options, see the [TAP documentation](https://github.com/bluesky-social/indigo/tree/main/cmd/tap).

## Available Scripts

| Script                 | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `npm run dev`          | Start the development server with hot reloading     |
| `npm run build`        | Build the application for production                |
| `npm run start`        | Start the production server                         |
| `npm run format`       | Format code with Prettier                           |
| `npm run format:check` | Check code formatting                               |
| `npm run db:generate`  | Generate Drizzle migrations from schema changes     |
| `npm run db:migrate`   | Run pending database migrations                     |
| `npm run db:push`      | Push schema changes directly to database (dev only) |
| `npm run db:studio`    | Open Drizzle Studio to browse database              |

## Database Management

LexHub uses [Drizzle ORM](https://orm.drizzle.team/) for database management.

### Creating Migrations

After modifying the schema in `src/db/schema.ts`:

```bash
npm run db:generate
```

This creates a new migration file in the `drizzle/` directory.

### Applying Migrations

```bash
npm run db:migrate
```

### Browsing the Database

```bash
npm run db:studio
```

This opens a web UI at `https://local.drizzle.studio` to browse and edit your database.

## Stopping Services

```bash
# Stop all Docker services
docker compose down

# Stop and remove volumes (deletes all data)
docker compose down -v
```

## Contact

If you have questions, ping me on Bluesky:

- [@caidan.dev](https://bsky.app/profile/caidan.dev)
- [@internetstudio.bsky.social](https://bsky.app/profile/internetstudio.bsky.social)
