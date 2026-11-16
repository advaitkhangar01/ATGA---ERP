# VPS Production Readiness Audit Plan - Design Specification

**System:** Atul Glass Agency ERP  
**Target Environment:** Ubuntu 24.04 LTS VPS (Cloud Docker Compose Architecture)  
**Document Identifier:** `docs/superpowers/specs/2026-11-16-vps-readiness-audit-plan-design.md`  
**Date:** 2026-11-16  
**Status:** In Review  

---

## 1. Intent & Purpose

The Atul Glass Agency ERP system has completed its 8-phase modernisation (Next.js App Router, PostgreSQL transition, atomic stock transactions, security hardening, barcode printing, and Docker packaging). Before cutting over to production on a live cloud VPS, a systematic, rigorous audit plan is required to guarantee zero downtime, zero data leakage, verified automated disaster recovery, and bulletproof network/host security.

The purpose of this specification is to define the structure, criteria, verification commands, and sign-off protocols for `docs/08-vps-readiness-audit-plan.md`.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- Establish an authoritative 4-stage gated verification protocol that operators must follow before declaring the VPS production-ready.
- Provide explicit, executable bash/CLI commands with deterministic pass/fail output expectations for every audit check.
- Include an active Disaster Recovery drill that verifies automated backups, non-destructive restore integrity, and database recovery.
- Include a complete operational sign-off scorecard and rollback procedure.
- Maintain seamless consistency with `docs/05-deployment-runbook.md` and `docs/07-vps-production-and-security-reference.md`.

### Non-Goals
- Modifying core application source code (application logic is already completed and frozen in `feature/production-upgrade`).
- Replacing existing Docker Compose configurations or Nginx templates (the audit plan verifies existing configurations against production standards).
- Implementing third-party cloud monitoring agent dependencies (audit relies on native Linux/Docker/Nginx tools: `systemd`, `docker inspect`, `curl`, `pg_isready`).

### Anti-Goals
- Vague or subjective verification questions (e.g. "Check if server is fast"). Every check must be a binary PASS or FAIL with measurable criteria.
- "Happy-path-only" checks. The audit must deliberately verify failure states (e.g. rate limit lockout, invalid token rejection, blocked open ports).

---

## 3. Constraints

- **Host Environment:** Ubuntu 24.04 LTS (64-bit), minimum 2 vCPUs, 4GB RAM, 40GB SSD.
- **Network Boundaries:** Only ports 22 (SSH), 80 (HTTP), and 443 (HTTPS) may be exposed externally. Port 5432 (PostgreSQL) must NEVER be bound to public interfaces.
- **Runtime Stack:** Docker Engine + Docker Compose Plugin (Next.js Node 20 Alpine container + PostgreSQL 16 Alpine container). Host-level Nginx reverse proxy with Certbot TLS 1.3 termination.
- **Data Persistence:** Dedicated Docker named volume `postgres_data` mapping to `/var/lib/postgresql/data`.

---

## 4. Architectural Approaches Considered

### Approach A: 4-Stage Gated Verification Runbook & Scorecard (Selected)
- **Description:** A sequential markdown document with 4 stage gates: Pre-Flight Codebase, VPS Host Hardening, Container Ingress & Reverse Proxy, and Resilience & Disaster Recovery Drill.
- **Trade-offs:** Requires manual execution of commands, but provides a 100% auditable record, clear accountability, and zero chance of automated script bugs masking deployment failures.
- **Outcome:** **Selected by user.**

### Approach B: Script-Automated Diagnostic Probe (`vps-audit.sh`)
- **Description:** A single shell script to run on the VPS to report red/green status.
- **Trade-offs:** Faster on repeat runs, but fragile across minor OS/distro differences and cannot evaluate end-to-end user workflows or browser-level TLS certificates interactively.
- **Outcome:** Rejected in favor of the transparent, auditable runbook scorecard.

### Approach C: Two-Tier Local/VPS Split Plan
- **Description:** Separate local staging simulation from live cutover steps.
- **Trade-offs:** Duplicates steps and fragments verification across two disparate documents.
- **Outcome:** Rejected in favor of a single unified gate document.

---

## 5. Detailed Design: The 4 Stage Gates

The resulting `docs/08-vps-readiness-audit-plan.md` will contain the following detailed gates:

### Gate 1: Pre-Flight Codebase & Artifact Hygiene (Executed on Local / CI)
1. **Compilation & Type Safety:** `npm run build` exits 0; `npx tsc --noEmit` exits 0 with zero warnings.
2. **Linting & Code Quality:** `npm run lint` clean.
3. **Git Hygiene & Secrets Exclusion:**
   - Verify `.env`, `.env.production`, `dev.db`, `prisma/dev.db` are strictly untracked.
   - Run `git status --ignored` to confirm secrets stay untracked.
4. **Container Image Build Verification & Hardening Check:**
   - Execute `docker build -t atulglass-erp:audit-test .` locally or on build runner.
   - Audit `Dockerfile`: Verify container runs with non-root security context (`USER node`), and runner stage only copies necessary production distribution assets.

### Gate 2: VPS Host Hardening & Environment Isolation (Executed on Ubuntu VPS)
1. **OS Baseline & Package State:**
   - System packages updated (`apt update && apt upgrade -y`).
   - Essential utilities installed: `nginx`, `git`, `curl`, `ufw`, `certbot`, `python3-certbot-nginx`, `docker-ce`, `docker-compose-plugin`.
2. **Firewall & Ingress Perimeter (UFW):**
   - Default deny incoming, default allow outgoing.
   - Only 22/tcp, 80/tcp, and 443/tcp permitted.
   - Confirm port 5432, 3000, and internal Docker bridges are unreachable from WAN.
3. **File System Permissions & Secrets Hardening:**
   - App directory: `/opt/atulglass-erp` owned by operator.
   - Production secrets file: `/opt/atulglass-erp/.env.production` set to `chmod 600 root:root`.
   - `SESSION_SECRET` entropy: verified 64-character hexadecimal (>= 256 bits of entropy).
   - `POSTGRES_PASSWORD`: verified strong random string (>= 24 characters).

### Gate 3: Container Orchestration & Ingress Security
1. **Docker Compose & Health Probes:**
   - Run `docker compose --env-file .env.production up -d`.
   - Verify `atulglass_postgres` health check status returns `healthy` (`pg_isready -U atuladmin -d atulglass_db`).
   - Verify `atulglass_app` container stays in `running` state with restart policy `always`.
2. **Database Migration & Seeding:**
   - Run `docker compose exec app npx prisma migrate status` confirming all migrations are applied.
   - Verify initial seed records exist (Admin/Staff users and Nagpur XYG product catalog).
3. **Nginx Reverse Proxy & TLS/SSL Configuration:**
   - Upstream proxy passes `http://127.0.0.1:3000` with standard proxy headers (`X-Forwarded-For`, `X-Forwarded-Proto`, `Host`).
   - Plain HTTP (`http://domain`) forces 301 Permanent Redirect to HTTPS (`https://domain`).
   - SSL certificate generated and managed by Certbot.
   - TLS configuration enforces TLS 1.2 and TLS 1.3; weak ciphers disabled; `Strict-Transport-Security` (HSTS) verified in HTTP headers.
4. **Application Security Boundary & Server Action Testing:**
   - Cookie inspection: `session_token` cookie carries `HttpOnly`, `SameSite=Lax`, and `Secure` attributes.
   - Login rate limiter verification: executing 5 consecutive invalid credentials triggers Next.js Server Action throttling payload (`{ success: false, error: "Too many failed login attempts..." }`).
   - Role-based Server Action guard verification: unauthenticated or staff calls to admin actions (e.g. `deleteProductAction`, `createUserAction`) return unauthorized access error (`requireRole('admin')`). UI navigation menu suppresses admin routes for staff.

### Gate 4: Resilience & Disaster Recovery Verification Drill
1. **Automated Backup Pipeline:**
   - Backup script `/opt/atulglass-erp/scripts/backup.sh` executable (`chmod 750`).
   - Manual dry-run execution: verifies generation of compressed dump `/var/backups/atulglass-db/atulglass_backup_YYYYMMDD_HHMMSS.sql.gz`.
   - Retention policy verification: confirms pruning of dumps older than 14 days.
   - Cron configuration: verified daily trigger at `02:00` with output redirected to `/var/log/atulglass_backup.log`.
2. **Disaster Recovery Restore Drill (Non-Destructive Simulation):**
   - Create a test verification table/record in PostgreSQL.
   - Run `scripts/backup.sh`.
   - Simulate data anomaly/drop.
   - Execute `scripts/restore.sh /var/backups/atulglass-db/<latest_dump>`.
   - Verify restored data integrity and confirm application re-connects cleanly.
3. **Emergency Rollback & Incident Protocol:**
   - Documented step-by-step rollback instructions in case of deployment failure.
   - Rollback sign-off checklist.

---

## 6. What's Left to the Builder

The builder implementing `docs/08-vps-readiness-audit-plan.md` must:
- Provide the exact shell commands for each step.
- Include standard Markdown checkboxes (`- [ ]`) for every audit requirement.
- Provide clear verification output examples so any engineer can unambiguously verify PASS/FAIL.
- Provide a summary Scorecard & Sign-off Table at the end of the document.
