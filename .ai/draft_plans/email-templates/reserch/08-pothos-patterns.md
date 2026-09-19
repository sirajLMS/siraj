# 08 — Pothos Patterns Verification (Email Template System)

**Verdict: VERIFIED with minor line updates needed.**

The design's mental model of Pothos v4 (object / input / enum / authScopes) matches both the current Pothos docs and the codebase convention. The two items that need line edits are: (a) the send-email mutation must live in the **mutation** file (the design already says mutation — confirmed correct, *not* a fix), and (b) enum registration must NOT happen inline in `emailTemplate.pothos.ts` — it must be added to `backend/graphql/pothos/shared/enum.pothos.ts` and imported. The design's bullet list does not explicitly call out the shared-enum registration, so it should.

---

## 1. Original claims (lines 341–348, quoted verbatim)

```
### GraphQL surface (NEW — none today)

Following single-canonical-object rule ([backend/AGENTS.md](backend/AGENTS.md)):

- [`backend/graphql/pothos/email/emailTemplate.pothos.ts`](backend/graphql/pothos/email/emailTemplate.pothos.ts) — `EmailTemplatePothosObject` (canonical), `EmailTemplateInputPothosObject`, `EmailTemplatePreviewPothosObject`
- [`backend/graphql/query/email/emailTemplates.query.ts`](backend/graphql/query/email/emailTemplates.query.ts) — `emailTemplates(scope?, status?, pagination)` list + `emailTemplate(id)`
- [`backend/graphql/mutation/email/emailTemplate.mutations.ts`](backend/graphql/mutation/email/emailTemplate.mutations.ts) — `createEmailTemplate`, `updateEmailTemplate`, `publishEmailTemplate`, `archiveEmailTemplate`, `sendEmail`, with `authScopes` for SUPER_ADMIN only by default + per-template `allowedEditorGroups` enforcement
- [`backend/graphql/query/email/emailTemplatePreview.query.ts`](backend/graphql/query/email/emailTemplatePreview.query.ts) — `previewEmailTemplate(templateId, sampleProps)` returns HTML string for iframe
```

## 2. Pothos version in `package.json` (quoted line)

```text
84:    "@pothos/core": "^4.13.1",
85:    "@pothos/plugin-add-graphql": "^4.3.1",
86:    "@pothos/plugin-dataloader": "^4.4.5",
87:    "@pothos/plugin-directives": "^4.3.1",
88:    "@pothos/plugin-drizzle": "^0.17.5",
89:    "@pothos/plugin-errors": "^4.9.1",
90:    "@pothos/plugin-scope-auth": "^4.1.7",
91:    "@pothos/plugin-simple-objects": "^4.1.4",
92:    "@pothos/plugin-tracing": "^1.1.3",
93:    "@pothos/plugin-with-input": "^4.1.5",
```

So this is **Pothos v4** (`@pothos/core@^4.13.1`) with the **`@pothos/plugin-scope-auth@^4.1.7`** plugin for `authScopes`. The `SchemaBuilder` is constructed in `backend/graphql/gqlSchemaBuilder.ts` and declares the `AuthScopes` map (lines 31–37):

```text
28:export interface PothosTypes {
29:  DrizzleRelations: DrizzleRelations;
30:  Context: BaseContext;
31:  AuthScopes: {
32:    loggedIn: boolean;
33:    permission: AppPermission;
34:    superAdmin: boolean;
35:    notImpersonating: boolean;
36:    notSimulatingGroup: boolean;
37:  };
```

## 3. Verification per item

### 3.1 Enum registration — `builder.enumType(MyEnum, { name, values? })`

**Docs URL:** https://v4.pothos-graphql.dev/docs/guide/enums (canonical v4 path; `pothos-graphql.dev/docs/guide/enums` redirects to v4 too).

**Docs say** (and the repo confirms):

> You can pass either a TypeScript enum or a configuration object. Using a TypeScript enum:
> ```typescript
> export enum Diet { HERBIVOROUS, CARNIVOROUS, OMNIVORIOUS }
> builder.enumType(Diet, { name: 'Diet' });
> ```
> `values` is only required when `param` is **not** an enum. When `param` IS a TS enum, Pothos auto-derives the values from the enum members; you only need to supply `name`.

So the design's intention (register from a TS enum backing `EmailScope` etc.) is correct: **`gqlSchemaBuilder.enumType(EmailScope, { name: "EmailScope" })` — no `values` map required**.

**CRITICAL codebase rule (from `backend/graphql/AGENTS.md` and `backend/graphql/pothos/AGENTS.md`):** the enum registration MUST live in `backend/graphql/pothos/shared/enum.pothos.ts`, NOT in the domain `emailTemplate.pothos.ts` file. The domain file only imports the registered `*PothosEnum` and uses it as a field type. Hardcoding `values: [...]` in a domain `.pothos.ts` file is explicitly **PROHIBITED**.

Quote from `backend/graphql/pothos/shared/enum.pothos.ts` showing the canonical pattern (lines 49–51, 153–159):

```49:51:backend/graphql/pothos/shared/enum.pothos.ts
export const AppPermissionPothosEnum = gqlSchemaBuilder.enumType(AppPermission, {
  name: "AppPermission",
});
```

```153:159:backend/graphql/pothos/shared/enum.pothos.ts
export const NotificationChannelPothosObject = gqlSchemaBuilder.enumType(NotificationChannel, {
  name: "NotificationChannel",
});

export const NotificationEventTypePothosObject = gqlSchemaBuilder.enumType(NotificationEventType, {
  name: "NotificationEventType",
});
```

> Note: the repo also has a fallback form (`enumType("Name", { values: { ... } })`) at lines 213–232 for `SystemSettingCategory`, used when remapping TS enum keys to GraphQL enum value names. The TS-enum form (no `values`) is the default and recommended.

### 3.2 Input object types — `builder.inputType('Name', { fields })` OR `builder.inputRef<T>('Name').implement({ fields })`

**Docs URL:** https://v4.pothos-graphql.dev/docs/guide/inputs (canonical v4 path; `/docs/guide/input-objects` → 404 — the current page is `/docs/guide/inputs`).

**Docs say:**

> Input objects can be created using `builder.inputType`.
> ```typescript
> const GiraffeInput = builder.inputType('GiraffeInput', {
>   fields: (t) => ({
>     name: t.string({ required: true }),
>   }),
> });
> ```

The **codebase convention** uses the `inputRef<T>().implement()` form so the input type is bound to an imported `backend/types` shape. Quote from `backend/graphql/pothos/notifications/notification-preferences.pothos.ts` (lines 23–31):

```23:31:backend/graphql/pothos/notifications/notification-preferences.pothos.ts
export const NotificationPreferenceInputPothosObject = gqlSchemaBuilder
  .inputRef<NotificationPreferenceUpdateInput>("NotificationPreferenceInput")
  .implement({
    fields: t => ({
      channel: t.field({ type: NotificationChannelPothosObject, required: true }),
      eventType: t.field({ type: NotificationEventTypePothosObject, required: true }),
      enabled: t.boolean({ required: true }),
    }),
  });
```

So the design's `EmailTemplateInputPothosObject` should be built with `gqlSchemaBuilder.inputRef<EmailTemplateSubmitInput>("EmailTemplateInput").implement({ fields: t => ({...}) })` — matching the canonical repo pattern, not the bare `builder.inputType('Name', { fields })` shown in the Pothos docs.

### 3.3 `authScopes` — object-level AND field/mutation-level, function form supported, per-call enforcement supported

**Docs URL:** https://v4.pothos-graphql.dev/docs/plugins/scope-auth (canonical v4 path; `/docs/guide/authorization` — does not exist; the auth plugin lives under `/docs/plugins/scope-auth`).

**Docs say:**

> **Object and Interface options — `authScopes`: `ScopeMap` or `function`, accepts `parent` and `context`, returns `MaybePromise<ScopeMap>`.**
> **Field Options — `authScopes`: `ScopeMap` or `function`, accepts same arguments as resolver, returns `MaybePromise<ScopeMap>`.**
> Adding multiple scopes to the `authScopes` object will check all the scopes, and if the user has **any** of the scopes, the request will be considered authorized for the current field.
> `ScopeMap`: A map of scope names to parameters. Based on `AuthScopes`, may also contain `$all`, `$any` or `$granted`.

So `authScopes` lives on:
1. **The builder config** — `scopeAuth.authScopes: async (ctx) => ({...})` — defines the *runtime values* of each named scope (this repo does it in `gqlSchemaBuilder.ts` lines 92–111).
2. **Object / Interface options** — `builder.objectType(Ref, { authScopes: {...}, runScopesOnType: true })` — applies to all fields of the type (only when `runScopesOnType: true`).
3. **Field options** — `t.field({ authScopes: {...}, resolve })` — applies per field. This is what mutations and queries use.
4. **Function form** — `authScopes: (parent, args, ctx) => ({ ... })` on a field, or `(parent, ctx) => ({ ... })` on an object — returns a dynamic `ScopeMap` per call. This is exactly what's needed for **per-template `allowedEditorGroups` enforcement**: the resolver-level function form can look up the template's `allowedEditorGroups` and return a scope map, OR (simpler) the field resolver calls `requireAuth(ctx)` + a service-level permission check after the scope gate passes.

**Codebase confirmation** — the repo uses **field-level** `authScopes` exclusively (no `runScopesOnType: true`). Quote from `backend/graphql/mutation/notifications/notification-preferences.mutation.ts` (lines 9–21):

```9:21:backend/graphql/mutation/notifications/notification-preferences.mutation.ts
gqlSchemaBuilder.mutationField("updateNotificationPreferences", t =>
  t.field({
    type: [NotificationPreferencePothosObject],
    authScopes: { loggedIn: true },
    args: {
      input: t.arg({ type: [NotificationPreferenceInputPothosObject], required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return NotificationPreferencesService.updatePreferences(actorUserId, args.input, ctx.locale);
    },
  })
);
```

Other examples of the convention (field-level `authScopes`):

- `backend/graphql/query/auth/auth.query.ts:25` — `authScopes: { permission: AppPermission.STAFF_EDIT }`
- `backend/graphql/mutation/billing/billing-payments.mutation.ts:68` — `authScopes: { superAdmin: true, notImpersonating: true }`
- `backend/graphql/mutation/scheduling/schedule.mutation.ts:19` — `authScopes: { superAdmin: true }`
- `backend/graphql/mutation/classes/class-session.mutation.ts:170` — `authScopes: { superAdmin: true }`

**For the design:** "SUPER_ADMIN only by default" maps cleanly to `authScopes: { superAdmin: true, notImpersonating: true }` (the repo's standard guard for admin mutations). For per-template `allowedEditorGroups` enforcement, two viable patterns:

- **Pattern A (scope-gate + service check):** `authScopes: { superAdmin: true, notImpersonating: true }` on the field, then in the resolver call a service method that enforces `allowedEditorGroups` for non-super-admin actors. Simplest, matches the existing repo style.
- **Pattern B (dynamic scope):** register a new scope in the `AuthScopes` map (e.g. `emailTemplateEditor: (templateId: string) => Promise<boolean>`) and use `authScopes: (parent, args, ctx) => ({ $any: { superAdmin: true, emailTemplateEditor: args.id } })`. More declarative but requires extending `PothosTypes.AuthScopes` in `gqlSchemaBuilder.ts`.

**Recommendation: Pattern A** (scope-gate + service check) — it matches the existing repo convention, avoids touching the shared `AuthScopes` map, and keeps the `allowedEditorGroups` logic in the service layer where it belongs.

### 3.4 "Single canonical GraphQL object type per entity" rule

**CONFIRMED** — this rule is enforced by **`backend/graphql/AGENTS.md`** ("Single Canonical Object Type Pattern (CRITICAL RULE)") and by **`backend/AGENTS.md`** ("Single Canonical Object Type Pattern (CRITICAL RULE)"). The design's citation of `backend/AGENTS.md` is correct.

Quote from `backend/graphql/AGENTS.md` (lines 55–62):

```55:62:backend/graphql/AGENTS.md
## Single Canonical Object Type Pattern (CRITICAL RULE)

### Positive Pattern (Required):
- Create a single GraphQL object type per entity using types from `backend/types/` (e.g., `{Entity}ReturnType`)
- Use the canonical type as the basis for Pothos object implementation: `gqlSchemaBuilder.objectRef<{Entity}ReturnType>("<Entity>")`
- Add additional fields as needed (resolved relationships, computed properties) beyond the canonical type
- Leverage GraphQL's selection mechanism - clients can request only the fields they need from the full object
- Define input types using types from `backend/types/` (e.g., `{Entity}SubmitInput`)
```

The negative pattern (prohibited) is also spelled out: creating multiple GraphQL object types for the same entity, or defining local types in Pothos files. **The design's `EmailTemplatePreviewPothosObject` is allowed** under the "Exception Policy" (lines 91–94): "Wrapper types for collections or complex responses (e.g., paginated results) are allowed as separate definitions." A `Preview` wrapper returning `{ html: string }` qualifies as a complex-response wrapper — but it must still import its base shape from `backend/types`, e.g. `EmailTemplatePreviewReturnType`.

### 3.5 Does the send-email field belong as a mutation? — YES (confirmed)

The send-email field has a side effect (it sends an email). GraphQL/Pothos convention: **root fields with side effects must be mutations**. The `backend/graphql/mutation/AGENTS.md` confirms mutations are reserved for "root mutation fields" registered via `gqlSchemaBuilder.mutationField(...)`; queries ("`backend/graphql/query/AGENTS.md`") are for root query fields. The Pothos docs (scope-auth plugin) state: "Subscription and Mutation root fields work the same way" for `authScopes` — i.e. mutations are first-class root fields. So the design is correct: **the send-email field is a mutation**.

> Minor note: the design's filename `emailTemplate.mutations.ts` uses the plural `mutations`, whereas every existing repo file is singular (`*.mutation.ts`). This is a **naming-convention drift** — see "Recommended edits" below.

### 3.6 Codebase convention cross-check (mandatory) — `notification-preferences.pothos.ts`

Full file (32 lines) read above. The canonical shape used in this repo is:

```11:21:backend/graphql/pothos/notifications/notification-preferences.pothos.ts
const NotificationPreferenceRef =
  gqlSchemaBuilder.objectRef<NotificationPreferenceReturnType>("NotificationPreference");

export const NotificationPreferencePothosObject = NotificationPreferenceRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    channel: t.expose("channel", { type: NotificationChannelPothosObject }),
    eventType: t.expose("eventType", { type: NotificationEventTypePothosObject }),
    enabled: t.exposeBoolean("enabled"),
  }),
});
```

Plus the input ref at lines 23–31 (quoted in §3.2).

**One-line canonical shape:** `gqlSchemaBuilder.objectRef<{Entity}ReturnType>("{Entity}").implement({ fields: t => ({ id: t.exposeString("id"), ... }) })` for the object; `gqlSchemaBuilder.inputRef<{Entity}SubmitInput>("{Entity}Input").implement({ fields: t => ({...}) })` for the input.

The new `emailTemplate.pothos.ts` MUST mirror this exact pattern. `authScopes` is NOT placed on the object — it lives on each query/mutation field (per the repo convention observed in every sampled file).

## 4. Corrected sample Pothos files

### 4.1 `backend/enum/notifications/emailTemplate.enum.ts` (NEW — or `backend/enum/email/` subdir)

```typescript
export enum EmailScope {
  SYSTEM = "SYSTEM",
  TENANT = "TENANT",
  SCOPE_UNDEFINED = "SCOPE_UNDEFINED",
}

export enum EmailTemplateStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}
```

> Register in `backend/enum/<subdir>/index.ts` and (if new subdir) `backend/enum/index.ts`.

### 4.2 Add to `backend/graphql/pothos/shared/enum.pothos.ts`

```typescript
import { EmailScope, EmailTemplateStatus } from "@/backend/enum";

export const EmailScopePothosEnum = gqlSchemaBuilder.enumType(EmailScope, {
  name: "EmailScope",
});

export const EmailTemplateStatusPothosEnum = gqlSchemaBuilder.enumType(EmailTemplateStatus, {
  name: "EmailTemplateStatus",
});
```

### 4.3 `backend/graphql/pothos/email/emailTemplate.pothos.ts`

```typescript
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  EmailScopePothosEnum,
  EmailTemplateStatusPothosEnum,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import type {
  EmailTemplateReturnType,
  EmailTemplateSubmitInput,
  EmailTemplatePreviewReturnType,
} from "@/backend/types/email/email-template.types";

const EmailTemplateRef =
  gqlSchemaBuilder.objectRef<EmailTemplateReturnType>("EmailTemplate");

export const EmailTemplatePothosObject = EmailTemplateRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    scope: t.expose("scope", { type: EmailScopePothosEnum }),
    status: t.expose("status", { type: EmailTemplateStatusPothosEnum }),
    subjectTemplate: t.exposeString("subjectTemplate"),
    bodyComponentJson: t.expose("bodyComponentJson", { type: "JSON", nullable: true }),
    allowedEditorGroups: t.expose("allowedEditorGroups", { type: ["String"] }),
    // ...other fields from EmailTemplateReturnType
  }),
});

export const EmailTemplateInputPothosObject = gqlSchemaBuilder
  .inputRef<EmailTemplateSubmitInput>("EmailTemplateInput")
  .implement({
    fields: t => ({
      name: t.string({ required: true }),
      scope: t.field({ type: EmailScopePothosEnum, required: true }),
      subjectTemplate: t.string({ required: true }),
      bodyComponentJson: t.field({ type: "JSON", required: false }),
      allowedEditorGroups: t.field({ type: ["String"], required: false }),
    }),
  });

export const EmailTemplatePreviewPothosObject =
  gqlSchemaBuilder.objectRef<EmailTemplatePreviewReturnType>("EmailTemplatePreview").implement({
    fields: t => ({
      html: t.exposeString("html"),
    }),
  });
```

> Note: no `authScopes` on the object — match the repo convention.

### 4.4 `backend/graphql/query/email/emailTemplates.query.ts`

```typescript
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { EmailTemplatePothosObject } from "@/backend/graphql/pothos/email/emailTemplate.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { EmailTemplateService } from "@/backend/services/email/email-template.service";

gqlSchemaBuilder.queryFields(t => ({
  emailTemplates: t.field({
    type: [EmailTemplatePothosObject],
    authScopes: { superAdmin: true, notImpersonating: true },
    args: {
      scope: t.arg({ type: EmailScopePothosEnum, required: false }),
      status: t.arg({ type: EmailTemplateStatusPothosEnum, required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return EmailTemplateService.list(actorUserId, args.scope ?? undefined, args.status ?? undefined, ctx.locale);
    },
  }),
  emailTemplate: t.field({
    type: EmailTemplatePothosObject,
    nullable: true,
    authScopes: { superAdmin: true, notImpersonating: true },
    args: { id: t.arg.id({ required: true }) },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return EmailTemplateService.getById(actorUserId, args.id, ctx.locale);
    },
  }),
}));
```

> `emailTemplatePreview.query.ts` follows the same pattern, returning `EmailTemplatePreviewPothosObject`. (No side effects — safe as a query, since rendering is idempotent.)

### 4.5 `backend/graphql/mutation/email/emailTemplate.mutation.ts` (note: singular, matching repo convention)

```typescript
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  EmailTemplateInputPothosObject,
  EmailTemplatePothosObject,
} from "@/backend/graphql/pothos/email/emailTemplate.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { EmailTemplateService } from "@/backend/services/email/email-template.service";

gqlSchemaBuilder.mutationField("createEmailTemplate", t =>
  t.field({
    type: EmailTemplatePothosObject,
    authScopes: { superAdmin: true, notImpersonating: true },
    args: { input: t.arg({ type: EmailTemplateInputPothosObject, required: true }) },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return EmailTemplateService.create(actorUserId, args.input, ctx.locale);
    },
  })
);

gqlSchemaBuilder.mutationField("sendEmail", t =>
  t.field({
    type: EmailTemplatePothosObject, // or a dedicated EmailSendResultPothosObject
    authScopes: { superAdmin: true, notImpersonating: true },
    args: {
      templateId: t.arg.id({ required: true }),
      recipient: t.arg({ type: "Email", required: true }),
      sampleProps: t.arg({ type: "JSON", required: false }),
    },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return EmailTemplateService.sendEmail(actorUserId, args.templateId, args.recipient, args.sampleProps ?? {}, ctx.locale);
    },
  })
);

// updateEmailTemplate, publishEmailTemplate, archiveEmailTemplate follow the same shape.
```

> `allowedEditorGroups` for non-super-admin editors is enforced inside `EmailTemplateService` (Pattern A) — the `authScopes` gate stays `superAdmin: true` by default. If/when editors below super-admin need access, switch to `authScopes: { $any: { superAdmin: true, permission: AppPermission.EMAIL_TEMPLATE_EDIT } }` (requires declaring `EMAIL_TEMPLATE_EDIT` in `AppPermission`).

## 5. Exact recommended line edits

1. **Line 345** — append a note: `EmailTemplatePreviewPothosObject` is a wrapper type (allowed under the "Exception Policy" in `backend/graphql/AGENTS.md`); its base shape `EmailTemplatePreviewReturnType` must still be imported from `@/backend/types`.

2. **Line 345** — add a new bullet (or a sub-bullet) registering the enums:
   > Add `EmailScope` and `EmailTemplateStatus` to `backend/enum/<subdir>/emailTemplate.enum.ts`, then register them ONCE in `backend/graphql/pothos/shared/enum.pothos.ts` (per `backend/graphql/pothos/AGENTS.md`): `gqlSchemaBuilder.enumType(EmailScope, { name: "EmailScope" })`. The domain `emailTemplate.pothos.ts` file only imports the registered `*PothosEnum` and uses it as a field type — never re-registers and never hardcodes `values: [...]`.

3. **Line 347** — fix the filename `emailTemplate.mutations.ts` → `emailTemplate.mutation.ts` (singular, matching repo convention in `backend/graphql/mutation/AGENTS.md`).

4. **Line 347** — clarify `authScopes` placement: it lives on each `t.field({ authScopes: {...} })` call in the mutation file (field-level), NOT on the object type. Default: `authScopes: { superAdmin: true, notImpersonating: true }`. Per-template `allowedEditorGroups` for non-super-admin editors is enforced inside the service layer (Pattern A); if declarative per-template scoping is required later, extend the `AuthScopes` map in `gqlSchemaBuilder.ts` and use the function form `authScopes: (parent, args, ctx) => ({...})`.

5. **Line 346 & 348** — confirm `emailTemplates`/`emailTemplate` and `previewEmailTemplate` are queries (root `queryFields`), while the send-email field is a **mutation** (side effect — sends an email). The design already gets this right; no edit needed beyond confirming.

---

## Sources consulted

- **Repo:** `backend/graphql/pothos/notifications/notification-preferences.pothos.ts` (full 32-line read), `backend/graphql/query/notifications/notification-preferences.query.ts`, `backend/graphql/mutation/notifications/notification-preferences.mutation.ts`, `backend/graphql/pothos/shared/enum.pothos.ts`, `backend/graphql/gqlSchemaBuilder.ts`, `backend/graphql/AGENTS.md`, `backend/graphql/pothos/AGENTS.md`, `backend/graphql/mutation/AGENTS.md`, `backend/graphql/query/AGENTS.md`, `backend/enum/AGENTS.md`, `backend/enum/notifications/notificationDeliveries.enum.ts`, sample mutation files (`billing-payments`, `scheduling/schedule`, `classes/class-session`, `shared/onboarding`), sample query files (`auth/auth`, `students/student`, `teachers/staff-directory`, `teachers/teacher-due`).
- **WebSearch (2026):** Pothos v4 `enumType` syntax, Pothos `authScopes` plugin current API, Pothos `inputType` current syntax.
- **WebFetch:** https://v4.pothos-graphql.dev/docs/plugins/scope-auth (success, written to agent-tools), https://v4.pothos-graphql.dev/docs/guide/enums (via WebSearch synthesis), https://v4.pothos-graphql.dev/docs/guide/inputs (via WebSearch synthesis). Direct WebFetch of `https://pothos-graphql.dev/docs` family timed out / 404'd; WebSearch fallback provided the v4 canonical URLs and content.
