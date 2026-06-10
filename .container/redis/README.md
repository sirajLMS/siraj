# Redis Container

This directory contains the Docker Compose configuration for Redis, used for rate limiting and caching.

## Quick Start

```bash
# Start Redis
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f

# Stop Redis
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v
```

## Configuration

- **Port**: 6379 (default Redis port)
- **Max Memory**: 256MB
- **Eviction Policy**: allkeys-lru (Least Recently Used)
- **Persistence**: RDB snapshots enabled
- **Health Check**: Built-in health monitoring

## Usage in Application

The Redis instance is used for:

- Rate limiting API requests
- Caching GraphQL queries (future)
- Session storage (if needed)

## Connection Details

```bash
REDIS_URL=redis://localhost:6379
```

## Production Notes

For production deployment:

1. Enable password authentication (uncomment `requirepass` in `redis.conf`)
2. Use persistent volumes
3. Configure backup strategy
4. Monitor memory usage
5. Consider Redis Cluster for high availability
