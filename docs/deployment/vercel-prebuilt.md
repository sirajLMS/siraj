# Vercel Prebuilt Deploy (GitHub Actions builds)

Siraj **never builds on Vercel**. GitHub Actions on each fork runs `vercel build`, then uploads artifacts with `vercel deploy --prebuilt`. Vercel only hosts the result (and runs crons).

## Architecture

```
sirajLMS/siraj (prod push)
  → .github/workflows/deploy.yml   # sync tree to forks (PATs on source)
       ↓
  each fork's prod branch
  → .github/workflows/vercel-prebuilt.yml   # build + deploy (secrets on fork)
       ↓
  vercel pull → sanitize [SENSITIVE] → vercel build --prod → vercel deploy --prebuilt --prod
       ↓
  Vercel project (host only)
```

`vercel.json` is **gitignored**. Prebuild on GitHub Actions generates it with `"ignoreCommand": "exit 0"`, `git`, `fluid`, and crons. Do not commit it.

Because the file is not in git, **you must** set each Vercel project's Ignored Build Step to **"Don't build anything"** so Git pushes never trigger a Vercel build.

## Secrets on each fork (Environment: `production`)

Prefer **environment secrets**, not repo secrets.

On each of `ahmedhosnypro/siraj`, `mfdfdfo/siraj`, `ahmedhosnyspace3-stack/siraj`:

1. **Settings → Environments → New environment** → name: `production`
2. Deployment branches: **Selected branches** → `prod`
3. Add secrets on that environment:

| Secret | Where to get it |
|--------|-----------------|
| `VERCEL_TOKEN` | https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | Team Settings → General → Team ID (`vercel link` → `.vercel/project.json` → `orgId`) |
| `VERCEL_PROJECT_ID` | Project Settings → General → Project ID |

Do **not** put these on `sirajLMS/siraj` — that repo only syncs forks. The prebuilt workflow skips when `github.repository == sirajLMS/siraj`.

## Sensitive env vars (why the last build failed)

`vercel pull` **cannot** download values marked **Sensitive**. It writes the literal placeholder:

```text
NEXT_PUBLIC_BASE_URL=[SENSITIVE]
```

`vercel build` then loads that as a real string. The app tries `new URL("[SENSITIVE]")` and fails.

Your failed job logged exactly that:

```text
! 44 Secret values cannot be pulled from the `production` Environment.
  Wrote "[SENSITIVE]" as placeholders...
Error: Invalid NEXT_PUBLIC_BASE_URL format: [SENSITIVE]
```

### Fix in the Vercel dashboard (required)

Project → **Settings → Environment Variables** (Production):

1. **Unmark Sensitive** on every variable needed at **build** time.
2. Especially all `NEXT_PUBLIC_*` (including `NEXT_PUBLIC_BASE_URL`) — they ship in the client bundle anyway; Sensitive does not protect them.
3. Runtime-only secrets (`DATABASE_URL`, JWT keys, etc.) **may stay Sensitive**. The workflow strips those `[SENSITIVE]` placeholders so they do not poison dotenv; Vercel injects the real values at **runtime** after deploy.

After changing Sensitive flags, re-run **Vercel Prebuilt Deploy** on the fork.

### What the workflow does

1. `vercel pull` → writes `.vercel/.env.production.local`
2. Lists any `[SENSITIVE]` keys
3. **Fails immediately** if a required build-time key (e.g. `NEXT_PUBLIC_BASE_URL`) is still `[SENSITIVE]`
4. Strips remaining Sensitive placeholders (runtime-only)
5. `vercel build --prod` → `vercel deploy --prebuilt --prod`

## Vercel project settings (once per account)

1. Connect the **fork** as the Git repository (optional).
2. Production Branch: `prod`.
3. **Build & Deployment → Ignored Build Step → "Don't build anything"**.
4. Env vars present for Production; build-time ones **not** marked Sensitive.

## Enable Actions on each fork

Fork **Settings → Actions → General**: allow Actions.

## Verify

1. Merge to `prod` on `sirajLMS/siraj`.
2. Watch **Sync Forks & Deploy** on the source repo.
3. On each fork, watch **Vercel Prebuilt Deploy**.
4. Pull step should no longer leave `NEXT_PUBLIC_BASE_URL=[SENSITIVE]`.
5. Vercel deployment is prebuilt (no long TypeScript build on Vercel).

Manual re-run: Actions → **Vercel Prebuilt Deploy** → Run workflow (`prod`).

## Local equivalent

```bash
vercel pull --yes --environment=production
# If pull warned about Sensitive placeholders, fix flags in the dashboard first.
vercel build --prod
vercel deploy --prebuilt --prod --archive=tgz
```
