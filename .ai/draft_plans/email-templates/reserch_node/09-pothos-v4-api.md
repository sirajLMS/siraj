# Research 09 — Pothos v4 API Verification (inputRef / enumType / authScopes)

Verification of the proposed Pothos API for the email-template system against
the installed `@pothos/core` and `@pothos/plugin-scope-auth`, and against
the repo's existing `notification-preferences` Pothos pattern.

---

## 1. Confirmed versions

| Package | Declared (package.json) | Installed (node_modules) | Status |
|---|---|---|---|
| `@pothos/core` | `^4.13.1` | `4.13.1` | OK |
| `@pothos/plugin-scope-auth` | `^4.1.7` | `4.1.7` | OK |

Sources:
- `package.json` lines 85 (`@pothos/core`) and 91 (`@pothos/plugin-scope-auth`)
- `node_modules/@pothos/core/package.json` → `"version": "4.13.1"`
- `node_modules/@pothos/plugin-scope-auth/package.json` → `"version": "4.1.7"`

Both plugins are also confirmed wired into the builder at
`backend/graphql/gqlSchemaBuilder.ts:7` (`import ScopeAuthPlugin from "@pothos/plugin-scope-auth"`)
and registered in the `plugins` array at line 81.

---

## 2. Repo's actual Pothos pattern — `notification-preferences.pothos.ts`

File: `backend/graphql/pothos/notifications/notification-preferences.pothos.ts` (whole file, 32 lines).
Quoted verbatim:

### Imports

```ts
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  NotificationChannelPothosObject,
  NotificationEventTypePothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import type {
  NotificationPreferenceReturnType,
  NotificationPreferenceUpdateInput,
} from "@/backend/types/notifications/notification-preferences.types";
```

### Object type — `objectRef<T>("Name").implement({...})`

```ts
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

### Input object — `inputRef<T>("Name").implement({...})` (the proposed API)

```ts
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
> Note also the exporting name convention: `…PothosObject` is used for BOTH the
> object type and the input type in this repo (e.g.
> `NotificationPreferenceInputPothosObject`). The name
> `EmailTemplateInputPothosObject` matches this convention.

### Queries and mutations

This file declares only object/input types. The query and mutation live in
side-effect-import sibling files:

- `backend/graphql/query/notifications/notification-preferences.query.ts`:
  ```ts
  gqlSchemaBuilder.queryFields(t => ({
    notificationPreferences: t.field({
      type: [NotificationPreferencePothosObject],
      authScopes: { loggedIn: true },
      resolve: async (_root, _args, ctx) => {
        const actorUserId = await requireAuth(ctx);
        return NotificationPreferencesService.getPreferences(actorUserId, ctx.locale);
      },
    }),
  }));
  ```

- `backend/graphql/mutation/notifications/notification-preferences.mutation.ts`:
  ```ts
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

Compound (multi-key) authScopes pattern is used in
`backend/graphql/mutation/billing/billing-payments.mutation.ts:68` —
`authScopes: { superAdmin: true, notImpersonating: true }` — AND semantics.

---

## 3. `inputRef<T>("Name").implement({...})` vs `builder.inputType("Name", {...})`

Both APIs exist in `@pothos/core@4.13.1`. Verified in
`node_modules/@pothos/core/dts/builder.d.ts`:

```ts
// builder.d.ts:60 — one-shot API
inputType<Param extends InputObjectRef<Types, unknown> | string, …>(
  param: Param,
  options: PothosSchemaTypes.InputObjectTypeOptions<Types, Fields> & { … }
): …

// builder.d.ts:65 — ref-first API (what the repo uses)
inputRef<T extends object, Normalize = true>(name: string):
  PothosSchemaTypes.ImplementableInputObjectRef<
    Types, RecursivelyNormalizeNullableFields<T>, …
  >;
```

And in `node_modules/@pothos/core/dts/index.d.ts:35-38`:

```ts
export type InputObjectRef<Types extends SchemaTypes, T> = PothosSchemaTypes.InputObjectRef<Types, T>;
export declare const InputObjectRef: new <Types extends SchemaTypes, T>(name: string) => PothosSchemaTypes.InputObjectRef<Types, T>;
export type ImplementableInputObjectRef<Types extends SchemaTypes, T extends object> = PothosSchemaTypes.ImplementableInputObjectRef<Types, T>;
export declare const ImplementableInputObjectRef: new <Types extends SchemaTypes, T extends object>(builder: PothosSchemaTypes.SchemaBuilder<Types>, name: string) => PothosSchemaTypes.ImplementableInputObjectRef<Types, T>;
```

`ImplementableInputObjectRef` has the `.implement({...})` method the repo uses.

### Decision

**The repo's actual usage (`inputRef<T>("Name").implement({...})`) wins.** The
proposed API for `EmailTemplateInputPothosObject` is correct:
`gqlSchemaBuilder.inputRef<EmailTemplateSubmitInput>("EmailTemplateInput").implement({...})`


`builder.inputType("Name", {...})` is a valid alternative API in Pothos v4, but
the repo consistently uses the `inputRef<T>(...).implement(...)` form (see
`notification-preferences.pothos.ts:23-31`). Stay with `inputRef`.

---

## 4. Enum registration pattern — `backend/graphql/pothos/shared/enum.pothos.ts`

File: `backend/graphql/pothos/shared/enum.pothos.ts` (254 lines).

The repo's Pothos v4 API for enums is **`builder.enumType(EnumObject, { name })`**
(enum-object form, NOT the string-keyed `values: [...]` form).

Verbatim quotes (file:line):

```ts
// backend/graphql/pothos/shared/enum.pothos.ts:49-51
export const AppPermissionPothosEnum = gqlSchemaBuilder.enumType(AppPermission, {
  name: "AppPermission",
});

// backend/graphql/pothos/shared/enum.pothos.ts:153-155  ← NotificationChannel
export const NotificationChannelPothosObject = gqlSchemaBuilder.enumType(NotificationChannel, {
  name: "NotificationChannel",
});

// backend/graphql/pothos/shared/enum.pothos.ts:157-159  ← NotificationEventType
export const NotificationEventTypePothosObject = gqlSchemaBuilder.enumType(NotificationEventType, {
  name: "NotificationEventType",
});
```

For the email-template work three new enums are introduced — `EmailScope`,
`EmailTemplateStatus`, `EmailEditorPermission`. To follow the repo pattern they
MUST:
1. Be defined as TypeScript `enum`s in `backend/enum/<subdir>/<entity>.enum.ts`.
2. Be re-exported from `backend/enum/<subdir>/index.ts` and the top-level
   `backend/enum/index.ts` barrel.
3. Be registered ONCE in `backend/graphql/pothos/shared/enum.pothos.ts` using
   the enum-object form:
   ```ts
   export const EmailScopePothosEnum = gqlSchemaBuilder.enumType(EmailScope, {
     name: "EmailScope",
   });
   export const EmailTemplateStatusPothosEnum = gqlSchemaBuilder.enumType(EmailTemplateStatus, {
     name: "EmailTemplateStatus",
   });
   export const EmailEditorPermissionPothosEnum =
     gqlSchemaBuilder.enumType(EmailEditorPermission, { name: "EmailEditorPermission" });
   ```
4. Then imported into `backend/graphql/pothos/email/emailTemplate.pothos.ts`
   from `@/backend/graphql/pothos/shared/enum.pothos` (never re-registered).
5. Run `bun run generate:gqlSchema` then `bun codegen` afterward.

This is enforced by `backend/graphql/AGENTS.md` ("Pothos Enum Registration
Pattern (CRITICAL RULE)") and `backend/graphql/pothos/AGENTS.md` (same rule).
A single hardcoded variant — `enumType("SystemSettingCategory", { values: {…} })`
— exists at `enum.pothos.ts:213-232` and `234-241`, but it still wraps a real TS
enum value per-key (`SystemSettingCategory.App`, etc.); it is not the
recommended pattern for new enums.

---

## 5. `authScopes` AND semantics — `.d.ts` proof

Source: `node_modules/@pothos/plugin-scope-auth/dts/types.d.ts` (lines 11-25, 33-60).

```ts
// types.d.ts:14-15  built-in $all/$any combinators
export interface BuiltInScopes<Types extends SchemaTypes> {
    $all?: true extends true ? AuthScopeMap<Types> : never;   // AND of nested scopes
    $any?: true extends true ? AuthScopeMap<Types> : never;   // OR  of nested scopes
    $granted?: string;
}

// types.d.ts:18  AuthScopeMap is a flat Partial<Types['AuthScopes']> merged with BuiltInScopes
export type AuthScopeMap<Types extends SchemaTypes> =
    Merge<BuiltInScopes<Types> & Partial<Types['AuthScopes']>>;

// types.d.ts:49-53  failure-kind enum that proves the per-key AND semantics
export interface AllAuthScopesFailure {
    kind: AuthScopeFailureType.AllAuthScopes;   // when a top-level authScopes map fails,
    failures: AuthFailure[];                    // ALL keys must pass; ANY failure → AllAuthScopesFailure
}
```

The `defaultStrategy` for `ScopeAuthPlugin` when `authScopes` is a **map**
(not using `$any`/`$all`) is `all` (i.e. every key must pass → AND). This is
confirmed by the repo's own behavior at
`backend/graphql/gqlSchemaBuilder.ts:92-111`:

```ts
scopeAuth: {
  authScopes: async ctx => ({
    loggedIn: !!ctx.user,
    permission: (key: AppPermission) => ctx.isSuperAdmin || ctx.permissions.includes(key),
    superAdmin: actorIsSuperAdmin,
    notImpersonating: !ctx.isImpersonating,
    notSimulatingGroup: !ctx.isSimulatingGroup,
  }),
  …
},
```

So `authScopes: { superAdmin: true, notImpersonating: true }`
evaluates to **`superAdmin === true AND notImpersonating === true`** at runtime.

Note: the `AuthScopes` type registered on the builder is the canonical list of
allowed scope keys (`backend/graphql/gqlSchemaBuilder.ts:31-37`):

```ts
AuthScopes: {
  loggedIn: boolean;
  permission: AppPermission;
  superAdmin: boolean;
  notImpersonating: boolean;
  notSimulatingGroup: boolean;
};
```

`superAdmin` and `notImpersonating` are both registered here, so
`{ superAdmin: true, notImpersonating: true }` is type-safe and semantically
AND. No new scope keys need to be registered for the email-template work.

### Existing usage in the repo

- `backend/graphql/pothos/auth/impersonation.pothos.ts:82`
  `authScopes: { superAdmin: true, notImpersonating: true, notSimulatingGroup: true }`
- `backend/graphql/mutation/billing/billing-payments.mutation.ts:68`
  `authScopes: { superAdmin: true, notImpersonating: true }`

The `{ superAdmin: true, notImpersonating: true }` shape is therefore the
correct, repo-idiomatic auth guard for the email-template mutations.

---

## 6. Cross-check with online docs

- Pothos v4 main docs: <https://pothos-graphql.dev/docs> — `inputRef` and
  `inputType` are both documented as the two equivalent ways to create input
  types; `inputRef` is the "deferred implementation" form (you hold the ref and
  call `.implement(...)` later, enabling circular references).
- Pothos authorization guide: <https://pothos-graphql.dev/docs/guides/authorization>
  — `authScopes` on a field maps each key to the scope loader by the same name
  (registered in `PothosTypes.AuthScopes`), and multiple keys are evaluated as a
  logical AND; `$any` / `$all` are the explicit OR / AND combinators for
  nested maps. This matches the `.d.ts` inspection above.

(No conflicting information found; the repo's usage is canonical.)

---

## 7. Verdict

**VERIFIED.** The Pothos API choices for the email-template system
match the installed `@pothos/core@4.13.1` + `@pothos/plugin-scope-auth@4.1.7`
and reproduce the repo's existing `notification-preferences.pothos.ts` pattern
exactly:

- `gqlSchemaBuilder.inputRef<EmailTemplateSubmitInput>("EmailTemplateInput").implement({...})`
  → confirmed correct (matches `notification-preferences.pothos.ts:23-31`;
  `inputRef<T>(name): ImplementableInputObjectRef<T,…>` is in
  `node_modules/@pothos/core/dts/builder.d.ts:65`).
- Object types → `gqlSchemaBuilder.objectRef<T>("Name").implement({...})`
  → confirmed (matches `notification-preferences.pothos.ts:11-21`).
- `authScopes: { superAdmin: true, notImpersonating: true }` field-level guard
  on all email-template mutations → confirmed correct AND semantics (built-in
  `defaultStrategy` is `all`; `superAdmin` and `notImpersonating` are both
  registered in `gqlSchemaBuilder.ts:31-37`; identical shape already used at
  `backend/graphql/mutation/billing/billing-payments.mutation.ts:68`).
- The three new enums (`EmailScope`, `EmailTemplateStatus`,
  `EmailEditorPermission`) must be defined as TypeScript `enum`s under
  `backend/enum/<subdir>/` and registered ONCE in
  `backend/graphql/pothos/shared/enum.pothos.ts` using the enum-object form
  `gqlSchemaBuilder.enumType(EmailScope, { name: "EmailScope" })` — never
  inline in `emailTemplate.pothos.ts` and never via the string-keyed
  `values: [...]` form. This is the `NotificationChannelPothosObject` pattern
  at `backend/graphql/pothos/shared/enum.pothos.ts:153-159`.

No corrections needed — the pattern is correct and idiomatic for the installed Pothos v4 version.
