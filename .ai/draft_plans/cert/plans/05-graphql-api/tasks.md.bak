# Plan 05 — GraphQL API: Tasks

> **Plan #**: 05
> **Dependencies**: Plan 2 (Types & Permissions), Plan 4 (Services)
> **Scope**: Pothos object types, queries, mutations, DataLoader, auth scopes, public verification endpoint, error mapping
> **Execution**: Sequential through phases below

---

## Dependency Graph

```
T01 ──► T02 ──► T03 ──► T04 ──► T05 ──► T06 ──► T07
                                                    │
T08 ──► T09 ──► T10 ──────────► T11 ──► T12 ──► T13 ──► T14
```

---

## Phase 1: Enum Registration & Foundation (T01–T03)

### T01: Register Certificate Enums in Pothos Shared Enum File
- [ ] Register all 11 cert pgEnums in `backend/graphql/pothos/shared/enum.pothos.ts`
- [ ] Enums to register: `CertificateTemplateStatus`, `CertificateOrientation`, `CertificateBackgroundType`, `CertificateElementType`, `CertificateVariableType`, `CertificateRecipientGroupStatus`, `CertificateRecipientItemStatus`, `CertificateStatus`, `CertificateGenerationStatus`, `CertificateVerificationMethod`, `CertificateVerificationResult`
- [ ] Ensure each enum's values match the pgEnum string values from Plan 1's schema
- [ ] Run quality loop on `backend/graphql/pothos/shared/enum.pothos.ts`:
  - `bun tsgo` — 0 type errors
  - `bun biome:check` — 0 issues
  - Lint via queue client for the file
- [ ] Verify against instruction files:
  - `backend/graphql/AGENTS.md`
  - `backend/graphql/pothos/AGENTS.md`
  - `.agents/instructions/backend.instructions.md`
- **Requirements**: AC-02 (all 11 cert enums registered)
- **Files modified**: `backend/graphql/pothos/shared/enum.pothos.ts`
- **Dependencies**: Plan 1 (schema), Plan 2 (types)
- **Estimated**: 2h

### T02: Create Pothos Directory Structure & Barrel Index
- [ ] Create `backend/graphql/pothos/certificates/` directory
- [ ] Create `backend/graphql/pothos/certificates/index.ts` — barrel file exporting all cert Pothos modules
- [ ] Wire barrel import into `backend/graphql/pothos/index.ts`
- [ ] Run quality loop on both files
- [ ] Verify against `backend/graphql/pothos/AGENTS.md`
- **Requirements**: AC-10 (barrel exports wired into root Pothos index)
- **Files created**: `backend/graphql/pothos/certificates/index.ts`
- **Files modified**: `backend/graphql/pothos/index.ts`
- **Dependencies**: T01
- **Estimated**: 1h

### T03: Create Input Types (InputRefs)
- [ ] Create `backend/graphql/pothos/certificates/inputs.pothos.ts`
- [ ] Define all input types backed by `SubmitInput` types from Plan 2:
  - `TemplateSubmitInput` → `TemplateCreateInput`, `TemplatePatchInput`
  - `TemplateElementSubmitInput` → `TemplateElementInput`
  - `TemplateVariableSubmitInput` → `TemplateVariableInput`
  - `CategorySubmitInput` → `CategoryCreateInput`, `CategoryPatchInput`
  - `RecipientGroupSubmitInput` → `RecipientGroupCreateInput`, `RecipientGroupPatchInput`
  - `TemplateStylePresetSubmitInput` → `StylePresetCreateInput`, `StylePresetPatchInput`
  - `VariableValueInput` (for per-recipient variable overrides)
  - `BatchGenerationInput` (groupId only)
  - `RevokeInput` (id + reason)
- [ ] All input fields map to corresponding `SubmitInput` properties from `backend/types/`
- [ ] Required vs optional fields match the SubmitInput types
- [ ] Run quality loop
- [ ] Verify against `backend/graphql/AGENTS.md`, `backend/types/AGENTS.md`
- **Requirements**: Design §6 (Mutation Catalog — all input types)
- **Files created**: `backend/graphql/pothos/certificates/inputs.pothos.ts`
- **Dependencies**: T02, Plan 2 (types)
- **Estimated**: 3h

---

## Phase 2: Object Types & DataLoader (T04–T08)

### T04: Create Certificate Object Type with loadableObjectRef
- [ ] Create `backend/graphql/pothos/certificates/certificate.pothos.ts`
- [ ] Define `Certificate` object type using `loadableObjectRef('Certificate', ...)` with batch loader by IDs
- [ ] All fields map from `CertificateReturnType` (Plan 2):
  - Scalar fields: id, status, verificationCode, generatedAt, issuedAt, revokedAt, revokedReason, expireDate, pdfUrl, createdAt
  - Relation fields: template (CertificateTemplate), student (Student), recipientGroupItem (RecipientGroupItem), verifications ([CertificateVerification])
- [ ] Create DataLoader batch loader: `backend/graphql/pothos/certificates/certificate.dataLoader.ts`
  - Batch function: given IDs, query service for certificates and return in same order
- [ ] Auth scope: field-level `CERT_VIEW` for sensitive fields (verificationCode, pdfUrl)
- [ ] Run quality loop on both files
- [ ] Verify against `backend/graphql/pothos/AGENTS.md`
- **Requirements**: AC-01 (9 Pothos object types), AC-05 (DataLoader batch loading)
- **Files created**: `certificate.pothos.ts`, `certificate.dataLoader.ts`
- **Dependencies**: T03, Plan 2 (types), Plan 4 (services)
- **Estimated**: 3h

### T05: Create CertificateTemplate Object Type with loadableObjectRef
- [ ] Create `backend/graphql/pothos/certificates/certificateTemplate.pothos.ts`
- [ ] Define `CertificateTemplate` object type using `loadableObjectRef('CertificateTemplate', ...)` with batch loader
- [ ] All fields map from `TemplateReturnType` (Plan 2):
  - Scalar fields: id, name, nameAr, description, status, orientation, widthPx, heightPx, backgroundType, backgroundColor, fontFamily, fontSize, version, createdAt, updatedAt
  - Relation fields: category (CertificateCategory), elements ([TemplateElement]), variables ([TemplateVariable]), recipientGroups ([RecipientGroup]), createdBy (User)
- [ ] Create DataLoader: `certificateTemplate.dataLoader.ts`
- [ ] Run quality loop
- **Requirements**: AC-01, AC-05
- **Files created**: `certificateTemplate.pothos.ts`, `certificateTemplate.dataLoader.ts`
- **Dependencies**: T04
- **Estimated**: 3h

### T06: Create Remaining 7 Object Types (Plain objectRef)
- [ ] Create `templateElement.pothos.ts` — TemplateElement type with all fields from Plan 2
- [ ] Create `templateVariable.pothos.ts` — TemplateVariable type
- [ ] Create `category.pothos.ts` — CertificateCategory type with self-referential parent/children relations
- [ ] Create `recipientGroup.pothos.ts` — RecipientGroup type
- [ ] Create `recipientGroupItem.pothos.ts` — RecipientGroupItem type
- [ ] Create `verification.pothos.ts` — CertificateVerification type
- [ ] Create `stylePreset.pothos.ts` — TemplateStylePreset type
- [ ] Each type uses plain `objectRef` (no DataLoader — loaded as child lists, not individually batched)
- [ ] All field resolvers map from corresponding `ReturnType` types in Plan 2
- [ ] Run quality loop on each file individually
- [ ] Verify against `backend/graphql/AGENTS.md`, `backend/types/AGENTS.md`
- **Requirements**: AC-01 (9 Pothos object types total)
- **Files created**: 7 Pothos type files
- **Dependencies**: T05
- **Estimated**: 4h

### T07: Define Additional Result Types
- [ ] Define `CertificateVerificationResult` type in `verification.pothos.ts` — the return type of the public verification query
  - Fields: certificate (Certificate or null), result (enum), verifiedAt, messageKey (for i18n), additionalInfo (optional JSON)
- [ ] Define `BatchGenerationResult` type in `certificate.pothos.ts` — return type of batch generation mutation
  - Fields: successCount, failCount, totalAttempted, results ([GenerationResultItem]), errors ([GenerationError])
- [ ] Define `GenerationResultItem` sub-type: certificateId, status, error?
- [ ] Define `GenerationError` sub-type: certificateId, errorCode, message
- [ ] Run quality loop
- **Requirements**: Design §5 (Query Catalog — certificateVerifyPublic return), Design §6 (Mutation Catalog — generateCertificatesBatch return)
- **Files modified**: `verification.pothos.ts`, `certificate.pothos.ts`
- **Dependencies**: T06
- **Estimated**: 2h

### T08: Wire All Object Types into Barrel Index
- [ ] Update `backend/graphql/pothos/certificates/index.ts` to export all type files
- [ ] Ensure import order respects Pothos type registration (types before queries/mutations)
- [ ] Run `bun tsgo` to verify all types compile
- [ ] Run `bun biome:check` on barrel file
- **Requirements**: AC-10
- **Files modified**: `backend/graphql/pothos/certificates/index.ts`
- **Dependencies**: T07
- **Estimated**: 1h

---

## Phase 3: Queries (T09–T10)

### T09: Create All 10 Queries
- [ ] Create `backend/graphql/pothos/certificates/queries.pothos.ts`
- [ ] Implement each query with correct auth scope:

| Query | Auth Scope | Service Delegation |
|---|---|---|
| `certificateList` | `CERT_VIEW` | `CertificateService.list(filters, pagination)` |
| `certificateById` | `CERT_VIEW` | DataLoader batch load by ID |
| `certificateVerifyPublic` | None (rate-limited) | `VerificationService.verifyPublic(code)` |
| `certTemplateList` | `CERT_TEMPLATE_VIEW` | `TemplateService.list(filters, pagination)` |
| `certTemplateById` | `CERT_TEMPLATE_VIEW` | DataLoader batch load by ID |
| `certCategoryTree` | `CERT_TEMPLATE_VIEW` | `CategoryService.getTree()` |
| `recipientGroupList` | `CERT_RECIPIENT_GROUP_MANAGE` | `RecipientGroupService.list(filters, pagination)` |
| `recipientGroupById` | `CERT_RECIPIENT_GROUP_MANAGE` | `RecipientGroupService.getById(id)` |
| `templateStylePresetList` | `CERT_TEMPLATE_VIEW` | `StylePresetService.list()` |
| `certificateVerificationLog` | `CERT_VERIFY` | `VerificationService.getLog(certificateId, pagination)` |

- [ ] For `certificateVerifyPublic`: implement rate limiting via middleware (check request IP, limit per window)
- [ ] Each query resolver accesses `ctx.t().errorsTranslations` for error localization
- [ ] Pagination arguments: `limit` (default 20, max 100), `offset` (default 0), for cursor-based: `after` cursor
- [ ] Filter arguments: domain-specific filters per query (status, categoryId, templateId, search, dateRange, etc.)
- [ ] Sort arguments: `sortBy` (field name), `sortDir` (ASC/DESC), multi-sort via array
- [ ] Run quality loop on queries file
- [ ] Verify against `backend/graphql/pothos/AGENTS.md`
- **Requirements**: AC-03 (10 queries with correct auth scopes), AC-06 (public verification with rate limiting)
- **Files created**: `backend/graphql/pothos/certificates/queries.pothos.ts`
- **Files modified**: `backend/graphql/pothos/query/index.ts` (import cert queries)
- **Dependencies**: T08, Plan 4 (services)
- **Estimated**: 4h

### T10: Wire Queries into Root Query Index
- [ ] Add import for `./certificates/queries.pothos` in `backend/graphql/pothos/query/index.ts`
- [ ] Run `bun tsgo` to verify query resolvers compile
- [ ] Run full `bun run generate:gqlSchema` to verify schema generation succeeds with new queries
- [ ] Fix any schema generation errors (circular refs, missing types, etc.)
- **Requirements**: AC-08 (schema generation successful)
- **Files modified**: `backend/graphql/pothos/query/index.ts`
- **Dependencies**: T09
- **Estimated**: 2h

---

## Phase 4: Mutations (T11–T12)

### T11: Create All 24 Mutations
- [ ] Create `backend/graphql/pothos/certificates/mutations.pothos.ts`
- [ ] Implement all mutations with correct auth scopes and service delegation:

**Template Mutations (7):**

| Mutation | Auth Scope | Service Method |
|---|---|---|
| `createCertificateTemplate` | `CERT_TEMPLATE_MANAGE` | `TemplateService.create(input)` |
| `updateCertificateTemplate` | `CERT_TEMPLATE_MANAGE` | `TemplateService.update(id, patch)` |
| `publishCertificateTemplate` | `CERT_TEMPLATE_PUBLISH` | `TemplateService.publish(id)` |
| `archiveCertificateTemplate` | `CERT_TEMPLATE_PUBLISH` | `TemplateService.archive(id)` |
| `duplicateCertificateTemplate` | `CERT_TEMPLATE_MANAGE` | `TemplateService.duplicate(id, newName)` |
| `setTemplateElements` | `CERT_TEMPLATE_MANAGE` | `TemplateService.setElements(templateId, elements)` |
| `setTemplateVariables` | `CERT_TEMPLATE_MANAGE` | `TemplateService.setVariables(templateId, variables)` |

**Category Mutations (4):**

| Mutation | Auth Scope | Service Method |
|---|---|---|
| `createCertificateCategory` | `CERT_CATEGORY_MANAGE` | `CategoryService.create(input)` |
| `updateCertificateCategory` | `CERT_CATEGORY_MANAGE` | `CategoryService.update(id, patch)` |
| `deleteCertificateCategory` | `CERT_CATEGORY_MANAGE` | `CategoryService.delete(id)` |
| `reorderCertificateCategories` | `CERT_CATEGORY_MANAGE` | `CategoryService.reorder(items)` |

**Recipient Group Mutations (6):**

| Mutation | Auth Scope | Service Method |
|---|---|---|
| `createRecipientGroup` | `CERT_RECIPIENT_GROUP_MANAGE` | `RecipientGroupService.create(input)` |
| `updateRecipientGroup` | `CERT_RECIPIENT_GROUP_MANAGE` | `RecipientGroupService.update(id, patch)` |
| `deleteRecipientGroup` | `CERT_RECIPIENT_GROUP_MANAGE` | `RecipientGroupService.delete(id)` |
| `addRecipientGroupItems` | `CERT_RECIPIENT_GROUP_MANAGE` | `RecipientGroupService.addItems(groupId, studentIds)` |
| `removeRecipientGroupItems` | `CERT_RECIPIENT_GROUP_MANAGE` | `RecipientGroupService.removeItems(groupId, itemIds)` |
| `setRecipientItemVariableValue` | `CERT_RECIPIENT_GROUP_MANAGE` | `RecipientGroupService.setVariableValue(itemId, variableId, value)` |

**Certificate Mutations (4):**

| Mutation | Auth Scope | Service Method |
|---|---|---|
| `generateCertificate` | `CERT_GENERATE` | `CertificateService.generateSingle(templateId, studentId, overrides)` |
| `generateCertificatesBatch` | `CERT_GENERATE` | `CertificateService.generateBatch(groupId)` |
| `revokeCertificate` | `CERT_REVOKE` | `CertificateService.revoke(id, reason)` |
| `revokeCertificatesBatch` | `CERT_REVOKE` | `CertificateService.revokeBatch(ids, reason)` |

**Style Preset Mutations (3):**

| Mutation | Auth Scope | Service Method |
|---|---|---|
| `createTemplateStylePreset` | `CERT_STYLE_PRESET_MANAGE` | `StylePresetService.create(input)` |
| `updateTemplateStylePreset` | `CERT_STYLE_PRESET_MANAGE` | `StylePresetService.update(id, patch)` |
| `deleteTemplateStylePreset` | `CERT_STYLE_PRESET_MANAGE` | `StylePresetService.delete(id)` |

- [ ] Each mutation resolver wraps service calls with try/catch mapping service errors to GraphQL error extensions (see design §8)
- [ ] Each resolver uses `ctx.t().errorsTranslations` for error message translation
- [ ] Mutations return the full object type (not just id) for Apollo cache normalization
- [ ] Run quality loop on mutations file
- **Requirements**: AC-04 (24 mutations with correct auth scopes), AC-07 (error mapping with translated messages)
- **Files created**: `backend/graphql/pothos/certificates/mutations.pothos.ts`
- **Dependencies**: T10
- **Estimated**: 4h

### T12: Wire Mutations into Root Mutation Index
- [ ] Add import for `./certificates/mutations.pothos` in `backend/graphql/pothos/mutation/index.ts`
- [ ] Run `bun tsgo` to verify mutation resolvers compile
- [ ] Run `bun run generate:gqlSchema` to verify full schema generation with both queries and mutations
- **Requirements**: AC-08
- **Files modified**: `backend/graphql/pothos/mutation/index.ts`
- **Dependencies**: T11
- **Estimated**: 1h

---

## Phase 5: Codegen & i18n (T13–T14)

### T13: Run GraphQL Codegen & Fix Generated Types
- [ ] Run `bun codegen` to generate TypeScript types from the schema
- [ ] Verify generated types in `frontend/common/graphql/generated/` include all cert types
- [ ] Create frontend GraphQL documents file if not part of this plan:
  - `frontend/common/graphql/sharedDocuments/certificates/certificates.documents.ts` — placeholder if Plan 8+ hasn't created it yet
- [ ] Run `bun tsgo` to verify frontend types compile against generated types
- [ ] Run `bun biome:check` on new/modified files
- **Requirements**: AC-08 (codegen successful), AC-09 (i18n error keys resolvable)
- **Files created**: `frontend/common/graphql/sharedDocuments/certificates/certificates.documents.ts` (placeholder)
- **Files modified**: generated types (auto)
- **Dependencies**: T12
- **Estimated**: 2h

### T14: Knowledge Propagation & Documentation
- [ ] Read all outcome files in `.ai/plans/cert-graphql-api/outcome/` to synthesize learnings
- [ ] Create canonical reference doc under `docs/graphql/certificate-api.md` consolidating:
  - Pothos type registration patterns for cert enums
  - loadableObjectRef bitterning pattern for Certificate and CertificateTemplate
  - Error mapping from service errors to GraphQL error extensions
  - Public verification endpoint rate limiting pattern
  - Auth scope integration with AppPermission entries
- [ ] Update `backend/graphql/AGENTS.md` with cert API section and reference to new doc
- [ ] Update `backend/graphql/pothos/AGENTS.md` with cert-specific patterns if needed
- [ ] Update `frontend/common/graphql/AGENTS.md` with cert document conventions
- [ ] Update root `AGENTS.md` Important References with `docs/graphql/certificate-api.md`
- [ ] Update `.agents/instructions/backend.instructions.md` if new backend GraphQL conventions emerged
- [ ] Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings)
- [ ] Write outcome file: `.ai/plans/cert-graphql-api/outcome/T14-knowledge-propagation-outcome.md`
- [ ] Update progress: Mark all tasks as `[x]` in this file
- **Requirements**: Feature 6 (Outcome Knowledge Base)
- **Files created**: `docs/graphql/certificate-api.md`, outcome file
- **Files modified**: AGENTS.md files, instruction files, root AGENTS.md
- **Dependencies**: T13
- **Estimated**: 3h

---

## Execution Order

```
Phase 1: T01 → T02 → T03                    (enum registration + inputs)
Phase 2: T04 → T05 → T06 → T07 → T08        (object types + DataLoader)
Phase 3: T09 → T10                           (queries + wiring)
Phase 4: T11 → T12                           (mutations + wiring)
Phase 5: T13 → T14                           (codegen + knowledge propagation)
```

Total: 14 tasks, ~36 hours estimated

---

## Quality Loop (Per File)

After creating/modifying ANY file in this plan, run:

```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-05","files":["<the-file>"]}'
```

Fix all errors before proceeding to next task.

---

## Instruction Verification (Per Subtask)

For each file created/modified, validate against ALL applicable instruction files:

| Layer | AGENTS.md | Instruction File |
|---|---|---|
| Backend GraphQL | `backend/graphql/AGENTS.md` | `.agents/instructions/backend.instructions.md` |
| Backend Pothos | `backend/graphql/pothos/AGENTS.md` | `.agents/instructions/backend.instructions.md` |
| Backend Types | `backend/types/AGENTS.md` | `.agents/instructions/backend.instructions.md` |
| Frontend GraphQL | `frontend/common/graphql/AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| Shared | `shared/AGENTS.md` | — |

---

## Acceptance Criteria Mapping

| AC | Task(s) | Description |
|---|---|---|
| AC-01 | T04, T05, T06 | 9 Pothos object types, one per entity, backed by ReturnType |
| AC-02 | T01 | All 11 cert enums registered in shared enum.pothos.ts |
| AC-03 | T09 | 10 queries with correct auth scopes |
| AC-04 | T11 | 24 mutations with correct auth scopes |
| AC-05 | T04, T05 | DataLoader batch loading for Certificate and CertificateTemplate |
| AC-06 | T09 | Public verification endpoint with rate limiting |
| AC-07 | T11 | Error mapping with translated messages |
| AC-08 | T10, T12, T13 | Schema generation + codegen successful |
| AC-09 | T11, T13 | All i18n error keys resolvable per request locale |
| AC-10 | T02, T08 | Barrel exports wired into root Pothos index |
