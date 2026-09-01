# Suggestions & Feedback Loops

Parents submit suggestions from the `/suggestions` page, which (for admins) redirects to the unified `/feedback/manage` triage hub that hosts lazy-loaded complaints and suggestions tabs behind `COMPLAINTS_*` / `SUGGESTIONS_LIST` permissions. Submission flows through the `submitSuggestion` GraphQL mutation into `SuggestionService`, which enforces permissions via the shared `complaintSuggestionBase` helpers (resolving the parent from the actor), persists the row in the `suggestions` table with status `PENDING`, and sends the submitter a `NEW_SUGGESTION` acknowledgement email through `CommunicationService` — skipped with a warning if the user has no email. Admins triage the queue through the `adminSuggestions` query (search, status tabs, and aggregate metrics) and act on each row: `markSuggestionReviewed` flips status to `REVIEWED`, `respondToSuggestion` (IP-rate-limited in the resolver) stores the admin response and notifies the parent via both ON_APP and EMAIL (`SUGGESTION_ACKNOWLEDGED`), and `markSuggestionDuplicate` links the row to a canonical suggestion with guards that throw `ValidationError` for self-references, circular links, or already-duplicate targets, then notifies the parent ON_APP. `deleteSuggestion` is restricted to super-admins and performs a soft delete via `SoftDeleteRepository`. Parents see updated statuses and responses through the `parentSuggestions` history query. Edge cases include `NotFoundError` when a suggestion id no longer exists, externalised i18n error/notification strings, and the legacy `/suggestions/manage` route redirecting to `/feedback/manage?tab=suggestions`.

## Key sources

- `app/(dashboard)/suggestions/page.tsx`
- `app/(dashboard)/suggestions/manage/page.tsx`
- `app/(dashboard)/feedback/manage/page.tsx`
- `backend/services/communication/suggestion.service.ts`
- `backend/services/communication/complaint.service.ts`
- `backend/graphql/pothos/parents/suggestion.pothos.ts`
- `backend/graphql/query/parents/suggestion.query.ts`
- `backend/graphql/mutation/parents/suggestion.mutation.ts`
- `frontend/common/views/dashboard/feedback/FeedbackManagePageContainer.tsx`
- `frontend/common/views/dashboard/feedback/FeedbackManageTabPanels.tsx`
- `frontend/common/views/dashboard/suggestions/useAdminSuggestionsViewModel.ts`
- `backend/db/schema/communications/communications.ts`
- `backend/enum/parents/suggestions.enum.ts`

```mermaid
flowchart TB
    subgraph INTAKE["Parent intake"]
        P_PAGE["/suggestions page<br/>(ParentSuggestionsContainer)"]
        P_SUB["submitSuggestion mutation<br/>(authScopes: loggedIn)"]
        P_HIST["parentSuggestions query<br/>(history with review status)"]
    end

    LEGACY["/suggestions/manage page<br/>(redirects to /feedback/manage?tab=suggestions)"]

    subgraph ADMIN["Admin triage at /feedback/manage"]
        F_PAGE["FeedbackManagePageContainer<br/>(permissions: COMPLAINTS_* or SUGGESTIONS_LIST)"]
        TABS["FeedbackManageTabPanels<br/>(lazy complaints and suggestions tabs)"]
        S_VM["useAdminSuggestionsViewModel<br/>(search, status tabs, dialogs)"]
        Q_ADMIN["adminSuggestions query<br/>(paginated queue plus metrics)"]
    end

    SVC["SuggestionService"]
    BASE["complaintSuggestionBase<br/>(assertPermission, requireParentByActorUserId)"]
    REPO["SuggestionRepository"]
    DB[("suggestions table")]
    COMM["CommunicationService<br/>(dispatch and dispatchMulti)"]
    PARENTS["ParentRepository / UserRepository"]

    RESPOND["respondToSuggestion<br/>(rate-limited per IP)"]
    REVIEW["markSuggestionReviewed"]
    DUP["markSuggestionDuplicate"]
    DEL["deleteSuggestion<br/>(super-admin soft delete)"]
    DUP_CHECK{"duplicate target valid?"}
    VALERR["ValidationError<br/>(self, circular, or target already DUPLICATE)"]

    P_PAGE --> P_SUB
    P_PAGE --> P_HIST --> SVC
    LEGACY -.-> F_PAGE
    F_PAGE --> TABS --> S_VM
    S_VM --> Q_ADMIN --> SVC
    P_SUB --> SVC
    SVC --> BASE --> REPO --> DB
    SVC --> PARENTS
    SVC -->|"submit: NEW_SUGGESTION email ack, skipped if no email"| COMM

    S_VM --> RESPOND & REVIEW & DUP & DEL
    RESPOND --> SVC
    REVIEW --> SVC
    DUP --> SVC
    DEL --> SVC
    SVC --> DUP_CHECK
    DUP_CHECK -->|"self, circular, or DUPLICATE target"| VALERR
    DUP_CHECK -->|"valid: set duplicateOfId"| DB
    COMM -->|"respond: SUGGESTION_ACKNOWLEDGED ON_APP + EMAIL; duplicate: ON_APP notice"| P_HIST
```

Machine-checkable copy: [suggestions-feedback.mmd](./suggestions-feedback.mmd)
