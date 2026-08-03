# Plan 14: Template Import/Export — Requirements Specification

## Document Information

| Field | Value |
|-------|-------|
| **Feature Name** | Certificate Template Import/Export |
| **Plan Number** | 14 |
| **Depends On** | Plan 05 (GraphQL API), Plan 10 (Template Editor Basic), Plan 11 (Template Editor Canvas), Plan 12 (Template Element Management), Plan 13 (Template Variable Management) |
| **Stakeholders** | Certificate Admins, Template Designers, Content Creators, System Integrators |
| **Related Documents** | MASTER_ARCHITECTURE.md, INTER_PLAN_CONTRACTS.md, frontend/COMPONENT_PATTERNS.md, frontend/NEW_PAGE_WORKFLOW.md |

---

## 1. Introduction

### 1.1 Overview
This plan defines the requirements for importing and exporting certificate templates in the Siraj platform. The feature enables users to:
- Export templates as portable JSON files (with all elements, variables, and settings)
- Import templates from JSON files with validation
- Batch export multiple templates as a ZIP archive
- Batch import templates from ZIP archives
- Share templates across environments (dev → staging → production)

### 1.2 Business Value
- **Portability**: Move templates between Siraj instances without database migration
- **Version Control**: Store template definitions in Git for change tracking
- **Collaboration**: Share templates with team members or across organizations
- **Backup/Restore**: Disaster recovery for template library
- **Template Marketplace**: Future foundation for community template sharing

### 1.3 Scope

| In Scope | Out of Scope |
|----------|--------------|
| Export single template as JSON | Direct database-to-database sync |
| Import single template from JSON | Real-time collaborative editing |
| Batch export as ZIP | Template marketplace UI (future plan) |
| Batch import from ZIP | Cross-platform format conversion (Canva, Figma, etc.) |
| Import validation pipeline | Automated CI/CD pipeline integration |
| Role-based access control | Template version conflict resolution UI |
| Audit logging for import/export | |

---

## 2. Requirements (EARS Format)

### 2.1 Export Requirements

#### REQ-EXP-001: Single Template Export
**WHEN** a user with `certificates.templates.manage` permission views a published or draft template **AND** clicks "Export" **THEN** the system **SHALL** generate a JSON file containing the complete template definition including all elements, variables, dimensions, orientation, background, and font settings.

#### REQ-EXP-002: Export File Format
**WHEN** a template is exported **THEN** the system **SHALL** produce a JSON file with the following structure:
```json
{
  "version": "1.0",
  "exportedAt": "ISO 8601 timestamp",
  "exportedBy": "userId",
  "template": {
    "id": "uuid",
    "title": "string",
    "description": "string",
    "categoryId": "uuid|null",
    "width": "number",
    "height": "number",
    "orientation": "landscape|portrait",
    "backgroundType": "color|image|gradient",
    "backgroundValue": "string",
    "fontFamily": "string",
    "fontSize": "number",
    "status": "draft|published|archived",
    "elements": [...],
    "variables": [...]
  }
}
```

#### REQ-EXP-003: Export Includes All Element Data
**WHEN** exporting a template **THEN** the system **SHALL** include for each element:
- id, type (static_text, data_text, data_date, image, qr_code, shape)
- position (x, y), dimensions (width, height), rotation (0-360), zIndex
- type-specific properties (text content, font settings, image reference, QR config, shape style)
- All values MUST use canonical types from INTER_PLAN_CONTRACTS.md §4

#### REQ-EXP-004: Export Includes All Variable Data
**WHEN** exporting a template **THEN** the system **SHALL** include for each variable:
- id, name, type (text, number, date, select), defaultValue, required
- For select type: options array with value/label pairs
- System variable keys MUST use centralized keys from Plan 13 contract

#### REQ-EXP-005: Export Background Images
**WHEN** a template has `backgroundType: "image"` **THEN** the system **SHALL** include the background image file as base64-encoded data URI in the export, OR provide a separate image file in ZIP export with reference.

#### REQ-EXP-006: Batch Export as ZIP
**WHEN** a user selects multiple templates **AND** clicks "Batch Export" **THEN** the system **SHALL** create a ZIP archive containing:
- One JSON file per template (named `{templateId}.json`)
- Background images in `/images/` folder (referenced by template JSON)
- A `manifest.json` listing all templates with metadata
- ZIP filename: `templates-export-{timestamp}.zip`

#### REQ-EXP-007: Export Audit Trail
**WHEN** any export operation completes **THEN** the system **SHALL** log an audit event with: userId, templateIds, exportType (single|batch), timestamp, fileSize.

---

### 2.2 Import Requirements

#### REQ-IMP-001: Single Template Import
**WHEN** a user with `certificates.templates.manage` permission uploads a valid JSON file **THEN** the system **SHALL** validate and import the template as a new draft template.

#### REQ-IMP-002: Import Validation Pipeline
**WHEN** a template JSON is uploaded **THEN** the system **SHALL** execute a validation pipeline:
1. **Schema Validation**: JSON matches export format (REQ-EXP-002)
2. **Structural Validation**: Required fields present, UUIDs valid, enums match canonical values (§4)
3. **Referential Validation**: categoryId exists (if provided), background images referenced
4. **Business Validation**: Element positions within canvas bounds, variable names unique, no duplicate IDs
5. **Security Validation**: No executable code, file size < 50MB, base64 images valid

#### REQ-IMP-003: Import Conflict Resolution
**WHEN** importing a template with an ID that already exists **THEN** the system **SHALL**:
- Generate a new UUID for the imported template
- Generate new UUIDs for all elements and variables
- Preserve all other data
- Log the ID remapping in audit trail

#### REQ-IMP-004: Import Background Images
**WHEN** importing a template with background image **THEN** the system **SHALL**:
- Upload base64 image to storage (Plan 7)
- Store the fileId in the template's backgroundValue
- Clean up temp files after import

#### REQ-IMP-005: Batch Import from ZIP
**WHEN** a user uploads a ZIP archive **THEN** the system **SHALL**:
- Extract and parse `manifest.json`
- Validate each template JSON independently
- Import valid templates as drafts
- Report results per template (success/failed with error details)
- Skip invalid templates, continue processing others

#### REQ-IMP-006: Import Preview Modal
**WHEN** a user selects a file for import **THEN** the system **SHALL** show a preview modal displaying:
- Template title, category, dimensions, element count, variable count
- Validation warnings (non-blocking): missing category, large images, deprecated properties
- Validation errors (blocking): schema mismatch, invalid enums, corrupt data
- "Import" button enabled only when no blocking errors

#### REQ-IMP-007: Import Audit Trail
**WHEN** any import operation completes **THEN** the system **SHALL** log an audit event with: userId, importedTemplateIds, sourceFileName, importType (single|batch), timestamp, skippedCount, errorCount.

---

### 2.3 UX & Navigation Requirements

#### REQ-UX-001: Template List Export Actions
**WHEN** on the Template List page (Plan 8) **THEN** the system **SHALL** provide:
- Row action: "Export" (single template)
- Bulk action bar (when checkboxes selected): "Export Selected" → ZIP
- Header action: "Import Template" (file picker)

#### REQ-UX-002: Template Detail Export
**WHEN** on the Template Editor page (Plan 10/11/12) **THEN** the system **SHALL** provide:
- Header action: "Export" (current template)
- Header action: "Import" (replace current - with confirmation)

#### REQ-UX-003: Role-Based Access Matrix
The following roles **SHALL** have import/export permissions:

| Role | certificates.templates.view | certificates.templates.manage | Export | Import |
|------|---------------------------|------------------------------|--------|--------|
| Super Admin | ✅ | ✅ | ✅ | ✅ |
| Certificate Admin | ✅ | ✅ | ✅ | ✅ |
| Template Designer | ✅ | ✅ | ✅ | ✅ |
| Content Creator | ✅ | ❌ | ✅ | ❌ |
| Reviewer | ✅ | ❌ | ✅ | ❌ |
| Student | ❌ | ❌ | ❌ | ❌ |
| Parent | ❌ | ❌ | ❌ | ❌ |
| Teacher | ❌ | ❌ | ❌ | ❌ |

#### REQ-UX-004: Mobile/Desktop Parity
**WHEN** on mobile viewport **THEN** the system **SHALL** provide equivalent import/export functionality via:
- MobileCardList row actions for export
- Floating action button for import
- Responsive file picker (native mobile file selection)
- Touch-optimized preview modal

---

### 2.4 Non-Functional Requirements

#### REQ-NFR-001: Accessibility (WCAG 2.1 AA)
- All import/export UI **SHALL** meet WCAG 2.1 AA standards
- File inputs **SHALL** have accessible labels
- Progress indicators **SHALL** be announced to screen readers
- Error messages **SHALL** be associated with inputs via aria-describedby
- Color contrast **SHALL** meet 4.5:1 for text, 3:1 for UI components
- Focus management **SHALL** work correctly in preview modal

#### REQ-NFR-002: Mobile Responsive
- All import/export UI **SHALL** work on viewports ≥ 320px
- File picker **SHALL** use native mobile file selection
- Preview modal **SHALL** be full-screen on mobile (< 600px)
- Progress indicators **SHALL** be visible without horizontal scroll

#### REQ-NFR-003: Performance Metrics
- Single template export **SHALL** complete < 2 seconds (template < 100 elements)
- Batch export (50 templates) **SHALL** complete < 30 seconds
- Single template import validation **SHALL** complete < 1 second
- Batch import (50 templates) **SHALL** complete < 60 seconds
- File size limit: 50MB per upload, 500MB per batch ZIP

#### REQ-NFR-004: Error Handling
- Network errors **SHALL** show retryable toast with action
- Validation errors **SHALL** be specific and actionable
- Corrupt ZIP **SHALL** show "Invalid archive format" with file name
- Partial batch failures **SHALL** not block successful imports
- Server errors **SHALL** log full context, show user-friendly message

---

### 2.5 Edge Cases & Error States

| Scenario | Expected Behavior |
|----------|------------------|
| Import file > 50MB | Reject with "File size exceeds 50MB limit" |
| Import ZIP > 500MB | Reject with "Archive size exceeds 500MB limit" |
| Corrupt JSON syntax | Show "Invalid JSON format" with line/column |
| Missing required fields | List each missing field in preview modal |
| Invalid enum value | Show "Invalid value for {field}: expected one of [...]" |
| Background image corrupt | Skip image, import template with default background, warn user |
| Duplicate variable names | Auto-rename with suffix (_1, _2), warn in preview |
| Category ID not found | Import without category, warn in preview |
| Element outside canvas bounds | Clamp to bounds, warn in preview |
| Network timeout during import | Retry up to 3 times, then show error with retry button |
| Concurrent import of same template | Allow both, generate separate UUIDs |
| Import template with newer schema version | Show "Schema version mismatch" - require migration tool |

---

### 2.6 i18n Requirements

#### Translation Namespace: `certificates.templates.importExport`

**English (en) / Arabic (ar) Keys:**

| Key | English | Arabic | Pluralization | Interpolation |
|-----|---------|--------|---------------|---------------|
| `exportButton` | Export | تصدير | - | - |
| `importButton` | Import | استيراد | - | - |
| `batchExportButton` | Export Selected | تصدير المحدد | - | - |
| `exporting` | Exporting... | جاري التصدير... | - | - |
| `importing` | Importing... | جاري الاستيراد... | - | - |
| `exportSuccess` | Template exported successfully | تم تصدير القالب بنجاح | - | `{templateTitle}` |
| `batchExportSuccess` | {count} templates exported | تم تصدير {count} قالب | count: zero/one/two/few/many/other | `{count}` |
| `importSuccess` | Template imported successfully | تم استيراد القالب بنجاح | - | `{templateTitle}` |
| `batchImportSuccess` | {successCount} of {totalCount} templates imported | تم استيراد {successCount} من {totalCount} قالب | count: zero/one/two/few/many/other | `{successCount}`, `{totalCount}` |
| `importPreviewTitle` | Import Preview | معاينة الاستيراد | - | - |
| `importPreviewTemplateTitle` | Template: {title} | القالب: {title} | - | `{title}` |
| `importPreviewCategory` | Category: {category} | التصنيف: {category} | - | `{category}` |
| `importPreviewDimensions` | Dimensions: {width}×{height}px | الأبعاد: {width}×{height}بكسل | - | `{width}`, `{height}` |
| `importPreviewElements` | Elements: {count} | العناصر: {count} | count: zero/one/two/few/many/other | `{count}` |
| `importPreviewVariables` | Variables: {count} | المتغيرات: {count} | count: zero/one/two/few/many/other | `{count}` |
| `importPreviewWarnings` | Warnings ({count}) | تحذيرات ({count}) | count: zero/one/two/few/many/other | `{count}` |
| `importPreviewErrors` | Errors ({count}) | أخطاء ({count}) | count: zero/one/two/few/many/other | `{count}` |
| `warningMissingCategory` | Category not found, will import without category | التصنيف غير موجود، سيتم الاستيراد بدونه | - | - |
| `warningLargeImage` | Background image exceeds recommended size | صورة الخلفية تتجاوز الحجم الموصى به | - | - |
| `warningDeprecatedProperty` | Deprecated property {property} ignored | تم تجاهل الخاصية المهملة {property} | - | `{property}` |
| `errorInvalidJson` | Invalid JSON format | تنسيق JSON غير صالح | - | - |
| `errorSchemaMismatch` | File does not match template schema | الملف لا يطابق مخطط القالب | - | - |
| `errorInvalidEnum` | Invalid value for {field} | قيمة غير صالحة لـ {field} | - | `{field}` |
| `errorFileTooLarge` | File size exceeds {limit}MB limit | حجم الملف يتجاوز حد {limit} ميجابايت | - | `{limit}` |
| `errorCorruptZip` | Invalid or corrupt ZIP archive | أرشيف ZIP غير صالح أو تالف | - | - |
| `errorNoValidTemplates` | No valid templates found in archive | لم يتم العثور على قوالب صالحة في الأرشيف | - | - |
| `errorNetwork` | Network error. Please retry. | خطأ في الشبكة. يرجى إعادة المحاولة. | - | - |
| `errorServer` | Server error. Please contact support. | خطأ في الخادم. يرجى التواصل مع الدعم. | - | - |
| `confirmReplaceTemplate` | Replace current template? Unsaved changes will be lost. | استبدال القالب الحالي؟ سيتم فقدان التغييرات غير المحفوظة. | - | - |
| `confirmBatchImport` | Import {count} templates? | استيراد {count} قالب؟ | count: zero/one/two/few/many/other | `{count}` |
| `filePickerLabel` | Select template JSON file | اختر ملف قالب JSON | - | - |
| `filePickerZipLabel` | Select templates ZIP archive | اختر أرشيف القوالب ZIP | - | - |
| `dropZoneText` | Drag and drop file here, or click to browse | اسحب وأفل الملف هنا، أو انقر للتصفح | - | - |
| `validationPassed` | Validation passed | تم اجتياز التحقق | - | - |
| `validationFailed` | Validation failed | فشل التحقق | - | - |
| `auditExportSingle` | Exported template {templateId} | تم تصدير القالب {templateId} | - | `{templateId}` |
| `auditExportBatch` | Batch exported {count} templates | تم التصدير الجماعي لـ {count} قالب | count: zero/one/two/few/many/other | `{count}` |
| `auditImportSingle` | Imported template {templateId} from {fileName} | تم استيراد القالب {templateId} من {fileName} | - | `{templateId}`, `{fileName}` |
| `auditImportBatch` | Batch imported {successCount}/{totalCount} templates from {fileName} | تم الاستيراد الجماعي لـ {successCount}/{totalCount} قالب من {fileName} | count: zero/one/two/few/many/other | `{successCount}`, `{totalCount}`, `{fileName}` |

#### Pluralization Rules
- **English**: zero → "0 templates", one → "1 template", other → "{count} templates"
- **Arabic**: zero → "0 قالب", one → "1 قالب", two → "2 قالبَين", few → "{count} قوالب", many → "{count} قالباً", other → "{count} قالب"

---

## 3. Acceptance Criteria

### AC-001: Single Export
- [ ] User with manage permission can export any template (draft/published/archived)
- [ ] Exported JSON matches schema in REQ-EXP-002
- [ ] All elements and variables included with correct canonical types
- [ ] Background image included as base64 or separate file
- [ ] Audit log entry created

### AC-002: Batch Export
- [ ] User can select multiple templates via checkboxes
- [ ] "Export Selected" creates valid ZIP with manifest
- [ ] Each template JSON valid per REQ-EXP-002
- [ ] Background images in /images/ folder
- [ ] Filename includes timestamp

### AC-003: Single Import
- [ ] User with manage permission can import JSON file
- [ ] Preview modal shows template info + warnings/errors
- [ ] Valid template imports as new draft with new UUIDs
- [ ] Background image uploaded to storage
- [ ] Audit log entry created

### AC-004: Import Validation
- [ ] Schema validation catches missing required fields
- [ ] Structural validation catches invalid UUIDs/enums
- [ ] Business validation catches duplicate variable names, out-of-bounds elements
- [ ] Security validation rejects executable code, oversized files
- [ ] Preview modal shows all warnings/errors correctly

### AC-005: Batch Import
- [ ] User can upload ZIP archive
- [ ] Manifest parsed, each template validated independently
- [ ] Valid templates imported, invalid skipped with errors reported
- [ ] Results summary shows success/failed counts
- [ ] Audit log entries for each imported template

### AC-006: Role-Based Access
- [ ] Content Creator can export but not import
- [ ] Reviewer can export but not import
- [ ] Student/Parent/Teacher see no import/export UI
- [ ] Certificate Admin/Template Designer have full access

### AC-007: Mobile Experience
- [ ] Export/import works on mobile viewport
- [ ] File picker uses native mobile selection
- [ ] Preview modal full-screen on mobile
- [ ] Touch targets meet 48×48dp minimum

### AC-008: Accessibility
- [ ] All interactive elements keyboard accessible
- [ ] Screen reader announces progress/errors
- [ ] Color contrast meets WCAG AA
- [ ] Focus trapped in preview modal

### AC-009: Error Handling
- [ ] Corrupt files show specific error messages
- [ ] Network errors show retry option
- [ ] Partial batch failures don't block successes
- [ ] Server errors logged with correlation ID

### AC-010: i18n
- [ ] All user-facing strings use translation keys from §2.6
- [ ] Arabic pluralization works for all count-based messages
- [ ] RTL layout works correctly for import/export UI

---

## 4. Outcome Knowledge Base & Progress Tracking

### 4.1 Key Decisions
- Export format version 1.0 with explicit version field for future migrations
- New UUIDs generated on import (not preserving original IDs)
- Base64 for single export images, separate files for batch ZIP
- Validation pipeline: schema → structural → referential → business → security
- Import preview modal required before commit

### 4.2 Patterns Established
- Wizard-style import flow with preview step
- Batch operations with per-item results
- Audit logging for all import/export operations
- Role-based action visibility via RequirePermission

### 4.3 Progress Tracking
| Milestone | Target Date | Status |
|-----------|-------------|--------|
| Requirements review complete | - | ✅ |
| Design review complete | - | ⏳ |
| Backend implementation complete | - | ⏳ |
| Frontend implementation complete | - | ⏳ |
| Testing complete | - | ⏳ |
| Quality gate passed | - | ⏳ |
| Documentation updated | - | ⏳ |