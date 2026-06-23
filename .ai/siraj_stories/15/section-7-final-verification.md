## Section 7: Final Verification & Integrity Protocol

### 7.1 Full Test Suite Execution

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
bun run test:coverage backend/db/test/repo/suggestion.repository.test.ts
bun run test:coverage backend/db/test/repo/notification.repository.test.ts
bun run test:coverage backend/db/test/repo/complaint.repository.test.ts
```

All three MUST show 100% line + function coverage on new/modified methods.

### 7.3 Provider Adapter Verification

```bash
# Verify each channel has interface + adapter + factory
rg "export interface IEmailChannel" backend/services/communication/
rg "export interface ISmsChannel" backend/services/communication/
rg "export interface IPushChannel" backend/services/communication/
rg "EmailChannelFactory" backend/services/communication/
rg "SmsChannelFactory" backend/services/communication/
rg "PushChannelFactory" backend/services/communication/
```

All six MUST return matches.

### 7.4 Zero Incomplete Implementation Check

```bash
rg -i "TODO|FIXME" backend/services/communication/
rg "from ['\"]drizzle\|from ['\"]backend/db/schema" backend/services/communication/
rg "from ['\"]backend/db" backend/graphql/pothos/complaint.pothos.ts backend/graphql/pothos/suggestion.pothos.ts
rg "mock.*Store" frontend/views/dashboard/complaints/ frontend/views/dashboard/suggestions/ --glob "!**/*.stories.tsx"
rg "RESEND_API_KEY\|TWILIO_AUTH_TOKEN\|FIREBASE_PRIVATE_KEY" backend/ --glob "!*.env*" --glob "!environment.d.ts"
```

All five commands MUST return zero matches.

### 7.5 Schema Verification

```sql
-- Verify suggestion_status enum exists
SELECT enum_range(NULL::suggestion_status);
-- Must return: {PENDING,REVIEWED,DUPLICATE}

-- Verify new columns on suggestions
SELECT column_name FROM information_schema.columns WHERE table_name = 'suggestions' AND column_name IN ('status', 'duplicate_of_id', 'admin_response', 'reviewed_by_user_id', 'reviewed_at', 'deleted_at');
-- Must return 6 rows

-- Verify ON_APP channel
SELECT enum_range(NULL::notification_channel);
-- Must include ON_APP

-- Verify new event types
SELECT enum_range(NULL::notification_event_type);
-- Must include NEW_COMPLAINT, NEW_SUGGESTION, SUGGESTION_ACKNOWLEDGED, SUGGESTION_DUPLICATE_MARKED
```

### 7.6 Permission Verification

```sql
SELECT key FROM permissions WHERE key IN ('suggestions.list', 'suggestions.review', 'suggestions.delete');
-- Must return 3 rows

SELECT g.slug, p.key
FROM group_permissions gp
JOIN permission_groups g ON g.id = gp.group_id
JOIN permissions p ON p.id = gp.permission_id
WHERE p.key IN ('suggestions.list', 'suggestions.review', 'suggestions.delete')
ORDER BY g.slug, p.key;
-- Must show super_admin has all 3, academy_admin has list+review
```

### 7.7 System Settings Verification

```sql
SELECT key, value, category FROM system_settings WHERE category = 'communication';
-- Must return 3 rows: complaint_max_file_size_mb, complaint_max_files_per_complaint, sms_rate_limit_per_hour
```

### 7.8 GraphQL Schema Verification

```bash
bun run generate:gqlSchema
bun codegen
```

Both MUST succeed. Verify generated types include:
- `ParentSuggestionsQueryQuery`
- `SearchSuggestionsQueryQuery`
- `RespondToSuggestionMutationMutation`
- `MarkSuggestionDuplicateMutationMutation`
- `DeleteSuggestionMutationMutation`

### 7.9 Final Checklist

- [ ] All 20 tasks completed with all success criteria met
- [ ] All quality gates passed (tsgo, biome, lint, codescene)
- [ ] 100% test coverage on all new/modified repository methods
- [ ] Zero TODO/FIXME markers in new code
- [ ] Zero service imports from drizzle/schema
- [ ] Zero GraphQL resolver imports from DB/repo
- [ ] Zero mock store imports in production files
- [ ] All 3 new permissions exist in database with correct group assignments
- [ ] All 6 schema changes applied (5 columns + deletedAt)
- [ ] ON_APP channel added to NotificationChannel enum
- [ ] 4 new NotificationEventType values added
- [ ] Provider adapters have interface + adapter + factory for all 3 channels
- [ ] System settings seeder has 3 new communication keys
- [ ] GraphQL schema generates and codegen succeeds
- [ ] i18n types satisfied for both EN and AR
