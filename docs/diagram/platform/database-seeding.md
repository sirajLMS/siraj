# Database Seeding Framework

The seed pipeline populates a local/dev/test database with a deterministic demo academy. It is triggered by `bun run db seed` (`backend/db/scripts/drizzleSeed.ts`), which hard-aborts when `NODE_ENV=production`, validates required seed assets for the `standard` profile, then calls the master controller `runAllSeeds` in `backend/db/seeds/index.ts`. `loadSeedConfig` resolves a `SeedConfig` from `SEED_PROFILE` (minimal/standard) plus an anchor date, controlling extra persona counts and feature gates for billing, communications, and audit seeds. The controller runs domain seeders in strict dependency order — reference data and migration-owned permission groups first, then demo users (`INTERNAL_DEMO_USERS` plus faker-generated extras via `UserSeedService`), personas (teachers, parents, students via `PersonaSeedService`/`StudentSeedService`), schedules and lessons (recurring schedules → days → class instances, lesson reports, group classes), billing (invoices, payments, and PACKAGE/PERIODIC quotas via `QuotaService.seedOrGetQuotaBatch` plus an on-demand recurring class), and communications (notification preferences, device tokens, deliveries, complaints). Every seeder is idempotent ("seed or get", usually via `orchestrateSeedMany` look-before-create with duplicate-race recovery), receives dependencies through the shared `SeedContext`, and may only write through service bootstrap methods — direct DB access from seeders is forbidden by ESLint. Each step is wrapped by `runSeedStep`, which logs failures and continues; failed step names land in `context.failedSteps` and are fed to `verifySeedCoverage`, which reports per-table row coverage distinguishing empty tables from upstream failures. All write paths are protected by `assertSeedWriteAllowed`, which hard-blocks on Vercel production while allowing local dev and CI test servers.

## Key sources

- `backend/db/scripts/drizzleSeed.ts` — CLI entry point, production guard, asset validation
- `backend/db/seeds/index.ts` — master controller `runAllSeeds`, `SeedContext`, step ordering
- `backend/db/seeds/lib/seed-config.ts` — `SeedConfig`, minimal/standard profiles
- `backend/db/seeds/lib/run-seed-step.ts` — per-step error capture
- `backend/db/seeds/lib/orchestrate-seed-many.ts` — idempotent look-before-create helper
- `backend/db/seeds/users/seed-users.ts` — demo user + avatar seeding
- `backend/db/seeds/billing/seed-quotas.ts` — quota + on-demand schedule seeding
- `backend/db/seeds/shared/verify-coverage.ts` — post-run table coverage verifier
- `backend/services/seed/user-seed.service.ts` — idempotent demo user upserts
- `backend/services/seed/persona-seed.service.ts` — teacher/parent persona upserts
- `backend/lib/bootstrap-gate.ts` — `assertSeedWriteAllowed` production gate

## Diagram

```mermaid
%% Database Seeding Framework — bun run db seed pipeline (personas, users, lessons, quotas, notifications)
flowchart TB
    CLI["bun run db seed<br/>(backend/db/scripts/drizzleSeed.ts)"] --> PRODCHK{"NODE_ENV = production?"}
    PRODCHK -- "yes" --> EXIT["exit(1) — seeding forbidden"]
    PRODCHK -- "no" --> ASSETS["validateSeedAssetsOrThrow<br/>(standard profile only)"]
    ASSETS --> CFG["loadSeedConfig<br/>(SEED_PROFILE minimal/standard, anchorDate)"]
    CFG --> MASTER["runAllSeeds<br/>(backend/db/seeds/index.ts master controller)"]

    subgraph REF["Phase 1: Reference data"]
        REFDATA["system settings, timezones,<br/>currencies, meeting providers"]
        GROUPS["listPermissionGroups (read-only)<br/>groups owned by SQL migrations"]
    end

    subgraph IDENTITY["Phase 2: Users and personas"]
        USERS["seed-users: INTERNAL_DEMO_USERS + extras<br/>via UserSeedService.upsertManyDemoUsers"]
        PERSONAS["teachers / parents via PersonaSeedService<br/>students via StudentSeedService"]
        AVATARS["seed avatars to storage<br/>via seedEntityFile (standard profile)"]
    end

    subgraph SCHED["Phase 3: Schedules and lessons"]
        CLASSES["seed-classes<br/>(recurring_schedules)"]
        DAYS["seed-recurring-schedule-days"]
        INSTANCES["seed-class-instances (lessons)<br/>via ClassSessionService"]
        LMS["seed-lesson-reports + teacher-dues"]
        GRP["group classes, enrollments,<br/>class communications"]
    end

    subgraph BILL["Phase 4: Billing (enableBilling)"]
        BILLS["currencies, package plans,<br/>invoices, payments"]
        QUOTAS["seed-quotas: PACKAGE + PERIODIC quotas<br/>via QuotaService.seedOrGetQuotaBatch"]
        ONDEMAND["seed on-demand recurring class<br/>via RecurringClassService"]
    end

    subgraph COMMS["Phase 5: Communications (enableCommunications)"]
        NOTIFS["notification preferences, device tokens,<br/>deliveries (CommunicationService)"]
        OTHER["complaints, suggestions,<br/>learning resources, site content"]
    end

    subgraph AUD["Phase 6: Audit (enableAuditLogs)"]
        AUDITS["admin audit logs, audit logs,<br/>user permission overrides"]
    end

    MASTER --> REF --> IDENTITY --> SCHED --> BILL --> COMMS --> AUD

    MASTER -.->|wraps each domain in| STEP["runSeedStep<br/>catch + log, continue pipeline"]
    STEP -.->|collected failures| FAILED["context.failedSteps"]
    AUD --> COVERAGE["verifySeedCoverage(failedSteps)<br/>TABLE_COVERAGE row-count report"]

    subgraph GATE["Safety gate on every write"]
        BSGATE["assertSeedWriteAllowed<br/>(bootstrap-gate.ts: blocks VERCEL_ENV=production)"]
    end
    IDENTITY -.-> GATE
    SCHED -.-> GATE
    BILL -.-> GATE

    REPOS["Repositories / Services<br/>(seeders never touch db directly)"]
    USERS --> REPOS
    PERSONAS --> REPOS
    REPOS --> DB[("PostgreSQL")]
```

Machine-checkable copy: [database-seeding.mmd](./database-seeding.mmd)
