# Grimoire — Expense Tracker

A lightweight, self-hosted expense tracker built with Next.js 16, React 19, SQLite, and Drizzle ORM. Vietnamese UI with VNĐ currency formatting.

## Features

- **Single-user admin** — hardcoded credentials via environment variables, JWT session
- **Transaction logging** — amount (VNĐ with thousand separators), note, datetime, category
- **Category management** — create, edit, delete with confirmation, toggle public visibility
- **Public sharing** — generate secure read-only URLs for individual categories
- **Mobile-first** — responsive design with bottom drawer on mobile, dialog on desktop
- **Form handling** — react-hook-form with Zod client-side validation, Enter to submit

## Tech Stack

- Next.js 16 (App Router) + React 19
- Tailwind CSS + shadcn/ui (Base UI)
- SQLite + Drizzle ORM
- JWT auth via jose
- react-hook-form + Zod validation
- ESLint + Prettier

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

| Command              | Description                   |
| -------------------- | ----------------------------- |
| `npm run dev`        | Start dev server              |
| `npm run build`      | Production build              |
| `npm run start`      | Start production server       |
| `npm run lint`       | Run ESLint                    |
| `npm run lint:fix`   | Run ESLint with auto-fix      |
| `npm run format`     | Format code with Prettier     |
| `npm run format:check` | Check formatting (for CI)   |
| `npm run db:push`    | Push schema changes to SQLite |
| `npm run db:studio`  | Open Drizzle Studio           |

## Project Structure

```
src/
├── app/
│   ├── actions/          # Server actions (auth, categories, transactions)
│   ├── dashboard/        # Admin pages (transactions, categories)
│   ├── login/            # Login page
│   └── p/[shareToken]/   # Public shared category view
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── transaction-form.tsx
│   ├── transaction-table.tsx
│   ├── transaction-filters.tsx
│   ├── category-form.tsx
│   ├── category-list.tsx
│   ├── currency-input.tsx
│   ├── confirm-dialog.tsx
│   └── ...
├── hooks/                # Custom React hooks
└── lib/
    ├── db/               # Database schema & queries
    ├── schemas.ts         # Shared Zod schemas
    ├── auth.ts           # JWT token utilities
    └── format.ts         # Currency & datetime formatting
```
