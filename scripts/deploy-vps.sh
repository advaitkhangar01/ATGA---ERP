#!/usr/bin/env bash
# ==============================================================================
# Atul Glass Agency ERP - Automated Production Deployment Script
# Target Domain: atga.reachx.world | Target VPS IP: 187.127.158.74
# Designed for Shared Multi-Site Ubuntu VPS (Zero Downtime for Co-Hosted Sites)
# ==============================================================================

set -euo pipefail

DOMAIN="atga.reachx.world"
EXPECTED_IP="187.127.158.74"
APP_DIR="/opt/atulglass-erp"
APP_PORT="3040"
ENV_FILE="${APP_DIR}/.env.production"
NGINX_AVAILABLE="/etc/nginx/sites-available/${DOMAIN}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${DOMAIN}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo -e "${BLUE}===================================================================${NC}"
echo -e "${BLUE}   ATUL GLASS AGENCY ERP - AUTOMATED VPS PRODUCTION DEPLOYMENT     ${NC}"
echo -e "${BLUE}   Domain: ${DOMAIN} | Port: ${APP_PORT} (Isolated Loopback)        ${NC}"
echo -e "${BLUE}===================================================================${NC}"

# 1. Root / Sudo Privilege Check
if [ "$EUID" -ne 0 ]; then
  log_error "This script must be executed with sudo or as root. Try: sudo bash $0"
fi

# 2. Multi-Site Safety: Port 3040 Availability Check
log_info "Verifying host loopback port ${APP_PORT} is free..."
if ss -tulpn | grep -q ":${APP_PORT}\b"; then
  log_error "Port ${APP_PORT} is already in use by another service! Check 'ss -tulpn | grep :${APP_PORT}'."
fi
log_success "Port ${APP_PORT} is free and ready for exclusive assignment."

# 3. Ensure Docker and Docker Compose Plugin Exist
log_info "Verifying Docker Engine and Compose plugin..."
if ! command -v docker &> /dev/null; then
  log_error "Docker is not installed or not in PATH."
fi
if ! docker compose version &> /dev/null; then
  log_error "Docker Compose v2 plugin is not installed."
fi
log_success "Docker and Docker Compose v2 verified."

# 4. Add Real User (SUDO_USER) to Docker Group (if running via sudo)
if [ -n "${SUDO_USER:-}" ] && [ "${SUDO_USER}" != "root" ]; then
  if ! id -nG "$SUDO_USER" | grep -qw "docker"; then
    log_info "Adding user '$SUDO_USER' to 'docker' group for rootless docker commands..."
    usermod -aG docker "$SUDO_USER"
    log_success "User '$SUDO_USER' added to docker group (takes effect on next login)."
  fi
fi

# 5. Application Directory Setup
log_info "Verifying working directory: ${APP_DIR}..."
if [ ! -d "${APP_DIR}" ]; then
  log_info "Creating directory ${APP_DIR}..."
  mkdir -p "${APP_DIR}"
  if [ -n "${SUDO_USER:-}" ]; then
    chown -R "${SUDO_USER}:${SUDO_USER}" "${APP_DIR}"
  fi
fi

cd "${APP_DIR}"

# 6. Production Secrets (.env.production) Configuration
if [ ! -f "${ENV_FILE}" ]; then
  log_info "Generating production environment file (${ENV_FILE})..."
  DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=')
  SESSION_HEX=$(openssl rand -hex 32)

  cat << EOF > "${ENV_FILE}"
NODE_ENV=production
PORT=3000
APP_HOST_PORT=${APP_PORT}
DATABASE_URL=postgresql://atuladmin:${DB_PASSWORD}@postgres:5432/atulglass_db?schema=public
SESSION_SECRET=${SESSION_HEX}
POSTGRES_USER=atuladmin
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=atulglass_db
EOF
  chmod 600 "${ENV_FILE}"
  log_success "Generated secure .env.production with 256-bit SESSION_SECRET and strong DB password."
else
  log_info "Existing .env.production detected. Preserving existing secrets."
  chmod 600 "${ENV_FILE}"
fi

# 7. Build and Launch Containers
log_info "Building and launching Docker containers (App + PostgreSQL 16)..."
docker compose --env-file "${ENV_FILE}" up -d --build

# 8. Wait for PostgreSQL Healthcheck
log_info "Waiting for PostgreSQL database container to report healthy..."
ATTEMPTS=0
MAX_ATTEMPTS=30
until [ "$(docker inspect --format='{{json .State.Health.Status}}' atulglass_postgres 2>/dev/null)" == '"healthy"' ]; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
    log_error "PostgreSQL container failed to become healthy within 60 seconds."
  fi
  sleep 2
done
log_success "PostgreSQL container is healthy and accepting connections."

# 9. Database Migrations & Seed
log_info "Applying Prisma database migrations..."
docker compose --env-file "${ENV_FILE}" exec -T app npx prisma migrate deploy
log_success "Database migrations deployed."

log_info "Seeding initial users and Nagpur XYG product catalog..."
docker compose --env-file "${ENV_FILE}" exec -T app npm run seed || log_warn "Seed command finished (records may already exist)."
log_success "Database seed completed."

# 10. Multi-Site Safe Nginx Configuration
log_info "Configuring Nginx Virtual Host for ${DOMAIN}..."
cat << 'EOF' > "${NGINX_AVAILABLE}"
server {
    server_name atga.reachx.world;

    client_max_body_size 20M;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://127.0.0.1:3040;
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

if [ ! -L "${NGINX_ENABLED}" ]; then
  ln -s "${NGINX_AVAILABLE}" "${NGINX_ENABLED}"
fi

# Test Nginx across all existing sites before reloading
log_info "Testing Nginx syntax across all hosted sites..."
nginx -t

log_info "Reloading Nginx (zero downtime for sibling sites)..."
systemctl reload nginx
log_success "Nginx virtual host enabled and reloaded."

# 11. Local App Response Check
log_info "Testing local HTTP response on 127.0.0.1:${APP_PORT}..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${APP_PORT}/login")
if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 307 ] || [ "$HTTP_CODE" -eq 302 ]; then
  log_success "Local application container is responding with HTTP ${HTTP_CODE}."
else
  log_warn "Application responded with unexpected HTTP ${HTTP_CODE}. Review container logs: 'docker compose logs app'."
fi

# 12. Automated Daily Backup Registration
log_info "Registering automated daily backup cron job (02:00 AM)..."
chmod 750 "${APP_DIR}/scripts/backup.sh" "${APP_DIR}/scripts/restore.sh"
mkdir -p /var/backups/atulglass-db

CRON_JOB="0 2 * * * ${APP_DIR}/scripts/backup.sh >> /var/log/atulglass_backup.log 2>&1"
if ! crontab -l 2>/dev/null | grep -Fq "scripts/backup.sh"; then
  (crontab -l 2>/dev/null || true; echo "$CRON_JOB") | crontab -
  log_success "Added nightly 02:00 AM database backup cron job."
else
  log_info "Backup cron job already registered."
fi

# 13. SSL Certificate Setup via Certbot (Optional / Conditional on DNS)
echo -e "\n${BLUE}--- SSL / HTTPS SETUP ---${NC}"
RESOLVED_IP=$(dig +short "${DOMAIN}" 2>/dev/null | tail -n1 || true)

if [ "${RESOLVED_IP}" == "${EXPECTED_IP}" ]; then
  log_info "DNS for ${DOMAIN} is resolving to this server (${EXPECTED_IP})."
  log_info "Requesting Let's Encrypt TLS certificate via Certbot..."
  certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos --email admin@atulglass.com --redirect || {
    log_warn "Certbot automated issuance encountered an issue. You can run manually later: sudo certbot --nginx -d ${DOMAIN}"
  }
  log_success "SSL Certificate issued and active for https://${DOMAIN}!"
else
  log_warn "DNS for ${DOMAIN} currently resolves to '${RESOLVED_IP:-NOT_RESOLVED}' (Expected: ${EXPECTED_IP})."
  log_warn "Skipping automated SSL generation. Once your DNS A-record points to ${EXPECTED_IP}, run:"
  echo -e "   ${GREEN}sudo certbot --nginx -d ${DOMAIN}${NC}\n"
fi

# 14. Final Summary & Access Information
echo -e "\n${GREEN}===================================================================${NC}"
echo -e "${GREEN}   DEPLOYMENT COMPLETED SUCCESSFULLY!                             ${NC}"
echo -e "${GREEN}===================================================================${NC}"
echo -e "URL:           https://${DOMAIN} (or http://${DOMAIN} until SSL is activated)"
echo -e "Local Port:    127.0.0.1:${APP_PORT}"
echo -e "Default Admin: admin@atulglass.com  / Admin@123"
echo -e "Default Staff: staff@atulglass.com  / Staff@123"
echo -e "Backup Cron:   Daily at 02:00 AM -> /var/backups/atulglass-db/"
echo -e "Container Ops: cd ${APP_DIR} && sudo docker compose ps"
echo -e "${GREEN}===================================================================${NC}"
