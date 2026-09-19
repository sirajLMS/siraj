# Research: i18n ↔ React Email Interop Verification

**Subject:** the email template system design.
**Date:** 2026-08-01
**Researcher:** subagent (file-search specialist)

---

## VERDICT

| # | Claim | Status |
|---|-------|--------|
| 1 | `getServerTranslations` is server-safe & synchronous | **VERIFIED** |
| 2 | Existing templates already call it synchronously (line 32 reference) | **VERIFIED** |
| 3 | `shared/AGENTS.md` bans shared → backend; reverse (backend → shared) is fine | **VERIFIED (no risk)** |
| 4 | `ComplaintResponseEmailLabels.subject({ complaintTitle })` exists today | **VERIFIED — already in repo** |
| 5 | `emailsTranslations.<scope>` exists / `emails.errors` namespace exists | **PARTIAL:** top-level scope access exists; `emails.errors` namespace **does NOT exist — NEEDS UPDATE** |
| 6 | Synchronous `getServerTranslations` safe inside `@react-email/render` pipeline | **VERIFIED (with one caveat — async render)** |

**Bottom line:** The design's i18n core assumption is sound and the canonical `SubjectArgs` pattern already exists. The only mandatory change is **introducing the `emails.errors` sub-namespace** (line 366) — it does not exist today and must be added to `EmailsLabels` + en + ar before any service can call `getServerTranslations(locale).emailsTranslations.errors.*`. The other edits are extensions to existing per-scope labels, which is straightforward.

---

## Original claims — quoted from the design

| Line | Quote |
|-----------|-------|
| 195 | `// (b) attachments resolved from definition.attachments` *(context only — the i18n claim is on the next paragraph: "This pattern satisfies: typesafe, no text unions...")* |
| 325 | `All user-facing errors via \`getServerTranslations(locale, "emails.errors")\` ([backend/services/AGENTS.md](backend/services/AGENTS.md))` |
| 365 | `New \`SubjectArgs\` per scope, e.g. \`ComplaintResponseEmailLabels.subject\` already takes \`{ complaintTitle }\` — extend to all scopes` |
| 366 | `Add \`errors\` namespace (subject-template errors, validation messages) accessor under \` EmailsLabels.errors.*\`` *(note: stray space before `EmailsLabels`)* |
| 367 | `Update English ([shared/locale/en/emails/index.ts](shared/locale/en/emails/index.ts)) and Arabic ([shared/locale/ar/emails/index.ts](shared/locale/ar/emails/index.ts)) implementations` |
| 377 | `All components import translations via \`getServerTranslations\` and use \`Email/designJson\` ONLY for body overrides (props enforce type safety cross all variants)` |

---

## 1. `getServerTranslations` — real signature & server-safety

**File:** `/home/ahmed/Projects/siraj-mail/shared/locale/server-graphql.ts`

```ts
1: import { getTranslations } from "@/shared/locale/server";
2:
3: export function getServerTranslations(locale: string): ReturnType<typeof getTranslations> {
4:   return getTranslations(locale);
5: }
```

**Real signature:** `function getServerTranslations(locale: string): Translations` — **NOT** generic, **NOT** async, takes a single `locale: string` argument. Returns the entire `Translations` bundle synchronously by value.

It delegates to `getTranslations` in `/home/ahmed/Projects/siraj-mail/shared/locale/server.ts`:

```ts
15: export function getTranslations(locale: string): Translations {
16:   return messagesByLocale[resolveLocale(locale)];
17: }
```

`messagesByLocale` is a static `Record<AppLocale, Translations>` populated by importing `arMessages` / `enMessages` at module load — so the call is a **pure synchronous dictionary lookup**, no I/O, no promises, no async boundary.

**Server-safety:** This is plain module-scope code with no React hooks, no `window`, no `document`, no Next.js request context — safe to invoke on the server (and inside Node scripts, GraphQL resolvers, CLI scripts, and React Email render pipelines alike). The repo's `shared/AGENTS.md` ("Translation System" section) explicitly classifies it as the canonical helper for **API Routes / Scripts** and `backend/services/AGENTS.md` mandates it as the i18n entrypoint for service-layer localized errors.

> Important: The design assumes a two-argument form `getServerTranslations(locale, "emails.errors")` (line 325). The actual function takes only `locale`. There is no namespace parameter — the **whole** `Translations` bundle is returned; consumers drill into `.emailsTranslations.errors.*` (or `.errorsTranslations.*` for the top-level errors namespace). The design's prose is correct everywhere except where it writes the call as if `getServerTranslations` accepted a namespace string; the actual call site pattern is `getServerTranslations(locale).emailsTranslations.errors.*`.

---

## 2. Synchronous-return assumption

**VERIFIED.** Existing usage at `/home/ahmed/Projects/siraj-mail/backend/services/communication/templates/email-templates.ts`:

```ts
28: export const renderComplaintResponseEmail = async (
29:   data: ComplaintResponseEmailData,
30:   locale?: string
31: ): Promise<string> => {
32:   const t = getServerTranslations(locale ?? "en").emailsTranslations.complaintResponse;
33:
34:   const subject = t.subject({ complaintTitle: escapeHtml(data.complaintTitle) });
...
89:   const t = getServerTranslations(locale ?? "en").emailsTranslations.suggestionAcknowledged;
```

The function is awaited as a default expression (`const t = getServerTranslations(...)...`) — **no `await`**, no `.then`, no `Promise` chaining. The enclosing `renderComplaintResponseEmail` is `async` only because it returns a string Promise per the channel contract, not because i18n is async. So the synchronous-return claim is correct.

---

## 3. AGENTS.md "shared must not import backend" rule

**File:** `/home/ahmed/Projects/siraj-mail/shared/AGENTS.md`, lines 7-11:

> **Layer Isolation (CRITICAL)**
> - **NEVER** import from `@/frontend/**`, `@/backend/**`, or `@/app/**`.
> - Enforced by ESLint `no-restricted-imports` in `eslint.config.mjs` for all `shared/**/*.{ts,tsx}` files.

The rule is **one-directional**: it forbids `shared/` from reaching *upward* into `frontend/`, `backend/`, or `app/`. It says nothing about the reverse direction — and the rest of the codebase freely does so:
- `backend/services/AGENTS.md` mandates `import { getServerTranslations } from "@/shared/locale/server-graphql"`.
- `backend/services/communication/templates/email-templates.ts:1` already does `import { getServerTranslations } from "@/shared/locale";`.
- `shared/locale/index.ts:21` re-exports `getServerTranslations` as part of the public barrel.

**Reverse-import risk for `backend/.../templates/components/*` → `shared/locale`:** **None.** This is the canonical backend → shared dependency direction. The design's proposed layout (`EmailScope` in `backend/enum/email`, components in `backend/services/communication/templates/components/*`) is entirely within the `backend/` layer and may import `@/shared/locale` freely — exactly like the existing `email-templates.ts` does today. No AGENTS.md rule blocks this; the ESLint `no-restricted-imports` guard fires only on `shared/**` source files importing upward, not on `backend/**` importing downward.

---

## 4. Existing per-scope `SubjectArgs` pattern

**File:** `/home/ahmed/Projects/siraj-mail/shared/locale/types/emails/index.ts` (full file):

```ts
1: /**
2:  * Email translation labels for complaint response emails
3:  */
4: export interface ComplaintResponseEmailLabels {
5:   readonly subject: (params: { complaintTitle: string }) => string;
6:   readonly greeting: (params: { parentName: string }) => string;
7:   readonly body: (params: { complaintTitle: string }) => string;
8:   readonly responseLabel: string;
9:   readonly dateLabel: string;
10:   readonly footer: string;
11: }
12:
13: /**
14:  * Email translation labels for suggestion acknowledged emails
15:  */
16: export interface SuggestionAcknowledgedEmailLabels {
17:   readonly subject: string;
18:   readonly greeting: (params: { parentName: string }) => string;
19:   readonly body: string;
20:   readonly suggestionLabel: string;
21:   readonly dateLabel: string;
22:   readonly footer: string;
23: }
24:
25: /**
26:  * Top-level emails namespace
27:  */
28: export interface EmailsLabels {
29:   readonly complaintResponse: ComplaintResponseEmailLabels;
30:   readonly suggestionAcknowledged: SuggestionAcknowledgedEmailLabels;
31: }
```

**`ComplaintResponseEmailLabels.subject({ complaintTitle }: { complaintTitle: string }) => string` ALREADY EXISTS** — exactly the pattern the design (line 365) calls "canonical". English impl at `shared/locale/en/emails/index.ts:5`:

```ts
5:     subject: ({ complaintTitle }) => `Response to your complaint: ${complaintTitle}`,
```

Arabic impl at `shared/locale/ar/emails/index.ts:5`:

```ts
5:     subject: ({ complaintTitle }) => `رد على شكواك: ${complaintTitle}`,
```

So extending the `SubjectArgs` pattern to additional scopes (e.g. `InvoiceGeneratedEmail`, `WelcomeEmail`, `PasswordResetEmail`) is a **straightforward extension**, not a new pattern invention. Note `SuggestionAcknowledgedEmailLabels.subject` is currently a plain `string` (no args) — design should decide per-scope whether the subject is static or templated.

---

## 5. `emailsTranslations.<scope>` and `emails.errors` namespace presence

### Top-level wiring — VERIFIED EXISTS

`/home/ahmed/Projects/siraj-mail/shared/locale/types/message.ts` lines 256-267 — `EmailsLabels` is registered as a first-class `Translations` key:

```ts
256: export type Translations = {
257:   authTranslations: AuthLabels;
258:   commonTranslations: CommonLabels;
259:   errorsTranslations: ErrorsLabels;
260:   emailsTranslations: EmailsLabels;
261:   sessionTranslations: SessionLabels;
...
267: };
```

So `getServerTranslations(locale).emailsTranslations.<scope>` is exactly the access path the design describes (line 195 prose, line 377), and it is **already wired today** — `email-templates.ts:32` uses `.emailsTranslations.complaintResponse` and `.emailsTranslations.suggestionAcknowledged`.

### `emails.errors` sub-namespace — DOES NOT EXIST TODAY

`EmailsLabels` (file above) has only two members: `complaintResponse`, `suggestionAcknowledged`. There is **no `errors` field** on `EmailsLabels`. A repo-wide search for `emails.errors`, `EmailsErrors`, and `emailsErrors` in `shared/locale` returned **zero matches**. The `ErrorsLabels` interface (`shared/locale/types/errors/index.ts:216`) is a sibling top-level namespace (`errorsTranslations`) that groups auth/billing/teacher/etc. errors — there is no `emails` sub-key inside it either.

So line 325's `getServerTranslations(locale, "emails.errors")` is **a new namespace the design must introduce**, not an existing one. Line 366 already calls for this addition (`Add \`errors\` namespace ... accessor under \` EmailsLabels.errors.*\``), so the design is internally consistent — but the claim that this namespace already exists is **NEEDS UPDATE / FALSE TODAY**.

### Recommended namespace shape

Add to `EmailsLabels`:

```ts
import type { EmailsErrors } from "@/shared/locale/types/emails/errors"; // new file or inline

export interface EmailsLabels {
  readonly complaintResponse: ComplaintResponseEmailLabels;
  readonly suggestionAcknowledged: SuggestionAcknowledgedEmailLabels;
  readonly errors: EmailsErrors; // NEW
}
```

Define `EmailsErrors` with typed `(params) => string` interpolations following the `Interpolation Pattern` in `shared/AGENTS.md` (lines 201-222), then implement in both `en/emails/index.ts` and `ar/emails/index.ts`.

---

## 6. Calling synchronous i18n inside the `@react-email/render` pipeline

React Email's render path (per [docs](https://react.email/docs/utilities/render)):

> ```js
> import { render } from 'react-email';
> const html = await render(<MyTemplate />);
> ```

Key findings from web research (Aug 2026):

1. **React Email 3.x made `render` async-by-default.** Resend's announcement (`resend.com/blog/react-email-3`) confirms the old synchronous `render` (which used `renderToStaticMarkup`) has been deprecated in favor of an async `render` that supports React 19, Suspense, and Server Components. The deprecated `renderAsync` was merged into the new `render`. Underneath, the async `render` ultimately resolves through `react-dom/server`'s `renderToStaticMarkup`/`renderToString` semantics wrapped in a Promise.

2. **`render` returns a Promise** (`Promise<string>`), even though the underlying stringification of an already-materialized React tree is synchronous. Consumers `await` it.

3. **Components themselves may still use synchronous translations.** The standard React Email i18n guidance (`react.email/docs/guides/internationalization/next-intl`, DEV community articles) initializes i18n server-side and passes a `t` function **as a prop** to the email component. The component body is then plain synchronous React with no async fetch inside the JSX. With a *synchronously-returning* `getServerTranslations(locale)`, calling it inside a React Email component (or, better, outside and threading the result as props) is fully compatible — the render pipeline sees a normal React element tree with no Suspense boundaries, no await inside components.

### Compatibility verdict

**VERIFIED SAFE**, with one caveat about *where* the i18n call happens:

- **Recommended pattern (props threading — matches `react.email` docs and `reactemailspro.com`):** Call `getServerTranslations(locale)` **outside** the React Email component — in `renderEmailTemplate` / the registry renderer / a service wrapper — and pass the typed `EmailsLabels` slice as a `t` prop to the component:

  ```tsx
  // backend/services/communication/templates/components/ComplaintResponseEmail.tsx
  import { Html, Body, Text } from "react-email";
  import type { ComplaintResponseEmailLabels } from "@/shared/locale/types/emails";

  export function ComplaintResponseEmail({
    t,
    parentName,
    complaintTitle,
    responseText,
    respondedAt,
  }: {
    t: ComplaintResponseEmailLabels;
    parentName: string; complaintTitle: string; responseText: string; respondedAt: string;
  }) { /* pure synchronous JSX */ }

  // renderer:
  const t = getServerTranslations(locale).emailsTranslations.complaintResponse;
  const html = await render(<ComplaintResponseEmail t={t} .../>);
  ```

  This style keeps the React Email component a pure function over props (matches the existing `ComplaintResponseEmailData` prop bag at `email-templates.ts:12` and avoids any async-inside-component concerns).

- **Alternative pattern (direct import inside component — what line 377 literally says):** Calling `getServerTranslations(locale)` *inside* the React Email component function body also works, because it is a synchronous dictionary lookup with no React hooks and no async — React Email's `render` will execute the component function synchronously when materializing the element tree (no `await` inside). There is no rule against this. However it slightly couples rendering to the i18n module import and makes the component harder to isolate. Prefer the props-threading pattern for isolation.

- **`next-intl` is NOT available** — confirmed by `shared/AGENTS.md`: "the legacy `next-intl` package has been fully removed from `package.json`." React Email's official `next-intl` i18n guide therefore does **not** apply to this repo. The custom compile-time TS i18n system is the only path — and the synchronous `getServerTranslations` is exactly the right primitive.

### Caveat worth noting in the design

Line 377 says "All components import translations via `getServerTranslations`". This is technically safe but it is **not the canonical React Email pattern** and it differs from how the existing `email-templates.ts` does it (computes `t` in the wrapper, not in the JSX). Recommend the design specify **props-threading**: components accept a typed `t: <Scope>EmailLabels` prop and the renderer calls `getServerTranslations` and threads the slice. This keeps the React Email components framework-agnostic and storybookable, and avoids any future React 19 "you cannot call a server-only function inside a Client Component" warnings (should these templates ever be rendered in a hybrid RSC tree). If the team prefers the inline-import style, still safe — the call is synchronous and hook-free.

---

## Recommended line edits

| Line | Current text | Recommended edit |
|-----------|--------------|-------------------|
| 325 | `All user-facing errors via \`getServerTranslations(locale, "emails.errors")\`` | Replace with `All user-facing errors via \`getServerTranslations(locale).emailsTranslations.errors.*\`` — the function takes only `locale`, no namespace argument. |
| 366 | `Add \`errors\` namespace ... under \` EmailsLabels.errors.*\`` | Strip leading space; explicitly state this namespace is **new** and must be added to `EmailsLabels`, `en/emails/index.ts`, `ar/emails/index.ts` (currently absent — confirmed by search). Define a new `EmailsErrors` interface (suggest inline or `shared/locale/types/emails/errors.ts`). |
| 365 | `New \`SubjectArgs\` per scope, e.g. \`ComplaintResponseEmailLabels.subject\` already takes \`{ complaintTitle }\`` | Clarify this is an *extension* of an existing pattern, not new — the repo already has it. Per-scope `SubjectArgs` should be defined when adding each new `*EmailLabels` interface. |
| 377 | `All components import translations via \`getServerTranslations\`` | Recommend rephrase to "components receive translations as a typed `t` prop; the renderer calls `getServerTranslations(locale).emailsTranslations.<scope>` and threads the slice" — matches React Email's documented i18n pattern and the existing `email-templates.ts` wrapper style. (Inline-import style is also safe but less idiomatic.) |
| 195 prose | `getServerTranslations(locale).emailsTranslations.<scope> inside the email template` | Correct as written — verify the implementing renderer uses this exact call shape. |

No other i18n-blocking issues found. The design's i18n architecture is implementable as written modulo the namespace addition and the signature nit on line 325.

---

## Files inspected

- `/home/ahmed/Projects/siraj-mail/shared/AGENTS.md` (layer isolation rules + i18n system docs)
- `/home/ahmed/Projects/siraj-mail/backend/services/AGENTS.md` (service i18n contract)
- `/home/ahmed/Projects/siraj-mail/shared/locale/server.ts` (`getTranslations` synchronous impl)
- `/home/ahmed/Projects/siraj-mail/shared/locale/server-graphql.ts` (`getServerTranslations` synchronous impl)
- `/home/ahmed/Projects/siraj-mail/shared/locale/index.ts` (public barrel)
- `/home/ahmed/Projects/siraj-mail/shared/locale/types/message.ts` (`Translations` type — `emailsTranslations` registered)
- `/home/ahmed/Projects/siraj-mail/shared/locale/types/emails/index.ts` (canonical `EmailsLabels`, `ComplaintResponseEmailLabels`, `SuggestionAcknowledgedEmailLabels`)
- `/home/ahmed/Projects/siraj-mail/shared/locale/en/emails/index.ts` (English impl)
- `/home/ahmed/Projects/siraj-mail/shared/locale/ar/emails/index.ts` (Arabic impl)
- `/home/ahmed/Projects/siraj-mail/shared/locale/types/errors/index.ts` (`ErrorsLabels` — confirmed no `emails` sub-key)
- `/home/ahmed/Projects/siraj-mail/backend/services/communication/templates/email-templates.ts` (existing call sites lines 32, 89)
- `https://react.email/docs/utilities/render` (async-by-default render)
- `https://react.email/docs/introduction`
- Resend blog + GitHub discussion #1144 (React Email 3.x render is async, supports Suspense/RSC)
