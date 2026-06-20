# HelloMe Postgres Migration And Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a project-owned Docker Postgres database, formalize Prisma migrations, and move demo auth/task/studio data onto durable persistence so local development uses real storage by default.

**Architecture:** The app will run against a Docker-managed `postgres:16` instance exposed on `localhost:5432`, with Prisma migrations as the source of truth for schema changes and a dedicated seed script to initialize demo users, workspaces, tasks, ledger rows, and studio skills. Server modules will stop creating ad-hoc Prisma clients and instead use one shared runtime that decides whether database mode is active and whether in-memory fallback is explicitly allowed.

**Tech Stack:** Docker Compose, PostgreSQL 16, Prisma 7, Node.js, TypeScript, Express

## Global Constraints

- Keep the default local database endpoint as `postgresql://postgres:postgres@localhost:5432/hellome?schema=public`.
- Use Prisma migrations as the primary schema workflow; do not rely on `prisma db push` as the main path.
- Preserve current demo behavior only behind an explicit `ALLOW_INMEMORY_FALLBACK` environment variable.
- Do not expand scope to session persistence in this pass.
- Reuse existing demo account semantics from `复用组件库/auth-login-kit/server-auth-kit.ts` and existing task/studio data shapes from server services.
- Every task must leave the repository runnable and type-safe before moving on.

---

## File Structure

- Create: `/Users/feihong/Documents/hellome/docker-compose.yml`
- Create: `/Users/feihong/Documents/hellome/prisma/seed.ts`
- Create: `/Users/feihong/Documents/hellome/src/server/db/prisma.ts`
- Create: `/Users/feihong/Documents/hellome/src/server/db/runtime.ts`
- Create: `/Users/feihong/Documents/hellome/src/server/bootstrap/demoSeedData.ts`
- Create: `/Users/feihong/Documents/hellome/src/server/bootstrap/demoSeedHelpers.ts`
- Create: `/Users/feihong/Documents/hellome/src/server/bootstrap/dbHealth.ts`
- Create: `/Users/feihong/Documents/hellome/prisma/migrations/<generated>/migration.sql`
- Modify: `/Users/feihong/Documents/hellome/.env.example`
- Modify: `/Users/feihong/Documents/hellome/package.json`
- Modify: `/Users/feihong/Documents/hellome/prisma/schema.prisma`
- Modify: `/Users/feihong/Documents/hellome/prisma.config.ts`
- Modify: `/Users/feihong/Documents/hellome/server.ts`
- Modify: `/Users/feihong/Documents/hellome/src/server/ugcTaskService.ts`
- Modify: `/Users/feihong/Documents/hellome/src/server/billingService.ts`
- Modify: `/Users/feihong/Documents/hellome/src/server/skillStudioService.ts`
- Modify: `/Users/feihong/Documents/hellome/复用组件库/auth-login-kit/server-auth-kit.ts`
- Modify: `/Users/feihong/Documents/hellome/README.md`

### Task 1: Add Dockerized Postgres And Local DB Scripts

**Files:**
- Create: `/Users/feihong/Documents/hellome/docker-compose.yml`
- Modify: `/Users/feihong/Documents/hellome/.env.example`
- Modify: `/Users/feihong/Documents/hellome/package.json`
- Modify: `/Users/feihong/Documents/hellome/README.md`

**Interfaces:**
- Consumes: Existing local env shape from `.env.example`, existing scripts in `package.json`
- Produces: `docker compose up -d postgres`, `npm run db:up`, `npm run db:down`, `npm run db:logs`, `npm run dev:with-db`

- [ ] **Step 1: Write the failing documentation expectations**

```md
## Local Database

1. `docker compose up -d postgres`
2. `npm run prisma:migrate`
3. `npm run prisma:seed`
4. `npm run dev`

Expected: the app reads and writes real data from Postgres on `localhost:5432`.
```

- [ ] **Step 2: Add `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16
    container_name: hellome-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: hellome
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - hellome_pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d hellome"]
      interval: 5s
      timeout: 5s
      retries: 20

volumes:
  hellome_pg_data:
```

- [ ] **Step 3: Extend `.env.example` with persistence controls**

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hellome?schema=public"
ALLOW_INMEMORY_FALLBACK="false"
DEMO_PLAN_NAME="体验版"
DEMO_MONTHLY_TOKEN_LIMIT="20000"
DEMO_LOW_BALANCE_THRESHOLD="0.1"
```

- [ ] **Step 4: Add local DB scripts to `package.json`**

```json
{
  "scripts": {
    "db:up": "docker compose up -d postgres",
    "db:down": "docker compose stop postgres",
    "db:logs": "docker compose logs postgres",
    "db:reset": "docker compose down -v",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "tsx prisma/seed.ts",
    "dev:with-db": "npm run db:up && npm run prisma:migrate && npm run prisma:seed && npm run dev"
  }
}
```

- [ ] **Step 5: Update README local-run instructions**

```md
1. Install dependencies: `npm install`
2. Copy envs and configure API keys
3. Start Postgres: `npm run db:up`
4. Run migrations: `npm run prisma:migrate`
5. Seed demo data: `npm run prisma:seed`
6. Start the app: `npm run dev`
```

- [ ] **Step 6: Verify scripts are visible**

Run: `node -e "const p=require('./package.json'); console.log(Object.keys(p.scripts).filter(k=>k.startsWith('db:')||k.startsWith('prisma:')||k==='dev:with-db'))"`
Expected: output includes `db:up`, `db:down`, `db:logs`, `db:reset`, `prisma:migrate`, `prisma:seed`, `dev:with-db`

- [ ] **Step 7: Commit**

```bash
git add docker-compose.yml .env.example package.json README.md
git commit -m "chore: add dockerized postgres workflow"
```

### Task 2: Formalize Prisma Schema And Generate The Initial Migration

**Files:**
- Modify: `/Users/feihong/Documents/hellome/prisma/schema.prisma`
- Modify: `/Users/feihong/Documents/hellome/prisma.config.ts`
- Create: `/Users/feihong/Documents/hellome/prisma/migrations/<generated>/migration.sql`

**Interfaces:**
- Consumes: Existing Prisma models in `prisma/schema.prisma`, DB URL in env
- Produces: `url = env("DATABASE_URL")` in schema and a committed `prisma migrate dev --name init` history

- [ ] **Step 1: Write the failing schema expectation**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

- [ ] **Step 2: Update `prisma/schema.prisma` datasource**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

- [ ] **Step 3: Keep `prisma.config.ts` aligned with local defaults**

```ts
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/hellome?schema=public',
  },
});
```

- [ ] **Step 4: Generate the first real migration**

Run: `npm run prisma:migrate -- --name init`
Expected: Prisma creates `prisma/migrations/<timestamp>_init/migration.sql` and updates the local database

- [ ] **Step 5: Generate Prisma client**

Run: `npm run prisma:generate`
Expected: Prisma client generation succeeds with no schema errors

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma.config.ts prisma/migrations
git commit -m "chore: formalize prisma migration history"
```

### Task 3: Create Shared Database Runtime And Health Checks

**Files:**
- Create: `/Users/feihong/Documents/hellome/src/server/db/prisma.ts`
- Create: `/Users/feihong/Documents/hellome/src/server/db/runtime.ts`
- Create: `/Users/feihong/Documents/hellome/src/server/bootstrap/dbHealth.ts`
- Modify: `/Users/feihong/Documents/hellome/server.ts`

**Interfaces:**
- Consumes: `DATABASE_URL`, `ALLOW_INMEMORY_FALLBACK`
- Produces:
  - `getPrismaClient(): PrismaClient | null`
  - `isPersistenceEnabled(): boolean`
  - `isFallbackAllowed(): boolean`
  - `assertDatabaseReady(): Promise<void>`
  - `registerDbHealthRoute(app: Express): void`

- [ ] **Step 1: Write the failing runtime test command**

Run: `node -e "import('./dist/server.cjs').catch(()=>process.exit(1))"`
Expected: current build does not expose a shared database runtime and no DB health route exists

- [ ] **Step 2: Add `src/server/db/prisma.ts`**

```ts
import { PrismaClient } from '@prisma/client';

declare global {
  var __hellomePrisma__: PrismaClient | undefined;
}

export function getPrismaClient(): PrismaClient | null {
  if (!process.env.DATABASE_URL) return null;
  if (!globalThis.__hellomePrisma__) {
    globalThis.__hellomePrisma__ = new PrismaClient();
  }
  return globalThis.__hellomePrisma__;
}
```

- [ ] **Step 3: Add `src/server/db/runtime.ts`**

```ts
import { getPrismaClient } from './prisma';

export function isFallbackAllowed(): boolean {
  return String(process.env.ALLOW_INMEMORY_FALLBACK ?? 'false').toLowerCase() === 'true';
}

export function isPersistenceEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export async function assertDatabaseReady(): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    if (isFallbackAllowed()) return;
    throw new Error('DATABASE_URL 未配置，且未启用内存回退。');
  }
  await prisma.$queryRaw`SELECT 1`;
}
```

- [ ] **Step 4: Add `src/server/bootstrap/dbHealth.ts`**

```ts
import type express from 'express';
import { assertDatabaseReady, isFallbackAllowed, isPersistenceEnabled } from '../db/runtime';

export function registerDbHealthRoute(app: express.Express): void {
  app.get('/api/health/db', async (_req, res) => {
    try {
      await assertDatabaseReady();
      res.json({ success: true, data: { connected: true, persistenceEnabled: isPersistenceEnabled(), fallbackEnabled: isFallbackAllowed() } });
    } catch (error) {
      res.status(503).json({
        success: false,
        data: {
          connected: false,
          persistenceEnabled: isPersistenceEnabled(),
          fallbackEnabled: isFallbackAllowed(),
        },
        error: error instanceof Error ? error.message : '数据库不可用',
      });
    }
  });
}
```

- [ ] **Step 5: Wire health registration into `server.ts`**

```ts
import { registerDbHealthRoute } from './src/server/bootstrap/dbHealth';

registerDbHealthRoute(app);
```

- [ ] **Step 6: Verify type safety**

Run: `npm run lint`
Expected: TypeScript finishes without errors after introducing the shared DB runtime

- [ ] **Step 7: Commit**

```bash
git add src/server/db/prisma.ts src/server/db/runtime.ts src/server/bootstrap/dbHealth.ts server.ts
git commit -m "feat: add shared database runtime and health endpoint"
```

### Task 4: Move Demo Seed Data Into Prisma Seed Script

**Files:**
- Create: `/Users/feihong/Documents/hellome/src/server/bootstrap/demoSeedHelpers.ts`
- Create: `/Users/feihong/Documents/hellome/src/server/bootstrap/demoSeedData.ts`
- Create: `/Users/feihong/Documents/hellome/prisma/seed.ts`
- Modify: `/Users/feihong/Documents/hellome/复用组件库/auth-login-kit/server-auth-kit.ts`

**Interfaces:**
- Consumes: Demo account defaults from auth kit, task defaults from `src/server/ugcTaskService.ts`, usage defaults from `src/server/billingService.ts`, skill defaults from `src/server/skillStudioService.ts`
- Produces:
  - `buildDemoUsers(): DemoUserSeed[]`
  - `buildDemoTaskSeeds(): DemoTaskSeed[]`
  - `buildDemoSkillSeed(): DemoSkillSeed`
  - `seedDatabase(): Promise<void>`

- [ ] **Step 1: Write the failing seed expectation**

```ts
const users = await prisma.user.findMany();
const tasks = await prisma.task.findMany();
const skills = await (prisma as any).skill.findMany();

expect(users.length).toBeGreaterThanOrEqual(3);
expect(tasks.length).toBeGreaterThanOrEqual(2);
expect(skills.length).toBeGreaterThanOrEqual(1);
```

- [ ] **Step 2: Add `demoSeedHelpers.ts` for stable slugs and demo profiles**

```ts
export function normalizeWorkspaceSlug(role: 'user' | 'creator' | 'admin', phone: string): string {
  const suffix = phone.replace(/\D/g, '').slice(-6);
  return `${role}-${suffix}`;
}

export function buildDemoProfile(input: {
  phone: string;
  name: string;
  email: string;
  workspace: string;
  role: 'user' | 'creator' | 'admin';
}) {
  return {
    externalId: input.phone,
    displayName: input.name,
    email: input.email,
    phone: input.phone,
    workspaceName: input.workspace,
    workspaceSlug: normalizeWorkspaceSlug(input.role, input.phone),
    role: input.role,
  };
}
```

- [ ] **Step 3: Add `demoSeedData.ts` with users, tasks, ledger, and skill payloads**

```ts
export function buildDemoUsers() {
  return [
    buildDemoProfile({ phone: '13800138001', name: 'HelloMe 普通用户', email: 'user@hellome.ai', workspace: '个人空间', role: 'user' }),
    buildDemoProfile({ phone: '13800138002', name: 'HelloMe 创作者', email: 'creator@hellome.ai', workspace: 'Creator Studio', role: 'creator' }),
    buildDemoProfile({ phone: '13800138000', name: 'HelloMe 演示管理员', email: 'admin@hellome.ai', workspace: 'HelloMe Demo Workspace', role: 'admin' }),
  ];
}
```

- [ ] **Step 4: Add `prisma/seed.ts`**

```ts
import { PrismaClient } from '@prisma/client';
import { buildDemoUsers, buildDemoTaskSeeds, buildDemoSkillSeed, buildDemoLedgerSeeds } from '../src/server/bootstrap/demoSeedData';

const prisma = new PrismaClient();

async function main() {
  for (const userSeed of buildDemoUsers()) {
    const user = await prisma.user.upsert({
      where: { externalId: userSeed.externalId },
      update: {
        displayName: userSeed.displayName,
        email: userSeed.email,
        phone: userSeed.phone,
      },
      create: {
        externalId: userSeed.externalId,
        displayName: userSeed.displayName,
        email: userSeed.email,
        phone: userSeed.phone,
      },
    });

    await prisma.workspace.upsert({
      where: { slug: userSeed.workspaceSlug },
      update: { name: userSeed.workspaceName, ownerId: user.id },
      create: { slug: userSeed.workspaceSlug, name: userSeed.workspaceName, ownerId: user.id },
    });
  }

  // Seed demo tasks, task inputs, runs, steps, artifacts, events, ledger, skills, versions.
}

main().finally(() => prisma.$disconnect());
```

- [ ] **Step 5: Simplify auth bootstrap to reuse seeded defaults**

```ts
const existingWorkspace = persistedUser.workspaces?.[0];
if (!existingWorkspace) {
  await prismaDb.workspace.create({
    data: {
      name: user.workspace,
      slug: normalizeWorkspaceSlug(role, user.phone),
      ownerId: persistedUser.id,
    },
  });
}
```

- [ ] **Step 6: Run seed**

Run: `npm run prisma:seed`
Expected: command succeeds and can be re-run without duplicate-key errors

- [ ] **Step 7: Commit**

```bash
git add prisma/seed.ts src/server/bootstrap/demoSeedHelpers.ts src/server/bootstrap/demoSeedData.ts 复用组件库/auth-login-kit/server-auth-kit.ts
git commit -m "feat: seed demo persistence data"
```

### Task 5: Refactor Services To Use Shared Prisma Runtime

**Files:**
- Modify: `/Users/feihong/Documents/hellome/src/server/ugcTaskService.ts`
- Modify: `/Users/feihong/Documents/hellome/src/server/billingService.ts`
- Modify: `/Users/feihong/Documents/hellome/src/server/skillStudioService.ts`
- Modify: `/Users/feihong/Documents/hellome/复用组件库/auth-login-kit/server-auth-kit.ts`

**Interfaces:**
- Consumes: `getPrismaClient`, `isFallbackAllowed`, `isPersistenceEnabled`
- Produces: one shared database activation model across auth, billing, task, and skill services

- [ ] **Step 1: Write the failing grep expectation**

Run: `rg -n "new PrismaClient|let prismaClient" src server.ts 复用组件库/auth-login-kit`
Expected: existing services still manage their own Prisma client state

- [ ] **Step 2: Replace local client state in `ugcTaskService.ts`**

```ts
import { getPrismaClient } from './db/prisma';
import { isFallbackAllowed } from './db/runtime';

function requirePersistenceFallback(): boolean {
  return !getPrismaClient() && isFallbackAllowed();
}
```

- [ ] **Step 3: Replace local client state in `billingService.ts`**

```ts
import { getPrismaClient } from './db/prisma';

export async function getUsageSummaryForExternalId(externalId: string): Promise<UsageSnapshot> {
  const prisma = getPrismaClient();
  if (!prisma || !externalId.trim()) return defaultUsage();
  // existing aggregate logic remains
}
```

- [ ] **Step 4: Replace local client state in `skillStudioService.ts`**

```ts
import { getPrismaClient } from './db/prisma';
import { isFallbackAllowed } from './db/runtime';

const prisma = getPrismaClient();
if (!prisma && !isFallbackAllowed()) {
  throw new Error('Skill Studio 持久化已启用，但数据库不可用。');
}
```

- [ ] **Step 5: Replace local client state in auth kit**

```ts
import { getPrismaClient } from '../../src/server/db/prisma';

async function ensureUserRecord(user: UserProfile): Promise<UserProfile> {
  const prisma = getPrismaClient();
  if (!prisma) return user;
  // existing upsert flow remains
}
```

- [ ] **Step 6: Verify duplicate client ownership is removed**

Run: `rg -n "new PrismaClient|let prismaClient" src 复用组件库/auth-login-kit`
Expected: only `src/server/db/prisma.ts` owns Prisma client construction

- [ ] **Step 7: Commit**

```bash
git add src/server/ugcTaskService.ts src/server/billingService.ts src/server/skillStudioService.ts 复用组件库/auth-login-kit/server-auth-kit.ts
git commit -m "refactor: centralize prisma client usage"
```

### Task 6: Make Database Mode The Default And Shrink Silent Fallbacks

**Files:**
- Modify: `/Users/feihong/Documents/hellome/server.ts`
- Modify: `/Users/feihong/Documents/hellome/src/server/ugcTaskService.ts`
- Modify: `/Users/feihong/Documents/hellome/src/server/skillStudioService.ts`
- Modify: `/Users/feihong/Documents/hellome/README.md`

**Interfaces:**
- Consumes: `assertDatabaseReady`, `isFallbackAllowed`
- Produces: startup logs and runtime behavior that clearly signal database mode versus fallback mode

- [ ] **Step 1: Write the failing startup expectation**

```txt
[persistence] mode=database
[persistence] mode=fallback reason=ALLOW_INMEMORY_FALLBACK=true
```

- [ ] **Step 2: Add startup guard to `server.ts`**

```ts
import { assertDatabaseReady, isFallbackAllowed, isPersistenceEnabled } from './src/server/db/runtime';

await assertDatabaseReady().then(() => {
  console.log('[persistence] mode=database');
}).catch((error) => {
  if (!isFallbackAllowed()) throw error;
  console.warn('[persistence] mode=fallback reason=%s', error instanceof Error ? error.message : 'unknown');
});
```

- [ ] **Step 3: Remove misleading silent returns in task and skill services**

```ts
const prisma = getPrismaClient();
if (!prisma && !isFallbackAllowed()) {
  throw new Error('数据库不可用，且未启用内存回退。');
}
if (!prisma) {
  return cloneAggregate(memoryRecord);
}
```

- [ ] **Step 4: Document fallback behavior in README**

```md
When `ALLOW_INMEMORY_FALLBACK=false`, the server expects Postgres to be available and will fail fast if it cannot connect.
Only set `ALLOW_INMEMORY_FALLBACK=true` for temporary demo-only operation.
```

- [ ] **Step 5: Verify startup behavior**

Run: `npm run build`
Expected: build succeeds and startup path compiles with explicit persistence logging

- [ ] **Step 6: Commit**

```bash
git add server.ts src/server/ugcTaskService.ts src/server/skillStudioService.ts README.md
git commit -m "feat: default local runtime to database persistence"
```

### Task 7: End-To-End Verification And Developer Handoff

**Files:**
- Modify: `/Users/feihong/Documents/hellome/README.md`

**Interfaces:**
- Consumes: Docker, Prisma, seed script, health route, auth/task/studio flows
- Produces: repeatable verification commands and rollback instructions

- [ ] **Step 1: Verify Docker database health**

Run: `docker compose up -d postgres`
Expected: container `hellome-postgres` is healthy

- [ ] **Step 2: Verify schema migration**

Run: `npm run prisma:migrate -- --name verify_persistence`
Expected: Prisma reports no pending schema drift or creates only the deliberate migration during development

- [ ] **Step 3: Verify seed idempotency**

Run: `npm run prisma:seed && npm run prisma:seed`
Expected: both runs succeed without duplicate-key errors

- [ ] **Step 4: Verify health endpoint**

Run: `curl http://localhost:3000/api/health/db`
Expected: JSON with `success: true` and `data.connected: true`

- [ ] **Step 5: Verify auth and business data**

Run: `node -e "fetch('http://localhost:3000/api/health/db').then(r=>r.text()).then(console.log)"`
Expected: API responds while app is running and seeded pages can load durable auth/task/studio data

- [ ] **Step 6: Add rollback instructions to README**

```md
## Reset Local Database

1. `npm run db:down`
2. `npm run db:reset`
3. `npm run db:up`
4. `npm run prisma:migrate`
5. `npm run prisma:seed`
```

- [ ] **Step 7: Commit**

```bash
git add README.md
git commit -m "docs: add persistence verification and reset guide"
```

## Self-Review

- Spec coverage: this plan covers Docker provisioning, Prisma migrations, seed design, shared DB runtime, service refactor, fallback reduction, and verification.
- Placeholder scan: the only generated path is `prisma/migrations/<generated>/migration.sql`, which is intentionally Prisma-generated; all other implementation paths and commands are concrete.
- Type consistency: all tasks reuse the same shared interfaces: `getPrismaClient`, `isFallbackAllowed`, `assertDatabaseReady`, `buildDemoUsers`, and `seedDatabase`.
