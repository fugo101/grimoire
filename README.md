# Grimoire — Expense Tracker

A lightweight, self-hosted expense tracker built with Next.js 15, React 19, SQLite, and Drizzle ORM.

## Features

- **Single-user admin** — hardcoded credentials via environment variables
- **Transaction logging** — amount, note, date, category
- **Category management** — create, edit, delete, toggle public visibility
- **Public sharing** — generate secure read-only URLs for individual categories
- **Mobile-first** — responsive design with bottom drawer on mobile, dialog on desktop

## Tech Stack

- Next.js 15 (App Router) + React 19
- Tailwind CSS + shadcn/ui
- SQLite + Drizzle ORM
- JWT auth via jose
- Zod validation

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Environment Variables

| Variable         | Description                 | Default     |
| ---------------- | --------------------------- | ----------- |
| `ADMIN_USERNAME` | Login username              | `admin`     |
| `ADMIN_PASSWORD` | Login password              | `changeme`  |
| `AUTH_SECRET`    | JWT signing key (32+ chars) | —           |
| `DATABASE_URL`   | SQLite database path        | `./data.db` |

### Scripts

| Command             | Description                   |
| ------------------- | ----------------------------- |
| `npm run dev`       | Start dev server              |
| `npm run build`     | Production build              |
| `npm run start`     | Start production server       |
| `npm run db:push`   | Push schema changes to SQLite |
| `npm run db:studio` | Open Drizzle Studio           |
