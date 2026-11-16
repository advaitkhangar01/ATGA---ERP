# VPS Production Readiness Audit Plan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the complete 4-stage gated VPS readiness audit runbook (`docs/08-vps-readiness-audit-plan.md`), apply essential container/Nginx security hardening baselines (`Dockerfile` non-root context and Nginx HSTS), and execute/verify Gate 1 (Local Pre-Flight) to validate zero errors before remote deployment.

**Architecture:** A 4-stage sequential verification matrix spanning Pre-Flight Codebase Hygiene, VPS Host Hardening, Container Ingress & Reverse Proxy, and Disaster Recovery Drills. The plan also hardens the repository's container configuration (`Dockerfile`) to run with the `node` non-root user and updates Nginx configuration templates to include HSTS headers, guaranteeing that the audit targets pass deterministic verification.

**Tech Stack:** Next.js 15, PostgreSQL 16 Alpine, Docker Compose, Nginx, Certbot (TLS 1.3), UFW, Bash, Prisma ORM.

**Spec:** `docs/superpowers/specs/2026-11-16-vps-readiness-audit-plan-design.md`

## Global Constraints

- Host target: Ubuntu 24.04 LTS (64-bit) with Docker CE and Docker Compose plugin.
- Network boundaries: Only ports 22 (SSH), 80 (HTTP), and 443 (HTTPS) permitted. Port 5432 and 3000 restricted to internal loopback / bridge network.
- Secrets protection: `.env.production` permissions strictly `0600 root:root`; 64-char hexadecimal `SESSION_SECRET`.
- Database engine: PostgreSQL 16 Alpine with native transactions; zero SQLite dependencies.
- Pass/Fail determinism: Every audit item must have an explicit bash command and deterministic expected output.

## Review Focus

- Docker container running as root: The current `Dockerfile` uses default `root` in the runner stage; must be hardened to `USER node` to satisfy Gate 1.4.
- Nginx template missing HSTS: `docs/05-deployment-runbook.md` lacks `Strict-Transport-Security`; must include it to satisfy Gate 3.3.
- Rate limiting verification: Verification must target Next.js Server Action JSON responses (`{ success: false, error: ... }`) rather than raw HTTP 429 status codes.
- Backup script execution: `scripts/backup.sh` must be executable (`0750`) and verified to produce a non-empty `*.sql.gz` dump.
- Restore drill safety: `scripts/restore.sh` must be tested against a disposable or isolated verification database before touching production volumes.

---

### Task 1: Container & Nginx Hardening Baseline Updates

**Files:**
- Modify: `Dockerfile`
- Modify: `docs/05-deployment-runbook.md:162-180`
- Modify: `docs/07-vps-production-and-security-reference.md:20-22`

**Interfaces:**
- Consumes: Existing multi-stage `Dockerfile` and deployment documentation.
- Produces: Hardened non-root Docker runner stage and HSTS-enabled Nginx reverse proxy configuration.

- [ ] **Step 1: Update `Dockerfile` runner stage for non-root security context**
  Update `Dockerfile` to create proper directory ownership and set `USER node` before running `CMD ["npm", "start"]`.

- [ ] **Step 2: Update Nginx reverse proxy template with HSTS and security headers**
  Edit `docs/05-deployment-runbook.md` and `docs/07-vps-production-and-security-reference.md` to add `Strict-Transport-Security "max-age=31536000; includeSubDomains" always;`, `X-Frame-Options SAMEORIGIN`, and `X-Content-Type-Options nosniff`.

- [ ] **Step 3: Verify local build and container build pass**
  Run: `npm run build`
  Expected: Compiled successfully with zero errors.

- [ ] **Step 4: Commit hardening updates**
  ```bash
  git add Dockerfile docs/05-deployment-runbook.md docs/07-vps-production-and-security-reference.md
  git commit -m "fix(deploy): harden Dockerfile with non-root user and add Nginx security headers"
  ```

---

### Task 2: Author Authoritative VPS Readiness Audit Plan (`docs/08-vps-readiness-audit-plan.md`)

**Files:**
- Create: `docs/08-vps-readiness-audit-plan.md`

**Interfaces:**
- Consumes: Spec `docs/superpowers/specs/2026-11-16-vps-readiness-audit-plan-design.md`, `docs/05-deployment-runbook.md`, and `docs/07-vps-production-and-security-reference.md`.
- Produces: Complete 4-stage gated audit document with explicit verification commands, checkboxes, pass/fail criteria, emergency rollback runbook, and sign-off scorecard.

- [ ] **Step 1: Draft Gate 1 (Pre-Flight Codebase & Artifact Hygiene)**
  Include checks for compilation (`npm run build`), TypeScript (`tsc --noEmit`), linting (`npm run lint`), Git secrets exclusion (`git status --ignored`), and Dockerfile multi-stage non-root inspection.

- [ ] **Step 2: Draft Gate 2 (VPS Host Hardening & Environment Isolation)**
  Include checks for Ubuntu package state, UFW firewall locks (22/80/443 only; 5432/3000 unreachable), directory permissions (`/opt/atulglass-erp`), `.env.production` file permissions (`chmod 600`), and entropy validation for `SESSION_SECRET` and `POSTGRES_PASSWORD`.

- [ ] **Step 3: Draft Gate 3 (Container Orchestration & Ingress Security)**
  Include checks for Docker Compose startup, PostgreSQL `pg_isready` healthcheck probe, Prisma migration deployment status, Nginx reverse proxy routing, Certbot SSL TLS 1.3 / HSTS validation, HTTP-to-HTTPS 301 redirection, session cookie attributes (`HttpOnly`, `Secure`, `SameSite=Lax`), and Server Action rate-limiting / RBAC enforcement.

- [ ] **Step 4: Draft Gate 4 (Resilience & Disaster Recovery Verification Drill)**
  Include checks for `scripts/backup.sh` manual execution, cron job scheduling (`02:00` daily), archive integrity check (`gzip -t`), and a complete non-destructive database restore verification drill using `scripts/restore.sh`, plus the emergency rollback protocol.

- [ ] **Step 5: Draft the Master Audit Scorecard & Sign-off Table**
  Provide a structured Markdown scorecard table with columns: Gate #, Audit Check, Verification Command, Expected Outcome, Result (PASS/FAIL), and Auditor Sign-off.

- [ ] **Step 6: Commit audit plan document**
  ```bash
  git add docs/08-vps-readiness-audit-plan.md
  git commit -m "docs: add complete 4-stage VPS production readiness audit plan"
  ```

---

### Task 3: Execute Gate 1 (Local Pre-Flight Audit) & Verify Readiness

**Files:**
- Modify: `docs/08-vps-readiness-audit-plan.md` (Update Gate 1 scorecard results to PASS)

**Interfaces:**
- Consumes: `docs/08-vps-readiness-audit-plan.md` Gate 1 checklist and codebase build tools.
- Produces: Verified local pre-flight audit report with 100% PASS for all local checks.

- [ ] **Step 1: Execute TypeScript compilation audit**
  Run: `npx tsc --noEmit`
  Expected: Clean exit code 0, 0 errors.

- [ ] **Step 2: Execute ESLint audit**
  Run: `npm run lint`
  Expected: Clean exit code 0, 0 errors.

- [ ] **Step 3: Execute production build audit**
  Run: `npm run build`
  Expected: Next.js production build exits 0.

- [ ] **Step 4: Execute Git secrets & binary database exclusion audit**
  Run: `git status --ignored`
  Expected: Confirm `.env`, `.env.production`, and `*.db` are ignored and untracked.

- [ ] **Step 5: Update Gate 1 Scorecard in `docs/08-vps-readiness-audit-plan.md` and commit**
  ```bash
  git add docs/08-vps-readiness-audit-plan.md
  git commit -m "docs(audit): mark Gate 1 local pre-flight checks as PASS"
  ```
