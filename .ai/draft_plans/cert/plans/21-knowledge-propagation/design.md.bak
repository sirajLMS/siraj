# Plan 21 — Knowledge Propagation: Design

## Document Info

| Field | Value |
|-------|-------|
| Feature | Certificate Knowledge Propagation |
| Plan # | 21 |
| Depends On | Plans 1–20 (all prior plans) |
| Related Docs | `MASTER_ARCHITECTURE.md`, `siraj_analysis/10-testing-quality-patterns.md`, `siraj_analysis/12-cron-config-infra.md`, all layer-level `AGENTS.md` files |
| Requirements | `requirements.md` (same directory) |

---

## 1. Architecture Overview

### Layer Position

This plan is purely documentation and configuration — it produces no application code, no database schema changes, no GraphQL schema additions, and no frontend components. Its artifacts are:

1. Markdown documentation files in `docs/certificates/`
2. Updated `AGENTS.md` files across all architecture layers
3. Updated `.agents/instructions/*.instructions.md` files
4. Updated skill definitions

The plan sits at the top of the plan hierarchy (Plan 21 of 22) because it depends on the complete implementation of all prior plans (1–20). Plan 22 (Cron & Cleanup) runs in parallel with this plan — its cron conventions are documented as part of this plan based on the requirements in Plan 22's `requirements.md`.

### Artifact Distribution

```
┌─────────────────────────────────────────────────────────┐
│                docs/certificates/INDEX.md                    │
│    Links to all certificate documentation files              │
├─────────────────────────────────────────────────────────┤
│  ARCHITECTURE.md    │  DATABASE_PATTERNS.md                  │
│  SERVICE_PATTERNS.md│  GRAPHQL_PATTERNS.md                   │
│  FRONTEND_PATTERNS  │  STORAGE_PATTERNS.md                   │
│  CRON_PATTERNS.md    │  TESTING_PATTERNS.md                   │
│  I18N_PATTERNS.md    │  TEMPLATE_EDITOR.md                   │
│  VERIFICATION_SYSTEM.md                                     │
├─────────────────────────────────────────────────────────┤
│            AGENTS.md Files (updated)                        │
│  root, app, shared, frontend/*, backend/*                   │
├─────────────────────────────────────────────────────────┤
│       .agents/instructions/ (updated)                       │
│  frontend, backend, tests                                    │
├─────────────────────────────────────────────────────────┤
│              Skills (updated)                               │
│  review workflows, quality gate, coding agent                │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

This plan has no runtime data flow. Its "data flow" is the documentation consumption flow:

```
Developer / AI Agent
    ↓ reads
docs/certificates/INDEX.md (entry point)
    ↓ links to
docs/certificates/ARCHITECTURE.md (overview)
    ↓ cross-references
Layer-specific documentation (DATABASE_PATTERNS, SERVICE_PATTERNS, etc.)
    ↓ cross-references
Layer-specific AGENTS.md files (backend/services/AGENTS.md, etc.)
    ↓ cross-references
Instruction files (.agents/instructions/backend.instructions.md, etc.)
    ↓ consumed by
AI agents during development (coding, review, quality gate)
```

---

## 2. Documentation Directory Structure

### 2.1 Directory Layout

The `docs/certificates/` directory at the project root contains the following files, organized by architecture layer:

| File | Layer | Content Summary | Lines (est.) |
|------|-------|----------------|--------------|
| `INDEX.md` | All | Entry point, links to all files, keyword index | 80–120 |
| `ARCHITECTURE.md` | All | Certificate feature position, data flow, entity model, layer boundaries | 200–300 |
| `DATABASE_PATTERNS.md` | Database | Schema barrel, repository pattern, entity cache, prepared statements, seeds | 200–300 |
| `SERVICE_PATTERNS.md` | Services | Namespace structure, generation pipeline, verification, template management, cache | 250–350 |
| `GRAPHQL_PATTERNS.md` | GraphQL | Pothos builders, auth scopes, DataLoader, document conventions, manual triggers | 200–300 |
| `FRONTEND_PATTERNS.md` | Frontend | View organization, Apollo hooks, Zustand, MUI, i18n | 200–300 |
| `STORAGE_PATTERNS.md` | Storage | Adapter pattern, signed URLs, orphan detection, quota, cache invalidation | 150–250 |
| `CRON_PATTERNS.md` | Cron | Vercel Cron pattern, auth guard, Redis lock, failure isolation, idempotency, env config | 200–300 |
| `TESTING_PATTERNS.md` | Testing | Entity-setup, runInRollback, test client, components, E2E, Storybook | 200–300 |
| `I18N_PATTERNS.md` | i18n | Namespace structure, sub-domains, pluralization, type schema, locale implementation | 150–250 |
| `TEMPLATE_EDITOR.md` | Frontend | Canvas architecture, element types, variable system, preview/publish, versioning | 200–300 |
| `VERIFICATION_SYSTEM.md` | Verification | Code generation, public page, log entries, retention, QR codes | 150–250 |

### 2.2 INDEX.md Structure

The `INDEX.md` file serves as the navigational entry point. It contains:

| Section | Content |
|---------|---------|
| Title | "Certificate Feature Documentation" |
| Overview | One-paragraph summary of the certificate feature and documentation purpose |
| Architecture Layer Index | Table mapping each architecture layer to its documentation file with keywords |
| Quick Reference | Table of common tasks (e.g., "Add a new certificate cron job → CRON_PATTERNS.md §3") |
| Cross-References | Links to relevant AGENTS.md files and instruction files |
| Keyword Index | Alphabetical keyword list mapping keywords to documentation files |

### 2.3 ARCHITECTURE.md Content

| Section | Content |
|---------|---------|
| 1. Feature Overview | What the certificate feature does, its role in the Siraj platform |
| 2. Architecture Layer Position | Where certificate code lives in each layer (tables with file path patterns) |
| 3. Entity Model | Certificate, Template, TemplateElement, TemplateVariable, RecipientGroup, RecipientGroupItem, VerificationLog — described with entity tables and relationships described in prose |
| 4. Data Flow — Client | Client Component → Apollo → GraphQL → Pothos → Service → Repo → DB (ASCII diagram) |
| 5. Data Flow — Server | Server Component → Cached Wrapper → Service → Repo → DB (ASCII diagram) |
| 6. Layer Boundary Rules | Rules specific to certificates: no frontend imports in repos, no service logic in Pothos, shared layer restrictions |
| 7. Related Documentation | Cross-references to layer-specific documentation files |

### 2.4 DATABASE_PATTERNS.md Content

| Section | Content |
|---------|---------|
| 1. Schema Barrel Structure | `backend/db/schema/cert/` barrel, table list, index list, described in tables |
| 2. Repository Pattern | One repository per entity, constructor injection of `db`, methods described by name + params + return type in tables |
| 3. Entity Cache Service | Cache key naming (`cert:{id}`, `template:{id}`), TTL configuration, invalidation triggers, described in prose |
| 4. Prepared Statements | Verification lookup by code (high-frequency query), described as method signature table |
| 5. Seed Data | `backend/db/seeds/cert/` structure, demo template, demo certificates, demo recipient groups, described in tables |
| 6. Cross-References | Links to `backend/db/repo/AGENTS.md`, `backend/db/seeds/AGENTS.md` |

### 2.5 SERVICE_PATTERNS.md Content

| Section | Content |
|---------|---------|
| 1. Namespace Structure | `backend/services/cert/` barrel, service files, index exports, described in tables |
| 2. Generation Pipeline | Batch generation service: job creation, idempotency key, per-certificate processing, retry logic, failure isolation, described in prose and flow tables |
| 3. Verification Service | Code lookup, audit logging, cache invalidation, rate limiting, described in prose |
| 4. Template Management | Draft→published state machine, version bumping, element CRUD, variable binding, publish workflow, described in state transition tables |
| 5. Entity Cache Service | Cache TTL, cache tags, invalidation on template publish and certificate revoke, described in tables |
| 6. Cross-References | Links to `backend/services/AGENTS.md` |

### 2.6 GRAPHQL_PATTERNS.md Content

| Section | Content |
|---------|---------|
| 1. Pothos Builders | Certificate input types, object types, enum types, described in tables (type name, fields, auth scope) |
| 2. Auth Scope Pattern | Staff, admin, teacher role requirements for certificate mutations, described in tables |
| 3. DataLoader Batching | Template elements loader, variable bindings loader, verification logs loader, described in prose (key type, batch function, cache) |
| 4. Document Conventions | Frontend GraphQL document files, naming, `id` inclusion rule, import from `@apollo/client/react`, no `useLazyQuery`, described in tables |
| 5. Manual Trigger Mutations | Pattern for admin-triggered cron jobs (modeled after `refreshExchangeRates`), described in prose |
| 6. Cross-References | Links to `backend/graphql/AGENTS.md`, `frontend/common/graphql/AGENTS.md` |

### 2.7 FRONTEND_PATTERNS.md Content

| Section | Content |
|---------|---------|
| 1. View Organization | `frontend/views/dashboard/certificates/` structure, page components, described in tables |
| 2. Apollo Hooks | `useCertificateListQuery`, `useCertificateGenerateMutation`, naming conventions, cache update patterns, described in tables |
| 3. Zustand Stores | Certificate list store (filters, pagination), generation dialog store, template editor store, described in tables |
| 4. MUI v9 Components | DataGrid configuration for certificate lists, generation dialog composition, described in prose |
| 5. i18n Usage | `useAppTranslation("certificates")` with sub-domain access, described in tables |
| 6. Cross-References | Links to `frontend/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/common/stores/AGENTS.md` |

### 2.8 STORAGE_PATTERNS.md Content

| Section | Content |
|---------|---------|
| 1. Storage Adapter | PDF file storage, background image storage, adapter pattern, described in prose |
| 2. Signed URLs | Generation, expiration, cleanup strategy (cron/both/on-demand), described in tables |
| 3. Orphan Detection | PDF orphan detection, background image orphan detection, grace period, deletion, described in flow tables |
| 4. Storage Quota | Quota check, threshold alerting, admin notification, described in prose |
| 5. Render Cache | Cache tag naming (`render-cache:template:{id}`, `render-cache:cert:{id}`), invalidation triggers, retention, described in tables |
| 6. Cross-References | Links to Plan 7 documentation, Plan 22 CRON_PATTERNS.md |

### 2.9 CRON_PATTERNS.md Content

| Section | Content |
|---------|---------|
| 1. Vercel Cron Overview | `vercel.json` crons[] registration, schedule format, GET-only routes, described in tables |
| 2. Route Pattern | `app/api/cron/cert-*/route.ts` structure, `verifyCronSecretAuth` guard, `logger` usage, `NextResponse.json` return, described in prose |
| 3. Redis Single-Flight Lock | Lock key naming (`cron-lock:cert-*`), TTL (300s), acquire/release pattern, skip behavior, described in flow tables |
| 4. Per-Item Failure Isolation | Try/catch per item, partial success reporting, error logging, described in prose |
| 5. UTC-Date Idempotency | Idempotency key construction, DB UNIQUE constraint, re-run safety, described in tables |
| 6. Env Config Registration | `environment.d.ts`, `env-config-keys.ts`, `.env.example`, `deploy.yml` registration pattern, described in tables |
| 7. Certificate Cron Jobs | Table of all certificate cron routes: route path, schedule, env var, service, description |
| 8. Cross-References | Links to `app/AGENTS.md`, `backend/services/AGENTS.md`, Plan 22 requirements |

### 2.10 TESTING_PATTERNS.md Content

| Section | Content |
|---------|---------|
| 1. Entity-Setup Helpers | Certificate helpers in `backend/db/test/entity-setup.ts`, signatures described in tables |
| 2. Repository Tests | `runInRollback` pattern, `tx` propagation, 100% coverage requirement, test file locations, described in tables |
| 3. Service Tests | Mocked repos vs real DB, parallel test runner, described in prose |
| 4. GraphQL Integration Tests | `testClient` usage, shared dev server, auth scope setup, described in tables |
| 5. Component Tests | `renderWithWrapper`, MockLink, no server, described in tables |
| 6. E2E Tests | Playwright, production server, cert flow fixtures, described in prose |
| 7. Storybook Stories | Page-level and component-level stories, mock stores, described in tables |
| 8. Cross-References | Links to `.agents/instructions/tests.instructions.md` |

### 2.11 I18N_PATTERNS.md Content

| Section | Content |
|---------|---------|
| 1. Namespace Structure | `certificates` namespace, sub-domains list, described in tables |
| 2. Sub-Domains | entities, templates, generation, verification, cron, errors, ui, knowledge — each described with key count and purpose |
| 3. Type Schema | `shared/locale/` type schema definition pattern, interpolation types, pluralization types, described in tables |
| 4. Locale Implementation | `shared/locale/en/certificates.ts`, `shared/locale/ar/certificates.ts` file structure, described in prose |
| 5. Arabic Pluralization | zero/one/two/few/many/other rules, example implementations, described in tables |
| 6. Key Naming Convention | Dot-separated, sub-domain prefixed, described with examples in tables |
| 7. Anti-Patterns | No hardcoded strings, no `next-intl` imports, no `shared/messages/` imports, described in prose |
| 8. Cross-References | Links to `shared/AGENTS.md` |

### 2.12 TEMPLATE_EDITOR.md Content

| Section | Content |
|---------|---------|
| 1. Canvas Architecture | Drag-and-drop, element positioning, zIndex management, described in prose |
| 2. Element Types | static_text, dynamic_text, image, qr_code, date, signature — each described with properties table |
| 3. Variable System | Text, date, image, QR code variables, binding to template elements, described in tables |
| 4. Preview Workflow | Draft preview, published preview, render pipeline, described in flow tables |
| 5. Version Bumping | Version increment on publish, old version retention, described in prose |
| 6. Cross-References | Links to `frontend/views/AGENTS.md`, `docs/certificates/FRONTEND_PATTERNS.md` |

### 2.13 VERIFICATION_SYSTEM.md Content

| Section | Content |
|---------|---------|
| 1. Code Generation | UUID-based verification code, uniqueness guarantee, code format, described in tables |
| 2. Public Verification Page | `app/verify/[code]/page.tsx`, server component, no auth, direct service call, described in prose |
| 3. Verification Log | IP, user agent, timestamp, success/fail, described in tables |
| 4. Log Retention | Default 90 days, aggregation before deletion, cron schedule, described in tables |
| 5. QR Code Embedding | QR code generation, embedding in PDF, verification URL, described in prose |
| 6. Cross-References | Links to `docs/certificates/CRON_PATTERNS.md`, `app/AGENTS.md` |

---

## 3. AGENTS.md Updates

### 3.1 Root AGENTS.md

| Section | Content |
|---------|---------|
| Certificate Feature (new section) | Pointer to `docs/certificates/INDEX.md`, namespace name, cron route paths, env var prefix, storage directory naming, cache tag naming convention |
| File Organization (updated) | Add `docs/certificates/` to documentation references; add certificate paths to frontend/backend sections |
| Important References (updated) | Add `docs/certificates/INDEX.md` to the references list |

### 3.2 shared/AGENTS.md

| Section | Content |
|---------|---------|
| Certificate Namespace (new section) | `certificates` translation namespace, sub-domain list, type schema location, locale implementation locations |
| Certificate Shared Types (new section) | Location of certificate shared types (if any in `shared/types/`), constants (`shared/constants/cert/`), utilities (`shared/lib/cert/`) |
| Import Rules (updated) | Reinforce that shared-layer certificate code must never import from `@/frontend/**`, `@/backend/**`, or `@/app/**` |

### 3.3 backend/services/AGENTS.md

| Section | Content |
|---------|---------|
| Certificate Services (new section) | Namespace structure (`backend/services/cert/`), file list, index exports |
| Generation Pipeline (new subsection) | Batch generation, idempotency key, per-item failure isolation, retry logic |
| Verification Service (new subsection) | Code lookup, audit logging, cache invalidation |
| Template Management (new subsection) | Draft→published state machine, version bumping, publish workflow |
| Entity Cache (new subsection) | Cache keys, TTL, invalidation triggers |
| Cross-Reference | Link to `docs/certificates/SERVICE_PATTERNS.md` |

### 3.4 backend/graphql/AGENTS.md

| Section | Content |
|---------|---------|
| Certificate Pothos Types (new section) | Object types, input types, enum types, their names and auth scopes |
| DataLoader (new subsection) | Certificate template elements loader, variable bindings loader, verification logs loader |
| Manual Trigger Mutations (new subsection) | Pattern for admin-triggered cron operations (trigger: 'cron' | 'manual') |
| Cross-Reference | Link to `docs/certificates/GRAPHQL_PATTERNS.md` |

### 3.5 backend/db/repo/AGENTS.md

| Section | Content |
|---------|---------|
| Certificate Repositories (new section) | Barrel structure (`backend/db/repo/cert/`), one repo per entity, file list |
| Entity Cache Integration (new subsection) | Cache keys, TTL, invalidation on update/delete |
| Prepared Statements (new subsection) | Verification lookup by code, high-frequency query optimization |
| Test Requirements (updated) | Reinforce `runInRollback` and `tx` propagation for certificate repo tests |
| Cross-Reference | Link to `docs/certificates/DATABASE_PATTERNS.md` |

### 3.6 backend/db/seeds/AGENTS.md

| Section | Content |
|---------|---------|
| Certificate Seeds (new section) | Seed data structure, demo template, demo certificates, demo recipient groups, demo verification logs |
| Cross-Reference | Link to `docs/certificates/DATABASE_PATTERNS.md` |

### 3.7 backend/types/AGENTS.md

| Section | Content |
|---------|---------|
| Certificate Types (new section) | `CertificateSelectType`, `CertificateInsertType`, `CertificateReturnType`, `CertificateSubmitInput`, and equivalent for Template, TemplateElement, TemplateVariable, RecipientGroup, RecipientGroupItem, VerificationLog |
| Type Import Rule (updated) | Reinforce that Pothos files must import certificate types from `@/backend/types` |
| Cross-Reference | Link to `docs/certificates/DATABASE_PATTERNS.md` |

### 3.8 backend/enum/AGENTS.md

| Section | Content |
|---------|---------|
| Certificate Enums (new section) | CertificateStatus (draft/issued/expired/revoked), TemplateStatus (draft/published/archived), TemplateElementType (static_text/dynamic_text/image/qr_code/date/signature), BatchGenerationStatus (pending/running/completed/cancelled/failed), VerificationLogStatus (success/fail/not_found) |
| Cross-Reference | Link to `docs/certificates/ARCHITECTURE.md` |

### 3.9 frontend/AGENTS.md

| Section | Content |
|---------|---------|
| Certificate Views (new section) | `frontend/views/dashboard/certificates/` organization, page component list |
| Certificate Apollo Hooks (new subsection) | Query and mutation hook naming, cache update patterns |
| Certificate Zustand Stores (new subsection) | Store naming, composition, mock store for Storybook |
| Certificate MUI Patterns (new subsection) | DataGrid for certificates, generation dialog, template editor canvas |
| Certificate i18n (new subsection) | `useAppTranslation("certificates")` usage, sub-domain access |
| Cross-Reference | Link to `docs/certificates/FRONTEND_PATTERNS.md` |

### 3.10 frontend/views/AGENTS.md

| Section | Content |
|---------|---------|
| Certificate Page Components (new section) | List view, detail view, generation dialog, template editor page, verification page — their props, composition, data flow |
| DataGrid Configuration (new subsection) | Column definitions, filter model, sort model, pagination |
| Template Editor (new subsection) | Canvas view, element palette, property panel, preview panel |
| Cross-Reference | Link to `docs/certificates/TEMPLATE_EDITOR.md`, `docs/certificates/FRONTEND_PATTERNS.md` |

### 3.11 frontend/common/stores/AGENTS.md

| Section | Content |
|---------|---------|
| Certificate Stores (new section) | Certificate list store (filters, pagination, sort), generation dialog store (form state, step tracking), template editor store (element selection, canvas state, dirty flag) |
| Mock Stores (new subsection) | Mock store pattern for Storybook, cert mock store naming |
| Cross-Reference | Link to `docs/certificates/FRONTEND_PATTERNS.md` |

### 3.12 frontend/common/graphql/AGENTS.md

| Section | Content |
|---------|---------|
| Certificate GraphQL Documents (new section) | Document file locations, naming conventions (`CertificateQueryDocument`, `CertificateMutationDocument`, `TemplateQueryDocument`), coverage list |
| Rules (updated) | Reinforce `id` field inclusion, no `useLazyQuery`, import from `@apollo/client/react` for certificate documents |
| Cross-Reference | Link to `docs/certificates/GRAPHQL_PATTERNS.md` |

### 3.13 app/AGENTS.md

| Section | Content |
|---------|---------|
| Certificate Routes (new section) | Public verification route (`app/verify/[code]/page.tsx`), admin dashboard routes (`app/(dashboard)/certificates/`), cron routes (`app/api/cron/cert-*/route.ts`) |
| Server Component Data Flow (new subsection) | Verification page: server component → cached wrapper → verification service → repository → database (no Apollo) |
| Cron Route Pattern (new subsection) | `verifyCronSecretAuth`, `logger`, `NextResponse.json`, service delegation |
| Cross-Reference | Link to `docs/certificates/CRON_PATTERNS.md`, `docs/certificates/VERIFICATION_SYSTEM.md` |

---

## 4. Instruction File Updates

### 4.1 frontend.instructions.md

| Subsection | Content |
|------------|---------|
| Certificate Component Naming | `*CertificateList`, `*CertificateDetail`, `*TemplateEditor`, `*GenerationDialog`, `*VerificationPage` |
| Certificate Apollo Hooks | `useCertificate*Query`, `useCertificate*Mutation` — return types, cache updates |
| Certificate Zustand Stores | `certificate*Store` — naming, composition, selector pattern |
| Certificate GraphQL Documents | `*CertificateQueryDocument`, `*CertificateMutationDocument` — file location, naming |
| Certificate MUI Notes | DataGrid column config for certificates, template editor canvas rendering, generation dialog stepper |
| Certificate i18n Notes | `useAppTranslation("certificates")`, sub-domain access pattern |
| Certificate Gotchas | PDF preview rendering in DataGrid, QR code generation, template element drag-and-drop coordinate system, MUI v9 style prop avoidance |

### 4.2 backend.instructions.md

| Subsection | Content |
|------------|---------|
| Certificate Service Naming | `Certificate*Service`, `Template*Service`, `Verification*Service` — namespace, barrel exports |
| Certificate Repository Naming | `Certificate*Repository`, `Template*Repository` — one per entity, barrel |
| Certificate Type Naming | `Certificate{Entity}SelectType`, `Certificate{Entity}InsertType`, `Certificate{Entity}ReturnType` |
| Certificate Pothos Naming | Object type, input type, enum naming conventions for certificates |
| Certificate Enum Naming | CertificateStatus, TemplateStatus, TemplateElementType, BatchGenerationStatus |
| Certificate Cron Route Naming | `cert-*` prefix, `app/api/cron/cert-*/route.ts` |
| Certificate Env Var Naming | `CERT_*` prefix, schedule vars, strategy vars, retention vars |
| Certificate Cache Tag Naming | `render-cache:cert:{id}`, `render-cache:template:{id}` |
| Certificate Gotchas | Generation pipeline idempotency (UTC-date key), verification code uniqueness (UUID), template version bumping (increment on publish), storage orphan detection (grace period), render cache invalidation (tag-based) |

### 4.3 tests.instructions.md

| Subsection | Content |
|------------|---------|
| Certificate Entity-Setup | Helper names and signatures for cert, template, element, variable, group, group item, verification log |
| Certificate Repository Tests | `runInRollback`, `tx` propagation, 100% coverage, file locations (`backend/db/test/repo/cert/`) |
| Certificate GraphQL Tests | `testClient` usage, auth scope setup, file locations (`frontend/common/graphql/test/cert/`) |
| Certificate Component Tests | `renderWithWrapper`, MockLink, fixture data, file locations (`test/ui/components/cert/`) |
| Certificate E2E Tests | Playwright, production server, cert flow fixtures, file locations (`test/ui/e2e/cert/`) |
| Certificate Storybook | Page-level and component-level stories, mock stores, file locations |
| Certificate Test Gotchas | PDF render mocking (no real render in tests), storage adapter mocking (in-memory), cron route testing (mock auth, no real schedule) |

---

## 5. Skill Updates

### 5.1 Review Workflow Skills

The review workflow skills (e.g., review-frontend, review-backend) receive certificate-specific checklist items:

| Skill | Additions |
|-------|-----------|
| review-frontend | Certificate component naming verification, Apollo hook naming, Zustand store naming, MUI v9 compliance for certificate components, i18n key usage |
| review-backend | Certificate service namespace structure, repository pattern, type import from `@/backend/types`, cron route pattern, cache tag naming |
| review-types | Certificate type naming (SelectType, InsertType, ReturnType, SubmitInput), no duplicate types, canonical type location |
| review-config | Certificate env var registration (`environment.d.ts`, `env-config-keys.ts`, `.env.example`, `deploy.yml`), `vercel.json` cron registration |

### 5.2 Quality Gate Skills

The quality gate skill's `sub-loop.ts` file path → instruction file mapping is extended:

| File Path Pattern | Instruction File | AGENTS.md |
|-------------------|-----------------|-----------|
| `backend/services/cert/**/*.ts` | `backend.instructions.md` | `backend/services/AGENTS.md`, `backend/AGENTS.md` |
| `backend/db/repo/cert/**/*.ts` | `backend.instructions.md` | `backend/db/repo/AGENTS.md`, `backend/AGENTS.md` |
| `backend/db/test/repo/cert/**/*.test.ts` | `tests.instructions.md`, `backend.instructions.md` | `backend/db/test/AGENTS.md`, `backend/AGENTS.md` |
| `backend/graphql/**/*cert*.ts` | `backend.instructions.md` | `backend/graphql/AGENTS.md`, `backend/AGENTS.md` |
| `frontend/views/dashboard/certificates/**/*.tsx` | `frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` |
| `frontend/common/stores/**/certificate*.ts` | `frontend.instructions.md` | `frontend/common/stores/AGENTS.md`, `frontend/AGENTS.md` |
| `frontend/common/graphql/sharedDocuments/*cert*.ts` | `frontend.instructions.md` | `frontend/common/graphql/sharedDocuments/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, `frontend/AGENTS.md` |
| `app/api/cron/cert-*/**/*.ts` | `backend.instructions.md` | `app/AGENTS.md`, `backend/AGENTS.md` |
| `app/verify/**/*.tsx` | `frontend.instructions.md` | `app/AGENTS.md` |
| `test/ui/**/cert/**/*.ts(x)` | `tests.instructions.md` | `test/ui/AGENTS.md` |
| `shared/locale/**/certificates.ts` | (shared layer rules) | `shared/AGENTS.md` |

### 5.3 Coding Agent Skills

The coding agent skills receive certificate-specific documentation references:

| Skill | Addition |
|-------|----------|
| coding-agent | When assigned a file matching `**/cert/**` or `**/*certificate*` or `**/cert-*`, first read `docs/certificates/INDEX.md` for architecture context, then read the relevant layer-specific documentation file |
| troubleshooting | Certificate-specific troubleshooting guide reference: `docs/certificates/ARCHITECTURE.md` for understanding data flow, `docs/certificates/CRON_PATTERNS.md` for cron issues, `docs/certificates/STORAGE_PATTERNS.md` for storage issues |

---

## 6. Cross-Reference Matrix

The following table maps each documentation file to its bidirectional AGENTS.md cross-references:

| Documentation File | AGENTS.md References (bidirectional) |
|--------------------|-------------------------------------|
| `ARCHITECTURE.md` | Root AGENTS.md, all layer AGENTS.md files |
| `DATABASE_PATTERNS.md` | `backend/db/repo/AGENTS.md`, `backend/db/seeds/AGENTS.md`, `backend/types/AGENTS.md` |
| `SERVICE_PATTERNS.md` | `backend/services/AGENTS.md` |
| `GRAPHQL_PATTERNS.md` | `backend/graphql/AGENTS.md`, `frontend/common/graphql/AGENTS.md` |
| `FRONTEND_PATTERNS.md` | `frontend/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/common/stores/AGENTS.md` |
| `STORAGE_PATTERNS.md` | `backend/services/AGENTS.md`, Plan 7 docs |
| `CRON_PATTERNS.md` | `app/AGENTS.md`, `backend/services/AGENTS.md` |
| `TESTING_PATTERNS.md` | `.agents/instructions/tests.instructions.md` |
| `I18N_PATTERNS.md` | `shared/AGENTS.md` |
| `TEMPLATE_EDITOR.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` |
| `VERIFICATION_SYSTEM.md` | `app/AGENTS.md`, `backend/services/AGENTS.md` |

---

## 7. i18n Design

### 7.1 Namespace and Sub-Domain

The `knowledge` sub-domain is added to the `certificates` namespace in `shared/locale/`. It contains only UI surface labels that might be generated from documentation metadata (e.g., if the documentation index is surfaced in an admin help panel).

| Property | Value |
|----------|-------|
| Namespace | `certificates` |
| Sub-domain | `knowledge` |
| Type schema location | `shared/locale/certificates.ts` (type schema) |
| English implementation | `shared/locale/en/certificates.ts` |
| Arabic implementation | `shared/locale/ar/certificates.ts` |
| Key count | 12 |
| Pluralization | None (all keys are singular labels) |

### 7.2 Key Usage

| Key | Used In | Access Pattern |
|-----|---------|----------------|
| `knowledge.docsIndexTitle` | Admin help panel (if surfaced) | `t("certificates.knowledge.docsIndexTitle")` |
| `knowledge.architectureOverview` | Section labels | `t("certificates.knowledge.architectureOverview")` |
| `knowledge.databasePatterns` | Section labels | `t("certificates.knowledge.databasePatterns")` |
| `knowledge.servicePatterns` | Section labels | `t("certificates.knowledge.servicePatterns")` |
| `knowledge.graphqlPatterns` | Section labels | `t("certificates.knowledge.graphqlPatterns")` |
| `knowledge.frontendPatterns` | Section labels | `t("certificates.knowledge.frontendPatterns")` |
| `knowledge.storagePatterns` | Section labels | `t("certificates.knowledge.storagePatterns")` |
| `knowledge.cronPatterns` | Section labels | `t("certificates.knowledge.cronPatterns")` |
| `knowledge.testingPatterns` | Section labels | `t("certificates.knowledge.testingPatterns")` |
| `knowledge.i18nPatterns` | Section labels | `t("certificates.knowledge.i18nPatterns")` |
| `knowledge.templateEditor` | Section labels | `t("certificates.knowledge.templateEditor")` |
| `knowledge.verificationSystem` | Section labels | `t("certificates.knowledge.verificationSystem")` |

### 7.3 Implementation Approach

The i18n keys for the `knowledge` sub-domain are defined alongside all other certificate sub-domains. The type schema entry adds a `knowledge` object with the 12 keys listed above. Both English and Arabic implementations provide the translations. Since these are simple string keys (no interpolation, no pluralization), the implementation is straightforward — each key maps to a string literal.

The keys are accessed via `getTranslations(locale, "certificates")` for server components and `useAppTranslation("certificates")` for client components, with the sub-domain accessed as a nested property: `t.certificates.knowledge.docsIndexTitle`.

---

## 8. Design Decisions

### DD-1: Documentation in `docs/certificates/` vs. Scattered Layer Docs

**Decision**: Create a dedicated `docs/certificates/` directory at the project root rather than scattering certificate documentation across layer-specific docs directories.

**Rationale**: A single directory provides a single entry point (`INDEX.md`) for developers and AI agents searching for certificate documentation. It avoids fragmentation and makes the documentation self-contained. Layer-specific `AGENTS.md` files cross-reference the documentation directory rather than duplicating content.

**Alternatives Considered**:
- Scattered approach (docs in each layer's docs/): Rejected because it fragments the knowledge base and makes cross-referencing harder.
- Nested approach (docs/certificates/database/, docs/certificates/frontend/): Rejected because a flat directory with descriptive filenames is easier to navigate and search.

### DD-2: No Code Snippets in Documentation

**Decision**: All documentation files in `docs/certificates/` shall use tables, prose, and ASCII art for descriptions — no code snippets or code blocks exceeding 3 lines.

**Rationale**: Code snippets in documentation rot quickly as implementations evolve. Using prose and tables creates more durable documentation that captures intent and convention rather than implementation details. AI agents can always read the actual source code for implementation details.

**Alternatives Considered**:
- Include code snippets: Rejected because of maintenance burden and the risk of documentation-code drift.
- Link to source files: Partially adopted — documentation references file paths and pattern names, directing readers to source for details.

### DD-3: Bidirectional Cross-References

**Decision**: All cross-references between documentation files and AGENTS.md files shall be bidirectional — if A references B, B references A.

**Rationale**: Unidirectional references create dead ends. A developer reading `backend/db/repo/AGENTS.md` should be able to find the detailed database patterns documentation, and vice versa. Bidirectional references ensure all paths lead to complete knowledge.

**Alternatives Considered**:
- Unidirectional (docs → AGENTS.md only): Rejected because developers reading AGENTS.md would not discover the detailed documentation.
- Centralized index only (INDEX.md → everything): Rejected because developers arriving at a specific AGENTS.md file should not need to navigate back to INDEX.md to find related docs.

### DD-4: Instruction Files Contain Subsections, Not Separate Files

**Decision**: Add certificate-specific content as subsections within existing instruction files (`.agents/instructions/frontend.instructions.md`, `backend.instructions.md`, `tests.instructions.md`) rather than creating separate certificate instruction files.

**Rationale**: The instruction file discovery mechanism in `scripts/health/sub-loop.ts` maps file path patterns to instruction files. Adding certificate subsections to existing files ensures the existing discovery mechanism works without modification. Creating separate files would require updating the discovery logic.

**Alternatives Considered**:
- Separate instruction files (`.agents/instructions/cert-frontend.instructions.md`): Rejected because it requires modifying the discovery mechanism and fragments instruction context.
- New instruction file with broader matching: Rejected for the same reason.

### DD-5: Skill Updates Are Additive

**Decision**: Skill updates are additive — new checklist items, new file path mappings, new documentation references are added to existing skills without restructuring them.

**Rationale**: Skills evolve incrementally. Additive updates minimize risk of breaking existing skill behavior and make rollback easier if needed.

**Alternatives Considered**:
- Create new certificate-specific skills: Rejected because the existing skills (review-frontend, review-backend, quality-gate, coding-agent) already cover the relevant workflows; certificate-specific guidance is best integrated into them.

### DD-6: Knowledge Sub-Domain Uses Simple String Keys

**Decision**: The `knowledge` i18n sub-domain uses only simple string keys (no interpolation, no pluralization).

**Rationale**: The documentation labels are static text that doesn't vary by count or parameter. Simple keys keep the type schema and locale implementations minimal and avoid unnecessary complexity.

**Alternatives Considered**:
- Add interpolation for future flexibility: Rejected because YAGNI — keys can be upgraded if and when needed.

---

## 9. Error Handling Strategy

This plan produces documentation and configuration, not application code. Error handling is limited to:

| Scenario | Handling |
|----------|----------|
| Documentation references a non-existent file | Documentation review (T-quality-loop) catches this; fix by updating the reference |
| AGENTS.md update introduces a broken cross-reference | Quality loop verification checks all links; fix by correcting the reference |
| Instruction file update conflicts with existing content | Resolved during review — instruction files are append-focused; conflicts are merge decisions |
| Skill update is not recognized by the skill framework | Validated by running the quality gate after skill updates; fix by adjusting the skill definition |

---

## 10. Data Model References

This plan does not introduce or modify any database tables, GraphQL types, or service interfaces. It references the data models defined in Plans 1–20:

| Model | Defined In | Referenced In |
|-------|-----------|---------------|
| Certificate entity | Plan 1 (schema), Plan 3 (repo), Plan 4 (service) | `ARCHITECTURE.md`, `DATABASE_PATTERNS.md`, `SERVICE_PATTERNS.md` |
| Template entity | Plan 1, Plan 3, Plan 4 | `ARCHITECTURE.md`, `DATABASE_PATTERNS.md`, `TEMPLATE_EDITOR.md` |
| TemplateElement | Plan 1, Plan 3, Plan 4 | `TEMPLATE_EDITOR.md`, `DATABASE_PATTERNS.md` |
| TemplateVariable | Plan 1, Plan 3, Plan 4 | `TEMPLATE_EDITOR.md`, `DATABASE_PATTERNS.md` |
| RecipientGroup | Plan 1, Plan 3, Plan 4 | `ARCHITECTURE.md`, `DATABASE_PATTERNS.md` |
| VerificationLog | Plan 1, Plan 3, Plan 4 | `VERIFICATION_SYSTEM.md`, `CRON_PATTERNS.md` |
| BatchGenerationJob | Plan 1, Plan 4 | `SERVICE_PATTERNS.md`, `CRON_PATTERNS.md` |

---

## 11. AGENTS.md References

The following AGENTS.md files are updated by this plan. Each file requires reading the existing content before appending certificate-specific sections:

| AGENTS.md File | Current Content Summary | Addition Type |
|----------------|------------------------|---------------|
| Root `AGENTS.md` | Project overview, commands, architecture layers, patterns | New "Certificate Feature" section + updated file organization and references |
| `shared/AGENTS.md` | Shared layer import rules, locale system, constants, utilities | New "Certificate Namespace" and "Certificate Shared Types" sections |
| `backend/services/AGENTS.md` | Service layer patterns, naming, barrel structure | New "Certificate Services" section with subsections |
| `backend/graphql/AGENTS.md` | Pothos patterns, builder usage, DataLoader | New "Certificate Pothos Types" section with subsections |
| `backend/db/repo/AGENTS.md` | Repository pattern, barrel structure, test requirements | New "Certificate Repositories" section with subsections |
| `backend/db/seeds/AGENTS.md` | Seed data structure, demo data patterns | New "Certificate Seeds" section |
| `backend/types/AGENTS.md` | Type naming conventions, import rules | New "Certificate Types" section |
| `backend/enum/AGENTS.md` | Enum naming, location | New "Certificate Enums" section |
| `frontend/AGENTS.md` | Frontend patterns, MUI v9, Apollo, Zustand, i18n | New "Certificate Views" section with subsections |
| `frontend/views/AGENTS.md` | View organization, page components | New "Certificate Page Components" section with subsections |
| `frontend/common/stores/AGENTS.md` | Store naming, composition, mock stores | New "Certificate Stores" section with subsections |
| `frontend/common/graphql/AGENTS.md` | Document conventions, naming, imports | New "Certificate GraphQL Documents" section |
| `app/AGENTS.md` | Route conventions, server/client components | New "Certificate Routes" section with subsections |

---

## 12. Quality Verification Approach

This plan's quality verification differs from code-producing plans. There is no TypeScript compilation, no ESLint, and no test suite for documentation files. Quality verification consists of:

| Check | Method | Pass Criteria |
|------|--------|---------------|
| Documentation completeness | Review against requirements.md | All 13 documentation files exist and cover all required topics |
| No code snippets | Text search for code block markers | No code blocks exceeding 3 lines |
| Cross-reference validity | Link validation | All internal links resolve to existing files/sections |
| AGENTS.md accuracy | Content review | Certificate sections are accurate, non-duplicative, cross-referenced |
| Instruction file accuracy | Content review | Certificate subsections are accurate and non-duplicative |
| i18n completeness | Locale file review | All 12 knowledge keys defined in type schema, English, and Arabic |
| Skill recognition | Quality gate dry run | Quality gate `sub-loop.ts` correctly maps certificate file paths to instruction files |
| Documentation accuracy | Comparison with implementation | Documentation matches actual implementation in Plans 1–20 |

---

## Reality Check Notes

Verified against the actual codebase at `/home/ahmed/Projects/siraj-cert/` on 2026-08-02.

### Verified Correct
- **`docs/<domain>/` convention**: `docs/` uses domain-named subdirs (`docs/auth/`, `docs/drizzle/`, `docs/graphql/`, `docs/services/`) plus top-level topic docs (`docs/IDEMPOTENCY.md`, `docs/DATABASE_MIGRATIONS.md`). Creating a new `docs/certificates/` directory with `INDEX.md` + topic docs matches this established layout.
- **`frontend/views/AGENTS.md`**: EXISTS at `/frontend/views/AGENTS.md` (the deprecated-but-present top-level views rules file). The plan's references to `frontend/views/AGENTS.md` are CORRECT and were left unchanged.
- **`app/AGENTS.md`**: EXISTS. References (for "Certificate Routes" updates) are valid.
- **Layer-level `AGENTS.md` files** referenced for backend/frontend updates all exist: `backend/services/AGENTS.md`, `backend/graphql/AGENTS.md`, `backend/db/repo/AGENTS.md`, `backend/db/seeds/AGENTS.md`, `backend/types/AGENTS.md`, `backend/enum/AGENTS.md`, `frontend/AGENTS.md`, `frontend/common/graphql/AGENTS.md`.
- **"Important References" section**: the root `AGENTS.md` DOES have a `## Important References` section (line 407). Adding `docs/certificates/INDEX.md` to it (T9) is a valid, targeted edit.
- **spec-driven-development skill**: `.agents/skills/spec-driven-development/SKILL.md` matches the methodology described (three-phase Requirements/Design/Tasks, EARS format, outcome knowledge base under `.ai/plans/<feature>/outcome/`). Note: actual spec-plan location here is `.ai/draft_plans/cert/plans/` (the `draft_plans` variant), but the skill's `outcome/` protocol is preserved.

### Corrections Made
1. **Instruction files location**: Every reference to `.github/instructions/*.instructions.md` was changed to `.agents/instructions/*.instructions.md`. The actual instruction directory is `.agents/instructions/` (contains `backend.instructions.md`, `frontend.instructions.md`, `mobile-desktop.instructions.md`, `sonarqube_mcp.instructions.md`, `tests.instructions.md`). NO `.github/instructions/` directory exists. Affected files: requirements.md, design.md, tasks.md (T10 tasks, cross-reference tables, acceptance criteria).
2. **Frontend stores AGENTS.md path**: All `frontend/stores/AGENTS.md` references changed to `frontend/common/stores/AGENTS.md`. The stores AGENTS.md actually lives at `frontend/common/stores/AGENTS.md` (verified); `frontend/stores/` does NOT exist as a top-level dir. (Note: the root `AGENTS.md` and `MASTER_ARCHITECTURE.md` line 151 contain the same stale `frontend/stores/AGENTS.md` reference — that is a pre-existing repo bug, but the canonical file is at `frontend/common/stores/`.) The `frontend/stores/**/certificate*.ts` file-pattern glob was likewise corrected to `frontend/common/stores/**/certificate*.ts`.
3. **Public verify route segment**: `app/[locale]/verify/**/*.tsx` (design.md §file-pattern table) changed to `app/verify/**/*.tsx`. Siraj uses a custom **compile-time TypeScript i18n system** (`shared/locale/`), NOT Next.js native `[locale]` dynamic route segments. Plan 19 confirms the verification page lives at `app/verify/[code]/page.tsx` with no `[locale]` segment.

   Additionally, dashboard **admin** certificate routes (`requirements.md` §skills-table and `design.md` §3-route-patterns) referenced `app/[locale]/dashboard/certificates/`; this was corrected to `app/(dashboard)/certificates/`. There is NO `[locale]` segment anywhere in `app/` — dashboard domains live directly under `app/(dashboard)/` (verified `app/(dashboard)/students`, `app/(dashboard)/billing`, etc.). Locale is handled at runtime via `getLocale()`/compile-time i18n, not a route segment.

### Notes
- `frontend/views/AGENTS.md` itself declares `frontend/views/` is DEPRECATED (switchers/containers/moved to `frontend/common/views/`), but the file still exists and remains the documented home for view-layer rules referenced by the frontend instructions file. Updating it for cert view patterns is appropriate.
- The existing `.agents/instructions/tests.instructions.md` is the correct cross-reference target for `TESTING_PATTERNS.md` (was wrongly `.github/instructions/tests.instructions.md`).


---

## SWE Expert Review Notes

> Review performed 2026-08-02 against the actual codebase at `/home/ahmed/Projects/siraj-cert/`.

### Completeness

1. **Docs files — ALL SPECIFIED (P0 none).** The 13 `docs/certificates/*.md` files (INDEX, ARCHITECTURE, DATABASE_PATTERNS, SERVICE_PATTERNS, GRAPHQL_PATTERNS, FRONTEND_PATTERNS, STORAGE_PATTERNS, CRON_PATTERNS, TESTING_PATTERNS, I18N_PATTERNS, TEMPLATE_EDITOR, VERIFICATION_SYSTEM) are enumerated in design.md §2.1 with content tables. **Reality check:** `docs/certificates/` does NOT exist yet (verified — `docs/` currently has only `auth/`, `bun/`, `drizzle/`, `graphql/`, `services/`). The plan creates it. The existing canonical-doc precedent is `docs/services/entity-cache-service.md` and `docs/graphql/dataloader-batching.md` — these live in **per-domain subdirs** (`services/`, `graphql/`), NOT a per-feature flat dir. **Decision tension (P1):** the plan's DD-1 deliberately picks `docs/certificates/` (feature-flat) over the existing `docs/<domain>/` (domain-flat) convention. This is a defensible divergence (a feature spanning many domains needs a home), but it breaks the established pattern. **Fix/confirm:** add a one-line note in INDEX.md explaining the divergence ("certificate spans DB/services/GraphQL/frontend/storage/cron/i18n; a per-feature dir avoids spreading one feature across 7 domain dirs") and add a cross-link FROM each existing `docs/<domain>/` to relevant `docs/certificates/<LAYERS>.md` (e.g. `docs/graphql/` → `docs/certificates/GRAPHQL_PATTERNS.md`) so the canonical-domain indexes are not orphaned.
2. **AGENTS.md updates — COMPREHENSIVE (P0 none).** §3 lists 13 AGENTS.md files: root, shared, backend/services, backend/graphql, backend/db/repo, backend/db/seeds, backend/types, backend/enum, frontend, frontend/views, **frontend/common/stores**, frontend/common/graphql, app. **Reality check:** the Reality-Check section already corrected `frontend/stores/` → `frontend/common/stores/` (verified `frontend/common/stores/AGENTS.md` is the canonical path; `frontend/stores/` does NOT exist). Good. But note: §3.11 references `frontend/common/stores/AGENTS.md` for Zustand cert stores; confirm the dashboard cert plans (16–18) actually created Zustand stores — if generation/dialog/template-editor state lives in form state or URL params instead of Zustand, §3.11 is moot and should be dropped or generalized. **P2)** Cross-check against Plans 16–18 before writing the AGENTS.md section.
3. **Instruction files — ALL THREE COVERED.** §4 lists `frontend.instructions.md`, `backend.instructions.md`, `tests.instructions.md` (verified all three exist in `.agents/instructions/`). `mobile-desktop.instructions.md` is referenced in the Storybook row (§8.1) — correct, since cert template editor uses tier split. **Gap (P2):** `sonarqube_mcp.instructions.md` exists in `.agents/instructions/` but is not relevant to cert knowledge — correctly omitted. No `cron.instructions.md` exists — cron conventions go into `backend.instructions.md` (§4.2 lists "Certificate Cron Route Naming") — correct decision.
4. **Skills — COVERED.** §5.1 (review-frontend, review-backend, review-types, review-config), §5.2 (quality-gate sub-loop file-pattern → instruction/AGENTS mapping — this is the critical skill update), §5.3 (coding-agent, troubleshooting). **Reality check:** the `.agents/skills/` directory contains exactly the referenced skills (verified: `review-frontend`, `review-backend`, `review-types`, `review-config`, `quality-gate`, `quality-loop`, `repo-review`, `quality-assurance`, `troubleshooting`, etc. all exist). The quality-gate `sub-loop.ts` file-pattern mapping in §5.2 must be EXTENSIONS to the existing mapping, not replacements — state this explicitly so the implementer appends cert patterns rather than overwriting. **P2)** confirm which files in each skill dir hold the pattern map (`sub-loop.ts` for quality-gate per the design — verify this filename exists in `.agents/skills/quality-gate/`).
5. **completeness gaps — MISSING DOCS (P1):** Two high-value architectural documents are absent given the cert feature's scope:
   - **`PERMISSIONS_AUTH.md`** — cert introduces role gating (staff/admin/teacher scopes), manual-trigger admin mutations, public-query allow-list. There is `AUTH` spread across ARCHITECTURE/GRAPHQL_PATTERNS but a dedicated permissions doc is warranted (Siraj's security is permission-group based — verified `frontend/common/graphql/test/permissions/` exists). Either add this doc OR explicitly fold a strong Permissions section into GRAPHQL_PATTERNS §2 + a new ARCHITECTURE §"Security Boundaries".
   - **`SEEDS.md` / seed documentation** — only mentioned as §5 of DATABASE_PATTERNS. If the cert feature ships demo seeds (it does, per Plan 1), a dedicated seeds doc helps. Acceptable to keep in DATABASE_PATTERNS — judgment call.
   Confirm these are intentional folds, not omisns.

### Doc Structure

6. **Canonical structure NOT FOLLOWED (P0).** Verified the canonical Siraj doc structure via `docs/services/entity-cache-service.md` and `docs/graphql/dataloader-batching.md` — they begin with `## Why`, then architecture/data-flow, naming conventions, rules, etc. The **canonical Siraj doc structure is:** `## Why` · `## Architecture & Data Flow` · `## Key Naming Conventions` (or domain-specific) · `## Rules` · `## NOT to do` · `## Rollout` · `## Related`. The plan's per-file content tables (§2.3–§2.13) use a **different, ad-hoc section scheme** — e.g. ARCHITECTURE.md has "1. Feature Overview / 2. Architecture Layer Position / 3. Entity Model / 4. Data Flow-Client / 5. Data Flow-Server / 6. Layer Boundary Rules / 7. Related Documentation". This **does not include the canonical `## Why`, `## NOT to do`, or `## Rollout` sections** that the existing canonical docs use. **Fix:** restructure each `docs/certificates/*.md` content table to start with `## Why` (the canonical opening) and explicitly include a `## NOT to do` (anti-patterns) and `## Related` section. Some files already imply anti-patterns (I18N_PATTERNS §7 "Anti-Patterns") — rename to "NOT to do" for consistency. The `## Rollout` section (used in entity-cache-service to describe how to adopt) is missing entirely; for cert, "Rollout" can summarize the per-plan rollout sequence (Plans 1→22).
7. **`## Why` is mandatory and universally missing.** Every existing canonical Siraj doc opens with `## Why` explaining the motivation/job-to-be-done. The plan's content specs do NOT list `## Why` for any of the 13 files. **Fix (P0):** add `## Why` as section 1 of every `docs/certificates/*.md`. This is the single most important structural correction.

### AgENTS.md Reference Format

8. **Reference format — NOT VALIDATED (P1).** The plan says "add cross-reference to `docs/certificates/SERVICE_PATTERNS.md`" in each AGENTS.md but does not specify the **reference format**. Existing AGENTS.md files use specific link conventions (e.g. `[docs/services/entity-cache-service.md](docs/services/entity-cache-service.md)` or a "Documentation" section with bullet links). **Fix:** specify the exact markdown reference format to use (relative path from the AGENTS.md file's location — `docs/certificates/X.md` from a root AGENTS.md, but `../../docs/certificates/X.md` from `backend/services/AGENTS.md`, etc.). Relative-path correctness is easy to get wrong across deeply nested AGENTS.md files; state the convention explicitly and give one example per nesting level.
9. **New rules added to relevant AGENTS.md — YES, comprehensively.** §3 specifies the new section/subsection to add to each AGENTS.md. This is the right level of detail. **Risk (P2):** some of these AGENTS.md files are large and curating where to inject the new section matters (alphabetical? by feature? by recency?). State the insertion heuristic: "add cert sections after the existing per-domain sections, before the 'External references' footer if present" — or read each AGENTS.md and follow its existing structural pattern.
10. **Root AGENTS.md "Important References" — specified but username ("Important References") should be verified.** §3.1 says add `docs/certificates/INDEX.md` to "Important References". **Reality check:** verify the root `AGENTS.md` actually has a section titled "Important References" (it does, per other plans' reality-check notes) — confirm before editing.

### Reality-Check Corrections to Apply

A. **Adopt canonical doc structure (`## Why` first, plus `## NOT to do`, `## Related`, `## Rollout`)** across all 13 `docs/certificates/*.md` per-file content tables (issue #6, #7). This is the highest-priority fix.
B. **Add cross-links from existing `docs/<domain>/` dirs** (`graphql/`, `services/`, `drizzle/`, `auth/`) to the relevant `docs/certificates/<LAYER>.md` to avoid orphaning canonical-domain indexes (issue #1).
C. **Specify the AGENTS.md reference format** with relative-path examples per nesting level (issue #8).
D. **Confirm `frontend/common/stores/AGENTS.md` cert-store content actually applies** (Plans 16–18 may not use Zustand for cert state); drop or generalize §3.11 if not (issue #2).
E. **State that quality-gate `sub-loop.ts` edits are APPENDS**, not overwrites, and verify the filename (issue #4).
F. **Explicitly document `## Why` as section 1 of every file — in §2.1 content table column header "Section" or as a blanket rule** (issue #7).
G. **Decide on a dedicated `PERMISSIONS_AUTH.md`** or strengthen the Security section in ARCHITECTURE/GRAPHQL_PATTERNS (issue #5).

### Remaining Risks

- **Volume**: 13 files × 150–350 lines = ~2.8k lines of documentation produced by one plan. Risk of staleness within the same release cycle if Plans 16–22 are still iterating. **Mitigation:** run this plan LAST (after 22, not in parallel with 22 as the design suggests for cron conventions) — OR freeze the cert spec before authoring docs. The design says "Plan 22 runs in parallel... its cron conventions are documented as part of this plan based on Plan 22's requirements.md" — this couples two plans on a requirements doc that may drift from Plan 22's final implementation. **Fix:** either block Plan 21 T5 (CRON_PATTERNS.md) on Plan 22 completion, or accept that CRON_PATTERNS.md will need a post-22 revision pass — state which.
- **`knowledge` i18n sub-domain is unused surface (P2).** §7 speculates the 12 `knowledge.*` keys "might be generated from documentation metadata (e.g. if the documentation index is surfaced in an admin help panel)". If no admin help panel surfaces docs, these keys are dead code that must still be translated/maintained. **Fix:** drop the `knowledge` i18n sub-domain unless a concrete consumer exists in Plan 16/17/18 admin UI; introduce it then. Avoid speculative i18n keys.
- **No code-snippet rule (DD-2) may impair usability (P2).** Limiting docs to prose/tables/ASCII (no >3-line code blocks) reduces drift but also reduces onboarding speed and AI agent effectiveness (agents learn faster from real signatures than prose). Consider relaxing to allow **<5-line type signatures** (interface names + key method signatures) which are the least drift-prone code. Revisit DD-2.
