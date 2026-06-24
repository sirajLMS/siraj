# Task L3 — Complaint File Upload UI

## Sprint 15 · Frontend Views Layer · Section 6

---

## Objective

Add multi-file upload dropzone to the complaint submission form and file display to complaint records. The dropzone adapts the `ResourceUploadDropzone` pattern for multi-file support. File display components show attached files in both parent and admin views.

---

## Dependencies

| Task | Description |
|------|-------------|
| J | Stories ready (Sprint 15 planning) |
| K | Stores exist (complaint store extended with file state) |

---

## Layer-Specific Rules

- **Generated types only**: View components use types from generated GraphQL types or from extracted `types.ts` files. No local entity type definitions.

---

## Target Files

| File | Action |
|------|--------|
| `frontend/views/dashboard/complaints/components/ComplaintFileUploadDropzone.tsx` | NEW |
| `frontend/views/dashboard/complaints/components/ComplaintFileList.tsx` | NEW |
| `frontend/views/dashboard/complaints/components/ComplaintFormFields.tsx` | Modify (add dropzone) |
| `frontend/views/dashboard/complaints/ParentComplaintsView.tsx` | Modify (add file state) |
| `frontend/views/dashboard/complaints/ParentComplaintsDesktopView.tsx` | Modify (pass file props) |
| `frontend/views/dashboard/complaints/ParentComplaintsMobileView.tsx` | Modify (pass file props) |
| `frontend/views/dashboard/complaints/components/ComplaintRecordCard.tsx` | Modify (show attached files) |
| `frontend/views/dashboard/complaints/components/ComplaintQueueCard.tsx` | Modify (show attached files in admin view) |
| `frontend/views/dashboard/complaints/schemas/complaintFormSchema.ts` | Modify (add file validation) |
| `frontend/views/dashboard/complaints/types/complaintsViewTypes.ts` | Modify (extend props) |
| `frontend/views/dashboard/complaints/utils/buildComplaintsLabels.ts` | Modify (add file upload labels) |

---

## Pre-Implementation Checklist

- [ ] Read `frontend/views/AGENTS.md` for view layer rules
- [ ] Read `frontend/AGENTS.md` for MUI breaking changes and theme rules
- [ ] Read `frontend/COMPONENT_PATTERNS.md` for dashboard UI patterns
- [ ] Review `ResourceUploadDropzone` at `frontend/views/dashboard/resources/components/ResourceUploadDropzone.tsx`
- [ ] Verify `mockParentComplaintsStore` has file-related state: `maxFiles`, `maxFileSizeMb`
- [ ] Verify `ComplaintFileType` interface exists with: `id`, `fileName`, `fileSize`, `mimeType`, `url`
- [ ] Verify `ParentComplaintRecord` extended with `files: ComplaintFileType[]`
- [ ] Verify `AdminComplaintRow` extended with `files: ComplaintFileType[]`
- [ ] Confirm allowed MIME types: `.pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.gif,.webp`
- [ ] Confirm system settings keys: `complaint_max_files_per_complaint`, `complaint_max_file_size_mb`

---

## Implementation Details

### 1. New Component: `ComplaintFileUploadDropzone`

Multi-file dropzone adapted from `ResourceUploadDropzone`. Shows file count limit from system settings. Shows selected files list with remove buttons.

```typescript
"use client";

import { CloseOutlined, CloudUploadOutlined } from "@mui/icons-material";
import { Box, Chip, IconButton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useRef } from "react";
import type { ComplaintFileUploadLabels } from "@/shared/messages/types/dashboard/complaints/main";

const StyledDropzoneContainer = styled(Box, {
  shouldForwardProp: prop => prop !== "hasError" && prop !== "isDragOver",
})<{ hasError: boolean; isDragOver: boolean }>(({ theme, hasError, isDragOver }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  border: `2px dashed ${hasError ? theme.palette.error.main : isDragOver ? theme.palette.primary.main : theme.palette.outlineVariant}`,
  borderRadius: theme.layout.radius.card,
  padding: theme.spacing(4),
  backgroundColor: isDragOver ? theme.palette.surfaceContainer : theme.palette.surfaceContainerLow,
  cursor: "pointer",
  transition: "border-color 0.15s ease, background-color 0.15s ease",
  "&:hover": {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.surfaceContainer,
  },
}));

const StyledSelectedFileRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(1, 1.5),
  borderRadius: theme.layout.radius.card,
  backgroundColor: theme.palette.surfaceContainerLow,
  border: `1px solid ${theme.palette.outlineVariant}`,
}));

const StyledFileIcon = styled(Box)(({ theme }) => ({
  width: 32,
  height: 32,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: theme.layout.radius.card,
  backgroundColor: theme.palette.surfaceContainerHigh,
}));

interface ComplaintFileUploadDropzoneProps {
  readonly labels: ComplaintFileUploadLabels;
  readonly selectedFiles: File[];
  readonly onFilesChange: (files: File[]) => void;
  readonly hasError: boolean;
  readonly errorMessage?: string;
  readonly variant: "desktop" | "mobile";
  readonly maxFiles: number;
  readonly maxFileSizeMb: number;
}

const ACCEPTED_FILE_TYPES = ".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.gif,.webp";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileTypeLabel(fileName: string): string {
  const ext = fileName.split(".").pop()?.toUpperCase() ?? "";
  return ext;
}

export function ComplaintFileUploadDropzone({
  labels,
  selectedFiles,
  onFilesChange,
  hasError,
  errorMessage,
  variant,
  maxFiles,
  maxFileSizeMb,
}: Readonly<ComplaintFileUploadDropzoneProps>) {
  const isMobile = variant === "mobile";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files ?? []);
    const combined = [...selectedFiles, ...newFiles].slice(0, maxFiles);
    onFilesChange(combined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    const updated = selectedFiles.filter((_, i) => i !== index);
    onFilesChange(updated);
  };

  const supportedFormatsLabel = labels.supportedFormats.replace("{maxSize}", String(maxFileSizeMb));
  const maxFilesLabel = labels.maxFiles.replace("{max}", String(maxFiles));

  return (
    <Box>
      <Typography variant="labelMd" sx={{ fontWeight: 700, mb: 1, display: "block" }}>
        {labels.title}
      </Typography>

      <StyledDropzoneContainer
        hasError={hasError}
        isDragOver={false}
        component="label"
        sx={{ p: isMobile ? 3 : 4 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          hidden
          multiple
          accept={ACCEPTED_FILE_TYPES}
          onChange={handleFileSelect}
        />
        <CloudUploadOutlined
          sx={theme => ({ fontSize: isMobile ? 36 : 44, color: theme.palette.primary.main, mb: 1 })}
        />
        <Typography variant="titleLg" sx={{ textAlign: "center", mb: 0.5 }}>
          {labels.hint}
        </Typography>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, textAlign: "center" })}>
          {supportedFormatsLabel}
        </Typography>
        <Chip
          label={maxFilesLabel}
          size="small"
          sx={theme => ({ mt: 1, bgcolor: theme.palette.surfaceContainerHigh })}
        />
      </StyledDropzoneContainer>

      {errorMessage ? (
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.error.main, mt: 0.5 })}>
          {errorMessage}
        </Typography>
      ) : null}

      {selectedFiles.length > 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2 }}>
          {selectedFiles.map((file, index) => (
            <StyledSelectedFileRow key={`${file.name}-${index}`}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <StyledFileIcon>
                  <Typography variant="labelMd" sx={{ fontWeight: 700 }}>
                    {getFileTypeLabel(file.name)}
                  </Typography>
                </StyledFileIcon>
                <Box>
                  <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
                    {file.name}
                  </Typography>
                  <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                    {formatFileSize(file.size)}
                  </Typography>
                </Box>
              </Box>
              <IconButton
                size="small"
                onClick={() => { handleRemoveFile(index); }}
                aria-label={labels.removeFile}
              >
                <CloseOutlined sx={{ fontSize: 18 }} />
              </IconButton>
            </StyledSelectedFileRow>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}
```

---

### 2. New Component: `ComplaintFileList`

Displays list of attached files with file name, size, type icon. Used in complaint record cards and queue cards.

```typescript
"use client";

import { AttachFileOutlined, OpenInNewOutlined } from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ComplaintFileType } from "@/frontend/stores/mockParentComplaintsStore";

const StyledFileListContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  marginTop: theme.spacing(1.5),
  paddingTop: theme.spacing(1.5),
  borderTop: `1px dashed ${theme.palette.outlineVariant}`,
}));

const StyledFileRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(1, 1.5),
  borderRadius: theme.layout.radius.card,
  backgroundColor: theme.palette.surfaceContainerLow,
  border: `1px solid ${theme.palette.outlineVariant}`,
}));

const StyledFileIcon = styled(AttachFileOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: 18,
}));

const StyledViewButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

interface ComplaintFileListProps {
  readonly files: readonly ComplaintFileType[];
  readonly attachedLabel: string;
  readonly viewFileLabel: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ComplaintFileList({
  files,
  attachedLabel,
  viewFileLabel,
}: Readonly<ComplaintFileListProps>) {
  if (files.length === 0) return null;

  const countLabel = attachedLabel.replace("{count}", String(files.length));

  return (
    <StyledFileListContainer>
      <Typography variant="labelMd" sx={{ fontWeight: 700 }}>
        {countLabel}
      </Typography>
      {files.map(file => (
        <StyledFileRow key={file.id}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <StyledFileIcon />
            <Box>
              <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
                {file.fileName}
              </Typography>
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                {formatFileSize(file.fileSize)}
              </Typography>
            </Box>
          </Box>
          <StyledViewButton
            size="small"
            aria-label={viewFileLabel}
            onClick={() => { window.open(file.url, "_blank"); }}
          >
            <OpenInNewOutlined sx={{ fontSize: 18 }} />
          </StyledViewButton>
        </StyledFileRow>
      ))}
    </StyledFileListContainer>
  );
}
```

---

### 3. Modifications: `ComplaintFormFields`

Add the `ComplaintFileUploadDropzone` below the complaint details field.

```typescript
// ADD import:
import { ComplaintFileUploadDropzone } from "./ComplaintFileUploadDropzone";
import type { ComplaintFileUploadLabels } from "@/shared/messages/types/dashboard/complaints/main";

// ADD to interface:
readonly fileUploadLabels: ComplaintFileUploadLabels;
readonly selectedFiles: File[];
readonly onFilesChange: (files: File[]) => void;
readonly maxFiles: number;
readonly maxFileSizeMb: number;

// ADD after complaint details TextField (inside StyledFormContainer):
<ComplaintFileUploadDropzone
  labels={fileUploadLabels}
  selectedFiles={selectedFiles}
  onFilesChange={onFilesChange}
  hasError={Boolean(errors.files)}
  errorMessage={errors.files?.message}
  variant={variant}
  maxFiles={maxFiles}
  maxFileSizeMb={maxFileSizeMb}
/>
```

---

### 4. Modifications: `complaintFormSchema`

Add `files` field with validation for count and size limits.

```typescript
import { z } from "zod";
import type { ComplaintValidationLabels } from "@/shared/messages/types/dashboard/complaints/main";

export const complaintFormSchema = (
  labels: ComplaintValidationLabels,
  options: { maxFiles: number; maxFileSizeMb: number }
) =>
  z.object({
    studentId: z.string().min(1, labels.studentRequired),
    contactEmail: z
      .string()
      .min(1, labels.emailRequired)
      .pipe(z.email({ message: labels.emailInvalid })),
    complaintDetails: z.string().min(10, labels.detailsRequired),
    files: z
      .array(z.instanceof(File))
      .max(options.maxFiles, labels.tooManyFiles.replace("{max}", String(options.maxFiles)))
      .optional()
      .refine(
        files => {
          if (!files) return true;
          const maxBytes = options.maxFileSizeMb * 1024 * 1024;
          return files.every(f => f.size <= maxBytes);
        },
        { message: labels.fileTooLarge.replace("{max}", String(options.maxFileSizeMb)) }
      ),
  });

export type ComplaintFormData = z.infer<ReturnType<typeof complaintFormSchema>>;
```

---

### 5. Modifications: `ComplaintRecordCard`

Show attached files in parent complaint record view.

```typescript
// ADD import:
import { ComplaintFileList } from "./ComplaintFileList";

// ADD to ComplaintRecordCardProps:
readonly files: readonly ComplaintFileType[];
readonly fileLabels: { attached: string; viewFile: string };

// ADD inside StyledRecordCardContent, after admin response / pending status section:
{files.length > 0 ? (
  <ComplaintFileList
    files={files}
    attachedLabel={fileLabels.attached}
    viewFileLabel={fileLabels.viewFile}
  />
) : null}
```

---

### 6. Modifications: `ComplaintQueueCard`

Show attached files in admin complaint queue view.

```typescript
// ADD import:
import { ComplaintFileList } from "./ComplaintFileList";

// ADD to ComplaintQueueCardProps:
readonly files: readonly ComplaintFileType[];
readonly fileLabels: { attached: string; viewFile: string };

// ADD inside StyledQueueCardPaper, after complaint text section:
{files.length > 0 ? (
  <ComplaintFileList
    files={files}
    attachedLabel={fileLabels.attached}
    viewFileLabel={fileLabels.viewFile}
  />
) : null}
```

---

### 7. Modifications: `ParentComplaintsView`

Manage file state and pass to desktop/mobile views.

```typescript
// ADD state:
const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

// ADD to defaultValues in useForm:
files: [],

// ADD to viewProps:
selectedFiles,
onFilesChange: setSelectedFiles,
fileUploadLabels: labels.fileUpload,
maxFiles: 5,
maxFileSizeMb: 25,

// UPDATE onSubmit to include files:
const handleFormSubmit = () => {
  handleSubmit(data => {
    onSubmit({ ...data, files: selectedFiles });
    reset();
    setSelectedFiles([]);
  })();
};
```

---

### 8. Modifications: `ParentComplaintsDesktopView` and `ParentComplaintsMobileView`

Pass file props through to `ComplaintFormFields`.

```typescript
// ADD to interface:
readonly selectedFiles: File[];
readonly onFilesChange: (files: File[]) => void;
readonly fileUploadLabels: ComplaintFileUploadLabels;
readonly maxFiles: number;
readonly maxFileSizeMb: number;

// PASS to ComplaintFormFields:
<ComplaintFormFields
  control={control}
  errors={errors}
  labels={labels}
  studentOptions={studentOptions}
  variant="desktop"
  fileUploadLabels={fileUploadLabels}
  selectedFiles={selectedFiles}
  onFilesChange={onFilesChange}
  maxFiles={maxFiles}
  maxFileSizeMb={maxFileSizeMb}
/>
```

---

### 9. Modifications: `complaintsViewTypes`

Extend `ParentComplaintsViewProps` with file-related properties.

```typescript
export interface ParentComplaintsViewProps {
  readonly labels: ComplaintsLabels["parent"];
  readonly studentOptions: readonly ParentStudentOption[];
  readonly records: readonly ParentComplaintRecord[];
  readonly hasOlderRecords: boolean;
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly canSubmit: boolean;
  readonly onSubmit: (data: ComplaintFormData & { files: File[] }) => void;
  readonly onDismissSuccess: () => void;
  readonly onLoadOlderRecords: () => void;
  readonly selectedFiles: File[];
  readonly onFilesChange: (files: File[]) => void;
  readonly maxFiles: number;
  readonly maxFileSizeMb: number;
}
```

---

### 10. Modifications: `buildComplaintsLabels`

Add file upload and file display label keys.

```typescript
// ADD to parent labels in buildComplaintsLabels:
fileUpload: {
  title: t("parent.fileUpload.title"),
  hint: t("parent.fileUpload.hint"),
  supportedFormats: t("parent.fileUpload.supportedFormats"),
  maxFiles: t("parent.fileUpload.maxFiles"),
  removeFile: t("parent.fileUpload.removeFile"),
},
files: {
  attached: t("parent.files.attached"),
  viewFile: t("parent.files.viewFile"),
},
validation: {
  studentRequired: t("parent.validation.studentRequired"),
  emailRequired: t("parent.validation.emailRequired"),
  emailInvalid: t("parent.validation.emailInvalid"),
  detailsRequired: t("parent.validation.detailsRequired"),
  tooManyFiles: t("parent.validation.tooManyFiles"),
  fileTooLarge: t("parent.validation.fileTooLarge"),
  invalidFileType: t("parent.validation.invalidFileType"),
},
```

---

## Allowed File Types

| Category | Extensions |
|----------|-----------|
| Documents | `.pdf`, `.doc`, `.docx` |
| Text | `.txt`, `.md` |
| Images | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp` |

---

## System Settings

| Key | Default | Description |
|-----|---------|-------------|
| `complaint_max_files_per_complaint` | `5` | Maximum number of file attachments per complaint |
| `complaint_max_file_size_mb` | `25` | Maximum file size in megabytes |

---

## Error Handling Strategy

| Scenario | Handling |
|----------|---------|
| Too many files selected | Zod validation: `files.max(maxFiles)` with localized message |
| File exceeds size limit | Zod `refine` check on each file's `size` property |
| Invalid file type | HTML `accept` attribute restricts file chooser; additional runtime check optional |
| No files selected | `files` field is optional — no error when empty |
| File input reset after selection | `fileInputRef.current.value = ""` prevents duplicate file issues |

---

## Quality Gate — Implementation

- [ ] All new components are functional components with hooks (no class components)
- [ ] All user-facing text uses translation keys via `labels` prop (no hardcoded strings)
- [ ] All MUI style props placed inside `sx` callbacks
- [ ] All colors use theme palette via `sx={(theme) => ({ ... })}` pattern (no hardcoded hex/rgb)
- [ ] `ComplaintFileUploadDropzone` supports multi-file selection via `multiple` attribute
- [ ] `ComplaintFileUploadDropzone` shows selected files list with remove buttons
- [ ] `ComplaintFileUploadDropzone` displays max files and max file size from props
- [ ] `ComplaintFileUploadDropzone` resets file input after selection to prevent duplicates
- [ ] `ComplaintFileList` displays file name, size, and view button for each attached file
- [ ] `ComplaintFileList` shows count label with interpolated `{count}` value
- [ ] `ComplaintFileList` returns `null` when no files are attached
- [ ] `ComplaintFormFields` includes dropzone below complaint details field
- [ ] `complaintFormSchema` validates file count and size limits with localized messages
- [ ] `ComplaintRecordCard` shows attached files via `ComplaintFileList`
- [ ] `ComplaintQueueCard` shows attached files via `ComplaintFileList`
- [ ] `ParentComplaintsView` manages `selectedFiles` state and clears on submit
- [ ] Desktop and mobile views pass file props through to form fields
- [ ] `buildComplaintsLabels` includes all new file upload and display keys
- [ ] No `console.*` calls — use `logger` from `@/frontend/utils/logger` if needed
- [ ] No nested ternary operators
- [ ] TypeScript types are fully resolved (no `any`)
- [ ] No local entity type definitions — all types sourced from generated GraphQL types or extracted `types.ts` files

---

## Quality Gate — Verification

- [ ] `bun tsgo` passes with zero errors
- [ ] `bun lint` passes with zero errors
- [ ] `bun quality-gate` passes all stages
- [ ] Manual verification: dropzone accepts multiple files within allowed types
- [ ] Manual verification: selecting more than `maxFiles` files truncates to limit
- [ ] Manual verification: selected files list shows file name, size, and remove button
- [ ] Manual verification: removing a file updates the list correctly
- [ ] Manual verification: form validation rejects when file count exceeds limit
- [ ] Manual verification: form validation rejects when a file exceeds size limit
- [ ] Manual verification: complaint record card shows attached files in parent view
- [ ] Manual verification: complaint queue card shows attached files in admin view
- [ ] Manual verification: clicking "View" on a file opens it in a new tab
- [ ] Manual verification: file state clears when form is successfully submitted
- [ ] Manual verification: dropzone renders correctly on both desktop and mobile
- [ ] Manual verification: all text renders correctly in both English and Arabic (RTL)

---

## Notes

- The `ComplaintFileType` interface must be defined in `mockParentComplaintsStore` (Task K) with fields: `id`, `fileName`, `fileSize`, `mimeType`, `url`.
- The `ComplaintFileUploadLabels` interface must be added to `shared/messages/types/dashboard/complaints/main.ts` (Task M).
- The `ComplaintValidationLabels` interface must be extended with `tooManyFiles`, `fileTooLarge`, and `invalidFileType` keys.
- The `ComplaintFileUploadDropzone` uses the same visual pattern as `ResourceUploadDropzone` but with multi-file support.
- The `formatFileSize` helper is duplicated between dropzone and file list — consider extracting to a shared utility if SonarQube flags duplication.
- The file input `accept` attribute provides first-line filtering; Zod validation provides the authoritative check.
- The `maxFiles` and `maxFileSizeMb` values are passed as props from the container, which reads them from system settings or store defaults.
