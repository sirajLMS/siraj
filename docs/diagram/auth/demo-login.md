# Demo Authentication Mode

The demo login is a password-less fast-login path intended for preview and internal demo environments. When `NEXT_PUBLIC_IS_DEMO` or `IS_DEMO` is set, the login page server component calls `DemoAuthService.getAvailableDemoGroups` to list every permission group (excluding `system_automated` and `super_admin`) with localized names, and the login view renders one quick-login button per group. Clicking a button fires the `demoLogin` GraphQL mutation with the chosen `groupSlug`. The resolver first applies the shared auth rate limiter (fail-open, mirroring the normal login path), then enforces three guards: `IS_DEMO` must be truthy, and any Vercel deployment or production `NODE_ENV` hard-blocks the mutation even if `IS_DEMO` was misconfigured. Only then does `DemoAuthService.loginWithGroupSlug` run: it rejects excluded group slugs before touching the database, looks up the `permission_groups` row by slug, and selects a demo user — preferring the canonical `INTERNAL_DEMO_USERS` email for the group, else the earliest-created member joined through `user_permission_groups`. On success it calls `createAuthSession` to mint access/refresh tokens and a `sessions` row, then `setAuthCookies` writes the httpOnly cookies and the client redirects via the same safe-return-URL logic as a normal login. Edge cases (unknown slug, excluded slug, group without members) throw localized domain errors that the resolver wraps as a generic `demoLoginFailed` `UNAUTHENTICATED` GraphQL error, and a transient failure in `getAvailableDemoGroups` simply yields an empty quick-login list rather than failing the page.

Key sources:

- `backend/services/auth/demo-auth.service.ts` — `getAvailableDemoGroups`, `loginWithGroupSlug`, demo user selection
- `backend/graphql/mutation/auth/auth.mutation.ts` — `demoLogin` mutation resolver with rate-limit and environment guards
- `app/(auth)/login/page.tsx` — server component that loads demo groups when demo mode is on
- `frontend/views/auth/login/useLoginViewModel.ts` — `handleFastLogin` client flow and post-login redirect
- `backend/lib/env-config-keys.ts` — `IS_DEMO` env key registration (excluded from DB-managed config)

```mermaid
%% Demo login: permission-group fast login (no password), gated by IS_DEMO and deployment guards
flowchart TB
  A["Login page server component<br/>app/(auth)/login/page.tsx"] --> B{"IS_DEMO or NEXT_PUBLIC_IS_DEMO set?"}
  B -- "no" --> C["Render password login form only"]
  B -- "yes" --> D["DemoAuthService getAvailableDemoGroups<br/>read permission_groups, localize name and description,<br/>exclude system_automated and super_admin"]
  D --> E["Fast login buttons in login view<br/>useLoginViewModel handleFastLogin"]
  E --> F["demoLogin mutation with groupSlug<br/>backend/graphql/mutation/auth/auth.mutation.ts"]
  F --> G["Auth rate limit check<br/>fail-open on transient errors"]
  G --> H{"IS_DEMO env enabled?"}
  H -- "no" --> I["GraphQLError demoLoginNotEnabled<br/>code UNAUTHENTICATED"]
  H -- "yes" --> J{"Vercel deploy or NODE_ENV production?"}
  J -- "yes" --> I
  J -- "no" --> K["DemoAuthService loginWithGroupSlug<br/>backend/services/auth/demo-auth.service.ts"]
  K --> L{"Slug in excluded set?<br/>system_automated, super_admin"}
  L -- "yes" --> M["Throw demoGroupNotFound<br/>resolver wraps as demoLoginFailed"]
  L -- "no" --> N{"permission_groups row found by slug?"}
  N -- "no" --> M
  N -- "yes" --> O{"Demo user selected?<br/>prefer canonical INTERNAL_DEMO_USERS email,<br/>else earliest-created member via<br/>user_permission_groups join users"}
  O -- "no" --> P["Throw demoGroupNoUser<br/>resolver wraps as demoLoginFailed"]
  O -- "yes" --> Q["createAuthSession<br/>generate access and refresh tokens,<br/>bind refresh JTI, insert sessions row"]
  Q --> R["setAuthCookies<br/>httpOnly session_id, refresh_token, access_token"]
  R --> S["Return LoginResponse token plus safe user"]
  S --> T["Frontend updateAuthToken<br/>redirect to safe return URL"]
```

Standalone diagram: [demo-login.mmd](./demo-login.mmd)
