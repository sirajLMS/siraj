## Section 7: Final Verification & Integrity Protocol

### 7.1 Full Test Suite Execution

After completing all 12 tasks (A–L), run the complete test suite in this order:

```bash
bun run test:db
bun run test:graphql
bun run test:ui:components
bun tsgo
bun biome:check
bun lint
bun codescene
```

All commands MUST pass with zero errors and zero warnings.

### 7.2 Coverage Verification

```bash
bun run test:coverage backend/db/test/repo/complaint.repository.test.ts
bun run test:coverage backend/db/test/repo/complaint-response.repository.test.ts
bun run test:coverage backend/db/test/repo/suggestion.repository.test.ts
```

All three MUST show 100% line + function coverage.

### 7.3 Zero Incomplete Implementation Check

```bash
rg -i "TODO|FIXME" backend/services/communication/ backend/db/repo/complaint.repository.ts backend/db/repo/complaint-response.repository.ts backend/db/repo/suggestion.repository.ts
rg "from ['\"]drizzle\|from ['\"]backend/db/schema" backend/services/communication/
rg "from ['\"]backend/db" backend/graphql/pothos/complaint.pothos.ts backend/graphql/pothos/suggestion.pothos.ts
rg "mock.*Store" frontend/views/dashboard/complaints/ frontend/views/dashboard/suggestions/ --glob "!**/*.stories.tsx"
```

All four commands MUST return zero matches.

### 7.4 Mock Store Deletion Verification

Verify all 4 mock store files are deleted:
- `frontend/stores/mockParentComplaintsStore.ts` — must NOT exist
- `frontend/stores/mockAdminComplaintsStore.ts` — must NOT exist
- `frontend/stores/mockParentSuggestionsStore.ts` — must NOT exist
- `frontend/stores/mockAdminSuggestionsStore.ts` — must NOT exist

### 7.5 Storybook Verification

```bash
rg "MockedProvider" frontend/views/dashboard/complaints/*.stories.tsx frontend/views/dashboard/suggestions/*.stories.tsx
```

All 4 story files MUST contain `MockedProvider`.

### 7.6 Permission Verification

Verify new permissions exist in the database:
```sql
SELECT key FROM permissions WHERE key IN (
  'support.submit_complaint',
  'support.view_history',
  'communication.submit_suggestion',
  'system.dispatch_email'
);
```

Must return 4 rows.

Verify group assignments:
```sql
SELECT g.slug, p.key
FROM group_permissions gp
JOIN permission_groups g ON g.id = gp.group_id
JOIN permissions p ON p.id = gp.permission_id
WHERE p.key IN (
  'support.submit_complaint',
  'support.view_history',
  'communication.submit_suggestion',
  'system.dispatch_email',
  'complaints.list',
  'complaints.delete',
  'complaints.respond'
)
ORDER BY g.slug, p.key;
```

### 7.7 GraphQL Schema Verification

```bash
bun run generate:gqlSchema
bun codegen
```

Both MUST succeed. Verify generated types include:
- `ParentComplaintsQueryQuery`
- `AdminComplaintQueueQueryQuery`
- `SubmitComplaintMutationMutation`
- `RespondToComplaintMutationMutation`
- `DeleteComplaintMutationMutation`
- `AdminSuggestionsQueryQuery`
- `SubmitSuggestionMutationMutation`
- `MarkSuggestionReviewedMutationMutation`

### 7.8 i18n Verification

```bash
bun tsgo
```

TypeScript compilation verifies that all i18n type interfaces are satisfied (all required keys present in both English and Arabic).

### 7.9 Dependency Integrity Check

Verify no forward dependencies exist:
- Task A files import only from current project state
- Task B files import only from Task A (enum) + current project state (schema)
- Task C files import only from Task B (repos) + current project state (services)
- Task D files import only from Tasks B+C
- Task E files import only from Task C (services)
- Task F files import only from Task E (generated types)
- Task G files import only from Task F (generated types)
- Tasks H, I, J import only from earlier tasks
- Task K imports only from Tasks I+J
- Task L imports only from Task K

### 7.10 Final Checklist

- [ ] All 12 tasks completed with all success criteria met
- [ ] All quality gates passed (tsgo, biome, lint, codescene)
- [ ] 100% test coverage on all new repository methods
- [ ] Zero TODO/FIXME markers in new code
- [ ] Zero service imports from drizzle/schema
- [ ] Zero GraphQL resolver imports from DB/repo
- [ ] Zero mock store imports in production files
- [ ] All 4 mock store files deleted
- [ ] All 4 stories use MockedProvider
- [ ] All 4 new permissions exist in database with correct group assignments
- [ ] GraphQL schema generates and codegen succeeds
- [ ] i18n types satisfied for both EN and AR
