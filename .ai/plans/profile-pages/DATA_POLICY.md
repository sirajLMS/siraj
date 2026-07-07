# Data Policy — GraphQL Endpoints Only (Profile Pages)

**Mandatory for all profile-page modules.** UI layers must never source display or edit data outside GraphQL.

## Allowed data paths

| Layer | What | How |
|-------|------|-----|
| App routes (`page.tsx`) | Routing context only | `resolveProfilePageContext` → pass `scope`, `mode`, `audience`, `targetUserId` to client |
| Client containers | All profile entity data | `useQuery` / `useMutation` + `TypedDocumentNode` from `frontend/graphql/sharedDocuments/` |
| Backend (not UI) | Business logic | Services/repos behind Pothos resolvers only |

## Forbidden in UI (`frontend/views/profile/**`, profile `page.tsx`)

- Importing `@/backend/services/**` or `@/backend/db/**`
- Server Components fetching profile payloads and passing entity data as props
- `fetch()` / REST / Server Actions for profile fields
- Zustand or local stores holding profile entity data (auth/permission chrome via existing user context is OK)
- Dashboard components that fetch their own data — reuse layout only; wire props from GraphQL parent
- Mock/hardcoded profile data in production code (Storybook mocks are OK in `*.stories.tsx`)

## GraphQL query patterns

### Primary: unified profile query

```typescript
useQuery(profileByUserIdQueryDocument, { variables: { userId: targetUserId } });
```

Nested sections (students, banking, permissions) should be **fields on `profileByUserId`** when loaded with the profile.

### Tab-specific lazy load (still GraphQL)

When a tab should not load until active, use a **dedicated GraphQL query document** with `skip`:

```typescript
const { data } = useQuery(notificationPreferencesQueryDocument, {
  skip: activeTab !== "notifications",
});
```

Both patterns are GraphQL endpoints. **Never** call services directly from the tab component.

## Mutations

All saves via GraphQL mutations only:

- `updateOwnProfile` / `updateUserProfile` (profile modules)
- `updateNotificationPreferences` (notifications tab)

Refetch via `refetch()` or `refetchQueries` — not a service call.

## Server page contract

Match existing `app/[locale]/(dashboard)/profile/page.tsx`:

```typescript
return (
  <ProfilePageClient
    scope={resolution.scope}
    mode={resolution.mode}
    audience={resolution.audience}
    targetUserId={resolution.targetUserId}
  />
);
```

**Do not** add `initialProfile`, `serverData`, or similar entity props.

## Presentational components

- Receive typed props derived from `Operations.*` query results
- No `useQuery` in leaf sections unless the section owns a dedicated GraphQL document (tab pattern above)
- `ProfileShell` receives `loading` / `error` / chrome props from the GraphQL-backed container only

## Plan-review checklist

When reviewing plans or implementation, reject if:

1. UI task mentions loading data from a service or repo
2. Plan says "parallel query" meaning non-GraphQL fetch
3. Reused dashboard component fetches its own data without rewiring to props
4. `page.tsx` passes profile entity fields to client

## References

- [GRAPHQL_PATTERNS.md](./GRAPHQL_PATTERNS.md) — hooks, documents, types
- [LAYER_PIPELINE.md](./LAYER_PIPELINE.md) — layer order; services are backend-only
- `frontend/views/profile/teacher/TeacherProfileContainer.tsx` — reference implementation
