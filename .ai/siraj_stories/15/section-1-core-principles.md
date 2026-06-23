## Section 1: Core Principles & Strict Rules (Mandatory Checklist)

### 1.1 Service Layer Architecture

- [ ] **NO monolithic services** — Services are scoped to domain-driven concerns: `SuggestionService`, `ComplaintService`, `CommunicationService`.
- [ ] **Business logic centralization** — All orchestration, validation, permission gating resides in services, NOT repositories or resolvers.
- [ ] **🚫 Services MUST NOT import from DB/Drizzle** — Services can ONLY depend on the repository layer (`backend/db/repo/`).
- [ ] **Provider/Adapter/Factory pattern** — Each communication channel (email, SMS, push) MUST follow the established codebase pattern:
  - **Interface** (`IEmailChannel`, `ISmsChannel`, `IPushChannel`) — pure contract
  - **Adapter** (`ResendEmailAdapter`, `TwilioSmsAdapter`, `FcmPushAdapter`) — provider implementation
  - **Factory** (`EmailChannelFactory`, `SmsChannelFactory`, `PushChannelFactory`) — reads env var, creates singleton
  - **Singleton access** — lazy initialization with `initializationPromise` race-condition prevention
  - **Reset for testing** — `resetEmailChannel()`, `resetSmsChannel()`, `resetPushChannel()`
- [ ] **Env-driven provider selection** — Each channel reads a provider env var (`EMAIL_PROVIDER`, `SMS_PROVIDER`, `PUSH_PROVIDER`) to select the adapter. Unknown providers log a warning and fall back to the default (or throw if no safe default exists).

### 1.1b GraphQL Resolver Architecture

- [ ] **🚫 GraphQL Resolvers MUST NOT import from DB/Repo** — Pothos resolvers can ONLY depend on the service layer.
- [ ] **Resolvers are thin adapters** — Validate input → call service → return result.
- [ ] **Locale propagation** — All resolvers pass `ctx.locale` to service calls.

### 1.2 Type Safety — NO `any`, NO Casts

- [ ] **Strict Type Narrowing** — BANNED: `any`, `as any`, `as unknown as`.
- [ ] **No route param casts** — Use safety checks like `typeof params?.id === "string"`.
- [ ] **Generated GraphQL types first** — Re-export from `graphql-types.ts`; define UI-specific types only when no generated equivalent exists.

### 1.2b Task Ordering & Dependency Integrity

- [ ] **No forward dependencies** — A task MUST NOT depend on code introduced by a later task.
- [ ] **Layered build order** — DB/Schema → Repositories → Repo Tests → System Settings → Communication Channels → Services → Service Tests → GraphQL Pothos → Frontend Documents → GraphQL Tests → Type Extraction → Storybook → Stores → Views → i18n.
- [ ] **Self-contained tasks** — After each task, the project compiles and passes quality gates.
- [ ] **Test tasks immediately follow implementation** — Repo tests follow repos. Service tests follow services. GraphQL tests follow documents.
- [ ] **Database Migration task protocol** — Migration → `bun db cleanGenerate` → `bun db reset` → `bun db seed` → `bun test:db`.

### 1.3 Zero Incomplete Implementation Policy

| **Prohibited Pattern** | **Required Instead** | **Verification Command** |
|---|---|---|
| `// TODO`, `// FIXME` | Fully working implementation | `rg -i "TODO\|FIXME" backend/services/communication/` |
| `throw new Error("Not implemented")` | Complete adapter implementation | Manual code review |
| Service importing from `drizzle-orm` | Service depends ONLY on `backend/db/repo/` | `rg "from ['\"]drizzle" backend/services/` |
| GraphQL resolver importing from `backend/db` | Resolver depends ONLY on `backend/services/` | `rg "from ['\"]backend/db" backend/graphql/pothos/` |
| Mock store in production views | Real `useQuery` with `TypedDocumentNode` | `rg "mock.*Store" frontend/views --glob "!**/*.stories.tsx"` |
| Hardcoded provider credentials | Env vars only | `rg "RESEND_API_KEY\|TWILIO" backend/ --glob "!*.env*"` |

### 1.4 Provider/Adapter Pattern Rules (Communication Channels)

- [ ] **Interface per channel** — Each channel defines a TypeScript interface with all operations (send, validate, etc.)
- [ ] **Adapter per provider** — Each provider implements the interface. Adapters are in subdirectories: `channels/email/resend/`, `channels/sms/twilio/`, `channels/push/fcm/`
- [ ] **Factory per channel** — Reads `EMAIL_PROVIDER` / `SMS_PROVIDER` / `PUSH_PROVIDER` env var, creates the appropriate adapter, manages singleton lifecycle
- [ ] **Env var type declarations** — All new env vars declared in `environment.d.ts`
- [ ] **Graceful degradation** — If a provider fails, the channel logs the error and returns a result object (`{ success: false, error: string }`). Failures in one channel do NOT block other channels (use `Promise.allSettled` for multi-channel dispatch).
- [ ] **Delivery tracking** — Every channel implementation creates a `notificationDeliveries` record BEFORE calling the provider API, then updates status to SENT/FAILED after the call.

### 1.5 Data Persistence & Mock Migration

- [ ] **NO dummy data in production** — Replace all mock stores with real GraphQL-backed stores.
- [ ] **Complete transaction boundaries** — Multi-table writes are atomic.
- [ ] **Soft-delete for suggestions** — `deletedAt` column added, consistent with `complaints` pattern.
- [ ] **File attachment cleanup** — When complaint is soft-deleted, associated files remain (no automatic cleanup). Hard-delete cascades via FK.

### 1.6 Logging & Observability

- [ ] **Logger utility mandatory** — `import { logger } from '@/backend/lib/logger'` (backend).
- [ ] **Console methods forbidden** — ESLint rejects `console.log/warn/error/debug`.
- [ ] **Provider errors logged** — All provider API failures logged with `logger.error` including provider name, event type, and user ID.

### 1.7 Testing Requirements

**Repository Tests** (`backend/db/test/repo/`):
- [ ] **100% line + function coverage** on all new/modified repository methods.
- [ ] **Success AND failure paths** — Valid input, invalid input, not-found, transaction rollback.
- [ ] **IDOR protection tests** — Parent A cannot access Parent B's suggestions.

**Service Tests** (`backend/services/communication/test/`):
- [ ] **Provider adapter tests** — Each adapter tested with mocked provider API calls.
- [ ] **Factory tests** — Env var selection, fallback behavior, singleton lifecycle.
- [ ] **Rate limiting tests** — SMS rate limit enforcement.

**GraphQL Integration Tests** (`frontend/graphql/test/`):
- [ ] **Authorized success + unauthorized denial** for every new query/mutation.
- [ ] **Duplicate linking tests** — Circular reference prevention, self-duplicate prevention.

**Coverage Verification Command:**
```bash
bun run test:coverage backend/db/test/repo/<domain>.repository.test.ts
```
