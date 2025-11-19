# Build stage
FROM golang:1.24-alpine AS builder

# Install git, ca-certificates, and build dependencies
RUN apk add --no-cache git ca-certificates build-base

# Set working directory
WORKDIR /build

# Clone the specific branch from the indigo repository
RUN git clone --branch sync-tool --single-branch --depth 1 https://github.com/bluesky-social/indigo.git .

# Download dependencies
RUN go mod download

# Build the binary and name it nexus
RUN CGO_ENABLED=1 GOOS=linux go build -o nexus ./cmd/nexus

# Runtime stage
FROM alpine:latest

# Install ca-certificates and sqlite support for runtime
RUN apk --no-cache add ca-certificates sqlite-libs

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /build/nexus .

# Create data directory for database persistence
RUN mkdir -p /app/data

# Set default database path to the data directory
ENV NEXUS_DB_PATH=/app/data/nexus.db

# Declare volume for database persistence
VOLUME ["/app/data"]

# Run the binary
ENTRYPOINT ["./nexus"]
