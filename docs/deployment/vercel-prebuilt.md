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
  vercel pull → vercel build --prod → vercel deploy --prebuilt --prod
       ↓
  Vercel project (host only)
```

`vercel.json` is **gitignored**. Prebuild on GitHub Actions generates it with `"ignoreCommand": "exit 0"`, `fluid`, and crons. Do not commit it.

Because the file is not in git, **you must** set each Vercel project's Ignored Build Step to **"Don't build anything"** so Git pushes never trigger a Vercel build.

## Secrets on each fork

Add these under **Settings → Secrets and variables → Actions** on each of:

- `ahmedhosnypro/siraj`
- `mfdfdfo/siraj`
- `ahmedhosnyspace3-stack/siraj`

| Secret | Where to get it |
|--------|-----------------|
| `VERCEL_TOKEN` | https://vercel.com/account/tokens (create with deploy scope) |
| `VERCEL_ORG_ID` | `vercel link` → `.vercel/project.json` → `orgId` |
| `VERCEL_PROJECT_ID` | same file → `projectId` |

Do **not** put these on `sirajLMS/siraj` — that repo only syncs forks. The prebuilt workflow skips when `github.repository == sirajLMS/siraj`.

## Vercel project settings (once per account)

1. Connect the **fork** as the Git repository (optional; useful for dashboard linkage).
2. Production Branch: `prod`.
3. **Build & Deployment → Ignored Build Step → "Don't build anything"** — required (vercel.json is gitignored, so ignoreCommand is not present on Git clones).
4. Confirm env vars for production are still set in the Vercel project (pulled by `vercel pull` during GHA).

## Enable Actions on each fork

Fork **Settings → Actions → General**: allow Actions (and allow the workflows from this repo).

## Verify

1. Merge to `prod` on `sirajLMS/siraj`.
2. Watch **Sync Forks & Deploy** on the source repo.
3. On each fork, watch **Vercel Prebuilt Deploy** — build logs appear in GitHub, not Vercel.
4. On Vercel, the deployment should show as prebuilt / no long TypeScript build step.

Manual re-run on a fork: Actions → **Vercel Prebuilt Deploy** → Run workflow (branch `prod`).

## Local equivalent

```bash
vercel pull --yes --environment=production
vercel build --prod
vercel deploy --prebuilt --prod --archive=tgz
```
