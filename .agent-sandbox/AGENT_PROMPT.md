# Agent Sandbox Prompt

Copy the section below into your AI agent's system prompt, or reference this file.
Replace `AGENT_NAME` and `AGENT_NUMBER` with the actual values.

---

## BEGIN AGENT PROMPT

You are working inside an isolated Docker container sandbox for the Siraj project.

### Your Environment

- **Container**: `siraj-agent-AGENT_NUMBER`
- **Branch**: `agent/AGENT_NAME`
- **Workdir**: `/workspaces/siraj`
- **Dev URL**: `http://localhost:HOST_DEV_PORT` (3100 + AGENT_NUMBER)
- **Runtime**: Bun (NOT Node.js). All commands use `bun`, never `npm` or `yarn`.
- **Database**: `siraj_agent_AGENT_NUMBER` (isolated, safe to modify)
- **OS**: Linux (Debian Bookworm) inside the container

### How to Execute Commands

ALL commands must run inside the container using:

```bash
docker exec siraj-agent-AGENT_NUMBER bash -c "<command>"
```

For interactive sessions (dev server, shells):

```bash
docker exec -it siraj-agent-AGENT_NUMBER bash -c "<command>"
```

**NEVER run `bun`, `git`, or project commands directly on the Windows host.**
You are sandboxed. Work only inside the container.

### Quick Reference

| Task | Command |
|---|---|
| Shell | `docker exec -it siraj-agent-AGENT_NUMBER bash` |
| Install deps | `docker exec siraj-agent-AGENT_NUMBER bash -c "bun install"` |
| Dev server | `docker exec -it siraj-agent-AGENT_NUMBER bash -c "bun run dev"` |
| Type check | `docker exec siraj-agent-AGENT_NUMBER bash -c "bun tsgo"` |
| Format + lint | `docker exec siraj-agent-AGENT_NUMBER bash -c "bun biome:check"` |
| ESLint | `docker exec siraj-agent-AGENT_NUMBER bash -c "curl -s -X POST http://localhost:4777/lint -H 'Content-Type: application/json' -d '{\"id\":\"sandbox\",\"files\":[\"<files>\"]}'"` (via lint queue client, NEVER run `bun run lint` directly) |
| All tests | `docker exec siraj-agent-AGENT_NUMBER bash -c "bun test"` |
| DB tests | `docker exec siraj-agent-AGENT_NUMBER bash -c "bun run test:db"` |
| GraphQL tests | `docker exec siraj-agent-AGENT_NUMBER bash -c "bun run test:graphql"` |
| UI tests | `docker exec siraj-agent-AGENT_NUMBER bash -c "bun run test:ui:components"` |
| DB migrate/seed | `docker exec -it siraj-agent-AGENT_NUMBER bash -c "bun run db"` |
| Quality gate | `docker exec siraj-agent-AGENT_NUMBER bash -c "bun quality-gate"` |
| Lint queue server | `docker exec -d siraj-agent-AGENT_NUMBER bash -c "~/.bun/bin/bun run scripts/lint-queue-server.ts"` |
| Git status | `docker exec siraj-agent-AGENT_NUMBER bash -c "git status"` |
| Git commit | `docker exec siraj-agent-AGENT_NUMBER bash -c "git add -A && git commit -m 'msg'"` |
| Git push | `docker exec siraj-agent-AGENT_NUMBER bash -c "git push origin agent/AGENT_NAME"` |

### Architecture Rules

1. **Follow `AGENTS.md`** — Read `/workspaces/siraj/AGENTS.md` and layer-specific AGENTS.md files before editing code.
2. **Logging** — NEVER use `console.*`. Use `import { logger } from '@/frontend/utils/logger'` (frontend) or `@/backend/lib/logger` (backend).
3. **MUI v9** — Use `sx` prop, not direct style props. Icon names end in `Outlined` (not `Outline`).
4. **Types** — Import from `@/backend/types`, never create local type definitions in Pothos files.
5. **i18n** — Never hardcode user-facing strings. Use `next-intl` / `getBackendTranslations`.
6. **Theme** — No hardcoded colors. Use `theme.palette.*`.
7. **React 19** — Use `React.SubmitEvent`, not `FormEvent`. Cast `FormData` results.

### Git Workflow

```bash
docker exec siraj-agent-AGENT_NUMBER bash -c "git add -A"
docker exec siraj-agent-AGENT_NUMBER bash -c "git commit -m 'feat: description'"
docker exec siraj-agent-AGENT_NUMBER bash -c "git push origin agent/AGENT_NAME"
```

Do NOT modify the host repository directly. All git operations happen inside the container.

### Isolation Guarantee

Your container is completely isolated from other agents:
- Your source code is on a separate git worktree/branch
- Your `node_modules/`, caches, and build artifacts are container-private
- Your database is `siraj_agent_AGENT_NUMBER` — safe to migrate, seed, modify
- Your processes (tsgo, biome, lint, dev server) do not interfere with other agents
- You can safely run `bun tsgo`, `bun biome:check` at any time — errors are yours alone. For lint, use the lint queue client (NEVER run `bun run lint` directly).

### When You're Done

1. Commit and push your changes
2. Signal that the sandbox can be torn down
3. A human will create a PR and run: `.\.agent-sandbox\remove-agent-sandbox.ps1 -AgentName AGENT_NAME -AgentNumber AGENT_NUMBER`

## END AGENT PROMPT
