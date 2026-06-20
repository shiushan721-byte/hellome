<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/b5a423b4-1d93-4b52-b550-668cd80b35ff

## Run Locally

**Prerequisites:** Node.js, Docker

1. Install dependencies: `npm install`
2. Copy envs and configure API keys: `cp .env.example .env`
3. Start Postgres: `npm run db:up`
4. Run migrations: `npm run prisma:migrate`
5. Seed demo data: `npm run prisma:seed`
6. Start the app: `npm run dev`

Or run everything in one step: `npm run dev:with-db`

## Local Database

1. `docker compose up -d postgres`
2. `npm run prisma:migrate`
3. `npm run prisma:seed`
4. `npm run dev`

Expected: the app reads and writes real data from Postgres on `localhost:5432`.

## Persistence Fallback

When `ALLOW_INMEMORY_FALLBACK=false`, the server expects Postgres to be available and will fail fast if it cannot connect.
Only set `ALLOW_INMEMORY_FALLBACK=true` for temporary demo-only operation.

## Reset Local Database

1. `npm run db:down`
2. `npm run db:reset`
3. `npm run db:up`
4. `npm run prisma:migrate`
5. `npm run prisma:seed`

## Cursor Agent Skills

This repo vendors [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) for shared engineering workflows in Cursor.

After cloning, initialize skills once:

```bash
git submodule update --init --recursive .cursor/agent-skills
./scripts/setup-cursor-skills.sh
```

Skills live under `.cursor/skills/` (symlinks into the submodule). Project-specific skills such as `grsai-gpt-image-2` stay as normal directories.

To update the upstream skill pack:

```bash
cd .cursor/agent-skills && git pull origin main && cd ../..
./scripts/setup-cursor-skills.sh
```
