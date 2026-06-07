# AETDRIXZ AI

A production-ready personal AI workspace combining ChatGPT-style chat, long-term memory, AI project generation, Monaco code editing, and live preview.

## Features

- **Chat Mode** — Streaming conversations with markdown, syntax highlighting, edit/regenerate, pin/archive
- **Workspace Mode** — Chat + file tree + Monaco editor + sandboxed live preview
- **Projects Mode** — Create, duplicate, import/export ZIP projects
- **Memory Mode** — Persistent memories with semantic retrieval injected into AI context
- **Gemma Integration** — Google AI Studio with automatic API key rotation (3 keys)
- **Global Search** — Search conversations, messages, memories, projects, and files (⌘K)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Zustand |
| Backend | Next.js Route Handlers |
| Database | Supabase PostgreSQL |
| ORM | Prisma |
| Editor | Monaco Editor |
| AI Model | Gemma (Google AI Studio) |
| Deployment | Vercel |

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  Chat │ Workspace │ Projects │ Memory │ Settings │ Search   │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API
┌──────────────────────────▼──────────────────────────────────┐
│                    Route Handlers (/api/*)                   │
│  chat │ conversations │ memory │ projects │ search │ export │
└───────┬──────────────────────────────┬──────────────────────┘
        │                              │
┌───────▼────────┐            ┌────────▼────────┐
│  Prisma ORM    │            │  Gemma Client   │
│  (Supabase PG) │            │  + Key Rotation │
└────────────────┘            └─────────────────┘
```

## Folder Structure

```
src/
├── app/
│   ├── api/           # REST endpoints
│   ├── chat/          # Chat mode
│   ├── workspace/     # Workspace mode
│   ├── projects/      # Projects mode
│   ├── memory/        # Memory mode
│   └── settings/      # Settings page
├── components/
│   ├── ui/            # shadcn-style components
│   ├── chat/          # Chat interface
│   ├── workspace/     # Editor, preview, file tree
│   ├── layout/        # Sidebar, app shell
│   └── shared/        # Markdown, global search
├── lib/
│   ├── gemma/         # AI client + key rotation
│   ├── memory/        # Semantic retrieval
│   ├── ai/            # Prompts + project parser
│   └── validations/   # Zod schemas
├── stores/            # Zustand state
└── types/             # TypeScript types
prisma/
└── schema.prisma      # Database schema
```

## Quick Start

### 1. Clone and install

```bash
cd Projects/aetdrixz-ai
npm install
cp .env.example .env
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database** and copy the connection strings
3. Set `DATABASE_URL` (pooler, port 6543) and `DIRECT_URL` (port 5432) in `.env`

### 3. Set up Gemma API keys

1. Get API keys from [Google AI Studio](https://aistudio.google.com/apikey)
2. Set `GEMMA_API_KEY_1`, `_2`, `_3` in `.env`
3. Set `GEMMA_MODEL` to your model ID (e.g. `gemma-3-27b-it`)

### 4. Run migrations

```bash
npm run db:push
# or for production migrations:
npm run db:migrate
```

### 5. Start development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Vercel Deployment

### Environment Variables

Set these in Vercel Project Settings → Environment Variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase pooler connection string |
| `DIRECT_URL` | Supabase direct connection string |
| `GEMMA_API_KEY_1` | Primary Gemma API key |
| `GEMMA_API_KEY_2` | Failover key #2 |
| `GEMMA_API_KEY_3` | Failover key #3 |
| `GEMMA_MODEL` | Model ID (e.g. `gemma-3-27b-it`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (optional) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (optional) |

### Deploy

```bash
npm i -g vercel
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

### Build Configuration

The `build` script runs `prisma generate && next build`. Vercel will use this automatically.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Streaming AI chat (SSE) |
| GET/POST | `/api/conversations` | List/create conversations |
| GET/PATCH/DELETE | `/api/conversations/[id]` | Manage conversation |
| PATCH/DELETE | `/api/messages/[id]` | Edit/delete message |
| GET/POST | `/api/memory` | List/create memories |
| PATCH/DELETE | `/api/memory/[id]` | Edit/delete memory |
| GET/POST | `/api/projects` | List/create projects |
| GET/PATCH/DELETE/POST | `/api/projects/[id]` | Manage/duplicate project |
| GET/POST/PUT | `/api/projects/[id]/files` | File CRUD |
| GET | `/api/projects/[id]/export` | Export ZIP |
| POST | `/api/projects/import` | Import project JSON |
| GET | `/api/search` | Global search |
| GET/PATCH | `/api/settings` | App settings |
| GET | `/api/export/conversations/[id]` | Export chat (MD/JSON) |
| GET | `/api/export/memories` | Export memories JSON |

## Memory Retrieval Flow

1. User sends a message
2. System extracts keywords from the prompt
3. Memories are scored by keyword overlap, importance, and pin status
4. Top N relevant memories are injected into the system prompt
5. Request is sent to Gemma with enriched context

## API Key Rotation

```
Key 1 → (429/quota) → Key 2 → (429/quota) → Key 3
         ↓ cooldown         ↓ cooldown
    Skip until ready    Skip until ready
```

Handles: HTTP 429, 503, quota exceeded, rate limit, resource exhausted.

## Multi-User Ready

All database models include a `userId` field (default: `"default"`). When adding auth later, filter queries by authenticated user ID.

## License

Private — personal use.
