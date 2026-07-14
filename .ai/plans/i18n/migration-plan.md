# i18n Migration Plan v2: `next-intl` → Compile-Time TypeScript Translation System

## Overview

Migrate Siraj from `next-intl` (runtime string-based `t("x.y")`) to a custom compile-time TypeScript i18n system with:
- **Compile-time safety**: `t.x.y` instead of `t("x.y")`
- **Native TypeScript pluralization**: functions instead of ICU strings
- **Lazy loading**: standard dynamic `import()` per namespace
- **SSR & API support**: `getTranslations()` for server, `getServerTranslations()` for GraphQL/API
- **GraphQL context integration**: `ctx.t("namespace")` bound to `ctx.locale`
- **SEO routing preserved**: Next.js native `[locale]` segments + middleware (no `next-intl` routing dependency)

> **IMPORTANT**: We do NOT remove the `[locale]` folder from `app/`. Next.js's file-system routing already handles SEO locale URLs. We only remove the `next-intl` *library dependency*.

---

## Architecture

### Before (next-intl)
```
next-intl → getRequestConfig → messages/ar.ts (flat object) → useTranslations("auth.login") → t("email")
```

### After (Compile-Time System)
```
shared/locale/
  ├── types/          ← TypeScript interfaces (the "schema") — same as current types/
  ├── ar/             ← Arabic translation objects implementing the interfaces
  ├── en/             ← English translation objects implementing the interfaces
  ├── server.ts       ← getTranslations(locale, namespace) for SSR & API routes
  ├── server-graphql.ts ← getServerTranslations(locale, namespace) for GraphQL/API
  └── client.ts       ← useAppTranslation(namespace) hook for client components
```

---

## File Structure (Target)

```
shared/locale/
├── AppLocale.ts                      ← enum / type for supported locales
├── server.ts                         ← getTranslations<K>(locale, namespace) for SSR
├── server-graphql.ts                 ← getServerTranslations<K>(locale, namespace) for GraphQL/API
├── client.ts                         ← useAppTranslation<K>(namespace) hook
├── index.ts                          ← re-exports
│
├── types/
│   ├── auth/index.ts                 ← AuthLabels, AuthLoginLabels, etc.
│   ├── common/index.ts
│   ├── dashboard/
│   │   ├── admin/
│   │   │   ├── dashboard.ts
│   │   │   ├── dst.migration.ts
│   │   │   ├── index.ts
│   │   │   └── view.ts
│   │   ├── billing/
│   │   │   ├── index.ts
│   │   │   ├── main.ts
│   │   │   ├── manual.ts
│   │   │   ├── payment.ts
│   │   │   ├── exchange-rates.ts
│   │   │   ├── supported-currencies.ts
│   │   │   └── currency-hedges.ts
│   │   ├── classes/
│   │   ├── complaints/
│   │   ├── core/
│   │   ├── lms/
│   │   ├── managers/
│   │   ├── meeting-providers/
│   │   ├── parents/
│   │   ├── permissions/
│   │   ├── reports/
│   │   ├── resources/
│   │   ├── students/
│   │   ├── subjects/
│   │   ├── suggestions/
│   │   ├── teachers/
│   │   ├── payment-catalogs/
│   │   ├── lms/
│   │   ├── studentPortal/
│   │   ├── supervisorPortal/
│   │   └── ... (all 70+ sub-namespaces)
│   ├── errors/index.ts
│   ├── ui/index.ts
│   ├── profile.ts
│   ├── session/index.ts
│   └── message.ts                    ← MessageSchema (top-level map of all namespaces)
│
├── ar/
│   ├── auth/index.ts
│   ├── common/index.ts
│   ├── dashboard/
│   │   └── (mirrors types structure)
│   ├── errors.ts
│   ├── ui/index.ts
│   └── profile.ts
│
└── en/
    ├── auth/index.ts
    ├── common/index.ts
    ├── dashboard/
    │   └── (mirrors types structure)
    ├── errors.ts
    ├── ui/index.ts
    └── profile.ts
```

> **NOTE**: The existing `shared/messages/types/` and `shared/messages/ar/` and `shared/messages/en/` directories are **the schema and data we already have**. The migration is largely a structural reorganization + replacement of the access layer.

---

## Core Utilities (Already Built / To Extend)

### 1. `shared/locale/AppLocale.ts` ✅
```typescript
export const locales = ["ar", "en"] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = "ar";
```

### 2. `shared/locale/server.ts` ✅ (for SSR & API routes)
```typescript
export async function getTranslations<K extends keyof MessageSchema>(
  locale: string,
  namespace: K
): Promise<MessageSchema[K]> { ... }
```

### 3. `shared/locale/server-graphql.ts` ✅ (for GraphQL/API - no Next.js deps)
```typescript
export async function getServerTranslations<K extends keyof MessageSchema>(
  locale: string,
  namespace: K
): Promise<MessageSchema[K]> { ... }
```

### 4. `shared/locale/client.ts` ✅ (for client components)
```typescript
export function useAppTranslation<K extends keyof MessageSchema>(
  namespace: K
): MessageSchema[K] { ... }
```

### 5. `LocaleProvider` ✅ (bridges server translations to client)
```tsx
// frontend/common/providers/LocaleProvider.tsx
export const LocaleContext = createContext<MessageSchema | null>(null);
```

### 6. GraphQL Context Integration ✅
```typescript
// backend/graphql/gqlContext.ts
export type BaseContext = {
  // ...
  locale: string;
  t: <K extends keyof MessageSchema>(namespace: K) => Promise<MessageSchema[K]>;
};
```

---

## Pluralization Pattern

Replace ICU strings with TypeScript functions in the type schema and implementations:

```typescript
// types/dashboard/students.ts
export interface StudentDirectoryLabels {
  title: string;
  studentCount: (count: number) => string; // Typed function — compile-time safe!
}

// ar/dashboard/students.ts
export const studentDirectory: StudentDirectoryLabels = {
  title: "الطلاب",
  studentCount: (count) => {
    if (count === 0) return "لا يوجد طلاب";
    if (count === 1) return "طالب واحد";
    if (count === 2) return "طالبان";
    if (count >= 3 && count <= 10) return `${count} طلاب`;
    return `${count} طالباً`;
  },
};

// en/dashboard/students.ts
export const studentDirectory: StudentDirectoryLabels = {
  title: "Students",
  studentCount: (count) =>
    count === 0 ? "No students" : count === 1 ? "1 student" : `${count} students`,
};
```

**Usage:**
```tsx
const t = useAppTranslation("dashboard");
<p>{t.studentDirectory.studentCount(42)}</p>  // "42 طالباً"
```

---

## Handling Interpolation (`{name}`, `{email}` placeholders)

Current next-intl translations use `{name}` ICU placeholders:
```typescript
// ar/auth/index.ts  (current)
bannerLoggedInAs: "أنت مسجل الدخول باسم {name}."
```

Replace with TypeScript template function in the type schema:
```typescript
// types/auth/index.ts (new)
export interface AuthImpersonationLabels {
  bannerLoggedInAs: (name: string) => string;  // was: string with {name}
  bannerViewingAs: (name: string, email: string) => string;
  actorIdentity: (name: string) => string;
  confirmTitle: (name: string) => string;
  bannerSimulatingAs: (name: string) => string;
  // purely static strings stay as string
  returnToNormalLogin: string;
  exit: string;
  loginAs: string;
  // ...
}

// ar/auth/index.ts (new)
export const auth: AuthLabels = {
  impersonation: {
    bannerLoggedInAs: (name) => `أنت مسجل الدخول باسم ${name}.`,
    bannerViewingAs: (name, email) => `أنت تعرض لوحة التحكم باسم ${name} (${email})`,
  }
};
```

**Usage:**
```tsx
<p>{t.impersonation.bannerLoggedInAs("أحمد")}</p>
```

---

## 16-Wave Migration Plan (5 namespaces per wave = 80 total)

Each wave: **8 parallel subagents** (each handles 1 namespace end-to-end). Subagents can spawn nested subagents for complex namespaces.

### What each subagent does per namespace:
1. **Copy type schema**: `shared/messages/types/<ns>` → `shared/locale/types/<ns>`
   - Convert `{placeholder}` string fields → `(param: type) => string` functions
2. **Copy Arabic translations**: `shared/messages/ar/<ns>` → `shared/locale/ar/<ns>`
   - Update implementations to use function syntax
3. **Copy English translations**: `shared/messages/en/<ns>` → `shared/locale/en/<ns>`
   - Update implementations to use function syntax
4. **Register in `MessageSchema`** (`shared/locale/types/message.ts`)
5. **Register namespace path** in `shared/locale/server.ts` (`namespacePaths` map)
6. **Migrate all frontend usages**: `useTranslations("ns")` → `useAppTranslation("ns")`
7. **Migrate all SSR usages**: `getTranslations({locale, namespace})` → `getTranslations(locale, "ns")`
8. **Migrate all GraphQL resolvers**: `getBackendTranslations(...)` → `ctx.t("ns")`
9. **Migrate all API routes**: `getBackendTranslations` → `getServerTranslations`
10. **Run per-file quality**: `tsgo` → `biome:check` → lint-queue on all modified files

---

### Wave 1 — Core Foundation (5 namespaces)
| # | Namespace | Key Files |
|---|-----------|-----------|
| 1 | `auth` | login page + 4 components (✅ pilot done) |
| 2 | `common` | layout, shared UI |
| 3 | `errors` | error pages, API routes, GraphQL errors |
| 4 | `ui` | shared UI components |
| 5 | `profile` | profile page |

### Wave 2 — Dashboard Core (5 namespaces)
| # | Namespace | Key Files |
|---|-----------|-----------|
| 6 | `dashboard.core.nav` | sidebar navigation |
| 7 | `dashboard.core.layout` | layout wrapper |
| 8 | `dashboard.core.notifications` | notifications |
| 9 | `dashboard.core.statusTracking` | status tracking |
| 10 | `dashboard.core.scheduleAlerts` | schedule alerts |

### Wave 3 — Dashboard Teachers (5 namespaces)
| # | Namespace | Key Files |
|---|-----------|-----------|
| 11 | `dashboard.teachers.dashboard` | teacher dashboard |
| 12 | `dashboard.teachers.directory` | teachers list |
| 13 | `dashboard.teachers.availability` | teacher availability |
| 14 | `dashboard.teachers.weeklySchedule` | weekly schedule |
| 15 | `dashboard.teachers.futureSchedule` | future schedule |

### Wave 4 — Dashboard Teachers (5 namespaces)
| # | Namespace | Key Files |
|---|-----------|-----------|
| 16 | `dashboard.teachers.onboarding` | teacher onboarding |
| 17 | `dashboard.teachers.reassignment` | teacher reassignment |
| 18 | `dashboard.teachers.profile` | teacher profile |
| 19 | `dashboard.teachers.ownProfile` | own profile |
| 20 | `dashboard.teachers.classList` | class list |

### Wave 5 — Dashboard Teachers / Classes (5 namespaces)
| # | Namespace | Key Files |
|---|-----------|-----------|
| 21 | `dashboard.teachers.createRecurringClass` | recurring class |
| 22 | `dashboard.classes.details` | class detail page |
| 23 | `dashboard.classes.audit` | class audit |
| 24 | `dashboard.classes.rescheduleTracking` | reschedule tracking |
| 25 | `dashboard.classes.rescheduleForm` | reschedule form |

### Wave 6 — Dashboard Students (5 namespaces)
| # | Namespace | Key Files |
|---|-----------|-----------|
| 26 | `dashboard.students.directory` | students list |
| 27 | `dashboard.students.profile` | student profile |
| 28 | `dashboard.students.history` | student history |
| 29 | `dashboard.students.quota` | student quota |
| 30 | `dashboard.students.status` | student status |

### Wave 7 — Dashboard Students / Parents (5 namespaces)
| # | Namespace | Key Files |
|---|-----------|-----------|
| 31 | `dashboard.students.onboarding` | student onboarding |
| 32 | `dashboard.parents.directory` | parents list |
| 33 | `dashboard.parents.profile` | parent profile |
| 34 | `dashboard.parents.onboarding` | parent onboarding |
| 35 | `dashboard.parents.lifecycle` | parent lifecycle |

### Wave 8 — Dashboard Parents / Managers (5 namespaces)
| # | Namespace | Key Files |
|---|-----------|-----------|
| 36 | `dashboard.parents.students` | parent students |
| 37 | `dashboard.parents.rules` | parent rules |
| 38 | `dashboard.parents.social` | parent social |
| 39 | `dashboard.managers.directory` | managers list |
| 40 | `dashboard.managers.onboarding` | manager onboarding |

### Wave 9 — Dashboard Admin (5 namespaces)
| # | Namespace | Key Files |
|---|-----------|-----------|
| 41 | `dashboard.admin.dashboard` | admin dashboard |
| 42 | `dashboard.admin.view` | admin view |
| 43 | `dashboard.admin.dstMigration` | DST migration |
| 44 | `dashboard.permissions.main` | permissions |
| 45 | `dashboard.reports.main` | reports page |

### Wave 10 — Dashboard Billing (5 namespaces)
| # | Namespace | Key Files |
|---|-----------|-----------|
| 46 | `dashboard.billing.main` | billing main |
| 47 | `dashboard.billing.payment` | payments |
| 48 | `dashboard.billing.exchangeRates` | exchange rates |
| 49 | `dashboard.billing.supportedCurrencies` | currencies |
| 50 | `dashboard.billing.currencyHedges` | currency hedges |

### Wave 11 — Dashboard Billing / Complaints / Resources (5 namespaces)
| # | Namespace | Key Files |
|---|-----------|-----------|
| 51 | `dashboard.billing.manual` | manual billing |
| 52 | `dashboard.complaints.main` | complaints |
| 53 | `dashboard.resources.main` | resources |
| 54 | `dashboard.subjects.main` | subjects |
| 55 | `dashboard.paymentCatalogs.main` | payment catalogs |

### Wave 12 — Dashboard LMS / Student Portal (5 namespaces)
| # | Namespace | Key Files |
|---|-----------|-----------|
| 56 | `dashboard.lms.credit` | LMS credit |
| 57 | `dashboard.lms.lessonReports` | lesson reports |
| 58 | `dashboard.lms.teacherDues` | teacher dues |
| 59 | `dashboard.lms.monthlyReports` | monthly reports |
| 60 | `dashboard.studentPortal.dashboard` | student portal |

### Wave 13 — Dashboard Student Portal / Supervisor Portal (5 namespaces)
| # | Namespace | Key Files |
|---|-----------|-----------|
| 61 | `dashboard.studentPortal.credits` | student credits |
| 62 | `dashboard.supervisorPortal.dashboard` | supervisor dashboard |
| 63 | `dashboard.supervisorPortal.pendingReviews` | pending reviews |
| 64 | `dashboard.supervisorPortal.teacherDues` | supervisor teacher dues |
| 65 | `dashboard.supervisorPortal.monthlyReports` | supervisor monthly |

### Wave 14 — Dashboard Meeting Providers / Suggestions / Search (5 namespaces)
| # | Namespace | Key Files |
|---|-----------|-----------|
| 66 | `dashboard.meetingProviders.main` | meeting providers |
| 67 | `dashboard.suggestions.main` | suggestions |
| 68 | `dashboard.searchSchedule.main` | search schedule |
| 69 | `dashboard.classes.main` | classes main |
| 70 | `dashboard.classes.index` | classes index |

### Wave 15 — Dashboard Books & Bags / Session / Remaining (5 namespaces)
| # | Namespace | Key Files |
|---|---|---|
| 71 | `dashboard.booksAndBags.main` | books and bags |
| 72 | `session` | session management |
| 73 | `dashboard.classAudit` | class audit |
| 74 | `dashboard.teacherCreateRecurringClass` | teacher recurring class |
| 75 | `dashboard.dstMigration` | DST migration |

### Wave 16 — Cleanup & Final (5 items)
| # | Item |
|---|------|
| 76 | Delete `shared/messages/` directory |
| 77 | Delete `shared/i18n/request.ts` |
| 78 | Strip next-intl imports from `shared/i18n/routing.ts` |
| 79 | Remove `next-intl` from `package.json` |
| 80 | Remove `next-intl` plugin from `next.config.ts`, remove `IntlMessages` from `global.d.ts` |

---

## Subagent Execution Model

**Per wave (8 parallel subagents):**
- Each subagent owns **1 namespace** completely (types + ar + en + all usages)
- Subagent **runs per-file quality loop** after each file: `tsgo` → `biome:check` → lint-queue (via HTTP POST to localhost:4777)
- Subagent **spawns nested subagents** if a namespace has >5 component files
- Subagent **reports cross-file dependencies** using CROSS-FILE DEPENDENCY format if fixing requires changes outside assigned namespace

**Quality gate per wave:**
- All 8 subagents must complete + pass per-file checks
- Then run wave-level `tsgo` + `biome:check` on all modified files
- Only then advance to next wave

---

## What Changes at Call Sites

| Before (next-intl) | After (Compile-Time) |
|---|---|
| `import { useTranslations } from "next-intl"` | `import { useAppTranslation } from "@/shared/locale/client"` |
| `const t = useTranslations("auth.login")` | `const t = useAppTranslation("auth").login` |
| `t("email")` | `t.email` ✅ compile-time |
| `t("bannerLoggedInAs", { name })` | `t.bannerLoggedInAs(name)` ✅ typed args |
| `import { getTranslations } from "next-intl/server"` | `import { getTranslations } from "@/shared/locale/server"` |
| `await getTranslations({ locale, namespace: "auth.login" })` | `(await getTranslations(locale, "auth")).login` |
| `t("pageTitle")` | `t.pageTitle` ✅ compile-time |
| GraphQL: `getBackendTranslations({locale, namespace})` | `await ctx.t("errors"); tErrors.auth.invalidCredentials` |
| API routes: `getBackendTranslations` | `await getServerTranslations(locale, "errors")` |

---

## Routing — No Change Required

The `[locale]` folder in `app/[locale]/` is **native Next.js routing**, not a next-intl feature. It stays exactly as-is. The cookie/header-based locale detection in `shared/i18n/request.ts` is also independent — we replicate its logic in our `getTranslations` server utility.

We stop using: `createNavigation`, `getRequestConfig`, `defineRouting` from next-intl.
We keep using: `next/navigation`'s `Link`, `redirect`, `usePathname`, `useRouter` directly.

---

## Files to Update in AGENTS.md (Shared Layer)

Add these conventions to `shared/AGENTS.md` (or root AGENTS.md):

### Translation System Rules
- **All user-facing strings** must come from `shared/locale/{ar,en}/...` via the compile-time access layer
- **Never use** `next-intl` hooks (`useTranslations`, `getTranslations`) in new code
- **Server Components**: use `getTranslations(locale, "namespace")` from `@/shared/locale/server`
- **Client Components**: use `useAppTranslation("namespace")` from `@/shared/locale/client`
- **GraphQL Resolvers**: use `ctx.t("namespace")` — already bound to `ctx.locale`
- **API Routes / Scripts / Tests**: use `getServerTranslations(locale, "namespace")` from `@/shared/locale/server-graphql`
- **Pluralization**: define as `(count: number) => string` in type schema, implement in each locale file
- **Interpolation**: define as `(param: string, ...) => string` in type schema, implement with template literals
- **Namespace registration**: add to `MessageSchema` in `shared/locale/types/message.ts` AND to `namespacePaths` in `shared/locale/server.ts`

### Adding a New Namespace
1. Create `shared/locale/types/<namespace>/index.ts` with interfaces (functions for plural/interpolation)
2. Create `shared/locale/ar/<namespace>/index.ts` implementing interfaces
3. Create `shared/locale/en/<namespace>/index.ts` implementing interfaces
4. Add export to `shared/locale/types/message.ts` (MessageSchema)
5. Add path mapping to `namespacePaths` in `shared/locale/server.ts`
6. If used in layout SSR, add to `LocaleProvider` translations in `app/[locale]/layout.tsx`
7. Run `tsgo` + `biome:check` + lint-queue on all new files

---

## Migration Status Tracking

| Namespace | Types | AR | EN | Frontend | SSR | GraphQL | API | Quality | Wave |
|-----------|-------|----|----|----------|-----|---------|-----|---------|------|
| `auth` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | ✅ | 1 |
| `common` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 1 |
| `errors` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 1 |
| `ui` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 1 |
| `profile` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 1 |
| `dashboard.core.nav` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 2 |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

(Continue tracking for all 77 namespaces)