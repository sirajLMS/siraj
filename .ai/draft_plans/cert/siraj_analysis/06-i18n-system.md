# 06 — i18n System Analysis (`shared/locale/`)

> Source of truth: `shared/AGENTS.md` (§ "Translation System (Compile-Time i18n)") and the actual code in `shared/locale/`.
> This document reflects the **current implementation** in the repository (which supersedes some of the file-structure diagrams in `shared/AGENTS.md`).

---

## 1. Architecture Overview

Siraj uses a **custom compile-time TypeScript i18n system** in `shared/locale/`. NOT `next-intl` (fully removed from `package.json`).

Core properties:
- **Compile-time safety**: `t.x.y` (property access) instead of `t("x.y")` (string lookup). IDE autocomplete + TS errors on missing keys.
- **Native TS pluralization**: `(count: number) => string` functions instead of ICU MessageFormat strings.
- **Lazy loading**: standard dynamic `import()` per namespace — only needed translation chunks load.
- **Dual server/client surface**: a synchronous server bundle (`server.ts`) and a Suspense-aware client cache (`client/`).
- **RTL**: handled by `<html dir>` attribute + Emotion RTL cache plugin — no third-party i18n routing.

### Layer Dependency (from `shared/AGENTS.md`)
- `shared/` sits **below** `app/`, `frontend/`, `backend/`. Nothing in `shared/` may import from those layers (ESLint `no-restricted-imports`).
- `shared/locale/` is therefore backend/enum-free; event-type keys are reproduced as string-literal unions (see `types/notifications/index.ts` header).

---

## 2. Actual File Structure (verified Nov 2025)

> NOTE: `shared/AGENTS.md` § "File Structure" shows `serverLegacy.ts` / `server-graphql-legacy.ts` / `clientLegacy.ts` / `types/message.ts` — these names are **stale**. The actual files are `server.ts`, `server-graphql.ts`, and the `client/` dir. `types/message.ts` does exist and is the canonical schema.

```
shared/locale/
├── AppLocale.ts                 ← locale const + type + defaultLocale
├── index.ts                     ← public barrel re-exports
├── server.ts                    ← getTranslations(locale): Translations (sync, server bundle)
├── server-graphql.ts            ← getServerTranslations(locale): thin alias of getTranslations
├── server-cookies.ts            ← getLocale(): Promise<AppLocale> from cookie + Accept-Language
├── localeContext.tsx            ← React Context (useAppLocale, LocaleContext)
│
├── client/
│   ├── index.ts                 ← client barrel
│   ├── namespace-registry.ts     ← Map<handle, loader-config> (side-effect registration)
│   ├── translation-cache-store.ts ← inflight + value cache, throws promise on miss
│   ├── translation-cache.tsx     ← <TranslationProvider> = <Suspense> wrapper
│   ├── use-app-translation.ts    ← useAppTranslation(handle) — locale from context
│   ├── use-translation.ts        ← useTranslation(handle, locale) — explicit locale
│   ├── preload.ts                ← preloadNamespaces(...handles) for both locales
│   └── snapshot-cache.ts         ← IndexedDB fallback (insecure contexts only)
│
├── namespaces/                  ← defineNamespace() calls (one per leaf)
│   ├── define-namespace.ts      ← defineNamespace(id?, config): NamespaceHandle<TLabels>
│   ├── translation.ts           ← `Translation` const tree (handle registry, see §4)
│   ├── index.ts                 ← barrel of all namespace handles + Translation
│   ├── auth/ common/ emails/ errors/ notifications/
│   ├── onboarding/ profile/ session/ sms/ ui/
│   └── dashboard/<domain>/<leaf>.namespace.ts   (≈ 90 leaves)
│
├── types/                       ← TypeScript interfaces ("the schema")
│   ├── message.ts               ← Translations (top), DashboardTranslations, UiTranslations, ProfileTranslations
│   ├── auth/ common/ emails/ errors/ notifications/ onboarding/ profile/ session/ sms/ ui/
│   └── dashboard/<domain>/<leaf>.ts  (mirrors namespaces/)
│
├── ar/                          ← Arabic implementations (left)  ┐ mirrored structure
│   ├── messages.ts             ← arMessages: Translations (static import bundle)
│   ├── auth/ common/ dashboard/... etc.
└── en/                          ← English implementations (right) ┘
    ├── messages.ts             ← enMessages: Translations (static import bundle)
    └── ...
```

Two **parallel** trees (`namespaces+types` vs `ar/en`):
- `types/` = interfaces (shape contracts)
- `ar/` & `en/` = concrete export objects implementing those interfaces
- `namespaces/` = `defineNamespace()` calls wiring types↔ar/en loaders

---

## 3. Locale Definition (`AppLocale.ts`)

`shared/locale/AppLocale.ts`:
```typescript
export const locales = ["ar", "en"] as const;
export type AppLocale = (typeof locales)[number];          // "ar" | "en"
export const defaultLocale: AppLocale = "ar";              // ← Arabic is default
```

- **Two locales**: `ar` (Arabic, **default**) and `en` (English).
- Default resolved by `defaultLocale` and used as a fallback when the incoming locale string is unknown (`resolveLocale` in `server.ts`).

### Locale resolution (server)
`shared/locale/server-cookies.ts` → `getLocale(): Promise<AppLocale>`:
1. Cookie `NEXT_LOCALE` (if value ∈ locales).
2. `Accept-Language` header (`ar` / `en` substrings).
3. `defaultLocale` (`"ar"`).

Locale is **cookie-based**, not URL-based — there is **no `[locale]` route segment**. GraphQL context (`backend/graphql/gqlContext.ts`) sets `ctx.locale` and binds `ctx.t = () => getServerTranslations(locale)`.

Client-side switching: `POST/GET /api/set-locale` (`app/api/set-locale/route.ts`) sets the `NEXT_LOCALE` cookie (1-year, non-httpOnly, lax) and redirects (GET) / returns JSON (POST).

---

## 4. Namespace Pattern (`defineNamespace`)

`shared/locale/namespaces/define-namespace.ts`:
```typescript
export interface NamespaceHandle<TLabels> {
  readonly __labels?: TLabels;
  readonly [NAMESPACE_ID_SYMBOL]?: string;     // stable id for snapshot cache
}
export interface NamespaceLoaderConfig<TLabels> {
  readonly load: Record<AppLocale, () => Promise<TLabels>>;   // ar + en loaders
}
export function defineNamespace<TLabels>(id: string, config: NamespaceLoaderConfig<TLabels>): NamespaceHandle<TLabels>;
export function defineNamespace<TLabels>(config: NamespaceLoaderConfig<TLabels>): NamespaceHandle<TLabels>;
```

A **namespace handle** is an opaque empty object carrying:
1. A `Symbol.for("siraj.namespace.id")` string (the first `id` arg) — used as the IndexedDB snapshot key. **Passing a stable id is REQUIRED per `shared/AGENTS.md`** ("Adding New Namespaces").
2. A registration side-effect: `registerNamespace(handle, config)` stores the loader config in `client/namespace-registry.ts`.

### Id convention (verified)
- dotted type: `"common.common"`, `"auth.login"`, `"dashboard.students.directory"`, `"errors.errors"`, `"emails.emails"`.
- Always `<domain>.<leaf-or-domain>`.

### The `Translation` registry (`namespaces/translation.ts`)
`namespaces/translation.ts` builds a single **`as const` object tree** mapping friendly display names → handle imports:
```typescript
import { AuthLogin } from "@/shared/locale/namespaces/auth/login.namespace";
import { Common } from "@/shared/locale/namespaces/common/common.namespace";
// … ~110 handle imports
export const Translation = {
  Auth: { Login: AuthLogin, Impersonation: AuthImpersonation, GroupSimulation: AuthGroupSimulation },
  Common,
  Errors, Emails, Session, Sms, Notifications,
  Onboarding: { UserEntity: OnboardingUserEntity },
  Profile: { Base, Teacher, Parent, Staff, Notifications },
  Dashboard: { Billing: DashboardBilling, StudentDirectory: DashboardStudentDirectory, /* … 90+ */ },
  Ui: { CountrySelect: UiCountrySelect, /* … */ },
} as const;
```

**Client usage** (the canonical access pattern):
```typescript
import { Translation, useAppTranslation } from "@/shared/locale";
const t = useAppTranslation(Translation.Auth.Login);   // t.login.pageTitle etc.
const t = useAppTranslation(Translation.Ui.PhoneInput);
```
(See `frontend/views/auth/login/useLoginViewModel.ts`, `frontend/common/hooks/useImageUpload.ts`.)

**Important distinction**: The `Translation` tree handle names (`Billing`, `StudentDirectory`) do NOT necessarily match the server-bundle keys (`billing`, `studentDirectory`). They are two parallel access surfaces (see §5 vs §6).

---

## 5. Server-Side Translations (`server.ts`)

`shared/locale/server.ts` is the **synchronous** server surface:
```typescript
import { arMessages } from "@/shared/locale/ar/messages";
import { enMessages } from "@/shared/locale/en/messages";

const messagesByLocale: Record<AppLocale, Translations> = { ar: arMessages, en: enMessages };

function resolveLocale(locale: string): AppLocale {
  return (locales as readonly string[]).includes(locale) ? (locale as AppLocale) : defaultLocale;
}
export function getTranslations(locale: string): Translations {
  return messagesByLocale[resolveLocale(locale)];
}
export function loadAllTranslations(locale: string): Translations { return getTranslations(locale); }
```

- **Static import**: `ar/messages.ts` and `en/messages.ts` statically import **every** leaf module and assemble the full `Translations` object (see `ar/messages.ts:1-249`, ~250 lines of imports + a nested object). This means the server bundle includes **all** translations (no lazy loading) — appropriate for SSR where you may render any namespace.
- **Synchronous** (not a Promise) — call as `getTranslations(locale).namespaceTranslations.field`.
- **No namespace handle** — keys are the **Translations npm** (`authTranslations`, `commonTranslations`, `errorsTranslations`, `emailsTranslations`, `sessionTranslations`, `smsTranslations`, `uiTranslations`, `dashboardTranslations`, `profileTranslations`, `notificationsTranslations`) → groups (`billing`, `studentDirectory`, `coreLayout`, …).

### Translations schema (`types/message.ts`)
```typescript
export type Translations = {
  authTranslations: AuthLabels;
  commonTranslations: CommonLabels;
  errorsTranslations: ErrorsLabels;
  emailsTranslations: EmailsLabels;
  sessionTranslations: SessionLabels;
  smsTranslations: SmsLabels;
  uiTranslations: UiTranslations;          // collected interface in message.ts
  dashboardTranslations: DashboardTranslations;  // collected ~80 leaf interfaces
  profileTranslations: ProfileTranslations;
  notificationsTranslations: NotificationsLabels;
};
```
`DashboardTranslations` and `UiTranslations` are **collector interfaces** defined in `message.ts` (`dashboardTranslations: { billing: BillingLabels; studentDirectory: StudentDirectoryLabels; … }`).

### Server Component usage (`app/**/*.tsx`)
Per `app/AGENTS.md` and verified across ~60 page files:
```typescript
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export default async function Page() {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.studentDirectory;
  return <h1>{t.pageTitle}</h1>;
}
```
- Server components pass **already-translated strings as props** to client components (do not call `useAppTranslation` on the server).
- Note `getTranslations` is **imported from `@/shared/locale`** (the barrel re-exports `server.ts`).

---

## 6. GraphQL / API / Scripts Translations (`server-graphql.ts`)

`shared/locale/server-graphql.ts`:
```typescript
import { getTranslations } from "@/shared/locale/server";
export function getServerTranslations(locale: string): ReturnType<typeof getTranslations> {
  return getTranslations(locale);
}
```
A thin alias on `getTranslations` — provided so non-React server code (API routes, scripts, tests, GraphQL) imports from a clearly-named module.

### GraphQL context
`backend/graphql/gqlContext.ts` wires it:
```typescript
import { getServerTranslations, type Translations } from "@/shared/locale";
// inside context builder:
{
  locale,
  t: () => getServerTranslations(locale),   // ctx.t() → full Translations
}
```
Resolvers consume:
```typescript
resolve: async (_parent, args, ctx) => {
  const tErrors = ctx.t().errorsTranslations;          // NB: property chain, NOT ctx.t("errors")
  throw new GraphQLError(tErrors.auth.invalidCredentials, ...);
}
```
> Note: `shared/AGENTS.md` shows `await ctx.t("errors")`; the **actual** code is synchronous `ctx.t()` returning the whole `Translations` (verified in `gqlContext.ts:70` and `gqlContext.ts:96`). Treat the AGENTS example as a stylistic guide, not the literal signature.

### API routes / scripts / tests
```typescript
import { getServerTranslations } from "@/shared/locale";
const t = getServerTranslations(locale).errorsTranslations;
return NextResponse.json({ error: t.auth.notFound }, { status: 404 });
```

---

## 7. Client-Side Translations (`client/`)

### Hooks
`client/use-app-translation.ts`:
```typescript
"use client";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { useAppLocale } from "@/shared/locale/localeContext";
export function useAppTranslation<TLabels>(handle: NamespaceHandle<TLabels>): TLabels {
  const locale = useAppLocale();
  return readTranslation(handle, locale);
}
```
`client/use-translation.ts` — same but locale passed explicitly.

### Cache + Suspense protocol (`client/translation-cache-store.ts`)
- `readTranslation(handle, locale)` returns either the resolved value or **throws the inflight promise** (React Suspense pattern).
- Internally `ensureNamespaceLoading()` looks up `getNamespaceConfig(handle).load[locale]()`, a dynamic `import()`.
- Cache shape: `Map<handle, Map<locale, { promise, value }>>`.
- On a secure-context miss it falls back to IndexedDB snapshots (`client/snapshot-cache.ts`) keyed `${BUILD_ID}:${namespaceId}:${locale}`. The `namespaceId` comes from the `Symbol` set by `defineNamespace` — hence the stable-id requirement.

### `<TranslationProvider>` (`client/translation-cache.tsx`)
```typescript
export function TranslationProvider({ children, fallback }) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}
```
Wrapped by `frontend/common/providers/LocaleProvider.tsx` together with `<LocaleContext.Provider>`.

### Preload
`client/preload.ts` → `preloadNamespaces(...handles)` calls `ensureNamespaceLoading` for both `ar` and `en`. Useful in layouts/routes to warm the client cache.

### `LocaleProvider` wiring
`frontend/common/providers/LocaleProvider.tsx`:
```typescript
"use client";
export function LocaleProvider({ children, locale }) {
  const value = useMemo(() => ({ locale }), [locale]);
  return (
    <LocaleContext.Provider value={value}>
      <TranslationProvider>{children}</TranslationProvider>
    </LocaleContext.Provider>
  );
}
```
Mounted once in `app/layout.tsx:121` with `locale` from `getLocale()`.

### `localeContext.tsx`
```typescript
export const LocaleContext = createContext<LocaleContextValue | null>(null);
export function useAppLocale(): AppLocale { return useLocaleContext().locale; }
```
- Note the re-export chain: `@/shared/locale` → `localeContext.tsx`; some `frontend/**` files import `useAppLocale` from `@/frontend/common/providers/localeContext` (re-export of the shared one).

---

## 8. Error Translations (`types/errors/`, `namespaces/errors/`)

### Type schema (`types/errors/index.ts` — ~260 lines)
Errors are **grouped by domain sub-interfaces**, each nested under the top-level `ErrorsLabels`:
```typescript
export interface ErrorsLabels {
  readonly auth: AuthErrors;
  readonly permissionManagement: PermissionManagementErrors;
  readonly billing: BillingErrors;
  readonly credit: CreditErrors;
  readonly file: FileErrors;
  readonly meetingProvider: MeetingProviderErrors;
  readonly teacher: TeacherErrors;
  readonly student: StudentErrors;
  readonly category: CategoryErrors;
  readonly user: UserErrors;
  readonly scheduling: SchedulingErrors;
  readonly permissionGroup: PermissionGroupErrors;
  readonly sessionConfig: SessionConfigErrors;
  readonly parent: ParentErrors;
  readonly staff: StaffErrors;
  // ─── Top-level API strings
  readonly rateLimitExceeded: string;
  readonly internalServerError: string;
  readonly insufficientPermissions: string;
  readonly unauthorized: string;
  readonly notFound: string;
  // ─── Flattened backward-compat proxies
  readonly categoryNotFound: (id: string) => string;
  // ─── FX display messages (function with named params)
  readonly displayCurrencyNotSet: (values: { lockedAmount: string; lockedCurrency: string }) => string;
  // ...
}
```
Sub-interfaces mix plain `string` and functions with **typed params**:
```typescript
export interface BillingErrors {
  readonly invoiceNotFound: (id: string) => string;
  readonly invoiceAlreadyPaid: (params: { id: string; status: string }) => string;          // named-arg object
  readonly invoiceVersionMismatch: (params: { id: string; expectedVersion: number; gotVersion: number }) => string;
  readonly exchangeRateStale: (params: { fromCurrency: string; toCurrency: string }) => string;
  readonly paymentProofRequired: string;
}
```
Two interpolation styles are used throughout the codebase:
1. **Positional** `(id: string) => string` — single value.
2. **Named-arg object** `(params: { id: string; status: string }) => string` — multiple values (preferred for 2+ args; clearer at call sites).

### Namespace handle
`namespaces/errors/errors.namespace.ts`:
```typescript
export const Errors = defineNamespace<ErrorsLabels>("errors.errors", {
  load: {
    en: () => import("@/shared/locale/en/errors").then(m => m.errorsEn),
    ar: () => import("@/shared/locale/ar/errors").then(m => m.errorsAr),
  },
});
```

### Implementations (`ar/errors/index.ts`, `en/errors/...`)
- `errorsAr.auth.demoGroupNotFound: (groupSlug) => \`مجموعة العرض غير موجودة: ${groupSlug}\``
- Static strings stay as `string`; only fields that used ICU `{param}` become functions.

### Consumption
- GraphQL resolvers: `ctx.t().errorsTranslations.auth.invalidCredentials`.
- API routes: `getServerTranslations(locale).errorsTranslations.billing.invoiceAlreadyPaid({ id, status })`.

---

## 9. Namespace Example Walkthroughs

### 9a. `Common` — simplest (all-static + one interpolation fn)
**Type** (`types/common/index.ts`):
```typescript
export interface CommonLabels {
  readonly title: string;
  readonly documentTitleTemplate: (title: string) => string;   // interpolation fn
  readonly welcome: string;
  readonly langAr: string;
  readonly loading: string;
  // … ~30 fields
}
```
**Handle** (`namespaces/common/common.namespace.ts`):
```typescript
export const Common = defineNamespace<CommonLabels>("common.common", {
  load: {
    en: () => import("@/shared/locale/en/common").then(m => m.commonEn),
    ar: () => import("@/shared/locale/ar/common").then(m => m.commonAr),
  },
});
```
**AR** (`ar/common/index.ts`):
```typescript
export const commonAr: CommonLabels = {
  title: "سراج",
  documentTitleTemplate: (title) => `${title} | سراج`,
  langAr: "العربية",
  // …
};
```
**EN** (`en/common/index.ts`): mirror with English strings.

### 9b. `Dashboard.Billing` — flat labels (representative)
`namespaces/dashboard/billing/main.namespace.ts`:
```typescript
export const DashboardBilling = defineNamespace<BillingLabels>("dashboard.billing.main", {
  load: {
    en: () => import("@/shared/locale/en/dashboard/billing/main").then(m => m.dashboardBillingEn),
    ar: () => import("@/shared/locale/ar/dashboard/billing/main").then(m => m.dashboardBillingAr),
  },
});
```
- Type in `types/dashboard/billing/main.ts`; `ar/dashboard/billing/main.ts` + `en/dashboard/billing/main.ts` implement it.
- The **module export name convention** is `<camelDomain><Leaf>En` / `…Ar` (e.g. `dashboardBillingEn`). Used by both `namespaces/*.namespace.ts` loaders and the `messages.ts` static assembler.

### 9c. `Dashboard.StudentDirectory` — nested objects + interpolation
**Type** (`types/dashboard/students/directory.ts`):
```typescript
export interface StudentDirectoryLabels {
  readonly pageTitle: string;
  readonly showingOf: (shown: number, total: number) => string;   // 2-arg interpolation
  readonly metrics: { readonly deactivated: string; readonly regular: string; /* … */ };
  readonly table: { readonly index: string; readonly student: string; /* … */ };
  readonly status: { /* … */ };
  readonly enrollment: { /* … */ };
  readonly actions: { readonly viewProfile: string; readonly viewHistory: string };
  readonly errors: { readonly loadFailed: string };
}
```
**AR** (`ar/dashboard/students/directory.ts`):
```typescript
export const dashboardStudentDirectoryAr: StudentDirectoryLabels = {
  pageTitle: "دليل الطلاب الرئيسي",
  showingOf: (shown, total) => `عرض ${shown} من ${total} طالب`,
  metrics: { deactivated: "معطّل", regular: "عادي", /* … */ },
  // …
};
```
**EN** (`en/dashboard/students/directory.ts`): mirror in English.
**Handle** (`namespaces/dashboard/students/directory.namespace.ts`):
```typescript
export const DashboardStudentDirectory = defineNamespace<StudentDirectoryLabels>("dashboard.students.directory", { load: { en, ar } });
```
**Server consumption** (`app/(dashboard)/students/page.tsx`):
```typescript
const t = getTranslations(locale).dashboardTranslations.studentDirectory;
<h1>{t.pageTitle}</h1>
{t.showingOf(shown, total)}      // interpolation call
```

---

## 10. Pluralization & Interpolation (Type-Level)

There is **no ICU runtime**. Both are expressed directly in TypeScript:

### Pluralization = `(count: number) => string` with branching in the function body
Real example — `ar/notifications/index.ts:136-142`:
```typescript
unreadCount: count => {
  if (count === 0) return "لا توجد إشعارات غير مقروءة";       // no unread
  if (count === 1) return "إشعار واحد غير مقروء";             // one
  if (count === 2) return "إشعاران غير مقروءان";             // dual
  if (count >= 3 && count <= 10) return `${count} إشعارات غير مقروءة";  // paucal (3-10)
  return `${count} إشعاراً غير مقروءاً";                       // 11+
},
```
English side is simpler ternaries. Type simply: `readonly unreadCount: (count: number) => string;`. The caller `t.unreadCount(42)` gets the localized, correctly-pluraled string with **compile-time-checked argument type**.

### Interpolation = typed function args
- Single value: `(id: string) => string` → e.g. `t.invoiceNotFound(id)`.
- Multiple values: `(params: { id: string; status: string }) => string` → e.g. `t.invoiceAlreadyPaid({ id, status })`.

The `types/notifications/index.ts` header documents the convention explicitly ("string → `string`, interpolated → function with explicit param shape").

### Compile-time guarantees
Because labels are TS interfaces (not string maps), the following are **type errors**:
- Missing key in `ar` or `en` impl → fails `: ErrorsLabels` assignment check.
- Wrong arg type at call site (`t.showingOf("x", 1)`).
- Extra key in impl that isn't in the interface (with `readonly` + excess-property checks on object literals).

---

## 11. RTL Support

RTL is handled at **two layers**, both keyed off `locale === "ar"`:

### 11a. Document direction (`app/layout.tsx`)
```typescript
const direction = locale === "ar" ? "rtl" : "ltr";
<html lang={locale} dir={direction} …>
```
So the `<html>` element gets `dir="rtl"` for Arabic. This is the canonical MUI way (MUI reads `document.dir`).

### 11b. Emotion RTL cache (`frontend/common/lib/emotion-cache.tsx`)
```typescript
import rtlPlugin from "stylis-plugin-rtl";
const isRtl = locale === "ar";
const cache = isRtl ? createRtlCache(nonce) : createLtrCache(nonce);
// createRtlCache uses stylisPlugins: [prefixer, rtlPlugin]
```
- `@emotion/cache` with `stylis-plugin-rtl` flips CSS logical properties (`margin-left` ↔ `margin-right`, etc.) for Arabic.
- Combined with `dir="rtl"` on `<html>`, this gives full visual RTL — no separate "RTL theme" object.

### 11c. No `[locale]` route
Locale is **not** a URL segment. Resolve via cookie (`getLocale`) and set `<html dir>` once in the root layout. Switching = `POST/GET /api/set-locale` + reload. (The `shared/AGENTS.md` mention of "Next.js native `[locale]` segments + middleware" describes the **pattern philosophy**, not the repo's literal routing.)

---

## 12. Browser Translation Cache (Hybrid SW + IndexedDB)

Two-tier cache for client translations:
1. **Primary (HTTPS / secure context)**: Service Worker (`public/sw.js`) intercepts `/_next/static/chunks/*.js` GETs and caches in Cache API store `siraj-static-chunks-v1`. Invalidation via Turbopack chunk content hashes.
2. **Fallback (HTTP / insecure context)**: `shared/locale/client/snapshot-cache.ts` — `window.isSecureContext === false && "indexedDB" in window` triggers IndexedDB (`siraj-locale-snapshots`) keyed `${BUILD_ID}:${namespaceId}:${locale}`.
   - `BUILD_ID` resolved in `next.config.ts` (`NEXT_PUBLIC_BUILD_ID` env → hash → UUID). `wipeIfBuildIdChanged()` clears stale entries on first access.
   - Snapshots are JSON, with functions restored via `reviver` (a guarded `new Function`). Hence functions are part of the stored payload.

This is why every `defineNamespace` call **MUST pass a stable string id** — it becomes the snapshot key.

---

## 13. EXACT Steps to Add a New `certificates` Namespace

Assume you want a top-level `cert` domain with one leaf `certificates`. The repo pattern uses domain-grouped leaves, so two viable shapes:

- **Shape A (new top-level domain)** — adds a new `Translations` key `certTranslations` (like `emailsTranslations`). Use if certificates are conceptually standalone.
- **Shape B (leaf inside an existing group)** — e.g. add under `dashboardTranslations` (like `billing`). Use if certificates are dashboard-scoped.

Below is **Shape A** (cleanest for a new feature area). It touches 7 files; the `dashboard/billing/main-namespace` examples in §9b are the closest templates.

### Step 1 — Type interface (`types/certificates/index.ts`)  ← NEW FILE
```typescript
/** CertificatesLabels — compile-time i18n schema for the top-level "certificates" namespace. */

export interface CertificateListLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly issuedTo: (name: string) => string;                        // interpolation
  readonly issuedOn: (date: string) => string;
  readonly certificateCount: (count: number) => string;               // pluralization
  readonly statuses: {
    readonly issued: string;
    readonly revoked: string;
    readonly draft: string;
  };
  readonly errors: {
    readonly notFound: (id: string) => string;
    readonly revokedAlready: string;
    readonly loadFailed: string;
  };
}

export interface CertificatesLabels {
  readonly list: CertificateListLabels;
}
```

### Step 2 — AR implementation (`ar/certificates/index.ts`)  ← NEW FILE
```typescript
import type { CertificatesLabels } from "@/shared/locale/types/certificates";

export const certificatesAr: CertificatesLabels = {
  list: {
    pageTitle: "الشهادات",
    pageSubtitle: "إصدار وإدارة شهادات الطلاب.",
    issuedTo: (name) => `صادرة إلى ${name}`,
    issuedOn: (date) => `تاريخ الإصدار: ${date}`,
    certificateCount: (count) => {
      if (count === 0) return "لا توجد شهادات";
      if (count === 1) return "شهادة واحدة";
      if (count === 2) return "شهادتان";
      if (count >= 3 && count <= 10) return `${count} شهادات`;
      return `${count} شهادة`;
    },
    statuses: { issued: "صادرة", revoked: "ملغاة", draft: "مسودة" },
    errors: {
      notFound: (id) => `الشهادة غير موجودة: ${id}`,
      revokedAlready: "الشهادة ملغاة بالفعل.",
      loadFailed: "فشل تحميل الشهادات.",
    },
  },
};
```

### Step 3 — EN implementation (`en/certificates/index.ts`)  ← NEW FILE
```typescript
import type { CertificatesLabels } from "@/shared/locale/types/certificates";

export const certificatesEn: CertificatesLabels = {
  list: {
    pageTitle: "Certificates",
    pageSubtitle: "Issue and manage student certificates.",
    issuedTo: (name) => `Issued to ${name}`,
    issuedOn: (date) => `Issued on: ${date}`,
    certificateCount: (count) =>
      count === 0 ? "No certificates" : count === 1 ? "1 certificate" : `${count} certificates`,
    statuses: { issued: "Issued", revoked: "Revoked", draft: "Draft" },
    errors: {
      notFound: (id) => `Certificate not found: ${id}`,
      revokedAlready: "Certificate already revoked.",
      loadFailed: "Failed to load certificates.",
    },
  },
};
```

### Step 4 — Namespace handle (`namespaces/certificates/certificates.namespace.ts`)  ← NEW FILE
```typescript
import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { CertificatesLabels } from "@/shared/locale/types/certificates";

export const Certificates = defineNamespace<CertificatesLabels>("certificates.certificates", {
  load: {
    en: () => import("@/shared/locale/en/certificates").then(m => m.certificatesEn),
    ar: () => import("@/shared/locale/ar/certificates").then(m => m.certificatesAr),
  },
});
```
(Must pass stable id `"certificates.certificates"` for the IndexedDB snapshot cache key.)

### Step 5 — Register in `namespaces/translation.ts`  ← EDIT
Add to import block (alphabetical-ish with the other top-leaves like `Emails`):
```typescript
import { Certificates } from "@/shared/locale/namespaces/certificates/certificates.namespace";
```
Add the handle to the `Translation` object:
```typescript
export const Translation = {
  Auth: { /* … */ },
  Common,
  Errors, Emails, Session, Sms, Notifications,
  Onboarding: { /* … */ },
  Profile: { /* … */ },
  Certificates,                          // ← add (or nest: Certificates: { List: ... } if multiple leaves)
  Dashboard: { /* … */ },
  Ui: { /* … */ },
} as const;
```
Also re-export from `namespaces/index.ts` (the barrel mirrors `translation.ts` imports):
```typescript
export { Certificates } from "@/shared/locale/namespaces/certificates/certificates.namespace";
```

### Step 6 — Add to `Types` + server message bundles  ← EDIT 3 files
**6a. `types/message.ts`** — import + a new top-level `Translations` key:
```typescript
import type { CertificatesLabels } from "@/shared/locale/types/certificates";
// …
export type Translations = {
  authTranslations: AuthLabels;
  commonTranslations: CommonLabels;
  errorsTranslations: ErrorsLabels;
  emailsTranslations: EmailsLabels;
  sessionTranslations: SessionLabels;
  smsTranslations: SmsLabels;
  uiTranslations: UiTranslations;
  dashboardTranslations: DashboardTranslations;
  profileTranslations: ProfileTranslations;
  notificationsTranslations: NotificationsLabels;
  certTranslations: CertificatesLabels;      // ← NEW
};
```
*(If you nested under an existing group instead, add to that collector interface, e.g. `DashboardTranslations`, and skip the top-level key.)*

**6b. `ar/messages.ts`** — import + assemble:
```typescript
import { certificatesAr } from "@/shared/locale/ar/certificates";
// in const arMessages: Translations:
  // …
  notificationsTranslations: notificationsAr,
  certTranslations: certificatesAr,          // ← NEW
```
**6c. `en/messages.ts`** — mirror exactly with `certificatesEn` → `certTranslations: certificatesEn`.

### Step 7 — (Optional) preload in layout  ← EDIT if needed
If certificates are critical-path SSR, `app/layout.tsx` could preload the client bundle. Per `shared/AGENTS.md` step 5: "If used in layout SSR, add to `LocaleProvider` translations in `app/[locale]/layout.tsx`". The repo's actual `app/layout.tsx` uses `LocaleProvider` (not a layout provider that takes a translations list), so this step is usually **not required** — `getTranslations(locale)` on the server already covers SSR, and the client lazy-loads via `useAppTranslation`.

### Step 8 — Verify
```bash
bun tsgo                       # type-check the new interfaces + bundles
bun lint                       # ESLint — no frontend/backend imports in shared/
```
Confirm:
- `t.x.y` autocomplete works in the editor.
- Compile error if `ar` or `en` impl is missing a field.
- `certTranslations` resolves at `getTranslations(locale).certTranslations.list.pageTitle`.

### Usage after integration
**Server component** (`app/(dashboard)/certificates/page.tsx`):
```typescript
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";
export default async function Page() {
  const locale = await getLocale();
  const t = getTranslations(locale).certTranslations.list;
  return <h1>{t.pageTitle}</h1><p>{t.certificateCount(3)}</p>;
}
```
**Client component** (`frontend/views/certificates/CertificatesView.tsx`):
```typescript
"use client";
import { Translation, useAppTranslation } from "@/shared/locale";
const t = useAppTranslation(Translation.Certificates).list;
return <p>{t.issuedTo(user.name)}</p>;
```
**GraphQL resolver / API route**:
```typescript
const tErr = getServerTranslations(locale).certTranslations.list.errors;
throw new GraphQLError(tErr.notFound(id), { extensions: { code: "NOT_FOUND" } });
```

### Summary of required files (new or edited)
| # | File | Action |
|---|------|--------|
| 1 | `shared/locale/types/certificates/index.ts` | NEW (interface) |
| 2 | `shared/locale/ar/certificates/index.ts` | NEW (ar impl) |
| 3 | `shared/locale/en/certificates/index.ts` | NEW (en impl) |
| 4 | `shared/locale/namespaces/certificates/certificates.namespace.ts` | NEW (handle) |
| 5 | `shared/locale/namespaces/translation.ts` | EDIT (import + `Translation.Certificates`) |
| 6 | `shared/locale/namespaces/index.ts` | EDIT (barrel re-export) |
| 7 | `shared/locale/types/message.ts` | EDIT (import + `certTranslations` in `Translations`) |
| 8 | `shared/locale/ar/messages.ts` | EDIT (import + assemble `certTranslations: certificatesAr`) |
| 9 | `shared/locale/en/messages.ts` | EDIT (import + assemble `certTranslations: certificatesEn`) |

> The AGENTS.md "Namespace Registration" list mentions adding to `serverLegacy.ts` `namespacePaths` map — that file does not exist in the repo (`server.ts` has no path map; the static assembler `ar/messages.ts`+`en/messages.ts` serves that role instead). **Disregard that step** and use messages.ts edits (Steps 6b/6c) instead.

---

## 14. Public Import Contract (for product code)

Per `shared/AGENTS.md` § "Public import contract":
- Product code (`app/`, `frontend/`, `backend/`) imports only **`@/shared/locale`** and **`@/shared/locale/types`**.
- NEVER deep paths like `@/shared/locale/old/**` or `@/shared/locale/beta/**`.
- Inside `shared/locale/`, relative/deep paths are allowed.
- The barrel `shared/locale/index.ts` re-exports everything (handles via `namespaces`, `getTranslations`/`loadAllTranslations` from `server`, `getServerTranslations` from `server-graphql`, `useAppTranslation` from `client/use-app-translation`, `LocaleContext`/`useAppLocale` from `localeContext`, `defineNamespace`/`NamespaceHandle`/`NamespaceLoaderConfig`/`Translation` from `namespaces`, and `* from ./types`).

### View-layer label types
Canonical `*Labels` interfaces live in `shared/locale/types/**`. `frontend/common/views/**/types/` may `Pick`/`Omit`/compose them into view-specific `*ShellLabels` slices — do not duplicate string keys (per `frontend/common/views/AGENTS.md` Rule 7).

---

## 15. Key Gotchas / Things to Keep in Mind

1. **Two parallel access surfaces** — client (`Translation.Domains.Leaf` handles → `useAppTranslation`) vs server (`getTranslations(locale).domainTranslations.leaf` nested object). The handle display names (PascalCase) ≠ the message-bundle keys (camelCase). Both must be kept in sync.
2. **Server bundle = full bundle**. `server.ts` statically imports ALL leaf modules via `messages.ts`. Adding a namespace grows that bundle. The client path lazy-loads per handle.
3. **Stable namespace ids are mandatory** for IndexedDB snapshot keys; omitting the id string disables the fallback cache for that namespace.
4. **`getTranslations` is synchronous** — call as `getTranslations(locale).x`, not `await getTranslations(...)`.
5. **`ctx.t()` returns the whole `Translations`** (not a per-namespace getter) — AGENTS.md examples of `ctx.t("errors")` are aspirational, not the literal signature (`backend/graphql/gqlContext.ts:70,96`).
6. **RTL** is driven by `locale === "ar"` in two places: `<html dir>` (`app/layout.tsx:90`) and Emotion cache (`emotion-cache.tsx:35`). No separate theme object.
7. **AGENTS.md is slightly stale** re actual filenames — `server.ts` (not `serverLegacy.ts`), `server-graphql.ts` (not `server-graphql-legacy.ts`), client lives in `client/` dir (not `clientLegacy.ts`). Follow the code, not the diagram.
8. **ICU is fully gone**: every `{placeholder}` must become a typed function. Use named-arg object shape for 2+ param interpolations.
