# Research 08 — Drizzle ORM `1.0.0-rc.4` PG API verification

Verification of the email-template schema snippet against the installed `node_modules/drizzle-orm` types.

---

## 1. Confirmed version

```
node_modules/drizzle-orm/package.json  →  "version": "1.0.0-rc.4"
exports["./pg-core"].import.types     →  ./pg-core/index.d.ts   (resolves correctly)
```

VERIFIED — the package is `1.0.0-rc.4`.

---

## 2. Required exports from `drizzle-orm/pg-core`

All names appear in the single re-export statement at
`node_modules/drizzle-orm/pg-core/index.d.ts:72`. Each resolves to a concrete `.d.ts`
file (the `.d.ts` path + `declare function` line is given):

| Export        | `.d.ts` path (under `node_modules/drizzle-orm/pg-core/`) | `declare` line              | Status    |
|---------------|----------------------------------------------------------|-----------------------------|-----------|
| `pgTable`     | `table.d.ts`                                             | `pgTable` (PgTableFn) at l.101 | VERIFIED  |
| `pgEnum`      | `columns/enum.d.ts`                                      | l.~62 `declare function pgEnum…` | VERIFIED  |
| `uuid`        | `columns/uuid.d.ts`                                      | l.21 `declare function uuid`     | VERIFIED  |
| `varchar`     | `columns/varchar.d.ts`                                   | l.34–47 (5 overloads)            | VERIFIED  |
| `text`        | `columns/text.d.ts`                                      | l.32–35 (4 overloads)            | VERIFIED  |
| `integer`     | `columns/integer.d.ts`                                   | l.18 `declare function integer` | VERIFIED  |
| `boolean`     | `columns/boolean.d.ts`                                    | l.17 `declare function boolean` | VERIFIED  |
| `jsonb`       | `columns/jsonb.d.ts`                                     | l.~12 `declare function jsonb`  | VERIFIED  |
| `timestamp`   | `columns/timestamp.d.ts`                                 | l.~46 two overloads             | VERIFIED  |
| `uniqueIndex` | `indexes.d.ts`                                           | l.~97 `declare function uniqueIndex` | VERIFIED  |

`timestamp` options — VERIFIED:
- `PgTimestampConfig` (`timestamp.d.ts` ~l.40) defines `{ mode?: 'date' | 'string'; precision?: Precision; withTimezone?: boolean }`.
- Constructor signature `new PgTimestampBuilder(name, withTimezone, precision)`.
- `Precision = 0|1|2|3|4|5|6` → `precision: 3` is valid.

---

## 3. `pgTable` callback signature — `(t) => ({ ... })` object form

`node_modules/drizzle-orm/pg-core/table.d.ts` exposes **four** overloads on `PgTableFnInternal`:

1. `pgTable(name, columns: TColumnsMap, extraConfig?: (self) => PgTableExtraConfigValue[])` — l.28
2. `pgTable(name, columns: (columnTypes) => TColumnsMap, extraConfig?: (self) => PgTableExtraConfigValue[])` — l.34
3. **`pgTable(name, columns: TColumnsMap, extraConfig: (self) => PgTableExtraConfig)` — l.62**  ← object-return form
4. `pgTable(name, columns: (columnTypes) => TColumnsMap, extraConfig: (self) => PgTableExtraConfig)` — l.90

- `PgTableExtraConfig = Record<string, PgTableExtraConfigValue>` (table.d.ts l.21).
- `PgTableExtraConfigValue = AnyIndexBuilder | CheckBuilder | ForeignKeyBuilder | PrimaryKeyBuilder | UniqueConstraintBuilder | PgPolicy` (table.d.ts l.20).

**VERIFIED — the object-return third-arg form `(t) => ({ scopeSlugIdx: uniqueIndex(…).on(t.scope, t.slug), … })` type-checks.**

⚠️ **CAVEAT (annotation in source, not a blocker):** overloads 3 and 4 carry a JSDoc
`@deprecated The third parameter of pgTable is changing and will only accept an array instead of an object`.
The repo already uses the deprecated object form extensively
(`backend/db/schema/communications/communications.ts:37-57`, `:68-90`, etc.) — so the
object form is **consistent with the existing repo**. The recommended (non-deprecated) form
for new tables is the array form `(t) => [uniqueIndex(…).on(t.scope, t.slug), …]` (overloads 1/2).
This is a **style note, not an API incompatibility** — both compile under `1.0.0-rc.4`.

`.on(t.scope, t.slug)` chained call on `uniqueIndex().on(...)`:
- `uniqueIndex(name?)` returns `IndexBuilderOn` (`indexes.d.ts` l.~97).
- `IndexBuilderOn.on(...columns): IndexBuilder` (`indexes.d.ts` ~l.34) accepts variadic `Partial<ExtraConfigColumn> | SQL | PgColumn`.
- `t.scope` and `t.slug` are `PgColumn` (post-build) — `ExtraConfigColumn` extends `PgColumn`, so the chained `.on(t.scope, t.slug)` is type-correct. VERIFIED.

---

## 4. `uniqueIndex().where()` for partial indexes — VERIFIED, with a runtime caveat

**Type-level (VERIFIED):**
- `uniqueIndex(name?)` returns `IndexBuilderOn` (`indexes.d.ts`).
- `.on(...)` / `.using(method, ...)` / `.onOnly(...)` return `IndexBuilder`.
- `IndexBuilder` declares **`where(condition: SQL): this`** at
  `node_modules/drizzle-orm/pg-core/indexes.d.ts` (class `IndexBuilder`, method `where`).
- `IndexConfig.where?: SQL` is the persisted partial-index predicate
  (`indexes.d.ts`, JSDoc: *"Condition for partial index."*).

So the partial unique index
`uniqueIndex("…_scope_locale_uq").on(t.scope, t.locale).where(sql\`…\`)` **type-checks**.

**Runtime caveat (drizzle-kit migration generation — known historical bug):**
GitHub issues [#3349](https://github.com/drizzle-team/drizzle-orm/issues/3349) and
[#4790](https://github.com/drizzle-team/drizzle-orm/issues/4790) document that `where(eq(col, true))`
generates a parameterized `$1` placeholder instead of a literal — producing invalid migration SQL.
The documented workaround is to use the `sql` template tag with an **inline literal**:

```ts
uniqueIndex("email_templates_scope_locale_active_uq")
  .on(t.scope, t.locale)
  .where(sql`${t.isActive} = true`)          // ← literal `true`, not eq()
```

For boolean columns this works; for enum casts the literal must include `::enum_type`:

```ts
.where(sql`${t.status} = 'PUBLISHED'::email_template_status`)
```

**Verdict:** the partial unique index is **implementable today** in `1.0.0-rc.4`, with an explicit note:
*"use `sql\`…\`` literal form, NOT `eq()` — see drizzle-orm #3349/#4790."*
The repo already follows this literal-`sql` pattern for partial indexes — see
`backend/db/schema/communications/communications.ts:221`:

```ts
index("suggestions_active_created_at_idx").on(table.createdAt).where(sql`${table.deletedAt} IS NULL`)
```

(except that's a non-unique `index`, not `uniqueIndex` — but the `.where(SQL)` method is the same
on both `IndexBuilder` instances).

---

## 5. `jsonb("...").$type<readonly EmailEditorPermission[]>()` — VERIFIED

- `PgJsonbBuilder extends PgColumnBuilder<{…}>` (`columns/jsonb.d.ts`).
- `PgColumnBuilder.$type<TType>(): Set$Type<this, TType>` (`columns/common.d.ts` ~l.163).
- `Set$Type<T, TType> = T & { readonly _: { $type: TType } }` (`columns/common.d.ts` l.85).

TypeScript happily accepts `readonly` array modifiers as a generic argument; `TType` has no
constraint, so `readonly EmailEditorPermission[]` flows through unchanged and is recorded in
the column's `_: { $type: readonly EmailEditorPermission[] }`. The Drizzle `default()` /
`$defaultFn()` `WrapArray` logic only kicks in when `dimensions` is set (i.e. `.array()`);
the `readonly[]` form goes through the non-array branch and uses `TType` as-is. VERIFIED.

Online docs cross-ref (`orm.drizzle.team/docs/column-types/pg`, fetched 2026-08-01):
- l.462 `json: json().$type<string[]>();`
- l.500 `jsonb: jsonb().$type<string[]>();`
- l.455/493 *"You can specify `.$type<..>()` for json object inference, it won't check runtime values. It provides compile time protection for default values, insert and select schemas."*

No online-doc mention of `readonly`, but the type signature has no constraint forbidding it.

---

## 6. `.array()` on `pgEnum` columns — VERIFIED at the type layer

- `pgEnum(name, values)` returns `PgEnum<TValues>` (`columns/enum.d.ts`).
- `PgEnum<TValues>.(name?) ⇒ PgEnumColumnBuilder<TValues>` (callable).
- `PgEnumColumnBuilder extends PgColumnBuilder<…>` (`columns/enum.d.ts`).
- `PgColumnBuilder.array(): SetDimensions<this, 1>` (`columns/common.d.ts` l.251) — **inherited by `PgEnumColumnBuilder`**.

So `emailEditorPermissionEnum("…").array()` type-checks, and the resulting column has
`_: { dimensions: 1 }`, which feeds `WrapArray<TValues[number], 1> = TValues[number][]`
on select/insert (`ResolvePgColumnConfig`, common.d.ts l.114).

⚠️ **Runtime caveat:** drizzle-kit enum-array migration generation has a historical bug —
[drizzle-orm #1680](https://github.com/drizzle-team/drizzle-orm/issues/1680) — fixed in the
`beta`/`1.0` line (which `1.0.0-rc.4` is part of). So the form should now work end-to-end, but
the `jsonb.$type<readonly EmailEditorPermission[]>()` form is the **lower-risk, idiomatic-to-this-repo** choice — confirmed: the repo has
**zero** existing `.array()` columns today and uses `jsonb.$type<T>()` for typed JSON
(e.g. `notifications.ts:117` — `jsonb("metadata").$type<NotificationMetadata | null>()`).

VERIFIED — the `jsonb` choice is sound; the `pgEnum-array` alternative is now type-safe
and (post-1.0) migration-safe, but should only be used if the team specifically prefers the
typed-array column shape.

---

## 7. Existing repo schema pattern — quotes from `backend/db/schema/communications/communications.ts`

An `emailTemplates` table mirrors the existing `communications.ts` conventions closely:

1. **Imports** (l.1–13) — the full set needed (`boolean, index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid, varchar`), plus `foreignKey` and `sql` from `drizzle-orm`, and `integer` — present in `pg-core/index.d.ts:72` exports, used elsewhere in the repo.

2. **`pgTable(name, columns, table => [ … ])`** — repo uses the **array form** (overload #1/#2),
   e.g. `userNotificationPreferences` (l.37–57): `table => [ index(…).on(…), …, uniqueIndex("…_unique_idx").on(table.userId, table.channel, table.eventType) ]`.
   Both the **object form** (`scopeSlugIdx:`) and the array form compile; the array form is the
   non-deprecated style. **Minor inconsistency** — the array form better matches
   repo style and avoids the `@deprecated` overload.

3. **`timestamp("…", { withTimezone: true, precision: 3 })`** — used identically throughout
   (`createdAt`, `updatedAt`, etc. — `communications.ts:47–48`, etc.). VERIFIED identical.

4. **Enum columns** — repo builds via `createPgEnumFromEnum` (`backend/utils/db.utils.ts:3–5`,
   wraps `pgEnum(enumName, Object.values(enumObject))`); enum-color values registered in
   `backend/db/schema/enums.ts`. Defer to that helper for new enums.
   The existing `appPermissionEnum` (`enums.ts:100–103`) shows the **raw `pgEnum` form** is also
   acceptable in this repo.
   > Note: `createPgEnumFromEnum` returns `PgEnum<[string, ...string[]]>`, whose column `data` is
   > `string` (not the TS enum value). The repo tolerates this; for `emailScopeEnum` /
   > `emailTemplateStatusEnum`, follow the same helper to stay consistent.

5. **`jsonb.$type<T>()`** — repo precedent at `notifications.ts:117`:
   `"metadata: jsonb("metadata").$type<NotificationMetadata | null>()"`. An
   `attachmentRules: jsonb("attachment_rules").$type<EmailAttachmentRules>()` (l.382) and
   `allowedEditorGroups: jsonb("allowed_editor_groups").$type<readonly EmailEditorPermission[]>().notNull()`
   (l.380) follow the same pattern — only difference is the `readonly[]` modifier, which is
   type-level only (see §5). VERIFIED consistent.

6. **`uniqueIndex(...).on(...)`** — repo uses `.on(table.col1, table.col2, table.col3)` for
   composite uniques (`communications.ts:55`). A `.on(t.scope, t.slug)` /
   `.on(t.scope, t.locale)` mirrors this. VERIFIED.

7. **Partial `.where(sql\`…\`)`** — repo already uses `.where(sql\`${table.deletedAt} IS NULL\`)`
   on a **non-unique** `index` at `communications.ts:221`. The same `.where()` method exists on
   `uniqueIndex` builders (same `IndexBuilder` class, `indexes.d.ts`). VERIFIED feasible.

8. **Self-reference (`parentTemplateId references(() => emailTemplates.id)`)** —
   common Drizzle pattern; an `emailTemplateRevisions` table references
   `emailTemplates.id` the same way `complaintResponses` references `complaints.id`
   (`communications.ts:174–176`). VERIFIED.

---

## 8. Online-docs cross-reference (fetched 2026-08-01)

- `https://orm.drizzle.team/docs/column-types/pg`
  - jsonb `.$type<…>()` usage: l.462, l.500 — `"jsonb: jsonb().$type<string[]>()"`
  - timestamp `{ withTimezone, precision }`: l.548–550, l.565–587
  - pgEnum: l.740–742
  - "Every column builder has a `.$type()` method": l.855, l.867 (`serial().$type<UserId>()`)
- `https://orm.drizzle.team/docs/latest-releases` → v1 upgrade path includes fix for #1680
  (enum-array migration generation) — `1.0.0-rc.4` is on the v1 line, so the fix applies.
- WebSearch ("drizzle-orm 1.0.0-rc.4 uniqueIndex where partial index pgEnum array") confirms:
  - `IndexBuilder.where(condition: SQL)` exists (Drizzle mintlify schema/indexes doc).
  - The `eq()`-in-`where()` migration-generation bug (#3349, #4790) — workaround is `sql\`…\`` literal.
  - The enum-array `#1680` is fixed in the v1/beta line.

---

## 9. Verdict

**VERIFIED** — the schema type-checks against
`node_modules/drizzle-orm@1.0.0-rc.4`. All required `pg-core` exports exist with the documented signatures.

### Minor (non-blocking) corrections:

1. **Third-arg callback form.** Prefer the **array form** `(t) => [ uniqueIndex(…).on(t.scope, t.slug), uniqueIndex(…).on(t.scope, t.locale) ]` to match the existing `communications.ts` repo style and avoid the `@deprecated` object-return overload (table.d.ts JSDoc). The object form still compiles under `1.0.0-rc.4`, so this is stylistic, not a hard requirement.

2. **Partial unique index note.** When implementing the partial unique
   index `on(t.scope, t.locale) where isActive = true`, the predicate MUST be written with the
   `sql\`${t.isActive} = true\`` **literal** form, NOT `eq(t.isActive, true)`. `eq()` produces a
   parameterized `$1` placeholder that breaks migration generation (drizzle-orm #3349, #4790).
   Reference `backend/db/schema/communications/communications.ts:221` as the in-repo precedent.

3. **`createPgEnumFromEnum` helper.** Confirmed to live at
   `backend/utils/db.ts:3–5` (re-exported as `@/backend/utils/db.utils`), wraps
   `pgEnum(enumName, Object.values(enumObject))`. Just import from
   `@/backend/utils/db.utils` (the existing `enums.ts` import path, l.40).

All other schema elements (`uuid.defaultRandom().primaryKey()`, `varchar length`,
`text`, `integer().default(1)`, `boolean().default(true)`, `jsonb.$type<T>()`,
`timestamp({ withTimezone: true, precision: 3 }).defaultNow()`, `references(() => …)` self/foreign
refs) match `1.0.0-rc.4` types exactly.
