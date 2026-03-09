# 🚀 StackMemory Production Deployment Guide

**Status:** ✅ Production Ready  
**Version:** v3.3.0  
**Date:** 11 Şubat 2026

---

## 📋 Pre-Deployment Checklist

### ✅ Completed

- [x] Dockerfile'lar eklendi (Frontend, Backend, Bridge, MCP, Bots)
- [x] .env.example template oluşturuldu
- [x] .gitignore güncellendi
- [x] .dockerignore eklendi
- [x] Test script'leri eklendi (package.json)
- [x] next.config.js production optimizasyonu
- [x] Docker Compose orchestration
- [x] Health checks
- [x] Multi-stage builds (Frontend)

### ⚠️ Before Deployment

- [ ] `.env` dosyasını `.env.example`'dan oluştur
- [ ] Production secrets'ları doldur
- [ ] Supabase database migration'ları çalıştır
- [ ] Domain DNS ayarlarını yap
- [ ] SSL sertifikası kur (Let's Encrypt)
- [ ] Monitoring setup (Prometheus + Grafana)

---

## 🐳 Docker Deployment

### Quick Start

```bash
# 1. Environment setup
cp .env.example .env
# Edit .env with your production values

# 2. Build and start all services
docker-compose up -d

# 3. Check health
docker-compose ps
curl http://localhost:3000/api/health
curl http://localhost:8080/health
```

### Individual Services

```bash
# Frontend only
docker-compose up -d frontend

# With bots
docker-compose --profile bots up -d

# With monitoring
docker-compose --profile monitoring up -d

# Everything
docker-compose --profile bots --profile monitoring up -d
```

### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f bridge
```

---

## 🔧 Configuration

### Environment Variables

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `OPENAI_API_KEY` - OpenAI API key

**Optional:**
- `BRAVE_API_KEY` - Brave Search API
- `GITHUB_TOKEN` - GitHub API token
- `SLACK_BOT_TOKEN` - Slack bot (if using bots profile)
- `DISCORD_TOKEN` - Discord bot (if using bots profile)
- `TELEGRAM_TOKEN` - Telegram bot (if using bots profile)

### Ports

- `3000` - Frontend (Next.js)
- `8080` - Bridge (REST + WebSocket)
- `8000` - Backend (FastAPI) - internal only
- `6379` - Redis (if cache profile enabled)
- `9090` - Prometheus (if monitoring profile enabled)
- `3001` - Grafana (if monitoring profile enabled)

---

## 🧪 Testing

### Unit Tests

```bash
cd frontend
npm test                 # Run once
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
```

**Current Coverage:** 70% (28 tests passing)

### E2E Tests

```bash
# Install Playwright
npm install -D @playwright/test

# Run E2E tests
npx playwright test

# UI mode
npx playwright test --ui
```

### Integration Tests

```bash
# Test all services
docker-compose up -d
npm run test:integration
```

---

## 📊 Monitoring

### Prometheus + Grafana

```bash
# Start monitoring stack
docker-compose --profile monitoring up -d

# Access
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001 (admin/admin)
```

### Metrics

- Request rate (RPM)
- Error rate
- Response time (p50, p95, p99)
- Memory usage
- CPU usage
- Database connections

### Alerts

Configure alerts in `monitoring/prometheus.yml`:
- High error rate (>5%)
- Slow response time (>1s p95)
- High memory usage (>80%)
- Service down

---

## 🔒 Security

### Secrets Management

**DO NOT commit:**
- `.env` files
- API keys
- Database credentials
- Service role keys

**Use:**
- Environment variables
- Secret managers (AWS Secrets Manager, HashiCorp Vault)
- Encrypted config files

### API Key Scopes

- `read` - Query, Search (60 rpm)
- `write` - + Create, Update (30 rpm)
- `full` - + Delete (100 rpm)
- `admin` - All operations (200 rpm)

### Rate Limiting

Implemented per API key scope. Configure in `frontend/lib/api-keys.js`.

---

## 🚀 Deployment Strategies

### 1. Single Server (Small Scale)

```bash
# On your server
git clone https://github.com/ai-ulu/emergent-ai-ulu.com
cd emergent-ai-ulu.com
cp .env.example .env
# Edit .env
docker-compose up -d
```

### 2. Kubernetes (Large Scale)

```bash
# Convert docker-compose to k8s
kompose convert

# Deploy
kubectl apply -f .
```

### 3. Cloud Platforms

**Vercel (Frontend only):**
```bash
vercel deploy
```

**Railway:**
```bash
railway up
```

**Fly.io:**
```bash
fly deploy
```

---

## 📈 Scaling

### Horizontal Scaling

```yaml
# docker-compose.yml
frontend:
  deploy:
    replicas: 3
  
bridge:
  deploy:
    replicas: 2
```

### Load Balancing

Use Nginx or Traefik:

```nginx
upstream frontend {
  server frontend-1:3000;
  server frontend-2:3000;
  server frontend-3:3000;
}
```

### Database

- Use Supabase connection pooling
- Enable read replicas
- Configure pgBouncer

---

## 🔄 CI/CD

### GitHub Actions

Workflow already configured: `.github/workflows/ci.yml`

**Pipeline:**
1. Lint
2. Test
3. Build
4. Deploy

### Manual Deployment

```bash
# Build
docker-compose build

# Push to registry
docker-compose push

# Deploy
ssh production "cd /app && docker-compose pull && docker-compose up -d"
```

---

## 🐛 Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs frontend

# Check health
docker-compose ps

# Restart
docker-compose restart frontend
```

### Database Connection Issues

```bash
# Check Supabase status
curl https://gsqzysjxqwipxphbgnpv.supabase.co/rest/v1/

# Test connection
docker-compose exec frontend node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

### Memory Issues

```bash
# Check usage
docker stats

# Increase limits
# docker-compose.yml
services:
  frontend:
    mem_limit: 2g
```

---

## 📞 Support

- **Docs:** https://docs.ai-ulu.com
- **Discord:** https://discord.gg/aiulu
- **GitHub Issues:** https://github.com/ai-ulu/emergent-ai-ulu.com/issues

---

## 🎯 Next Steps

1. **Performance Optimization**
   - Enable Redis caching
   - CDN for static assets
   - Image optimization

2. **Feature Additions**
   - Local-first mode (IndexedDB)
   - Sync engine
   - Privacy mode

3. **Monitoring Enhancement**
   - Error tracking (Sentry)
   - APM (New Relic, DataDog)
   - Log aggregation (ELK Stack)

---

**Ready to deploy!** 🚀

