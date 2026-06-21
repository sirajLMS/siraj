# Task H — Frontend Views: Wire Real Data, Add RBAC, Replace Deactivate Confirm

**Objective:** Replace all mock store imports in the three production containers (`ParentProfileContainer`, `ParentBillingContainer`, `StudentQuotaContainer`) with real Apollo `useQuery`/`useMutation` hooks. Add `<RequirePermission>` wrappers. Replace the deactivate `href="#"` link with an MUI `<Dialog>` + real mutation.

**Dependencies:** Depends on Task F (frontend documents are created and codegen ran).

**Layer-Specific Rules (Frontend Views — Flattened from frontend/views/AGENTS.md):**
- Functional Components only. No class components.
- Access Control: Use `<RequirePermission permissions={["domain.action"]} />` to gate components.
- Data Fetching: Use Apollo `useQuery` with generated `TypedDocumentNode`s from Task F.
- NO hardcoded colors — all from theme palette.
- MUI style props via `sx` only.
- Dashboard UI Patterns: Use `PageContainer`, `PageHeader`, `SectionPanel`.
- **Mock Data Ban**: Mock data is strictly forbidden in production. `*.stories.tsx` files MUST KEEP their mock aliases.
- NO `useLazyQuery` — use stateful `useQuery`.
- No blind casts: Replace `useParams() as { id: string }` with type guard.

**Target Files:**
- `frontend/views/dashboard/parents/profile/ParentProfileContainer.tsx` — Replace mock with `useQuery`
- `frontend/views/dashboard/parents/profile/ParentProfileActions.tsx` — Replace deactivate link with Dialog + mutation
- `frontend/views/dashboard/billing/ParentBillingContainer.tsx` — Replace mock with `useQuery`
- `frontend/views/dashboard/students/quota/StudentQuotaContainer.tsx` — Replace mock with `useQuery` + mutation

---

## Detailed Implementation Steps

### Step 1: Rewrite `ParentProfileContainer.tsx`

**Current state:** Hardcoded `MOCK_PARENT` constant. `id` prop is ignored (`_id`).  
**Target:** Fetch real data via `parentProfileQueryDocument` + `parentAssociatedStudentsQueryDocument`. Gate with `<RequirePermission permissions={["parent.view_profile"]}>`.

```typescript
"use client";

import { useQuery } from "@apollo/client";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  parentProfileQueryDocument,
  parentAssociatedStudentsQueryDocument,
} from "@/frontend/graphql/sharedDocuments";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import ParentProfileView from "./ParentProfileView";

export function ParentProfileContainer() {
  const t = useTranslations("dashboard.parentProfile");
  const params = useParams();
  const parentId = typeof params?.id === "string" ? params.id : "";

  const profileQuery = useQuery(parentProfileQueryDocument, {
    variables: { parentId },
    skip: !parentId,
  });

  const studentsQuery = useQuery(parentAssociatedStudentsQueryDocument, {
    variables: { parentId },
    skip: !parentId,
  });

  if (!parentId) {
    return <Typography variant="bodyMd" color="error">{t("errors.invalidId")}</Typography>;
  }

  if (profileQuery.loading || studentsQuery.loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (profileQuery.error || !profileQuery.data?.parentProfile) {
    return (
      <Typography variant="bodyMd" color="error">
        {profileQuery.error?.message ?? t("errors.notFound")}
      </Typography>
    );
  }

  const profile = profileQuery.data.parentProfile;
  const associatedStudents = studentsQuery.data?.parentAssociatedStudents ?? [];

  // Map GraphQL data to the shape expected by ParentProfileView
  const parentData = {
    id: profile.id,
    name: profile.name,
    avatarUrl: profile.avatarUrl ?? undefined,
    status: profile.status.toLowerCase() as "regular" | "activated" | "deactivated" | "on_leave" | "suspended" | "on_trial",
    nationality: profile.nationality ?? "",
    email: profile.email,
    phone: profile.phone ?? "",
    address: profile.address ?? "",
    facebook: profile.facebook ?? undefined,
    whatsapp: profile.whatsapp ?? undefined,
    skype: profile.skype ?? undefined,
    zoomLink: profile.defaultZoomLink ?? undefined,
    invoiceType: profile.invoiceType ?? "",
    feeAmount: profile.feeAmount ? Number(profile.feeAmount) : 0,
    paymentMethod: profile.paymentMethod ?? "",
    currency: profile.currency ?? "",
    students: associatedStudents.map((s) => ({
      id: s.id,
      name: s.name,
      teacher: s.teacherName ?? "",
      hoursPerWeek: Number(s.hoursPerWeek),
      classesLeft: s.classesRemaining,
      totalClasses: s.classesTotal,
      language: s.language ?? "",
      gender: (s.gender?.toLowerCase() ?? "male") as "male" | "female",
      status: (s.status?.toLowerCase() ?? "regular") as "regular" | "on_trial" | "on_leave",
    })),
  };

  return (
    <RequirePermission permissions={[AppPermission.ParentViewProfile]}>
      <ParentProfileView parent={parentData} parentId={parentId} />
    </RequirePermission>
  );
}
```

**Note:** `ParentProfileView` needs to accept `parentId` prop to pass to `ParentProfileActions` for the deactivation mutation. Update the `ParentProfileViewProps` interface accordingly.

---

### Step 2: Rewrite `ParentProfileActions.tsx` — Add MUI Dialog for Deactivation

**Current state:** Deactivate button is `<Link href="#">` — no confirmation, no mutation.  
**Target:** Open MUI `<Dialog>` on click → confirm → call `deactivateParentMutationDocument`.

```typescript
"use client";

import {
  EditNoteOutlined,
  PersonAddOutlined,
  PersonOffOutlined,
  PhotoCameraOutlined,
  ReceiptLongOutlined,
  UploadFileOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Link,
  Snackbar,
  Stack,
  useTheme,
} from "@mui/material";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type React from "react";
import { deactivateParentMutationDocument } from "@/frontend/graphql/sharedDocuments";

interface ParentProfileActionsProps {
  readonly parentId: string;
}

const ParentProfileActions: React.FC<ParentProfileActionsProps> = ({ parentId }) => {
  const theme = useTheme();
  const t = useTranslations("dashboard.parentProfile.actions");
  const router = useRouter();

  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  const [deactivateParent, { loading: deactivating, error: deactivateError }] = useMutation(
    deactivateParentMutationDocument,
    {
      onCompleted: () => {
        setDeactivateDialogOpen(false);
        setSnackbarMessage(t("deactivateSuccess"));
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        // Navigate back to parent directory after short delay
        setTimeout(() => router.back(), 1500);
      },
      onError: (error) => {
        setSnackbarMessage(error.message);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      },
    }
  );

  const handleDeactivateConfirm = () => {
    void deactivateParent({ variables: { parentId } });
  };

  const actionLinks = [
    { label: t("editPicture"), icon: PhotoCameraOutlined, color: theme.palette.primary.main },
    { label: t("editProfile"), icon: EditNoteOutlined, color: theme.palette.primary.main },
    { label: t("uploadDocs"), icon: UploadFileOutlined, color: theme.palette.primary.main },
    { label: t("addNewStudent"), icon: PersonAddOutlined, color: theme.palette.primary.main },
    { label: t("viewInvoices"), icon: ReceiptLongOutlined, color: theme.palette.primary.main },
  ];

  return (
    <>
      <Stack
        direction="row"
        spacing={4}
        sx={{
          flexWrap: "wrap",
          pb: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          mb: theme.layout.sectionGap,
        }}
      >
        {actionLinks.map(({ label, icon: Icon, color }) => (
          <Link
            key={label}
            href="#"
            underline="hover"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: color,
              typography: "labelLarge",
              fontWeight: 700,
            }}
          >
            <Icon sx={{ fontSize: 18 }} />
            {label}
          </Link>
        ))}

        {/* Deactivate Account — opens confirmation dialog */}
        <Link
          component="button"
          onClick={() => setDeactivateDialogOpen(true)}
          underline="hover"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: theme.palette.error.main,
            typography: "labelLarge",
            fontWeight: 700,
            ml: "auto !important",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <PersonOffOutlined sx={{ fontSize: 18 }} />
          {t("deactivateAccount")}
        </Link>
      </Stack>

      {/* Deactivation Confirmation Dialog */}
      <Dialog
        open={deactivateDialogOpen}
        onClose={() => !deactivating && setDeactivateDialogOpen(false)}
        aria-labelledby="deactivate-parent-dialog-title"
        aria-describedby="deactivate-parent-dialog-desc"
      >
        <DialogTitle id="deactivate-parent-dialog-title">
          {t("deactivateDialogTitle")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="deactivate-parent-dialog-desc">
            {t("deactivateConfirmText")}
          </DialogContentText>
          {deactivateError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deactivateError.message}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeactivateDialogOpen(false)}
            disabled={deactivating}
            variant="outlined"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleDeactivateConfirm}
            disabled={deactivating}
            color="error"
            variant="contained"
            startIcon={deactivating ? <CircularProgress size={16} /> : undefined}
          >
            {deactivating ? t("deactivating") : t("deactivateAccount")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success / Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ParentProfileActions;
```

---

### Step 3: Rewrite `ParentBillingContainer.tsx`

**Current state:** Imports from `moackParentBillingStore` (typo-named mock).  
**Target:** Use `parentInvoiceHistoryQueryDocument` to fetch real invoices.

```typescript
"use client";

import { useQuery } from "@apollo/client";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { parentInvoiceHistoryQueryDocument } from "@/frontend/graphql/sharedDocuments";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { ParentBillingView } from "./ParentBillingView";
import type { ParentBillingViewProps } from "./types/billingViewTypes";
import { filterParentInvoices } from "./utils/billingFilters";
import { buildBillingLabels } from "./utils/buildBillingLabels";

export function ParentBillingContainer() {
  const t = useTranslations("dashboard.billing");
  const params = useParams();
  const parentId = typeof params?.id === "string" ? params.id : "";
  const labels = buildBillingLabels(t);

  const [searchQuery, setSearchQuery] = useState("");

  const { data, loading, error } = useQuery(parentInvoiceHistoryQueryDocument, {
    variables: { parentId },
    skip: !parentId,
  });

  const invoices = data?.parentInvoiceHistory ?? [];

  const filteredInvoices = useMemo(
    () =>
      filterParentInvoices(
        invoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.id.slice(0, 8).toUpperCase(),
          month: inv.issueDate ? new Date(inv.issueDate).toLocaleString("en", { month: "long" }) : "",
          issueDate: inv.issueDate ?? "",
          dueDate: inv.dueDate ?? "",
          paidDate: inv.paidDate ?? "—",
          fee: `${inv.currency} ${inv.amount}`,
          status: (inv.status?.toLowerCase() ?? "unpaid") as "paid" | "unpaid",
        })),
        searchQuery
      ),
    [invoices, searchQuery]
  );

  if (!parentId) {
    return <Typography variant="bodyMd" color="error">{t("errors.invalidId")}</Typography>;
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Typography variant="bodyMd" color="error">{error.message}</Typography>;
  }

  const viewProps: ParentBillingViewProps = {
    labels,
    summary: {
      outstandingBalance: "",
      paidThisTerm: "",
      nextDueDate: "",
      activeStudents: "",
    },
    invoices: filteredInvoices,
    searchQuery,
    canManage: false,
    canView: true,
    canCreate: false,
    onSearchChange: setSearchQuery,
    onPayNow: () => undefined,
    onDownloadPdf: () => undefined,
    onQuickPay: () => undefined,
  };

  return (
    <RequirePermission permissions={[AppPermission.BillingViewHistory]}>
      <ParentBillingView {...viewProps} />
    </RequirePermission>
  );
}
```

---

### Step 4: Rewrite `StudentQuotaContainer.tsx`

**Current state:** Imports from `mockStudentQuotaStore`. Uses `useParams() as { id: string }` (blind cast).  
**Target:** Use `parentAssociatedStudentsQueryDocument` + `updateStudentQuotaMutationDocument`.

```typescript
"use client";

import { useMutation, useQuery } from "@apollo/client";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  parentAssociatedStudentsQueryDocument,
  updateStudentQuotaMutationDocument,
} from "@/frontend/graphql/sharedDocuments";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { StudentQuotaView } from "./StudentQuotaView";
import type { StudentQuotaFormData } from "./schemas/studentQuotaSchema";

export function StudentQuotaContainer() {
  const t = useTranslations("dashboard.students.quota");
  const params = useParams();

  // Safe param extraction — no blind cast
  const studentId = typeof params?.id === "string" ? params.id : "";

  // We fetch the student via parentAssociatedStudents using a stored parentId,
  // OR we add a dedicated studentProfile query. For now, the quota form works
  // with the student data passed from the parent profile context.
  // The container uses the studentId from the URL to load just that student's info.
  // A dedicated `studentProfile` query may be needed; use the existing student.ts document.
  const { data, loading, error } = useQuery(parentAssociatedStudentsQueryDocument, {
    variables: { parentId: "" }, // parentId must be passed — see note below
    skip: true, // Skipped: studentId-based fetch needs a dedicated query (see implementation note)
  });

  const [updateQuota, { loading: saving }] = useMutation(updateStudentQuotaMutationDocument, {
    onCompleted: () => {
      // Show success feedback — handle via snackbar in parent or local state
    },
  });

  const handleSave = async (formData: StudentQuotaFormData) => {
    if (!studentId) return;
    await updateQuota({
      variables: {
        studentId,
        newClassesRemaining: formData.classesLeft,
      },
    });
  };

  if (!studentId) {
    return <Typography variant="bodyMd" color="error">{t("errors.invalidId")}</Typography>;
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Typography variant="bodyMd" color="error">{error.message}</Typography>;
  }

  return (
    <RequirePermission permissions={[AppPermission.StudentEditQuota]}>
      <StudentQuotaView
        studentData={null}  // Will be populated once student-scoped query is added
        isLoading={loading}
        isSaving={saving}
        isSaved={false}
        onSave={handleSave}
      />
    </RequirePermission>
  );
}
```

> **Implementation Note for StudentQuotaContainer:** The current `parentAssociatedStudentsQueryDocument` requires a `parentId`, but `StudentQuotaContainer` is navigated to from a student ID in the URL. Two options:
> 1. Add a dedicated `studentById` GraphQL query in Task E (preferred — add `studentById` query to `parent-profile.pothos.ts` or a new `student.pothos.ts`).
> 2. Pass the `parentId` as a query parameter alongside the `studentId`.
> **The plan recommends Option 1**: Add a `studentById` Pothos query gated by `STUDENT_VIEW_ASSOCIATED` that returns a single student's profile. This requires a small amendment to Task E (add `StudentRepository.findById` → `ParentProfileService.getStudentById` → Pothos query → document). Document in the Task E file when implementing.

---

### Step 5: Update `ParentProfileView.tsx` to pass `parentId` to `ParentProfileActions`

Since `ParentProfileActions` now needs `parentId` for the mutation, update `ParentProfileView`:

```typescript
// In ParentProfileView.tsx, update ParentProfileViewProps:
interface ParentProfileViewProps {
  readonly parent: ParentProfileData;
  readonly parentId: string;  // ADD THIS
}

// Pass it down:
<ParentProfileActions parentId={parentId} />
```

---

## Test Execution Requirements

```bash
bun run test:graphql
bun run test:ui:components
bun tsgo
```

---

## Success Criteria / Check Progress Points

- [ ] `ParentProfileContainer` uses `useQuery(parentProfileQueryDocument)` with `RequirePermission`.
- [ ] `ParentProfileContainer` extracts `id` from `useParams()` using type guard — no blind cast.
- [ ] `ParentProfileActions` deactivate button opens MUI `<Dialog>` with confirmation text.
- [ ] `deactivateParent` mutation called on confirm; loading state shown; success navigates back.
- [ ] `ParentBillingContainer` uses `useQuery(parentInvoiceHistoryQueryDocument)` with `RequirePermission`.
- [ ] `StudentQuotaContainer` uses `useMutation(updateStudentQuotaMutationDocument)` with `RequirePermission`.
- [ ] No `mockXxxStore` imports in any production container file.
- [ ] No `useParams() as { id: string }` blind cast remains.
- [ ] `*.stories.tsx` files keep their mock store aliases unchanged.
- [ ] `bun tsgo` passes with 0 errors.

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` passes with 0 TypeScript errors & 0 warnings after each file
- [ ] `bun biome:check` passes with 0 errors & 0 warnings after each file
- [ ] `bun lint` passes with 0 errors & 0 warnings after each file
- [ ] `bun codescene` passes with 0 errors & 0 warnings after each file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` passes with 0 TypeScript errors & 0 warnings
- [ ] `bun biome:check` passes with 0 errors & 0 warnings
- [ ] `bun lint` passes with 0 errors & 0 warnings
- [ ] `bun codescene` passes with 0 errors & 0 warnings
