# Master Architecture Reference — Certificate Feature (Siraj)

> **Purpose**: This document is the single source of truth for all 22 plan subagents.
> Read this BEFORE creating any spec file. It defines the overall architecture,
> plan boundaries, conventions, and rules that ALL plans must follow.

> **CRITICAL**: Read `INTER_PLAN_CONTRACTS.md` (in this same directory) for canonical
> cross-plan contracts — permission keys, service names, enum values, pagination patterns,
> verification response shape, error classes, batch generation pattern, and more. Where any
> plan conflicts with `INTER_PLAN_CONTRACTS.md`, the contract document wins.

## Project: Siraj

- **Runtime**: Bun (not Node.js)
- **Framework**: Next.js 16 (App Router)
- **Frontend**: React 19, MUI v9, Apollo Client v4, Zustand
- **Backend**: Pothos GraphQL, Drizzle ORM, PostgreSQL
- **i18n**: Custom compile-time TypeScript system in `shared/locale/` (NOT next-intl)
- **Testing**: Bun test runner

## Critical Rule: NO Code Snippets in Spec Files

Plan spec files (requirements.md, design.md, tasks.md) must contain:
- **Requirements** — WHAT the system must do (EARS format: WHEN/THEN/SHALL)
- **Design** — HOW the system is structured (architecture decisions, interface contracts, data flow, component hierarchy, API surface)
- **Tasks** — Actionable implementation steps (2-4hr granularity, files to create/modify, dependencies, quality checks)

**DO NOT include**: implementation code, import statements, schema definitions, repository method bodies, component JSX, or any code blocks longer than 3 lines for illustration of a concept.

**Use instead**: interface contracts, method signatures (name + params + return type only), table-based API descriptions, data flow diagrams (ASCII), and decision rationale.

## Critical Rule: i18n is INLINE

Each plan MUST include its own i18n requirements as part of its feature scope:
- Define the translation keys this plan introduces (by sub-domain)
- Specify Arabic pluralization rules (zero/one/two/few/many/other) and English (one/other)
- Specify interpolation parameters with types
- Reference the `shared/locale/` system patterns
- There is NO separate i18n plan — every plan owns its translations

i18n namespace: `certificates` (with nested sub-domains like `templates`, `categories`, `generation`, `verification`, `errors`, etc.)

## Critical Rule: Fit Siraj Patterns

Plans MUST reference and follow existing Siraj patterns:
- **Schema**: `backend/db/schema/` — Drizzle tables, pgEnums, barrel exports
- **Relations**: `backend/db/drizzleRelations.ts` — Drizzle 1.0 RC `defineRelations(schema, r => ({...}))` single root registry (NOT legacy `relations()` factory + per-domain files)
- **Types**: `backend/types/` — `{Entity}SelectType`, `{Entity}InsertType`, `{Entity}ReturnType`, `{Entity}SubmitInput`
- **Repository**: `backend/db/repo/` — namespace exports, `queryDb(tx)` for reads, `tx ?? db` for writes, prepared statements
- **Services**: `backend/services/` — namespace exports, error handling, caching, idempotency, permissions checks
- **GraphQL**: `backend/graphql/pothos/` — Pothos object types, queries, mutations, DataLoader, auth scopes
- **Frontend views**: `frontend/common/views/dashboard/{domain}/` — Container + ViewModel + DesktopView + MobileView
- **App Router**: `app/(dashboard)/{domain}/page.tsx` — server component guards, permission checks
- **Stores**: `frontend/common/stores/` — Zustand stores- **GraphQL Documents**: `frontend/common/graphql/sharedDocuments/{domain}.documents.ts`

Each plan MUST specify which AGENTS.md files and instruction files apply to the files being created/modified.

## Layer Architecture

```
App Router (server) → Service → Repository → Database
Client Component → Apollo Hook → GraphQL API → Pothos Resolver → Service → Repository → Database
```

## 22-Plan Structure

### Backend Foundation (Plans 1-5) — SEQUENTIAL

| # | Plan | Depends On | Scope |
|---|------|-----------|-------|
| 1 | DB Schema & Enums | — | All cert tables, pgEnums, relations, indexes, RLS, CHECK constraints |
| 2 | Types & Permissions | 1 | Type definitions, AppPermission entries, enum registration |
| 3 | Repository Layer | 1, 2 | All cert namespace repos, prepared statements, FTS, soft deletes, pagination |
| 4 | Services & Business Logic | 3 | Generation pipeline, verification, template mgmt, idempotency, caching, email |
| 5 | GraphQL API | 2, 4 | Pothos types, queries, mutations, DataLoader, auth scopes, public verification endpoint |

### PDF & Storage (Plans 6-7) — PARALLEL after Plan 4

| # | Plan | Depends On | Scope |
|---|------|-----------|-------|
| 6 | PDF Rendering Engine | 4 | Template→PDF via Puppeteer, QR codes, Arabic fonts, render cache, background images |
| 7 | Storage & File Management | 4 | Certificate PDF storage, signed URLs, file cleanup, background image upload |

### Template Management UI (Plans 8-15) — PARALLEL after Plan 5

| # | Plan | Depends On | Scope |
|---|------|-----------|-------|
| 8 | Template List & Navigation | 5 | List page, sidebar nav group, search, filters, pagination |
| 9 | Template Category Management | 5 | Category tree CRUD, reorder, assign templates, drag tree |
| 10 | Template Editor — Basic Info & Dimensions | 5 | Meta form, dimensions, orientation, background, font settings |
| 11 | Template Editor — Visual Canvas (Desktop) | 5, 10 | Drag-position elements, canvas rendering, element selection, snap guides |
| 12 | Template Editor — Element Management | 5, 11 | Create/edit/delete elements, element type properties (text, image, QR, shape, date) |
| 13 | Template Variable Management | 5, 10 | Variable CRUD, types (text/number/date/select), default values, required, variable forms |
| 14 | Recipient Group Management | 5 | Create groups, assign students, per-recipient variable values, student search |
| 15 | Template Preview & Publishing | 5, 6, 11 | Client-side preview, version snapshot, publish/archive, template versioning |

### Certificate UI (Plans 16-19) — PARALLEL after Plan 5

| # | Plan | Depends On | Scope |
|---|------|-----------|-------|
| 16 | Certificate List & Management | 5 | List page, filters, bulk actions, status management, revoke |
| 17 | Certificate Generation Dialog | 5, 6, 14 | Single + batch generation flow, recipient selection, variable override, generation progress |
| 18 | Certificate Detail & Download | 5, 6 | Detail view, PDF download, print, revoke workflow, audit trail |
| 19 | Public Verification Page | 5 | `/verify/[code]` page, QR scan landing, verification result, share, public API |

### Cross-Cutting (Plans 20-22) — LAST

| # | Plan | Depends On | Scope |
|---|------|-----------|-------|
| 20 | Testing & Quality | 1-19 | DB repo tests, service tests, GraphQL integration |
| 21 | Knowledge Propagation | 1-19 | docs/, AGENTS.md updates, skill updates, instruction files |
| 22 | Cron Jobs & Cleanup | 4, 7 | Expired certificate detection, storage cleanup, orphan file removal, scheduled renders |

## Entity Model (from CGVS analysis, adapted for Siraj)

### Core Tables
- `certificate_categories` — hierarchical category tree for templates
- `certificate_templates` — template definitions with dimensions, orientation, background, font, status (draft/published/archived), version chain
- `certificate_template_elements` — polymorphic elements (static_text, data_text, data_date, image, qr_code, shape) with position (x, y, width, height), z-index, rotation
- `certificate_template_variables` — polymorphic variables (text, number, date, select) with default value, required flag
- `certificate_recipient_groups` — groups of students assigned to a template for batch generation
- `certificate_recipient_group_items` — student entries in a group, with per-recipient variable values
- `certificates` — generated certificates with status (draft/pending/issued/revoked/expired), verification code, PDF storage reference
- `certificate_verifications` — verification log entries (IP, user agent, timestamp, result)

### Relationships
```
certificate_categories (1) ──→ (N) certificate_templates
certificate_templates (1) ──→ (N) certificate_template_elements
certificate_templates (1) ──→ (N) certificate_template_variables
certificate_templates (1) ──→ (N) certificate_recipient_groups
certificate_recipient_groups (1) ──→ (N) certificate_recipient_group_items
certificate_recipient_group_items (1) ──→ (1) students
certificate_recipient_group_items (1) ──→ (N) recipient_group_item_variable_values
certificate_templates (1) ──→ (N) certificates
students (1) ──→ (N) certificates
certificates (1) ──→ (N) certificate_verifications
```

## Siraj Frontend Three-Location Split

Every UI plan MUST specify components in all three locations:
1. **App Router page** (server): `app/(dashboard)/certificates/...` — guard, audience resolution, data fetch
2. **Container + ViewModel**: `frontend/common/views/dashboard/certificates/...` — data fetching, state, GraphQL hooks
3. **Presentation**: `frontend/desktop/views/...` and `frontend/mobile/views/...` — pure UI components

## Key AGENTS.md Files to Reference

| Layer | AGENTS.md Path |
|-------|---------------|
| Root | `AGENTS.md` |
| App Router | `app/AGENTS.md` |
| Shared | `shared/AGENTS.md` |
| Frontend | `frontend/AGENTS.md` |
| Frontend Views | `frontend/views/AGENTS.md` |
| Frontend Stores | `frontend/common/stores/AGENTS.md` |
| Frontend GraphQL | `frontend/common/graphql/AGENTS.md` |
| Backend Services | `backend/services/AGENTS.md` |
| Backend GraphQL | `backend/graphql/AGENTS.md` |
| Database Repos | `backend/db/repo/AGENTS.md` |
| Backend Types | `backend/types/AGENTS.md` |
| Backend Enums | `backend/enum/AGENTS.md` |

## Spec File Format (Each Plan = 3 Files)

### requirements.md
- Document info (feature name, plan #, deps, stakeholders, related docs)
- Introduction (overview, business value, scope in/out table)
- Requirements in EARS format (WHEN/THEN/SHALL)
- Each requirement grouped by feature area
- Feature 6: Outcome Knowledge Base & Progress Tracking
- i18n requirements (translation keys, pluralization, interpolation for this plan's domain)
- Acceptance criteria per requirement

### design.md
- Architecture overview (layer position, data flow)
- Design decisions (with rationale, alternatives considered)
- Interface contracts (method signatures, return types — NOT implementations)
- Component hierarchy (for UI plans)
- API surface (for GraphQL plans)
- UX/Navigation specification (routes, sidebar, roles, permissions, mobile/desktop)
- Data model references (which tables/repos this plan touches)
- Error handling strategy
- i18n design (which translation keys, namespace structure)
- Outcome & Knowledge Transfer Protocol

### tasks.md
- Ordered tasks (2-4hr each) with subtasks
- Each task: files to create/modify, dependencies, requirements references
- Quality loop per file (tsgo + biome + lint)
- Instruction verification per subtask (AGENTS.md + .agents/instructions paths)
- Knowledge propagation as final task
- Dependency graph
- Execution order

## Analysis File References

All plans should reference these analysis files:
- **CGVS Analysis**: `.ai/draft_plans/cert/cgvs_analysis/01-08*.md` — CGVS project analysis (what features exist)
- **Siraj Analysis**: `.ai/draft_plans/cert/siraj_analysis/01-12*.md` — Siraj codebase patterns (how to build it)

## Execution Order

```
Phase 1: Backend (sequential)     1 → 2 → 3 → 4 → 5
Phase 2: PDF + Storage (parallel)  6, 7  (after 4)
Phase 3: Template UI (parallel)    8-15  (after 5) — 8,9,10,13,14 parallel; 11 after 10; 12 after 11; 15 after 11
Phase 4: Cert UI (parallel)       16-19 (after 5)
Phase 5: Cross-cutting (last)     20, 21, 22 (after all)
```
