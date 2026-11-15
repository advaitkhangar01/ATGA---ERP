# 05. Ubuntu VPS Deployment & Operations Runbook

**Target Operating System:** Ubuntu 24.04 LTS (64-bit Cloud VPS)  
**Stack Components:** Nginx (Host SSL Termination), Docker Compose (Next.js Application + PostgreSQL 16), Certbot, UFW  
**Domain Example:** `erp.atulglassagency.com`  

---

## 1. Initial Server Setup & Package Installation

Execute as `root` or `sudo` user on fresh Ubuntu 24.04 server:

```bash
# 1. Update system packages
apt update && apt upgrade -y

# 2. Install core utilities, Nginx, UFW, Git, Certbot
apt install -y nginx git curl ufw certbot python3-certbot-nginx ca-certificates gnupg lsb-release

# 3. Install Docker and Docker Compose Plugin
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 4. Enable Docker service
systemctl enable --now docker
```

---

## 2. Firewall Configuration (UFW)

Lock down all ports except SSH, HTTP, and HTTPS:

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status verbose
```

---

## 3. Project Deployment Directory & Docker Compose Configuration

Clone the repository and set up environment:

```bash
# Create application root
mkdir -p /opt/atulglass-erp
cd /opt/atulglass-erp

# Clone repository
git clone <REPO_URL> .
git checkout main

# Create production environment file (.env.production)
cat << 'EOF' > .env.production
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://atuladmin:STRONG_DB_PASSWORD@postgres:5432/atulglass_db?schema=public
SESSION_SECRET=REPLACE_WITH_GENERATED_64_CHAR_HEX_KEY
POSTGRES_USER=atuladmin
POSTGRES_PASSWORD=STRONG_DB_PASSWORD
POSTGRES_DB=atulglass_db
EOF

# Restrict permissions on env file
chmod 600 .env.production
```

### Docker Compose File (`docker-compose.yml`)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: atulglass_postgres
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - internal_net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: atulglass_app
    restart: always
    env_file:
      - .env.production
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - internal_net

volumes:
  postgres_data:

networks:
  internal_net:
    driver: bridge
```

### Production Dockerfile (`Dockerfile`)

```dockerfile
# Multi-stage production build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["npm", "start"]
```

---

## 4. Nginx Reverse Proxy & SSL (Certbot)

Create Nginx site configuration:

```bash
cat << 'EOF' > /etc/nginx/sites-available/atulglass-erp
server {
    server_name erp.atulglassagency.com;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/atulglass-erp /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Issue Let's Encrypt SSL certificate
certbot --nginx -d erp.atulglassagency.com --non-interactive --agree-tos --email admin@atulglass.com
```

---

## 5. Database Initialization & Seed

Run migrations and seed the XYG product catalog:

```bash
cd /opt/atulglass-erp
docker compose up -d

# Execute migration inside app container
docker compose exec app npx prisma migrate deploy

# Seed baseline users and Nagpur catalog
docker compose exec app npm run seed
```

---

## 6. Nightly Automated Backups & Off-Server Copy

### Backup Script (`/opt/atulglass-erp/scripts/backup.sh`):

```bash
#!/bin/bash
set -e

BACKUP_DIR="/var/backups/atulglass-db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/atulglass_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

# 1. Execute compressed pg_dump from PostgreSQL container
docker exec atulglass_postgres pg_dump -U atuladmin atulglass_db | gzip > "${BACKUP_FILE}"
chmod 600 "${BACKUP_FILE}"

# 2. Retain local backups for 14 days, delete older
find "${BACKUP_DIR}" -name "atulglass_backup_*.sql.gz" -mtime +14 -delete

# 3. Off-Server Copy: Sync to secure remote storage (e.g. AWS S3 / rsync / Backblaze B2)
# Example using rclone (pre-configured for cloud storage):
# rclone copy "${BACKUP_FILE}" remote_b2:atulglass-backups/daily/

echo "Backup successful: ${BACKUP_FILE}"
```

Make executable and register in root crontab:
```bash
chmod +x /opt/atulglass-erp/scripts/backup.sh
# Add to crontab to run every midnight at 02:00 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/atulglass-erp/scripts/backup.sh >> /var/log/atulglass_backup.log 2>&1") | crontab -
```

---

## 7. Disaster Recovery & Tested Restore Procedure

To restore the database from a backup file:

```bash
# 1. Identify the backup file to restore
BACKUP_FILE="/var/backups/atulglass-db/atulglass_backup_20261115_020000.sql.gz"

# 2. Stop application container to prevent incoming writes
cd /opt/atulglass-erp
docker compose stop app

# 3. Drop and recreate database inside postgres container
docker exec -i atulglass_postgres psql -U atuladmin -d postgres -c "DROP DATABASE IF EXISTS atulglass_db;"
docker exec -i atulglass_postgres psql -U atuladmin -d postgres -c "CREATE DATABASE atulglass_db;"

# 4. Stream uncompressed backup into postgresql container
gunzip -c "${BACKUP_FILE}" | docker exec -i atulglass_postgres psql -U atuladmin -d atulglass_db

# 5. Restart application container and verify
docker compose start app
docker compose logs --tail=30 app
```

---

## 8. Application Updates & Instant Rollback Steps

### Standard Deployment Update:
```bash
cd /opt/atulglass-erp
git pull origin main
docker compose build app
docker compose up -d app
docker compose exec app npx prisma migrate deploy
```

### Emergency Rollback:
```bash
cd /opt/atulglass-erp
# Revert git commit or checkout known tag
git checkout <PREVIOUS_COMMIT_TAG>
docker compose build app
docker compose up -d app
```
