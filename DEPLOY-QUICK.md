# Deploy Checklist - Coolify

## 1️⃣ Environment Variables
```bash
# Wajib
DATABASE_URL=postgres://user:pass@host:5432/kygoo?sslmode=require
SESSION_SECRET=min-32-random-chars-secret-key

# Storage
STORAGE_PROVIDER=local
# Volume mount: /app/public/uploads
```

## 2️⃣ Database
```
1. Coolify → New Resource → PostgreSQL
2. Copy connection string ke DATABASE_URL
3. Run: npm run db:push
4. Optional: npm run db:seed
```

## 3️⃣ Application
```
1. New Application
2. Git: <repo-url>, Branch: main
3. Build Pack: Nixpacks (Node.js)
4. Start: npm run start
5. Add env vars
6. Deploy
```

## 4️⃣ Domain
```
1. Settings → Add Domain
2. Enable HTTPS
3. Done ✅
```

## 5️⃣ Post-Deploy
```bash
# Health check
curl https://your-domain.com/api/health

# Expected response
{"status":"ok","timestamp":...}
```
