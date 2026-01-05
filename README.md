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
- **TAP** - AT Protocol firehose consumer that ingests lexicon records and sends them to LexHub via webhook

## Development Setup

### Option 1: Local Development (Recommended)

This setup runs PostgreSQL and TAP in Docker while running the Next.js app locally for hot reloading.

1. **Clone the repository**

   ```bash
   git clone <repository-url>
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
   TAP_URL=http://tap:2480
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

| Variable             | Description                                          | Default                                                     |
| -------------------- | ---------------------------------------------------- | ----------------------------------------------------------- |
| `DATABASE_URL`       | PostgreSQL connection string                         | `postgresql://lexhub:lexhub_password@localhost:5432/lexhub` |
| `DATABASE_SSL`       | SSL mode override: `require` or `disable` (optional) | Auto-detected (disabled for localhost, required otherwise)  |
| `NODE_ENV`           | Environment: `development` or `production`           | `development`                                               |
| `PORT`               | Port for the Next.js server                          | `10000`                                                     |
| `TAP_URL`            | URL of the TAP service                               | `http://localhost:2480`                                     |
| `TAP_ADMIN_PASSWORD` | Admin password for TAP (optional)                    | -                                                           |

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
