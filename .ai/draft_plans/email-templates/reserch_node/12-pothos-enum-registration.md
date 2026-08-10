# Research 12 — Pothos Enum Registration Pattern Verification

Verifies plan line 460 of
`/home/ahmed/.cursor/plans/email_template_system_(react_email_+_editor)_08419060.plan.md`
against the installed `@pothos/core@4.13.1` and the repo's existing
`NotificationEventType` / `NotificationChannel` registration.

Concern: confirm whether `builder.enumType(Enum, {...})` is the correct
Pothos v4 registration API, where the registration file lives, and whether
`EmailEditorPermission` registration **must** happen before the email
Pothos object can reference it.

---

## 1. Registration file — confirmed path

**File:** `backend/graphql/pothos/shared/enum.pothos.ts`
(all enum registrations live in this single file; there is no second enum
file).

Barrel: `backend/graphql/pothos/shared/index.ts:1` re-exports everything
from `enum.pothos` (`export * from "./enum.pothos"`).

---

## 2. Verbatim exports for `NotificationChannel` / `NotificationEventType`

From `backend/graphql/pothos/shared/enum.pothos.ts`:

```text
28:import { NotificationChannel } from "@/backend/enum";   (inside the big import block at lines 1–44)
29:import { NotificationEventType } from "@/backend/enum";
47:import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";

153:export const NotificationChannelPothosObject = gqlSchemaBuilder.enumType(NotificationChannel, {
154:  name: "NotificationChannel",
155:});
156:
157:export const NotificationEventTypePothosObject = gqlSchemaBuilder.enumType(NotificationEventType, {
158:  name: "NotificationEventType",
159:});
```

**Naming convention observation:** the naming is *not* strictly
`XxxPothosObject` — the file mixes three suffixes:
- `XxxPothosObject`  (e.g. `NotificationChannelPothosObject`, `GenderPothosObject`, `OrderSortDirectionPothosObject`)
- `XxxPothosEnum`    (e.g. `AppPermissionPothosEnum`, `ProfileModePothosEnum`, `UserRolePothosEnum`)
- `XxxPothos`        (e.g. `SystemSettingCategoryPothos`, `SystemSettingDataTypePothos` — the only two that use the legacy string-name form)

The repo's own `backend/graphql/AGENTS.md` and
`backend/graphql/pothos/AGENTS.md` use `XxxPothosEnum` in their positive
examples (e.g. `ProfileModePothosEnum`). So the plan's existing choice of
`EmailScopePothosEnum`, `EmailTemplateStatusPothosEnum`, and
`EmailEditorPermissionPothosEnum` (from research file 09) matches the
AGENTS.md-sanctioned convention. Either `*PothosEnum` or `*PothosObject`
works at runtime (it's just a local export name); only `*PothosEnum`
matches the documented guideline.

---

## 3. `enumType` API signature in Pothos v4

**File:** `node_modules/@pothos/core/esm/builder.d.ts:53`

```text
53:enumType<Param extends EnumParam, const Values extends EnumValues<Types>>(
       param: Param,
       options: EnumTypeOptions<Types, Param, Values>
     ): PothosSchemaTypes.EnumRef<Types,
       Param extends BaseEnum ? ValuesFromEnum<Param> : ShapeFromEnumValues<Types, Values>>;
```

Supporting types:

- `EnumParam = BaseEnum | string` —
  `node_modules/@pothos/core/esm/types/type-params.d.ts:60`
  (so the first arg accepts **either** a real TS enum object **or** a
  string name).
- `EnumTypeOptions<Types, Param, Values>` —
  `node_modules/@pothos/core/esm/types/builder-options.d.ts:45`:
  ```text
  45:export type EnumTypeOptions<Types, Param, Values> =
        Param extends BaseEnum
          ? Merge<Omit<PothosSchemaTypes.EnumTypeOptions<Types, Values>, 'values'> & {
              name: string;
              values?: Partial<Record<keyof Param, Omit<PothosSchemaTypes.EnumValueConfig<Types>, 'value'>>>;
            }>
          : PothosSchemaTypes.EnumTypeOptions<Types, Values>;
  ```
  → When `Param extends BaseEnum` (the enum-object form, which is what the
  repo uses), only `name` is required, and `values` is an *optional*
  `Partial<Record<keyof Param, …>>`. That is exactly why
  `gqlSchemaBuilder.enumType(NotificationChannel, { name: "NotificationChannel" })`
  compiles without listing values: Pothos v4 auto-derives them from the
  enum object via `valuesFromEnum(Enum)` in
  `node_modules/@pothos/core/esm/utils/enums.d.ts:3`.

So the plan's note "Pothos v4 uses the enum-object form (passing the TS
enum directly), not string values" is **correct** — and is the *only* form
permitted by the repo's own AGENTS.md rules (see lines in
`backend/graphql/AGENTS.md` "Pothos Enum Registration Pattern (CRITICAL
RULE)").

---

## 4. Exactly how a registered enum is consumed in a Pothos object

Verbatim from `backend/graphql/pothos/notifications/notification-preferences.pothos.ts:1-31`:

```text
1: import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
2: import {
3:   NotificationChannelPothosObject,
4:   NotificationEventTypePothosObject,
5: } from "@/backend/graphql/pothos/shared/enum.pothos";
6: import type {
7:   NotificationPreferenceReturnType,
8:   NotificationPreferenceUpdateInput,
9: } from "@/backend/types/notifications/notification-preferences.types";
10:
11: const NotificationPreferenceRef =
    gqlSchemaBuilder.objectRef<NotificationPreferenceReturnType>("NotificationPreference");
12:
14: export const NotificationPreferencePothosObject = NotificationPreferenceRef.implement({
15:   fields: t => ({
16:     id: t.exposeString("id"),
17:     channel: t.expose("channel", { type: NotificationChannelPothosObject }),
18:     eventType: t.expose("eventType", { type: NotificationEventTypePothosObject }),
19:     enabled: t.exposeBoolean("enabled"),
20:   }),
21: });
22:
23: export const NotificationPreferenceInputPothosObject = gqlSchemaBuilder
24:   .inputRef<NotificationPreferenceUpdateInput>("NotificationPreferenceInput")
25:   .implement({
26:     fields: t => ({
27:       channel: t.field({ type: NotificationChannelPothosObject, required: true }),
28:       eventType: t.field({ type: NotificationEventTypePothosObject, required: true }),
29:       enabled: t.boolean({ required: true }),
30:     }),
31:   });
32:
```

Key facts:
- The domain Pothos file imports the **registered ref** (e.g.
  `NotificationChannelPothosObject`) from `shared/enum.pothos`, never the
  raw TS enum (`NotificationChannel`). The field references the Pothos
  ref, not the enum object.
- The TS enum object is only imported into `shared/enum.pothos.ts`
  (the registration file). Domain Pothos files import the *ref* from
  `shared`.
- The same ref is reusable on both an `objectRef().implement()` field
  (`t.expose("channel", { type … })`) and an `inputRef().implement()`
  field (`t.field({ type, required })`).

---

## 5. Must `EmailEditorPermission` be registered BEFORE the email Pothos
       object can reference it?

**Yes — registration must be reachable before the email object's module
is evaluated.** The mechanism is import side-effects, not a "before/after"
ordering enforced by Pothos itself:

1. Pothos accumulates types via the builder's `ConfigStore` as a side
   effect of module evaluation. There is no central `registerAll()` call;
   the builder is populated *when the `.pothos.ts` modules are imported*.
2. The schema is assembled in `backend/graphql/gqlSchema.ts:1`:
   `import "@/backend/graphql/gqlSchema.definitions"` which runs
   `backend/graphql/gqlSchema.definitions.ts:10-13`:
   ```text
   import "@/backend/graphql/pothos";
   import "@/backend/graphql/query";
   import "@/backend/graphql/mutation";
   import "@/backend/graphql/pothos/schema.types";
   ```
3. `backend/graphql/pothos/index.ts:7-25` barrels every domain including
   the new `email` domain (which the plan adds) *and* `shared` (line 19:
   `export * from "@/backend/graphql/pothos/shared"`), which pulls in
   `shared/index.ts:1` → `shared/enum.pothos.ts`.

**What "BEFORE" means in practice** — the import graph, not program order:

- [ ] **The registered ref** (`EmailEditorPermissionPothosEnum`) must be
      *importable* by `emailTemplate.pothos.ts`. That is satisfied if the
      export exists in `shared/enum.pothos.ts` and the email Pothos file
      imports it with `import { EmailEditorPermissionPothosEnum } from
      "@/backend/graphql/pothos/shared/enum.pothos"`.
- [ ] **Type registration** only needs to have run by the time
      `gqlSchemaBuilder.toSchema()` is called in
      `backend/graphql/gqlSchema.ts:49`. As long as both
      `shared/enum.pothos` and `email/emailTemplate.pothos` are reachable
      from `backend/graphql/pothos/index.ts`, the order of their
      evaluation does not matter — Pothos resolves refs lazily when the
      schema is built, not at module-eval time.

However, there is a **failure mode** the plan must avoid:

- ❌ If `emailTemplate.pothos.ts` references `EmailEditorPermissionPothosEnum`
  via `t.expose(..., { type: EmailEditorPermissionPothosEnum })` but the
  enum is **not** registered anywhere reachable from
  `gqlSchema.definitions.ts`, then `gqlSchemaBuilder.toSchema()` will
  throw `Unable to resolve type for field …` or `"EmailEditorPermission"
  has not been registered`. (Re-registering it again in a domain file,
  which is the *opposite* mistake, throws `"EmailEditorPermission" has
  already been declared` per AGENTS.md.)

So the precise rule for the plan is:

> `EmailEditorPermission`, `EmailScope`, `EmailTemplateStatus` **MUST be
> registered once** in `backend/graphql/pothos/shared/enum.pothos.ts` and
> the email Pothos object MUST **import the registered refs** from
> `shared/enum.pothos`. Module-evaluation *order* does not matter (Pothos
> resolves refs at `toSchema()` time); what matters is *reachability*
> from `gqlSchema.definitions.ts`. Because both `shared` and the new
> `email` domain are barrel-exported from `backend/graphql/pothos/index.ts`,
> the registration will be present before `toSchema()` runs as long as
> the email domain is added to that same barrel.

No special "import this enum file before the object file" line is needed
in the domain Pothos file — the existing barrel handles it. The
*reachability* requirement is the real "BEFORE" the plan refers to, and
it is satisfied by the barrel.

---

## 6. Quoted call shape the plan should follow

For the three new enums, the registration block to add to
`backend/graphql/pothos/shared/enum.pothos.ts` (matching
`NotificationChannelPothosObject` / `NotificationEventTypePothosObject`
verbatim style, line 153–159 of the same file):

```typescript
import { EmailEditorPermission, EmailScope, EmailTemplateStatus } from "@/backend/enum";
// ... (the existing import block; add these three to it)

export const EmailScopePothosEnum = gqlSchemaBuilder.enumType(EmailScope, {
  name: "EmailScope",
});

export const EmailTemplateStatusPothosEnum = gqlSchemaBuilder.enumType(EmailTemplateStatus, {
  name: "EmailTemplateStatus",
});

export const EmailEditorPermissionPothosEnum = gqlSchemaBuilder.enumType(EmailEditorPermission, {
  name: "EmailEditorPermission",
});
```

(Suffix choice `*PothosEnum` matches the AGENTS.md positive example. The
suffix `*PothosObject` would compile identically; both are plain local
export names. Pick one and be consistent — research file 09 already
chose `*PothosEnum`.)

Then, in `backend/graphql/pothos/email/emailTemplate.pothos.ts`:

```typescript
import {
  EmailEditorPermissionPothosEnum,
  EmailScopePothosEnum,
  EmailTemplateStatusPothosEnum,
} from "@/backend/graphql/pothos/shared/enum.pothos";
// ... use those refs as { type: EmailScopePothosEnum } etc.
```

And add `export * from "@/backend/graphql/pothos/email";` to
`backend/graphql/pothos/index.ts` so the new domain becomes reachable
from `gqlSchema.definitions.ts`.

---

## 7. One-line verdict

**VERIFIED** — The plan line 460 statement is correct: the Pothos v4 enum
registration API is `gqlSchemaBuilder.enumType(<TS enum>, { name: "…" })`
(`@pothos/core@4.13.1`, `node_modules/@pothos/core/esm/builder.d.ts:53`,
`builder-options.d.ts:45`); all enum registrations live in
`backend/graphql/pothos/shared/enum.pothos.ts`; the email Pothos object
must **import the registered ref** (`NotificationChannelPothosObject`
style, `notification-preferences.pothos.ts:17,27` shows it), and the
"BEFORE" requirement is satisfied by adding the `email` domain to the
`backend/graphql/pothos/index.ts` barrel (Pothos resolves refs lazily at
`toSchema()` time). The only nuance beyond the plan's wording is that
module-evaluation *order* is not what matters — *reachability* from
`gqlSchema.definitions.ts` is. The plan is otherwise accurate; the
"`*PothosObject`" suffix in the plan is fine but the AGENTS.md-sanctioned
suffix is `*PothosEnum` (research file 09 already uses `*PothosEnum`).
