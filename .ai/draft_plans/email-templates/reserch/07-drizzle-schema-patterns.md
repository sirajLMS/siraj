# 07 — Drizzle ORM Schema Patterns Verification

**Scope:** lines 248–296 of the design.
**Verdict:** VERIFIED (with two small import-order / enum-convention nits to fix)
**Repo `drizzle-orm` version (exact line from `package.json`):**
```
"drizzle-orm": "1.0.0-rc.4",
```
(Line 119 of `/home/ahmed/Projects/siraj-mail/package.json` — well past the 0.36 milestone the design references; the design's "0.36+" phrasing is correct but conservative. `drizzle-kit` is also `1.0.0-rc.4`, line 211.)

---

## 1. Original schema block (verbatim, lines 252–296)

```ts
import { pgTable, uuid, varchar, text, jsonb, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { users } from "@/backend/db/schema";
import { emailScopeEnum, emailTemplateStatusEnum, emailEditorPermissionEnum } from "@/backend/db/schema/enums";

export const emailTemplates = pgTable("email_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  scope: emailScopeEnum("scope").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  status: emailTemplateStatusEnum("status").notNull().default("DRAFT"),
  designJson: jsonb("design_json"),
  compiledHtml: text("compiled_html"),
  compiledText: text("compiled_text"),
  defaultFromName: varchar("default_from_name", { length: 255 }),
  defaultFromEmail: varchar("default_from_email", { length: 255 }),
  allowedEditorGroups: emailEditorPermissionEnum("allowed_editor_groups").array().notNull(),
  attachmentRules: jsonb("attachment_rules").$type<EmailAttachmentRules>(),
  locale: varchar("locale", { length: 10 }).notNull().default("en"),
  version: integer("version").notNull().default(1),
  parentTemplateId: uuid("parent_template_id").references(() => emailTemplates.id),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
}, (t) => ({
  scopeSlugIdx: uniqueIndex("email_templates_scope_slug_uq").on(t.scope, t.slug),
  scopeLocaleActiveIdx: uniqueIndex("email_templates_scope_locale_active_uq").on(t.scope, t.locale, t.isActive),
}));

export const emailTemplateRevisions = pgTable("email_template_revisions", { ... });
```

> Notes on the verbatim block: (a) `pgEnum` is imported but unused (the enums are imported from `@/backend/db/schema/enums`); (b) `integer` is used but never imported; (c) `uniqueIndex` is used but never imported.

---

## 2. Comparison table: design claim → repo reality + docs URL

| # | Claim | Repo reality | Drizzle docs reference | Verdict |
|---|---|---|---|---|
| Q5 | Repo is "0.36+" | `drizzle-orm` = **`1.0.0-rc.4`**, `drizzle-kit` = **`1.0.0-rc.4`** (`package.json:119, 211`) | [latest-releases](https://orm.drizzle.team/docs/latest-releases) — docs page only shows up to `v1.0.0-beta.2 (Feb 12, 2025)`; the `rc.4` in the repo is newer than the docs page's listed releases | VERIFIED (repo is on `1.0.0-rc.4`, well past 0.36) |
| Q1 | `pgEnum("name", [...]).array()` is legal for `allowedEditorGroups` (array-of-enum) | **No existing `.array()` columns anywhere in `backend/db/schema/**/*.ts`** (zero matches) — there is no in-repo precedent. The pattern IS supported at the ORM level on `1.0.0-rc.4`. | drizzle-orm source [`pg-core/columns/enum.ts`](https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-orm/src/pg-core/columns/enum.ts) — `pgEnum(...)` returns a callable that returns a `PgEnumColumnBuilder`; `.array()` is a standard column-builder method. GitHub issue [#1564](https://github.com/drizzle-team/drizzle-orm/issues/1564) shows the canonical syntax `myEnum('col').array().notNull()` and confirms it was fixed in `drizzle-kit ~0.24.0` (so the rc in this repo is fine). | VERIFIED (with caveats — see §5 gotchas) |
| Q2 | `uniqueIndex("name").on(t.col1, t.col2)` is the modern multi-column form | **Confirmed by sibling:** `backend/db/schema/communications/communications.ts:55` — `uniqueIndex("user_notification_preferences_unique_idx").on(table.userId, table.channel, table.eventType)`. Also `backend/db/schema/classes/group-class.ts:52`, `backend/db/schema/students/students.ts:155`, `backend/db/schema/classes/subject-resource.ts:20`. | [indexes-constraints](https://orm.drizzle.team/docs/indexes-constraints) — `uniqueIndex("name").on(table.a, table.b)` is the documented multi-column form. (Old single-arg `.on(col)` still works; multi-arg is the modern form.) | VERIFIED |
| Q3 | `uuid("id").defaultRandom().primaryKey()` is the canonical ordering | **Confirmed verbatim** in repo: `backend/db/schema/communications/communications.ts:40` — `id: uuid("id").defaultRandom().primaryKey()`. Same in `userDeviceTokens` (line 71), `teacher-dues.ts`, `students.ts`, etc. The repo ALWAYS uses this exact ordering chain. | [indexes-constraints "Default"](https://orm.drizzle.team/docs/indexes-constraints) shows `uuid().defaultRandom()` for the default; [column-types/pg "Primary key"](https://orm.drizzle.team/docs/column-types) shows `.primaryKey()`. Both confirmed. | VERIFIED (matches repo convention exactly) |
| Q4 | Enum import shape: enums come from `@/backend/db/schema/enums` and are named `emailScopeEnum` etc. | **Convention mismatch (minor).** `/home/ahmed/Projects/siraj-mail/backend/db/schema/enums.ts` defines enums via the shared helper `createPgEnumFromEnum("name", Enum)` (not raw `pgEnum` directly). Every enum is sourced from a TypeScript enum in `@/backend/enum` first, then wrapped. Only ONE exception uses raw `pgEnum` (`appPermissionEnum`, line 100–103). The new email enums (`emailScopeEnum`, `emailTemplateStatusEnum`, `emailEditorPermissionEnum`) must follow the `createPgEnumFromEnum` pattern AND have corresponding TypeScript enums in `@/backend/enum`. The design currently imports them from `.../enums` (correct barreling) but doesn't show how they're defined. | N/A (repo convention) | NEEDS UPDATE — define new enums with `createPgEnumFromEnum`, not raw `pgEnum`. Also: remove the unused `pgEnum` import from the table file. |
| Q6 | `jsonb("attachment_rules").$type<EmailAttachmentRules>()` typed-JSON pattern works | **Confirmed by multiple siblings.** `backend/db/schema/meeting/meeting-providers.ts:10` — `name: jsonb("name").$type<LocalizedString>().notNull()`. Also `:13` uses `.$type<readonly string[]>()`. `backend/db/schema/communications/communications.ts:117` — `metadata: jsonb("metadata").$type<NotificationMetadata | null>()`. The repo places `.$type<>()` BEFORE `.notNull()` (e.g., `jsonb(...).$type<Foo>().notNull()`) — the design's nullable `attachmentRules` omits `.notNull()` so ordering doesn't matter here, but for consistency with the repo, chain `.$type<>()` immediately after the column constructor. | [column-types/pg — jsonb](https://orm.drizzle.team/docs/column-types) — "You can specify `.$type<..>()` for json object inference". | VERIFIED |
| Q7 | Existing array-of-enum or array columns in repo to reference | **None.** `Grep` for `\.array\(\)` across `backend/db/schema/**/*.ts` returns zero matches. The design would introduce the FIRST `.array()` column in the repo. If a precedent is desired, the closest is `urlAllowlist: jsonb("url_allowlist").$type<readonly string[]>()` in `backend/db/schema/meeting/meeting-providers.ts:13` and `backend/db/schema/billing/supported-payment-links.ts:13` — i.e., the repo prefers storing arrays as **typed `jsonb`** (`.$type<readonly string[]>()`) rather than PG native arrays. | [guides/empty-array-default-value](https://orm.drizzle.team/docs/guides/empty-array-default-value) documents native `.array()`. | NEEDS UPDATE (recommendation, not a blocker) — see §6 recommended form. |

---

## 3. Matching repo siblings

| Pattern in the design | Best repo sibling to mirror |
|---|---|
| `uuid("id").defaultRandom().primaryKey()` | `backend/db/schema/communications/communications.ts:40` (exact same chain) |
| Multi-column `uniqueIndex("name").on(t.a, t.b, t.c)` | `backend/db/schema/communications/communications.ts:55` — `uniqueIndex("user_notification_preferences_unique_idx").on(table.userId, table.channel, table.eventType)` |
| `jsonb("x").$type<Foo>()` | `backend/db/schema/meeting/meeting-providers.ts:10` — `jsonb("name").$type<LocalizedString>().notNull()` |
| `jsonb("x").$type<readonly string[]>()` (typed array via jsonb) | `backend/db/schema/meeting/meeting-providers.ts:13` — `urlAllowlist: jsonb("url_allowlist").$type<readonly string[]>().notNull()` |
| Enum-from-TS-enum registration | `backend/db/schema/enums.ts:42` — `createPgEnumFromEnum("app_language", AppLanguage)` |

---

## 4. Gotchas for the array-of-enum column

1. **Default values require `sql` template literals.** Per [GitHub issue #1564](https://github.com/drizzle-team/drizzle-orm/issues/1564), array-of-enum columns with a non-empty default need `sql\`'{"VALUE"}'\`` (or `sql\`ARRAY['VALUE']::enum_name[]\``). A bare JS array default like `.default(["X"])` does NOT round-trip via `drizzle-kit push` correctly. The design's `allowedEditorGroups` has `.notNull()` but NO default, so the insert path must always supply a value — verify this is intentional, otherwise add `.default(sql\`'{}'\`)` for an empty-array default (see [guides/empty-array-default-value](https://orm.drizzle.team/docs/guides/empty-array-default-value)).
2. **Order of `.notNull()` vs `.array()`** — the docs and issue threads consistently use `.array().notNull()`. The design uses `.array().notNull()` — correct.
3. **The repo has no existing `.array()` precedent.** Reviewers may flag it as a "new pattern." Consider explicitly documenting the choice in the PR description, or using the repo's existing jsonb-of-array pattern instead (see §6).
4. **`.$type<>()` on the enum column** — repo convention (e.g., `currencyCodeEnum("currency").notNull().$type<CurrencyCode>()` at `billing/billing.ts:41`) often adds `.$type<TsEnum>()` to enum columns to surface the underlying TS enum type. The design omits this for `scope`, `status`, and `allowedEditorGroups`. Optional but recommended for type parity with `@/backend/enum`.
5. **Unused `pgEnum` import** — line 252 imports `pgEnum` but never calls it (enums come from `.../enums`). Remove it to satisfy lint.
6. **Missing `integer` import** — line 252 doesn't import `integer` but uses it on line 276. Both imports must come from `drizzle-orm/pg-core`.
7. **Missing `uniqueIndex` import** — used in the table callback; must be added to the `drizzle-orm/pg-core` import list.

---

## 5. Corrected schema block

```ts
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "@/backend/db/schema";
import {
  emailEditorPermissionEnum,
  emailScopeEnum,
  emailTemplateStatusEnum,
} from "@/backend/db/schema/enums";
// (EmailAttachmentRules type lives in @/backend/types/email/email.types.ts per the backend pattern.)

export const emailTemplates = pgTable(
  "email_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    scope: emailScopeEnum("scope").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    status: emailTemplateStatusEnum("status").notNull().default("DRAFT"),
    designJson: jsonb("design_json"),
    compiledHtml: text("compiled_html"),
    compiledText: text("compiled_text"),
    defaultFromName: varchar("default_from_name", { length: 255 }),
    defaultFromEmail: varchar("default_from_email", { length: 255 }),
    // First native PG-array column in this repo — keep .array().notNull() ordering.
    allowedEditorGroups: emailEditorPermissionEnum("allowed_editor_groups")
      .array()
      .notNull(),
    attachmentRules: jsonb("attachment_rules").$type<EmailAttachmentRules>(),
    locale: varchar("locale", { length: 10 }).notNull().default("en"),
    version: integer("version").notNull().default(1),
    parentTemplateId: uuid("parent_template_id").references(() => emailTemplates.id),
    isActive: boolean("is_active").notNull().default(true),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("email_templates_scope_slug_uq").on(t.scope, t.slug),
    uniqueIndex("email_templates_scope_locale_active_uq").on(t.scope, t.locale, t.isActive),
  ],
);
```

> Two callback-shape notes:
> - The design returns an **object** `(t) => ({ scopeSlugIdx: ..., scopeLocaleActiveIdx: ... })` from the callback. The repo's overwhelming convention (and the Drizzle docs) is to return an **array** of constraint/index builders, e.g. `table => [index(...), uniqueIndex(...)]`. Both forms compile in Drizzle `1.0.0-rc.4`, but the array form is what every other file in `backend/db/schema/` uses. **Recommended:** switch to the array form for repo consistency (see `backend/db/schema/communications/communications.ts:50–57`). Both forms are shown in the Drizzle docs ([indexes-constraints](https://orm.drizzle.team/docs/indexes-constraints) uses the array form in the index section and the object form only in the older docs).

---

## 6. Recommended alternative for `allowedEditorGroups` (matches existing repo style)

The repo currently has zero PG-array columns but several **jsonb-backed array** columns using `.$type<readonly string[]>()` (e.g., `backend/db/schema/meeting/meeting-providers.ts:13` — `urlAllowlist: jsonb("url_allowlist").$type<readonly string[]>().notNull()`). If the reviewer wants repo consistency over native PG enum arrays, this is the equivalent:

```ts
allowedEditorGroups: jsonb("allowed_editor_groups")
  .$type<readonly EmailEditorPermission[]>()
  .notNull(),
```

Trade-off: loses PG-level enum value validation (the jsonb form accepts any string), but gains consistency with the existing repo pattern and avoids any `drizzle-kit` array-default edge cases. **Decision is the implementer's** — the native-array form (Q1) IS supported in `drizzle-orm 1.0.0-rc.4`.

---

## 7. Exact recommended line edits

| Line | Edit |
|---|---|
| 252 | Remove `pgEnum` from the import list (unused). Add `integer`, `uniqueIndex` to the import list. Sort imports biome-style. |
| 255 (new enums source) | Confirm `emailScopeEnum` / `emailTemplateStatusEnum` / `emailEditorPermissionEnum` are added to `backend/db/schema/enums.ts` via `createPgEnumFromEnum("email_scope", EmailScope)` etc., and the underlying TS enums live in `@/backend/enum`. The design doesn't show this; add a step. |
| 270 | Add a comment noting this is the repo's first PG-native array column. Optionally add `.$type<EmailEditorPermission[]>()` for TS-enum type parity. If a default is desired, use `.default(sql\`'{}'\`)`. |
| 282–285 | Consider switching the callback from object form `(t) => ({ ... })` to array form `(t) => [uniqueIndex(...), uniqueIndex(...)]` for repo consistency (every sibling uses the array form). |
| 248–296 | Remove the second `emailTemplateRevisions` placeholder block or expand it fully — it's an ellipsis in the design but the surrounding code references it. |

---

## 8. Source URLs cited

- Drizzle latest releases: https://orm.drizzle.team/docs/latest-releases
- Drizzle PG column types (enum + jsonb + uuid + primaryKey): https://orm.drizzle.team/docs/column-types/pg
- Drizzle indexes & constraints (uniqueIndex multi-column): https://orm.drizzle.team/docs/indexes-constraints
- Drizzle guides — empty array as default value: https://orm.drizzle.team/docs/guides/empty-array-default-value
- drizzle-orm source `pg-core/columns/enum.ts`: https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-orm/src/pg-core/columns/enum.ts
- GitHub issue #1564 (enum-as-array syntax + drizzle-kit default support): https://github.com/drizzle-team/drizzle-orm/issues/1564

## 9. Repo files cited

- `/home/ahmed/Projects/siraj-mail/package.json` (lines 119, 211) — `drizzle-orm` / `drizzle-kit` versions
- `/home/ahmed/Projects/siraj-mail/backend/db/schema/enums.ts` (lines 1, 40, 42, 100–103) — enum convention (`createPgEnumFromEnum` helper + one raw `pgEnum`)
- `/home/ahmed/Projects/siraj-mail/backend/utils/db.utils.ts` (lines 1–5) — `createPgEnumFromEnum` definition
- `/home/ahmed/Projects/siraj-mail/backend/db/schema/communications/communications.ts` (lines 40, 55) — `uuid().defaultRandom().primaryKey()` and multi-column `uniqueIndex(...).on(a, b, c)`
- `/home/ahmed/Projects/siraj-mail/backend/db/schema/meeting/meeting-providers.ts` (lines 10, 13) — `jsonb().$type<LocalizedString>()` and `jsonb().$type<readonly string[]>()`
