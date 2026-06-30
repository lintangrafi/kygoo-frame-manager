# =============================================================================
# COOLIFY DEPLOYMENT GUIDE - Kygoo Frame Studio
# =============================================================================

## Prerequisites

1. **Coolify Instance** with:
   - Docker Runtime
   - PostgreSQL 16+ (built-in Coolify database)
   - Persistent Storage (for uploads)

2. **Git Repository** pushed to GitHub/GitLab/Bitbucket

## Deployment Steps

### 1. Create PostgreSQL Database

```bash
# In Coolify Dashboard:
# Resources > Add Resource > Database > PostgreSQL

# After creation, copy the Connection URL
# Format: postgresql://postgres:PASSWORD@HOST:PORT/DATABASE
```

### 2. Deploy Application

```bash
# In Coolify Dashboard:
# Applications > New Application > Select Git Repository

# Configure:
# - Build Pack: Dockerfile
# - Port: 3000

# Environment Variables:
DATABASE_URL=postgresql://postgres:PASSWORD@10.0.0.1:5432/kygoo_frame_studio
SESSION_SECRET=<generate-with-openssl-rand-base64-32>
UPLOAD_DIR=/app/uploads
NODE_ENV=production
```

### 3. Persistent Storage

```bash
# Add persistent storage mount for uploads:
# Application > Storage > Add Persistent Storage

# Mount Path: /app/uploads
# This ensures uploads persist across restarts/deployments
```

### 4. Environment Variables (Coolify)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `SESSION_SECRET` | Secure random string (32+ chars) | `openssl rand -base64 32` |
| `UPLOAD_DIR` | Upload directory path | `/app/uploads` |
| `NODE_ENV` | Environment | `production` |

### 5. Database Migration

After first deployment, run migrations:

```bash
# Via Coolify Terminal:
npm run db:generate    # Generate migrations
npm run db:push        # Push to database
```

Or use Drizzle Studio:
```bash
npm run db:studio     # Interactive DB viewer
```

## Volume Mounts (Coolify)

| Container Path | Host Path | Purpose |
|----------------|-----------|---------|
| `/app/uploads` | `uploads` | User uploaded files |
| `/var/lib/postgresql/data` | `postgres_data` | Database files |

## Health Check

- **Endpoint**: `http://localhost:3000/api/health`
- **Interval**: 30s
- **Timeout**: 3s
- **Retries**: 3

## Performance Optimizations

### 1. Image Optimization
The app uses Sharp for image processing. Ensure adequate memory:

```bash
# In Coolify > Application > Resource Limits:
Memory: 1024MB minimum
CPU: 1 core minimum
```

### 2. PostgreSQL Connection Pooling
Default Drizzle settings are adequate for small-medium workloads.
For high traffic, consider PgBouncer:

```bash
# Add to docker-compose:
services:
  app:
    depends_on:
      pgbouncer:
        condition: service_healthy

  pgbouncer:
    image: edoburu/pgbouncer
    environment:
      - DATABASE_URL=postgresql://...
      - POOL_MODE=transaction
      - MAX_CLIENT_CONN=100
```

## Backup Strategy

### Coolify Built-in Backups
- Enable automatic backups for PostgreSQL
- Recommended: Daily backups, retain 7 days

### Application Backups
```bash
# Backup uploads directory periodically:
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz ./uploads
```

## Troubleshooting

### Common Issues

1. **Build fails**
   - Check Dockerfile syntax
   - Ensure `.dockerignore` excludes unnecessary files

2. **Database connection refused**
   - Verify DATABASE_URL format
   - Check PostgreSQL is running
   - Verify network connectivity

3. **Uploads not persisting**
   - Add persistent storage mount
   - Check mount path matches UPLOAD_DIR

4. **Session not working**
   - Generate new SESSION_SECRET
   - Check cookie settings in production

## Security Checklist

- [ ] Use HTTPS (Coolify handles this with Let's Encrypt)
- [ ] Generate strong SESSION_SECRET
- [ ] Set proper DATABASE_URL credentials
- [ ] Enable firewall rules in Coolify
- [ ] Regular backups enabled
- [ ] Monitor resource usage

## Quick Deploy Commands

```bash
# SSH into Coolify server (if needed)
ssh root@your-server

# View logs
docker logs -f kygoo-studio

# Restart application
docker restart kygoo-studio

# Shell into container
docker exec -it kygoo-studio sh

# Check environment
docker exec kygoo-studio env | grep -E "NODE|DATABASE|UPLOAD"
```

## Resource Recommendations

| Users/Day | Memory | CPU | Storage |
|-----------|--------|-----|---------|
| < 100 | 512MB | 0.5 | 5GB |
| 100-500 | 1024MB | 1 | 20GB |
| 500-1000 | 2048MB | 2 | 50GB |
| 1000+ | 4096MB | 4 | 100GB |

---

**Deploy with confidence! 🚀**
