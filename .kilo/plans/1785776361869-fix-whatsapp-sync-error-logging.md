# Disable WhatsApp Sync Button When Not Configured

## Problem
The "Sync from Meta" button should be disabled when WhatsApp configuration is not set up (i.e., when `WHATSAPP_WABA_ID` and `WHATSAPP_ACCESS_TOKEN` are not configured in the environment).

## Root Cause Analysis
1. The sync functionality requires WhatsApp Cloud API credentials (`WHATSAPP_WABA_ID` and `WHATSAPP_ACCESS_TOKEN`)
2. Currently, the sync button is only disabled during syncing (`disabled={syncing}`)
3. There's no check for whether WhatsApp is configured before allowing sync
4. The backend already has a `validateConfig()` method in `MetaCloudApiAdapter` that checks if credentials can be resolved

## Solution
1. **Backend**: Add a new GraphQL query `isWhatsappConfigured` that calls `whatsappChannel.validateConfig()`
2. **Frontend**: 
   - Add the new query to the ViewModel
   - Use the result to disable the sync button when WhatsApp is not configured
   - Update both NumbersTab and TemplatesTab sync buttons

## Files to Modify

### Backend
1. `backend/services/whatsapp/whatsapp-account.service.ts` - Add `isConfigured()` method that calls `whatsappChannel.validateConfig()`
2. `backend/graphql/query/whatsapp/whatsapp-account.query.ts` - Add `isWhatsappConfigured` query field
3. Run `bun run generate:gqlSchema && bun codegen` to update types

### Frontend
1. `frontend/common/graphql/sharedDocuments/whatsapp/whatsapp.documents.ts` - Add new query document `isWhatsappConfiguredQueryDocument`
2. `frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.ts` - Use the new query, add `isConfigured` to ViewModel
3. `frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes.ts` - Add `isConfigured` to `WhatsappSettingsViewModel` interface
4. `frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps.ts` - Add `isConfigured` to `NumbersTabSharedProps` and `TemplatesTabSharedProps`
5. `frontend/common/views/dashboard/settings/whatsapp/tabs/shared/TemplatesTabContent.tsx` - Update button disabled state to `disabled={syncing || !isConfigured}`
6. `frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile.tsx` - Update button disabled state to `disabled={syncing || !isConfigured}`
7. `frontend/desktop/views/dashboard/settings/whatsapp/tabs/NumbersTab.desktop.tsx` - Update button disabled state to `disabled={syncing || !isConfigured}`

## Implementation Details

### Backend Service Method
```typescript
// In WhatsappAccountService namespace
export async function isConfigured(): Promise<boolean> {
  const { whatsappChannel } = await import("@/backend/services/communication/channels/whatsapp");
  return whatsappChannel.validateConfig();
}
```

### Backend GraphQL Query
```typescript
// In whatsapp-account.query.ts
isWhatsappConfigured: t.boolean({
  nullable: false,
  description: "Check if WhatsApp Cloud API is configured and credentials are valid",
  authScopes: { permission: AppPermission.WHATSAPP_VIEW },
  resolve: withAuthResult((_actorUserId, _args, _tErrors) => WhatsappAccountService.isConfigured()),
}),
```

### Frontend Query Document
```typescript
// In whatsapp.documents.ts
export const isWhatsappConfiguredQueryDocument: TypedDocumentNode<Operations.IsWhatsappConfiguredQuery> = gql`
  query isWhatsappConfigured {
    isWhatsappConfigured
  }
`;
```

### Frontend ViewModel Changes
```typescript
// In useWhatsappSettingsViewModel.ts
const configuredQuery = useQuery(isWhatsappConfiguredQueryDocument);
const isConfigured = configuredQuery.data?.isWhatsappConfigured ?? false;

// Add to return object
return {
  // ...existing
  isConfigured,
  // ...existing
};
```

### Shared Props Updates
```typescript
// In whatsappTabSharedProps.ts
export interface NumbersTabSharedProps {
  // ...existing
  readonly isConfigured: boolean;
}

export interface TemplatesTabSharedProps {
  // ...existing
  readonly isConfigured: boolean;
}
```

### UI Changes

**TemplatesTabContent.tsx (shared):**
```tsx
<Button variant="outlined" startIcon={<CloudSyncOutlined />} disabled={syncing || !isConfigured} onClick={onSyncFromMeta}>
  {syncing ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
  {t.syncTemplates}
</Button>
```

**NumbersTab.mobile.tsx:**
```tsx
<Button
  size="small"
  variant="outlined"
  startIcon={<CloudSyncOutlined />}
  disabled={syncing || !isConfigured}
  onClick={onSyncFromMeta}
>
  {t.syncFromMeta}
</Button>
```

**NumbersTab.desktop.tsx:**
```tsx
<Button
  variant="outlined"
  startIcon={<CloudSyncOutlined />}
  disabled={syncing || !isConfigured}
  onClick={onSyncFromMeta}
>
  {syncing ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
  {t.syncFromMeta}
</Button>
```

## Design Decisions

1. **Permission**: `WHATSAPP_VIEW` - consistent with `whatsappAccounts` query
2. **Error handling**: `validateConfig()` catches errors and returns `false`; GraphQL query returns `false` on error (safe default)
3. **Loading state**: Default `isConfigured` to `false` while query loads (button disabled until confirmed)
4. **Caching**: Apollo default caching is sufficient for this simple boolean query

## Validation
- Test with WhatsApp configured: sync buttons enabled in both Numbers and Templates tabs
- Test with WhatsApp not configured: sync buttons disabled in both tabs
- Test sync functionality still works when configured
- Verify no regression in existing functionality
- Run `bun tsgo` and `bun biome:check` to verify code quality

## Risk Assessment
- Low risk: Adding a new read-only query and service method
- No changes to existing mutations or business logic
- Backward compatible
- Requires proper permission scoping (`WHATSAPP_VIEW` seems appropriate)
- The `validateConfig` method is already tested and used in the channel factory

## Dependencies
- Backend changes must be deployed before frontend changes (GraphQL schema update)
- Run codegen after backend schema changes
- Frontend ViewModel must import the new query document