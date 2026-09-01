# Parent Social/Community

The parent social page (`/parents/social`) is a read-only surface that shows a parent's own social and contact links (phone, Facebook, WhatsApp, Twitter); despite the spec title, there is no community feed, no posts/reactions, and no moderation hooks in the codebase — the feature is contact-link display. The page entry point `app/(dashboard)/parents/social/page.tsx` wraps the view in `withPageAuth` requiring `SCHEDULE_VIEW_FAMILY`, then renders `ParentSocialContainer`, whose `useParentSocialViewModel` hook issues the `parentOwnProfile` GraphQL query with `cache-and-network`. The Pothos query field enforces a logged-in actor via `requireAuth`, then delegates to `ParentPortalService.getOwnProfile`, which checks `PROFILE_CORE_IDENTITY_VIEW_OWN` through `ParentServiceBase.assertPermission`, resolves the parent row with `findByUserId`, and loads the profile through `ParentRepository.getParentProfile` (a join of the `parents` and `users` tables). A companion service `ParentSocialService` exposes the narrower social-fields-only getters `getSocialProfile` (own, gated by `PROFILE_PARENT_SOCIAL_VIEW_OWN`) and `getAdminSocialProfile` (gated by `PROFILE_PARENT_SOCIAL_VIEW_OTHER`). Edge cases: missing permission throws the localized `unauthorizedAction` error, a missing parent row or profile throws `notFound` in the portal path while the social service returns `null` for a missing profile, and the frontend renders either an error state or a responsive mobile/desktop view of the returned profile.

## Key sources

- `app/(dashboard)/parents/social/page.tsx`
- `frontend/common/views/dashboard/parent/social/ParentSocialContainer.tsx`
- `frontend/common/views/dashboard/parent/social/useParentSocialViewModel.ts`
- `frontend/common/views/dashboard/parent/social/ParentSocialView.tsx`
- `frontend/common/graphql/sharedDocuments/parents/parent-portal.documents.ts`
- `backend/graphql/query/parents/parent-portal.query.ts`
- `backend/services/parent/parent-portal.service.ts`
- `backend/services/parent/parent-social.service.ts`
- `backend/services/parent/__shared__/parentServiceBase.ts`
- `backend/db/repo/parents/parent.repository.ts`

```mermaid
%% Parent Social page flow — read-only social contact links (no feed/posts/reactions exist)
sequenceDiagram
  autonumber
  participant Page as Page withPageAuth
  participant VM as useParentSocialViewModel
  participant GQL as "GraphQL parentOwnProfile"
  participant Portal as ParentPortalService
  participant Base as ParentServiceBase
  participant Repo as ParentRepository
  participant DB as "DB parents + users"

  Page->>VM: render ParentSocialContainer
  Note over Page: withPageAuth requires SCHEDULE_VIEW_FAMILY
  VM->>GQL: useQuery(parentOwnProfileDocument, cache-and-network)
  GQL->>GQL: authScopes loggedIn + requireAuth(ctx)
  GQL->>Portal: getOwnProfile(userId, locale)
  Portal->>Base: assertPermission PROFILE_CORE_IDENTITY_VIEW_OWN
  Base-->>GQL: Error unauthorizedAction (denied)
  Portal->>Base: resolveParentForUser(userId)
  Base->>Repo: findByUserId(userId)
  Repo->>DB: select from parents
  Base-->>GQL: Error notFound (no parent row)
  Portal->>Repo: getParentProfile(parent.id)
  Repo->>DB: join parents + users
  Portal-->>GQL: Error notFound (profile missing)
  Portal-->>GQL: profile incl facebook whatsapp twitter
  GQL-->>VM: ParentOwnProfile data
  VM->>Page: ResponsiveViewSwitch renders mobile or desktop view

  Note over Portal,DB: Related service ParentSocialService
  Note over Portal,DB: getSocialProfile uses PROFILE_PARENT_SOCIAL_VIEW_OWN
  Note over Portal,DB: getAdminSocialProfile uses PROFILE_PARENT_SOCIAL_VIEW_OTHER and returns null when missing
```

[Standalone diagram file](./social.mmd)
