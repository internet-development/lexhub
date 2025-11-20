FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies (changes rarely, cache this layer)
RUN apk add --no-cache libc6-compat curl postgresql-client

# Copy package files first (for better caching)
COPY package.json package-lock.json* ./

# Install dependencies (cached unless package files change)
RUN npm ci

# Copy source files (changes often, so do this after deps)
COPY . .

# Make entrypoint script executable
RUN chmod +x /app/docker-entrypoint.sh

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set ownership to nextjs user
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose the port
EXPOSE 10000

# Set environment variables
ENV PORT=10000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:10000/ || exit 1

# Use entrypoint script to run migrations before starting the app
ENTRYPOINT ["/app/docker-entrypoint.sh"]
