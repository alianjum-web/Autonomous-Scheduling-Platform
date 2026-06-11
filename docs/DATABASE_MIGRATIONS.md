# Database migrations

Schema lives in `backend/supabase/migrations/`. The FastAPI backend owns the database; the frontend uses generated types in `frontend/src/types/database.ts`.

## Prerequisites

- Supabase project ([dashboard](https://supabase.com/dashboard))
- **Project ref** — from the URL: `supabase.com/dashboard/project/<ref>`
- **Database password** — Supabase → **Database** → **Settings** → **Reset database password**  
  (This is **not** the anon key, service role key, or JWT secret.)
- Supabase CLI: `npm install --prefix backend` (CLI is a backend devDependency)

Log in once:

```bash
cd backend && npx supabase login
```

## Apply migrations (CLI — recommended)

From the **repository root**:

```bash
# 1. Validate migration filenames
npm run db:validate

# 2. Link project (once per machine, or after password reset)
export SUPABASE_DB_PASSWORD='<database-password-from-dashboard>'
npm run db:link -- --project-ref <your-project-ref>

# 3. Apply pending migrations
npm run db:push

# 4. Refresh frontend TypeScript types
npm run gen:types
```

### Why link needs the password

`db:push` connects to Postgres as user `postgres.<project-ref>`. If you run `db:link` **without** the database password, push fails with:

`password authentication failed for user "postgres" (SQLSTATE 28P01)`

`scripts/db/link.sh` passes `--password` when `SUPABASE_DB_PASSWORD` is set in your shell.

### Commands reference

| Command | Description |
|---------|-------------|
| `npm run db:validate` | Check migration file names and layout |
| `npm run db:link -- --project-ref <ref>` | Link CLI to remote project (store password at link time) |
| `npm run db:push` | Apply **pending** migrations only |
| `npm run db:migration:list` | Compare local vs remote migration history |
| `npm run db:migration:new -- feature_name` | Create a new timestamped migration file |
| `npm run gen:types` | Regenerate `frontend/src/types/database.ts` |

Scripts live in `scripts/db/` (`link.sh`, `push.sh`, `validate-migrations.sh`).

## Apply migrations (SQL Editor — no CLI password)

If the CLI cannot connect:

1. Supabase → **Database** → **Migrations** — see what is already applied
2. **SQL Editor** — open each missing file from `backend/supabase/migrations/` **in filename order** and run it

## After schema changes

1. `npm run db:push`
2. `npm run gen:types`
3. Configure **Custom Access Token Hook**: Supabase → Authentication → Hooks → `public.custom_access_token_hook`

## CI (GitHub Actions)

On push to `main`, job `apply-migrations` runs `scripts/db/push.sh`.

Set these in **GitHub → Settings → Environments → production → Secrets**:

| Secret | Purpose |
|--------|---------|
| `SUPABASE_ACCESS_TOKEN` | [Account access token](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_PROJECT_REF` | Project ref from dashboard URL |
| `SUPABASE_DB_PASSWORD` | Database password (Database → Settings) |

## Where secrets live

| Secret | Local dev app | Migrations CLI | Production |
|--------|---------------|----------------|------------|
| Supabase URL, API keys | `backend/.env.development`, `frontend/.env.development` | — | Render / Vercel env vars |
| Database password | Password manager (optional); **not** required in `.env` for `npm run dev` | `export SUPABASE_DB_PASSWORD=...` when running `db:link` / `db:push` | GitHub secret for CI |

Do **not** commit `.env.development`, `.env.production`, or real passwords to git. Use `.env.example` as the committed template only.
