# Task 5: Redesign MeetingProviderCredentialForm with zod validation

## Summary

Redesigned `MeetingProviderCredentialForm` to use `react-hook-form` with `@hookform/resolvers/zod` for schema-driven validation. Added password show/hide toggles for secret fields, scope chip input with add/remove, provider-specific config fields (Zoom: `accountId`, MS Teams: `tenantId`), and `EntityFormDialogActions` footer. All strings are pre-resolved and passed as `labels` prop from the parent ViewModel — no `useAppTranslation` in the component.

## Files Created

| File | Purpose |
|------|---------|
| `frontend/common/views/dashboard/settings/schemas/credentialForm.schema.ts` | Zod schema factory `createCredentialFormSchema(labels)` returning `z.object({clientId, clientSecret, tenantId, scopes, webhookSecret, accountId})`. Exports `CredentialFormValues`, `CredentialFormInput`, `CredentialFormLabels`, `CredentialFormFieldLabels`. |

## Files Modified

| File | Changes |
|------|---------|
| `frontend/common/views/dashboard/settings/components/meetingIntegrations/MeetingProviderCredentialForm.tsx` | Full rewrite: react-hook-form + zodResolver, password toggle (`VisibilityOutlined`/`VisibilityOffOutlined`), scopes chip input, provider-specific fields via `ProviderConfigFields`, `EntityFormDialogActions` footer. Extracted `useCredentialFormMutations`, `useScopeHandlers`, `buildCredentialEntries`, `buildFieldMap`, `buildDefaultValues`, `filterProviderEntries`, `parseScopesFromEntries`, `renderEarlyReturn`, `toggleSecretField` to reduce cognitive complexity. Uses `useWatch` instead of `watch()` to avoid `react-hooks/incompatible-library` warning. |
| `shared/locale/types/dashboard/settings/meeting-integrations.ts` | Added 9 new keys to `credentialForm` sub-object: `clientId`, `clientSecret`, `tenantId`, `scopes`, `webhookSecret`, `accountId`, `addScope`, `removeScope`, `scopesPlaceholder`. |
| `shared/locale/en/dashboard/settings/meeting-integrations.ts` | Added EN values for new credentialForm keys. |
| `shared/locale/ar/dashboard/settings/meeting-integrations.ts` | Added AR values for new credentialForm keys. |
| `frontend/common/views/dashboard/settings/components/meetingIntegrations/meetingIntegrationsStoryMocks.ts` | Updated `createCredentialFormLabels()` mock with new keys. |

## Verification Results

All files passed `sub-loop.ts --lifecycle lint` (tsgo → oxlint → biome → lint:type-aware), exit code 0:

| File | tsgo | oxlint | biome | lint:type-aware |
|------|------|--------|-------|-----------------|
| `credentialForm.schema.ts` | ✅ | ✅ | ✅ | ✅ |
| `MeetingProviderCredentialForm.tsx` | ✅ | ✅ | ✅ | ✅ |
| `meeting-integrations.ts` (types) | ✅ | ✅ | ✅ | ✅ |
| `meeting-integrations.ts` (EN) | ✅ | ✅ | ✅ | ✅ |
| `meeting-integrations.ts` (AR) | ✅ | ✅ | ✅ | ✅ |
| `meetingIntegrationsStoryMocks.ts` | ✅ | ✅ | ✅ | ✅ |

## Carry-Forward Knowledge

### Schema factory pattern
The zod schema factory pattern `createCredentialFormSchema(labels: Pick<Labels, ...>)` returns `z.object({...})` with pre-resolved label strings injected as validation messages. This matches the `sessionConfigForm.schema.ts` reference pattern. Labels are resolved in the ViewModel and passed in — the schema NEVER receives a `t` function.

### react-hook-form + zod integration
- Import `zodResolver` from `@hookform/resolvers/zod`
- Use `useForm<T>({ resolver: zodResolver(schema), defaultValues })` 
- Access `register`, `handleSubmit`, `control`, `setValue`, `formState: { errors, isSubmitting }`
- Use `useWatch({ control, name: "field" })` instead of `watch("field")` to avoid `react-hooks/incompatible-library` warning (React Compiler cannot memoize `watch()` return value)

### EntityFormDialogActions props
- `formId` (string), `cancelLabel` (NOT `confirmLabel`), `saveLabel`, `onClose`, `isLoading` (NOT `loading`)
- Import from `@/frontend/common/views/dashboard/subjects/home/components/__shared__/EntityFormDialogActions`
- It renders `DialogActions` with `px: 3, pb: 3` styling — works inline inside AccordionDetails too

### Enum-safe comparisons
When comparing `MeetingIntegrationProviderSlug` enum values, use the enum members directly (e.g., `MeetingIntegrationProviderSlug.Zoom`) rather than string literals (`"ZOOM"`) to avoid `no-unsafe-enum-comparison`. Using `String()` wrapping triggers `no-unnecessary-type-conversion` for string enums.

### Cognitive complexity reduction
For components with complexity > 15, extract:
1. Custom hooks for mutation/callback logic (`useCredentialFormMutations`, `useScopeHandlers`)
2. Module-level pure functions for data transformation (`buildCredentialEntries`, `buildFieldMap`, `buildDefaultValues`, `filterProviderEntries`, `parseScopesFromEntries`)
3. Helper functions for early-return rendering (`renderEarlyReturn`)

### Password field show/hide pattern
Use `IconButton` with `VisibilityOutlined`/`VisibilityOffOutlined` inside `InputAdornment` via `slotProps.input.endAdornment`. Track visibility state in a `Record<string, boolean>` state object keyed by field name.

### Scopes chip input
- TextField for entering scopes (press Enter to add)
- `Chip` components with `onDelete` for removal
- `CloseOutlined` icon as the delete icon
- Scope values stored as comma-separated string in env config

### Provider-specific config fields
`ProviderConfigFields` component checks `providerSlug` and renders:
- `MICROSOFT_TEAMS`: `tenantId` field
- `ZOOM`: `accountId` field
- Others: `null`

## Cross-File Dependencies

| Dependency | From | To | Status |
|-----------|------|----|--------|
| Type import | `MeetingProviderCredentialForm.tsx` | `credentialForm.schema.ts` (`CredentialFormValues`, `createCredentialFormSchema`) | ✅ Resolved |
| Type import | `MeetingProviderCredentialForm.tsx` | `meetingIntegrations.types.ts` (`MeetingIntegrationProviderSummary`) | ✅ Pre-existing |
| Component import | `MeetingProviderCredentialForm.tsx` | `EntityFormDialogActions.tsx` | ✅ Pre-existing |
| Enum import | `MeetingProviderCredentialForm.tsx` | `gql/graphql-types.ts` (`MeetingIntegrationProviderSlug`) | ✅ Pre-existing |
| Locale keys | `MeetingProviderCredentialForm.tsx` | locale type/EN/AR files (`credentialForm.*`) | ✅ Added in this task |
| Parent render | `meetingIntegrationsTabShared.tsx` line 109 | `MeetingProviderCredentialForm` | ✅ No changes needed — props unchanged (`provider`, `labels`) |
| Storybook | `MeetingProviderCredentialForm.stories.tsx` | `MeetingProviderCredentialForm` | ✅ No changes needed — props unchanged |
