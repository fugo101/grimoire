# Grimoire

A lightweight, self-hosted expense tracker. Vietnamese UI, VNĐ currency, SQLite storage.

## Features

- Single-user admin with JWT session
- Transaction logging — amount, note, datetime, category
- Category management with public sharing via secure URLs
- Mobile-first responsive design
- Client-side validation with react-hook-form + Zod

## Tech Stack

Next.js 16 · React 19 · Tailwind CSS · shadcn/ui · SQLite · Drizzle ORM · jose · ESLint · Prettier

## Quick Start

### Docker Compose

```bash
cp .env.example .env   # edit credentials
docker compose up -d
```

### Local Development

```bash
npm install
cp .env.example .env.local   # edit credentials
npm run db:push
npm run dev
```

## Environment Variables

| Variable         | Description                 | Default     |
| ---------------- | --------------------------- | ----------- |
| `ADMIN_USERNAME` | Login username              | `admin`     |
| `ADMIN_PASSWORD` | Login password              | `changeme`  |
| `AUTH_SECRET`    | JWT signing key (32+ chars) | —           |
| `DATABASE_URL`   | SQLite database path        | `./data.db` |

## Scripts

| Command                | Description           |
| ---------------------- | --------------------- |
| `npm run dev`          | Dev server            |
| `npm run build`        | Production build      |
| `npm run start`        | Production server     |
| `npm run lint`         | ESLint                |
| `npm run lint:fix`     | ESLint with auto-fix  |
| `npm run format`       | Prettier format       |
| `npm run format:check` | Prettier check (CI)   |
| `npm run db:push`      | Push schema to SQLite |
| `npm run db:studio`    | Open Drizzle Studio   |

## Docker

Pre-built images are published to GHCR on each tagged release.

```bash
# Using pre-built image
docker run -d -p 3000:3000 \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=changeme \
  -e AUTH_SECRET=your-secret-key-at-least-32-chars \
  -v grimoire-data:/app/data \
  ghcr.io/fudio101/grimoire:latest

# Or build locally
docker build -t grimoire .
```

SQLite data is persisted at `/app/data/data.db` via volume mount.

## Releasing

This project uses GitHub Flow. Development happens on feature branches, merged to `main` via PRs.

```bash
# 1. Create a feature branch
git checkout -b feature/my-change

# 2. Open a PR to main (add labels: enhancement, bug, documentation)
# 3. Merge PR(s)

# 4. When ready to release, bump version
npm version patch   # 1.0.0 → 1.0.1
npm version minor   # 1.0.0 → 1.1.0
npm version major   # 1.0.0 → 2.0.0

# 5. Push commit + tag
git push --follow-tags
```

Pushing a `v*` tag triggers GitHub Actions to:

- Build and publish Docker image to `ghcr.io/fudio101/grimoire`
- Create a GitHub Release with auto-generated notes from merged PRs

## Project Structure

```
src/
├── app/
│   ├── actions/        # Server actions
│   ├── dashboard/      # Admin pages
│   ├── login/          # Auth
│   └── p/[shareToken]/ # Public shared view
├── features/
│   ├── transactions/   # Form, table, filters, add button
│   └── categories/     # Form, list, copy button
├── components/
│   ├── ui/             # shadcn/ui
│   ├── responsive-modal.tsx
│   ├── confirm-dialog.tsx
│   ├── submit-button.tsx
│   └── currency-input.tsx
├── hooks/              # Custom hooks
└── lib/
    ├── db/             # Schema & queries
    ├── schemas.ts      # Zod schemas
    ├── types.ts        # Shared types
    ├── auth.ts         # JWT utilities
    └── format.ts       # Currency & datetime
```
