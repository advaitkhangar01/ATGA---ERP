# 08. VPS Production Readiness Audit Plan & Verification Protocol

**System:** Atul Glass Agency ERP  
**Target Environment:** Ubuntu 24.04 LTS (64-bit Cloud VPS)  
**Document Purpose:** Mandatory 4-stage gated verification protocol and scorecard before cutting over live production traffic.  
**Binding Architecture:** Docker Compose (Node.js 20 Alpine `USER node` + PostgreSQL 16 Alpine), Host Nginx (TLS 1.3 / HSTS termination), UFW.  
**Auditor:** Operations & Lead Full-Stack Engineer  
**Date:** November 16, 2026  

---

## Executive Overview & Verification Gates

Before cutover of live warehouse scanner devices and user authentication, the production candidate must clear four sequential verification gates. Each gate requires 100% compliance; any failure blocks progression to the next gate.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       VPS PRODUCTION READINESS GATES                        │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────┤
│     GATE 1      │     GATE 2      │     GATE 3      │        GATE 4         │
│   Pre-Flight    │    Host OS &    │    Container    │     Disaster DR &     │
│ Codebase & CI   │  Environment    │  Ingress/Proxy  │      Resilience       │
├─────────────────┼─────────────────┼─────────────────┼───────────────────────┤
│ • Zero tsc errs │ • Ubuntu 24.04  │ • Docker health │ • Automated backup    │
│ • Zero lint     │ • UFW 22/80/443 │ • Prisma deploy │ • Compression test    │
│ • Clean build   │ • Secrets 0600  │ • Nginx TLS 1.3 │ • Drop & restore drill│
│ • No tracked db │ • Entropy check │ • Cookie flags  │ • Emergency rollback  │
│ • Non-root img  │ • Port isolation│ • Action RBAC   │ • 14-day prune check  │
└─────────────────┴─────────────────┴─────────────────┴───────────────────────┘
```

---

## Gate 1: Pre-Flight Codebase & Artifact Hygiene

*Execution Context:* Local development machine or Continuous Integration build runner prior to remote deployment.

### 1.1 TypeScript Strict Compilation Audit
Ensure zero type errors across the entire codebase.

```bash
# Execute static typecheck
npx tsc --noEmit
```
- **Expected Result:** Exit code `0` with zero error messages.
- [x] **Check 1.1:** TypeScript static compilation passes cleanly.

### 1.2 ESLint Code Quality Audit
Ensure zero unresolved linting, syntax, or React 19 render errors.

```bash
# Execute linter
npm run lint
```
- **Expected Result:** Exit code `0` with zero errors (44 non-blocking React/TypeScript warnings permitted).
- [x] **Check 1.2:** ESLint inspection passes cleanly.

### 1.3 Production Compilation & Bundle Optimization
Verify that Turbopack / Next.js production build succeeds and generates all 17 application routes.

```bash
# Execute production build
npm run build
```
- **Expected Result:** Output displays `✓ Compiled successfully`, pre-renders static and dynamic App Router routes, and exits `0`.
- [x] **Check 1.3:** Next.js production build exits 0.

### 1.4 Git Repository Hygiene & Secret Exclusion
Verify that sensitive files (`.env`, `.env.production`) and legacy SQLite binary databases (`*.db`, `*.db-journal`) are strictly excluded from version control.

```bash
# Verify no untracked secrets or databases are staged
git status --ignored | grep -E '\.env$|\.env\.production$|dev\.db'
```
- **Expected Result:** `.env`, `.env.production`, and `dev.db` appear exclusively under "Ignored files", never under "Untracked files" or "Changes to be committed".
- [x] **Check 1.4:** Git repository strictly ignores local secrets and binary databases.

### 1.5 Dockerfile Non-Root Context & Layer Optimization
Inspect `Dockerfile` to confirm security hardening standards.

```bash
# Verify non-root USER instruction in runner stage
grep -n "USER node" Dockerfile
```
- **Expected Result:** Line exists in the runner stage before `CMD ["npm", "start"]`.
- [x] **Check 1.5:** Dockerfile enforces non-root container user (`USER node`).

---

## Gate 2: VPS Host Hardening & Environment Isolation

*Execution Context:* Direct SSH terminal session on the target Ubuntu 24.04 LTS VPS.

### 2.1 Host Operating System Baseline
Ensure the VPS is running Ubuntu 24.04 LTS and all core system libraries are up to date.

```bash
# Verify distribution
lsb_release -a

# Ensure packages are current
sudo apt update && sudo apt upgrade -y
```
- **Expected Result:** `Description: Ubuntu 24.04 LTS`, zero pending security updates.
- [ ] **Check 2.1:** Ubuntu 24.04 LTS verified and packages upgraded.

### 2.2 UFW Firewall & Network Perimeter Lock
Verify that ingress traffic is strictly constrained to SSH (22), HTTP (80), and HTTPS (443). Confirm PostgreSQL (5432) and Next.js (3000) are not exposed to the public internet.

```bash
# Check UFW status
sudo ufw status verbose
```
- **Expected Result:**
  ```text
  Status: active
  Logging: on (low)
  Default: deny (incoming), allow (outgoing), disabled (routed)
  To                         Action      From
  --                         ------      ----
  22/tcp (OpenSSH)           ALLOW IN    Anywhere
  80/tcp                     ALLOW IN    Anywhere
  443/tcp                    ALLOW IN    Anywhere
  ```
```bash
# Verify port 5432 and 3000 are NOT listening on public 0.0.0.0 interfaces
sudo ss -tulpn | grep -E '5432|3000'
```
- **Expected Result:** Port 3000 is bound strictly to `127.0.0.1:3000`; Port 5432 is not exposed on any host interface (accessible only via internal Docker network). Never `0.0.0.0:5432`, `0.0.0.0:3000`, `:::5432`, or `:::3000`.
- [ ] **Check 2.2:** UFW is active and only ports 22, 80, and 443 are open to WAN.

### 2.3 Directory Permissions & Secrets Protection
Validate that `/opt/atulglass-erp/.env.production` is strictly locked down and owned by `root`.

```bash
# Inspect file mode
ls -l /opt/atulglass-erp/.env.production
```
- **Expected Result:** `-rw------- 1 root root ... .env.production` (Permissions `0600`).
- [ ] **Check 2.3:** `.env.production` is locked to permissions `0600` owned by `root:root`.

### 2.4 Cryptographic Entropy Verification
Ensure that production secrets meet minimum security strength standards.

```bash
# Verify SESSION_SECRET length (must be 64-character hexadecimal)
grep "^SESSION_SECRET=" /opt/atulglass-erp/.env.production | cut -d'=' -f2- | tr -d '\r\n"' | wc -c
```
- **Expected Result:** Output is exactly `64`.
```bash
# Verify POSTGRES_PASSWORD length (minimum 24 characters)
grep "^POSTGRES_PASSWORD=" /opt/atulglass-erp/.env.production | cut -d'=' -f2- | tr -d '\r\n"' | wc -c
```
- **Expected Result:** Output is `>= 24`.
- [ ] **Check 2.4:** `SESSION_SECRET` has 256 bits of entropy (64 hex characters) and DB password is `>= 24` chars.

---

## Gate 3: Container Orchestration & Ingress Security

*Execution Context:* Direct SSH session on VPS running Docker Compose and Nginx.

### 3.1 Container Health & Restart Policies
Launch stack and inspect container status.

```bash
cd /opt/atulglass-erp
docker compose --env-file .env.production up -d

# Inspect running containers
docker compose ps
```
- **Expected Result:**
  - `atulglass_postgres`: Status `Up (healthy)`.
  - `atulglass_app`: Status `Up`.
- [ ] **Check 3.1:** Both Docker containers launch successfully with healthchecks reporting healthy.

### 3.2 Database Migration Status
Verify PostgreSQL has received all Prisma schema migrations.

```bash
docker compose exec app npx prisma migrate status
```
- **Expected Result:** `Database schema is up to date!` with zero pending migrations.
- [ ] **Check 3.2:** Prisma reports database schema is fully up to date.

### 3.3 Database Seed Integrity Check
Confirm default administrative accounts and Nagpur XYG product catalogs are populated in PostgreSQL.

```bash
# Query product and user count
docker compose exec postgres psql -U atuladmin -d atulglass_db -c "SELECT count(*) FROM \"Product\"; SELECT count(*) FROM \"User\";"
```
- **Expected Result:** Product count `>= 90`; User count `>= 2` (`admin@atulglass.com`, `staff@atulglass.com`).
- [ ] **Check 3.3:** Database contains seeded users and automotive glass SKU catalog.

### 3.4 Nginx Reverse Proxy & HTTP-to-HTTPS Redirection
Test Nginx configuration and automated HTTP redirection.

```bash
# Test Nginx configuration syntax
sudo nginx -t

# Test HTTP redirects to HTTPS with 301 Moved Permanently
curl -s -I http://erp.atulglassagency.com | grep -E "HTTP|Location"
```
- **Expected Result:**
  - `nginx: configuration file /etc/nginx/nginx.conf test is successful`
  - `HTTP/1.1 301 Moved Permanently`
  - `Location: https://erp.atulglassagency.com/`
- [ ] **Check 3.4:** Nginx proxy configuration syntax is valid and HTTP forces 301 redirect to HTTPS.

### 3.5 TLS 1.3 & HSTS Security Header Verification
Audit the HTTPS endpoint for security headers and modern SSL protocols.

```bash
# Inspect response headers on HTTPS endpoint
curl -s -I https://erp.atulglassagency.com/login | grep -iE "strict-transport-security|x-frame-options|x-content-type-options"
```
- **Expected Result:**
  - `strict-transport-security: max-age=31536000; includeSubDomains`
  - `x-frame-options: SAMEORIGIN`
  - `x-content-type-options: nosniff`
- [ ] **Check 3.5:** HTTPS connection presents valid TLS certificate and enforces HSTS, X-Frame-Options, and X-Content-Type-Options.

### 3.6 Session Cookie Flags Verification
Inspect authenticated session cookie attributes to ensure tokens cannot be accessed via JavaScript or transmitted over insecure channels.

```bash
# Execute authentication probe inside container to inspect cookie configuration
docker compose exec app npx tsx -e "
import { loginAction } from './src/actions/auth';
async function test() {
  const res = await loginAction('admin@atulglass.com', 'Admin@123');
  console.log('Login outcome:', res.success ? 'SUCCESS' : res.error);
}
test();
"
```
- **Expected Result:**
  - Login returns `SUCCESS`.
  - In browser DevTools (Application > Cookies for `https://erp.atulglassagency.com`), inspect cookie named `session-token`.
  - Confirm attributes: `HttpOnly` is checked, `Secure` is checked, `SameSite` is set to `Lax`, and `Path` is `/`.
- [ ] **Check 3.6:** Authentication cookie `session-token` enforces `HttpOnly`, `SameSite=Lax`, and `Secure` attributes.

### 3.7 Server Action Rate Throttling Test
Validate that the in-memory sliding window rate limiter in `src/actions/auth.ts` blocks brute-force authentication attempts after 5 failures.

```bash
# Trigger 6 rapid consecutive failed login calls inside container
docker compose exec app npx tsx -e "
import { loginAction } from './src/actions/auth';
async function test() {
  for (let i = 1; i <= 6; i++) {
    const res = await loginAction('admin@atulglass.com', 'wrongpassword' + i);
    console.log('Attempt ' + i + ':', res.error);
  }
}
test();
"
```
- **Expected Result:** Attempts 1-5 output `Invalid email or password`. Attempt 6 returns `Too many failed login attempts. Please wait 15 minutes before trying again.`
- [ ] **Check 3.7:** Authentication rate limiter throttles repeated invalid logins after 5 attempts.

### 3.8 Role-Based Access Control (RBAC) Guard Verification
Validate that Server Actions enforce the administrative security perimeter and reject unauthorized calls from staff or unauthenticated contexts.

```bash
# Test admin-restricted server actions from unauthorized context
docker compose exec app npx tsx -e "
import { deleteProductAction } from './src/actions/products';
async function test() {
  const res = await deleteProductAction('test-sku-id');
  console.log('Delete Product without Admin Session:', res.error);
}
test();
"
```
- **Expected Result:** Output displays `Unauthorized` or `Authentication required` (Server Action terminates without executing database mutation). In UI, staff login suppresses links to `/users`, `/settings`, and `/reports`.
- [ ] **Check 3.8:** Server Actions strictly enforce RBAC guards (`requireRole('admin')`) and block unauthorized privilege escalation.

---

## Gate 4: Resilience & Disaster Recovery Verification Drill

*Execution Context:* Direct SSH terminal session on VPS.

### 4.1 Backup Automation Execution
Test the automated backup script manually and verify compressed archive generation.

```bash
# Ensure script has execution permissions
chmod 750 /opt/atulglass-erp/scripts/backup.sh

# Run backup script manually
sudo /opt/atulglass-erp/scripts/backup.sh
```
- **Expected Result:** Script logs `Backup completed successfully` and creates `/var/backups/atulglass-db/atulglass_backup_<TIMESTAMP>.sql.gz`.
- [ ] **Check 4.1:** `scripts/backup.sh` executes without error and generates timestamped dump.

### 4.2 Backup Archive Integrity & Non-Empty Check
Verify the generated backup file is a valid gzip archive and contains non-empty database tables.

```bash
LATEST_BACKUP=$(ls -t /var/backups/atulglass-db/atulglass_backup_*.sql.gz | head -n 1)

# Check archive integrity
gzip -t "$LATEST_BACKUP"

# Verify size is greater than 10 KB
find "$LATEST_BACKUP" -size +10k
```
- **Expected Result:** `gzip -t` exits `0` with no output (valid integrity); `find` returns the file path.
- [ ] **Check 4.2:** Backup archive passes gzip checksum test and size exceeds 10KB.

### 4.3 Automated Cron Job Registration
Verify that the daily backup cron job is registered to run at 02:00 AM.

```bash
# Inspect root crontab
sudo crontab -l | grep "backup.sh"
```
- **Expected Result:** `0 2 * * * /opt/atulglass-erp/scripts/backup.sh >> /var/log/atulglass_backup.log 2>&1`
- [ ] **Check 4.3:** Daily backup cron is configured for 02:00 AM with log redirection.

### 4.4 Disaster Recovery Restore Drill (Controlled Simulation)
Conduct a live restore verification drill using `scripts/restore.sh` to prove that disaster recovery works end-to-end.

```bash
# 1. Insert a canary record into PostgreSQL to track recovery
docker compose exec postgres psql -U atuladmin -d atulglass_db -c \
  "INSERT INTO \"User\" (\"id\", \"email\", \"name\", \"password\", \"role\", \"createdAt\", \"updatedAt\") VALUES ('dr-canary', 'canary@atulglass.com', 'DR Canary Test', 'hash', 'staff', NOW(), NOW());"

# 2. Execute fresh backup capturing the canary record
sudo /opt/atulglass-erp/scripts/backup.sh
CANARY_BACKUP=$(ls -t /var/backups/atulglass-db/atulglass_backup_*.sql.gz | head -n 1)

# 3. Simulate accidental deletion of the canary record
docker compose exec postgres psql -U atuladmin -d atulglass_db -c \
  "DELETE FROM \"User\" WHERE \"id\" = 'dr-canary';"

# Verify canary record is gone
docker compose exec postgres psql -U atuladmin -d atulglass_db -c \
  "SELECT count(*) FROM \"User\" WHERE \"id\" = 'dr-canary';" # Returns 0

# 4. Execute restore script with confirmation
sudo /opt/atulglass-erp/scripts/restore.sh "$CANARY_BACKUP"

# 5. Verify canary record has been fully restored
docker compose exec postgres psql -U atuladmin -d atulglass_db -c \
  "SELECT \"id\", \"email\" FROM \"User\" WHERE \"id\" = 'dr-canary';"
```
- **Expected Result:** Canary record `dr-canary` (`canary@atulglass.com`) is present in the restored database.
```bash
# Clean up canary record after drill
docker compose exec postgres psql -U atuladmin -d atulglass_db -c \
  "DELETE FROM \"User\" WHERE \"id\" = 'dr-canary';"
```
- [ ] **Check 4.4:** Disaster recovery restore drill restores deleted records with 100% fidelity.

### 4.5 Backup Retention Policy Prune Test
Verify that backups older than 14 days are automatically pruned by `scripts/backup.sh`.

```bash
# Create simulated 15-day-old dummy backup file
sudo touch -d "15 days ago" /var/backups/atulglass-db/atulglass_backup_20200101_000000.sql.gz

# Run backup script
sudo /opt/atulglass-erp/scripts/backup.sh

# Verify dummy file was removed by retention prune
ls /var/backups/atulglass-db/atulglass_backup_20200101_000000.sql.gz 2>&1
```
- **Expected Result:** Output displays `No such file or directory` (file was pruned by `find -mtime +14 -delete`).
- [ ] **Check 4.5:** Automated retention policy prunes backup archives older than 14 days.

---

## 5. Emergency Rollback Runbook

If any fatal defect or outage occurs during deployment:

### 5.1 Immediate Container Rollback
```bash
cd /opt/atulglass-erp

# 1. Stop current containers
docker compose down

# 2. Revert codebase to previous stable commit tag
git checkout <PREVIOUS_STABLE_COMMIT_TAG>

# 3. Rebuild and launch previous container image
docker compose up -d --build

# 4. If database corruption occurred, restore latest verified backup
sudo /opt/atulglass-erp/scripts/restore.sh /var/backups/atulglass-db/<LATEST_VERIFIED_BACKUP>.sql.gz
```

### 5.2 Verification of Rollback
```bash
# Verify app is responding on port 3000
curl -s -I http://127.0.0.1:3000/login | grep "HTTP/1.1 200 OK"
```

---

## 6. Master Production Readiness Scorecard & Sign-off

| Gate | Check Item | Verification Command | Criteria | Result | Auditor Sign-off |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **G1.1** | TypeScript Compilation | `npx tsc --noEmit` | Clean exit 0, 0 errors | **PASS** | Verified 2026-11-16 |
| **G1.2** | ESLint Code Quality | `npm run lint` | Clean exit 0, 0 errors | **PASS** | Verified 2026-11-16 |
| **G1.3** | Production Build | `npm run build` | Route generation complete, exit 0 | **PASS** | Verified 2026-11-16 |
| **G1.4** | Git Hygiene & Secrets | `git status --ignored` | No `.env` or `dev.db` tracked | **PASS** | Verified 2026-11-16 |
| **G1.5** | Docker Non-Root | `grep "USER node" Dockerfile` | Non-root `node` user in runner | **PASS** | Verified 2026-11-16 |
| **G2.1** | OS Version Baseline | `lsb_release -a` | Ubuntu 24.04 LTS confirmed | PENDING | |
| **G2.2** | UFW Perimeter Lock | `sudo ufw status verbose` | Only 22, 80, 443 open to WAN | PENDING | |
| **G2.3** | File Permissions | `ls -l /opt/.../.env.production` | Mode `0600`, owned `root:root` | PENDING | |
| **G2.4** | Secret Entropy | Length check commands | `SESSION_SECRET`=64, DB pass>=24 | PENDING | |
| **G3.1** | Container Health | `docker compose ps` | Postgres healthy, App running | PENDING | |
| **G3.2** | Prisma Migration | `npx prisma migrate status` | Database schema up to date | PENDING | |
| **G3.3** | Catalog Seed | PostgreSQL `SELECT count(*)` | Products >= 90, Users >= 2 | PENDING | |
| **G3.4** | Nginx & HTTP Redirection | `curl -I http://...` | 301 redirect to HTTPS | PENDING | |
| **G3.5** | TLS 1.3 & HSTS | `curl -I https://...` | Valid cert, HSTS header present | PENDING | |
| **G3.6** | Secure Cookies | `Set-Cookie` / DevTools | `session-token` HttpOnly, Secure | PENDING | |
| **G3.7** | Rate Limiting | 6 failed logins probe | Throttled on 6th attempt | PENDING | |
| **G3.8** | Action RBAC Guard | Action probe without Admin | Unauthorized / mutation blocked | PENDING | |
| **G4.1** | Backup Script Run | `sudo scripts/backup.sh` | Clean exit, dump created | PENDING | |
| **G4.2** | Backup Compression | `gzip -t <dump>` | Exit 0, size > 10KB | PENDING | |
| **G4.3** | Cron Job Setup | `sudo crontab -l` | Daily 02:00 run configured | PENDING | |
| **G4.4** | DR Restore Drill | Canary insert/restore test | Canary record recovered 100% | PENDING | |
| **G4.5** | 14-Day Prune Test | Simulated 15d dump prune | Old archives automatically pruned| PENDING | |

### Cutover Authorization Sign-off

```
All 22 verification criteria must be evaluated and signed off by the Operations Lead before pointing domain DNS to the VPS:

Auditor Name:       ___________________________________
Auditor Signature:  ___________________________________
Date of Sign-off:   ___________________________________
Final Decision:     [ ] APPROVED FOR CUTOVER   [ ] REJECTED (REMEDIATION REQUIRED)
```
