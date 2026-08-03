# i18n Repo Verdict — Email Template Plan (lines 493–514)

Verifies the plan's claims about the i18n call shape used by
`backend/services/communication/templates/email-templates.ts` and the
`EmailsLabels` namespace.

Source of truth: **repo source code** (docs are NOT the source of truth — see
"Stale docs" below).

---

## 1. `getServerTranslations` — definition

| Item | Value |
|------|-------|
| File | `/home/ahmed/Projects/siraj-mail/shared/locale/server-graphql.ts` |
| Line | 3 |
| Verbatim signature | `export function getServerTranslations(locale: string): ReturnType<typeof getTranslations>` |
| Return type | `Translations` (object, NOT a Promise) |
| Async? | **No** — synchronous return; body is `return getTranslations(locale);` |
| Body | `return getTranslations(locale);` (1 line) |

Full file (5 lines):

```3:shared/locale/server-graphql.ts
export function getServerTranslations(locale: string): ReturnType<typeof getTranslations> {
  return getTranslations(locale);
}
```

**Conclusion**: The plan is CORRECT — the function is single-arg
`(locale: string)`, fires synchronously, and returns the whole `Translations`
object. There is **NO 2-arg variant** of `getServerTranslations`. Grep for

```3:shared/locale/server-graphql.ts
```

`getServerTranslations\([^)]*,\)` across the repo returned ZERO code-hits — only
documentation/instruction files mention the (locale, "namespace") form.
`import { getServerTranslations } from "@/shared/locale";` is the public barrel
(`shared/locale/index.ts:21`).

### Representative call sites (all single-arg, all sync)

| File:line | Call shape |
|-----------|------------|
| `backend/services/communication/templates/email-templates.ts:32` | `getServerTranslations(locale ?? "en").emailsTranslations.complaintResponse` |
| `backend/services/communication/templates/email-templates.ts:89` | `getServerTranslations(locale ?? "en").emailsTranslations.suggestionAcknowledged` |
| `backend/services/communication/complaint.service.ts:46` | `getServerTranslations(locale ?? "en").errorsTranslations` |
| `backend/services/teacher/teacher-due.service.ts:31` | `getServerTranslations(locale ?? "en").errorsTranslations` |
| `backend/db/repo/teachers/teacher-availability.repository.ts:319` | `getServerTranslations(locale ?? "en").errorsTranslations` |
| `backend/db/repo/scheduling/class-instances.ts:208` | `getServerTranslations("en").sessionTranslations` |
| `backend/services/notification/notification-payloads.builders.ts:71` | `getServerTranslations(locale ?? "en").notificationsTranslations` |
| `backend/graphql/gqlContext.ts:70` | `t: () => getServerTranslations(locale)` (used by resolvers as `ctx.t("errors")`) |
| `backend/graphql/gqlContext.ts:96` | `t: () => getServerTranslations(locale)` |

No call site is awaited. A grep for `await getServerTranslations` zero-hits in
production code — only 1 doc hit at `shared/AGENTS.md:165` (a stale example — see
below).

**Approximate total call-site count**: ~90+ source call sites across `backend/`
and `app/api/`, every one of them single-arg and synchronous.

---

## 2. `getTranslations` — the underlying server function

| Item | Value |
|------|-------|
| File | `/home/ahmed/Projects/siraj-mail/shared/locale/server.ts` |
| Line | 15 |
| Verbatim signature | `export function getTranslations(locale: string): Translations` |
| Async? | **No** — synchronous; returns `messagesByLocale[resolveLocale(locale)]` |
| Used by server components | Yes — `import { getTranslations } from "@/shared/locale/server"` |

Full definition:

```15:shared/locale/server.ts
export function getTranslations(locale: string): Translations {
  return messagesByLocale[resolveLocale(locale)];
}
```

So **two distinct functions exist**, both single-arg and synchronous:

| Function | Path module | Recommended for |
|----------|-------------|-------------------|
| `getTranslations(locale)` | `@/shared/locale/server` | Server Components (`app/**/*.tsx`) |
| `getServerTranslations(locale)` | `@/shared/locale/server-graphql` — re-exported by `@/shared/locale` | API routes, scripts, services, repos, tests |

They differ only in the import path / barrel. `getServerTranslations` is a thin
trampoline that delegates to `getTranslations`. **The plan is using the correct
one** (`getServerTranslations`) for the `email-template.service.ts` backend
service path — that file (`backend/services/...`) sits in the "API routes /
scripts / services / tests" bucket per AGENTS.md, which is the bucket
`getServerTranslations` is meant for.

### Representative `getTranslations` call sites (single-arg, sync)

- `app/(dashboard)/dashboard/page.tsx:10` — `getTranslations(locale).commonTranslations;`
- `app/(auth)/login/page.tsx:10` — `getTranslations(locale).authTranslations;`
- `app/layout.tsx:52` — `getTranslations(locale).commonTranslations;`
- `frontend/common/views/dashboard/components/DashboardLayoutContainer.tsx:25` —
  `getTranslations(locale).dashboardTranslations;`

`getTranslations(locale).<namespace>` is the universal shape. **No** call site
uses a 2-arg `getTranslations(locale, "namespace")` form — that form appears
only in stale docs (`shared/AGENTS.md:79` and `shared/AGENTS.md:125`).

---

## 3. `EmailsLabels` interface — verbatim

File `/home/ahmed/Projects/siraj-mail/shared/locale/types/emails/index.ts`,
lines 1–31:

```28:shared/locale/types/emails/index.ts
export interface EmailsLabels {
  readonly complaintResponse: ComplaintResponseEmailLabels;
  readonly suggestionAcknowledged: SuggestionAcknowledgedEmailLabels;
}
```

Supporting leaf interfaces in the same file:

```4:shared/locale/types/emails/index.ts
export interface ComplaintResponseEmailLabels {
  readonly subject: (params: { complaintTitle: string }) => string;
  readonly greeting: (params: { parentName: string }) => string;
  readonly body: (params: { complaintTitle: string }) => string;
  readonly responseLabel: string;
  readonly dateLabel: string;
  readonly footer: string;
}
```

```16:shared/locale/types/emails/index.ts
export interface SuggestionAcknowledgedEmailLabels {
  readonly subject: string;
  readonly greeting: (params: { parentName: string }) => string;
  readonly body: string;
  readonly suggestionLabel: string;
  readonly dateLabel: string;
  readonly footer: string;
}
```

**`errors` field?** — **NO.** The `EmailsLabels` interface today contains
exactly two members: `complaintResponse` and `suggestionAcknowledged`. There is
no `errors`, `<template-name>Errors`, or any error sub-namespace. The plan's
proposal to add a new errors implant (lines 499–510 of the plan) is therefore an
ADDITION, not a refactor of existing fields.

### Wiring

`EmailsLabels` is wired into the top-level `Translations` at
`shared/locale/types/message.ts:260`:

```260:shared/locale/types/message.ts
  emailsTranslations: EmailsLabels;
```

So a new errors group must be added as a property of `EmailsLabels` (e.g.
`readonly errors: ...`) — and the en/ar implants must be extended in
`shared/locale/en/emails/index.ts` / `shared/locale/ar/emails/index.ts`. There
is no `serverLegacy.ts namespacePaths` map to update for this system — that
section of `shared/AGENTS.md` describes a different (unimplemented) layer; the
actual current i18n is fully synchronous, no lazy `import()` per namespace.

---

## 4. English / Arabic email implants

En file: `/home/ahmed/Projects/siraj-mail/shared/locale/en/emails/index.ts`
(21 lines). Exports `emailsEn: EmailsLabels` with both `complaintResponse` and
`suggestionAcknowledged` blocks; uses literal string keys + typed template
literals (e.g. `subject: ({ complaintTitle }) => \`Response to your complaint:
${complaintTitle}\``). Already follows the Interpolation Pattern from
`shared/AGENTS.md`.

Ar file: `/home/ahmed/Projects/siraj-mail/shared/locale/ar/emails/index.ts`
(20 lines). Exports `emailsAr: EmailsLabels` with the same shape, Arabic
strings; same template-literal pattern.

Both files import `import type { EmailsLabels } from "@/shared/locale/types/emails";`
and satisfy the interface.

**Verified actual repo layout** (sanity check — there is NO
`shared/locale/emails/en/index.ts` variant, only the layout above):

```
shared/locale/types/emails/index.ts
shared/locale/en/emails/index.ts
shared/locale/ar/emails/index.ts
```

To add the proposed errors group, extend `EmailsLabels`, `emailsEn`, and
`emailsAr` in that exact three files. No new layout / new namespace loader
needed.

---

## 5. The `email-templates.ts:32` call shape — verbatim

File `/home/ahmed/Projects/siraj-mail/backend/services/communication/templates/email-templates.ts`:

```32:backend/services/communication/templates/email-templates.ts
  const t = getServerTranslations(locale ?? "en").emailsTranslations.complaintResponse;
```

(Also `:89` — `getServerTranslations(locale ?? "en").emailsTranslations.suggestionAcknowledged`.)

The import on line 1 is:

```1:backend/services/communication/templates/email-templates.ts
import { getServerTranslations } from "@/shared/locale";
```

Confirmed:
- Args: single (`locale ?? "en"`) — **not** a 2-arg `(locale, "namespace")`.
- No `await` keyword — the result is consumed synchronously.
- Property chain: `.emailsTranslations.complaintResponse` — already matches the
  `Translations.emailsTranslations` shape defined at message.ts:260.

---

## 6. `next-intl` is absent repo-wide (zero source imports)

`next-intl` keyword appears **only** in documentation / legacy metadata files
(none of which are real `import` sources). Concrete places where it appears
*textually*:

- `shared/Messages_README.md`, `frontend/IMPLEMENTATION_PLAN.md`,
  `frontend/page-prompt.md`, `frontend/IMPLEMENTATION_LEARNINGS.md`,
  `frontend/STYLED_COMPONENTS_REFACTORING_GUIDE.md`,
  `frontend/views/auth/login/README.md`
- Comments inside `shared/locale/types/{errors,common,session,profile}/index.ts`
  and `shared/locale/types/emails` reference it only to say "migrated from
  next-intl" or "old next-intl system".
- "Do not import" reminders in `AGENTS.md`, `shared/AGENTS.md`,
  `backend/graphql/AGENTS.md`, `backend/services/AGENTS.md`,
  `backend/db/repo/AGENTS.md`, `backend/db/test/AGENTS.md`,
  `.agents/instructions/backend.instructions.md`,
  `.agents/agents/review-backend.agent.md`, `.cursor/plans/teacher_*.plan.md`.

`/home/ahmed/Projects/siraj-mail/package.json` does NOT contain the string
`next-intl` (grep zero-hit). The package is fully removed. There is no live
`import` of `next-intl`, `getBackendTranslations`, or `NextIntlClientProvider`
anywhere in source. The plan's premise that `next-intl` is gone is **VERIFIED**.

---

## 7. Cross-layer hard rule (shared/AGENTS.md) for the new namespace file

`shared/AGENTS.md` Layer Isolation (lines 7–11) bans any `shared/**` file from
importing `@/frontend/**`, `@/backend/**`, or `@/app/**`. The plan's proposed
new emails `errors` group will live under `shared/locale/types/emails/` and
`shared/locale/{en,ar}/emails/` — all `shared/**` territory — so it can only
import from `@/shared/**` (e.g. the email-template-namespace leaf interfaces).
Any new error keys whose values need to interpolate runtime data (template id,
provider name, reason) should follow the Interpolation Pattern
(`(param: string) => string` typed function) — the en/ar implants already use
this pattern.

The plan must NOT import email-render specifics (`@react-email/*`, provider
SDK shapes) into the `shared/locale/emails` errors interface — those belong in
`backend/services/communication/templates/*` and are passed in as parameters.

---

## 8. Stale-docs warning (worth flagging back to the orchestrator)

Several instruction files still describe the i18n API as `getServerTranslations(locale, "namespace")` (2-arg, await) — this is a documentation hallucination and contradicts the actual implementation. The real signature is single-arg + synchronous, per `shared/locale/server-graphql.ts:3` and `shared/locale/server.ts:15`. Affected files:

- `shared/AGENTS.md` lines 79, 125, 129–130, 142–143, 165
- `AGENTS.md` lines 150, 153
- `app/AGENTS.md` (per the `app/AGENTS.md` line 104 already correctly states sync — only the wider doc set is wrong)
- `backend/db/repo/AGENTS.md:42`, `backend/services/AGENTS.md:7`,
  `backend/db/test/AGENTS.md:128`, `.agents/instructions/backend.instructions.md:71,90`,
  `.agents/agents/review-backend.agent.md:90–91`,
  `.ai/plans/quota/implementation.md:291`,
  `.cursor/plans/teacher_desktop_layout_5fae6c00.plan.md:37`

This is a repo-wide doc drift issue, not something the email-template plan
introduces. The plan, by adopting the actual single-arg sync shape (as it
does — see plan lines 495 and 511), is correct.

---

## 9. One-line verdict

**VERIFIED.** The plan's i18n premises are correct on every check:

1. `getServerTranslations(locale)` is single-arg and synchronous — confirmed at
   `shared/locale/server-graphql.ts:3`. No 2-arg variant exists anywhere in
   source (every code call site is `getServerTranslations(locale)` or
   `getServerTranslations(locale ?? "en")`).
2. `email-templates.ts:32` and `:89` call it WITHOUT `await` and WITHOUT a
   2nd argument — exactly as the plan describes.
3. `EmailsLabels` (`shared/locale/types/emails/index.ts:28–31`) has NO `errors`
   field today — only `complaintResponse` + `suggestionAcknowledged`; the
   proposed errors implant at plan lines 499–510 is a NEW addition.
4. Extending `shared/locale/en/emails/index.ts` and
   `shared/locale/ar/emails/index.ts` is the correct path for the En/AR
   implants (existing files already implement `emailsEn` / `emailsAr`).
5. `next-intl` is absent from `package.json` and from any live import — zero
   source hits, only doc/comment remnants.

The ONLY corrective note for the plan: it must use the **single-arg sync**
call shape (`getServerTranslations(locale ?? "en").emailsTranslations.<newGroup>`)
— NOT the stale 2-arg await form that several instruction files incorrectly
describe. The plan already does this in its examples (lines 495, 511), so no
change needed.
