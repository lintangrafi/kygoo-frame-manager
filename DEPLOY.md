# 🚀 Kygoo Frame Studio - Coolify Deployment Guide

## Prerequisites
- Coolify instance sudah berjalan
- PostgreSQL database tersedia
- S3-compatible storage (atau gunakan storage bawaan Coolify)

---

## Step 1: Environment Variables

```bash
# Database
DATABASE_URL=postgres://user:password@host:5432/kygoo_frame?sslmode=require

# Session Secret (generate 32+ random characters)
SESSION_SECRET=your-super-secret-key-min-32-chars-here

# Storage (S3 or Local)
STORAGE_PROVIDER=local  # or 's3'
S3_BUCKET=kygoo-uploads
S3_REGION=ap-southeast-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_ENDPOINT=https://s3.ap-southeast-1.amazonaws.com

# Optional: Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000

# Optional: Admin Initial Setup
ADMIN_EMAIL=admin@kygoo.com
ADMIN_PASSWORD=your-admin-password
```

---

## Step 2: Create Coolify Application

### A. New Application
```bash
# Di Coolify Dashboard:
1. Click "New Application"
2. Name: "kygoo-frame-studio"
3. Resource: Docker (recommended)
```

### B. Git Repository
```
Repository: <your-github-repo-url>
Branch: main
Build Pack: Nixpacks (Node.js)
Start Command: npm run start
```

### C. Environment Variables
Tambahkan semua environment variables dari Step 1

---

## Step 3: Database Setup

### Option A: Coolify PostgreSQL
```bash
# Di Coolify:
1. Add New Resource → Database → PostgreSQL
2. Name: kygoo-postgres
3. Note the connection string
4. Add to app's environment variables
```

### B. Run Migrations
```bash
# Via Coolify Terminal atau SSH:
npm run db:push
```

### C. Seed Initial Data (Optional)
```bash
# Create default frames, categories, etc:
npm run db:seed
```

---

## Step 4: Storage Configuration

### Option A: Local Storage (Simpler)
```bash
# Volume mount di Coolify:
/app/data/uploads -> /app/public/uploads
```

### Option B: S3 Storage (Recommended for Production)
```bash
# Environment variables sudah di-set di Step 1
# Pastikan bucket CORS allow:
# [
#     {
#         "AllowedHeaders": ["*"],
#         "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
#         "AllowedOrigins": ["*"],
#         "ExposeHeaders": []
#     }
# ]
```

---

## Step 5: Domain & SSL

```bash
# Di Coolify:
1. Application Settings → Domains
2. Add Domain: kygoo.yourdomain.com
3. Enable HTTPS (Let's Encrypt automatic)
4. Force HTTPS redirect
```

---

## Step 6: Build & Deploy

```bash
# Trigger deployment di Coolify:
# 1. Click "Deploy"
# 2. Monitor build logs
# 3. Health check otomatis
```

### Health Check Endpoint
```
URL: /api/health
Expected: {"status":"ok","timestamp":...}
```

---

## Step 7: Post-Deployment Setup

### A. Create First Admin User
```bash
# Via Coolify Terminal:
# Login ke /staff/login, lalu buat staff baru via UI
```

### B. Upload Frame Templates
```
1. Login ke /staff
2. Pindah ke /staff/frames/new
3. Upload frame images untuk 2R dan 4R
4. Definisikan slot placeholder
```

### C. Configure Photo Presets (Optional)
```
1. Staff Panel → Settings → Photo Presets
2. Add custom filter presets untuk studio
```

---

## 🐳 Docker Deployment (Alternative)

### Dockerfile (Already in project)
```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### docker-compose.yml (For standalone)
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - SESSION_SECRET=${SESSION_SECRET}
      - STORAGE_PROVIDER=${STORAGE_PROVIDER:-local}
    volumes:
      - ./uploads:/app/public/uploads
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check DATABASE_URL format:
postgres://username:password@hostname:5432/database_name?sslmode=require
```

#### 2. Build Failed
```bash
# Clear cache and rebuild:
npm run clean
npm install
npm run build
```

#### 3. Upload Not Working
```bash
# Check volume mount exists:
ls -la /app/public/uploads

# Set permissions:
chmod 755 /app/public/uploads
```

#### 4. 502 Bad Gateway
```bash
# Check app logs di Coolify:
# Application → Logs
# Ensure npm start runs correctly
```

---

## 📊 Monitoring

### Logs
```bash
# View application logs:
# Coolify → Application → Logs

# Or via terminal:
tail -f /app/logs/*.log
```

### Metrics
```
URL: /api/health
Response Time: < 200ms expected
Uptime: 99.9%
```

---

## 🔒 Security Checklist

- [ ] HTTPS enabled
- [ ] SESSION_SECRET changed from default
- [ ] DATABASE_URL with strong password
- [ ] Rate limiting enabled
- [ ] CORS configured for production domain
- [ ] Admin accounts use strong passwords
- [ ] Regular backups scheduled

---

## 🚀 Quick Deploy Commands

```bash
# Clone and setup
git clone <repo-url>
cd kygoo-frame-studio
cp .env.example .env.local

# Edit .env.local with your values
nano .env.local

# Deploy via Coolify
# 1. Import project to Coolify
# 2. Add environment variables
# 3. Deploy

# Or manual Docker
docker-compose up -d
```

---

## 📱 PWA Setup

After deployment:
1. Access app via HTTPS
2. Open in Chrome mobile
3. Click "Install App" prompt
4. Service worker will activate automatically

---

## 🆘 Support

- Docs: `/staff` dashboard
- Health: `/api/health`
- Logs: Coolify application logs
