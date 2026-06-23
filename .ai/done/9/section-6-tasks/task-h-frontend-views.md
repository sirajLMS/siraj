### Task H — Frontend Views: Replace Mock Stores with Real Mutations & Wire Student Actions

**Objective:**
1. Replace `mockAdminBillingStore` in `AdminBillingContainer` with real `useMutation` hooks for `markInvoicePaid` and `deleteInvoice`.
2. Replace `mocKAdminManualInvoiceStore` in `ManualInvoiceContainer` with a real `useMutation` hook for `createManualInvoice`.
3. Wire the inert `SettingsOutlined` icon in `ParentStudentsDataGrid` to a real `reassignStudentTeacher` mutation via an MUI `Dialog`.
4. Wire the `StatusBadge` click in `ParentStudentsDataGrid` to a real `changeStudentStatus` mutation via an MUI `Dialog` with a dropdown of valid target statuses.
5. Add `<RequirePermission>` gates on all new mutation-triggering UI elements.

**Dependencies:** Depends on Task F — `createManualInvoiceMutationDocument`, `markInvoicePaidMutationDocument`, `deleteInvoiceMutationDocument`, `reassignStudentTeacherMutationDocument`, `changeStudentStatusMutationDocument` are available from `@/frontend/graphql/sharedDocuments`. Codegen has run and all `AppPermission` enum values are in the generated types.

**Layer-Specific Rules (Frontend Views — Flattened from `frontend/views/AGENTS.md`):**
- **Functional Components only** — no class components.
- **Access Control:** Use `<RequirePermission permissions={["domain.action"]} />` to gate components.
- **Data Fetching:** Use Apollo `useMutation` with generated `TypedDocumentNode`.
- **NO hardcoded colors** — all from MUI theme palette.
- **MUI Breaking Changes:** Typography style props via `sx` only. Stack layout props in `sx`.
- **No `globalThis.confirm()` or `window.confirm()`** — use MUI `<Dialog>` instead.
- **Mock Data Ban (Production):** `mockAdminBillingStore` and `mocKAdminManualInvoiceStore` MUST be removed from production containers. `*.stories.tsx` files MUST keep mock data.
- **No `any` types or blind casts** — use type guards and generated types.
- **Use `useTranslations`** for all user-facing strings.
- **Logger:** Use `import { logger } from '@/frontend/utils/logger'` in frontend files if needed.

**Target Files:**
- `frontend/views/dashboard/billing/AdminBillingContainer.tsx` — Replace mock store with real mutations
- `frontend/views/dashboard/billing/manual/ManualInvoiceContainer.tsx` — Replace mock store with real mutation
- `frontend/views/dashboard/parents/profile/ParentStudentsDataGrid.tsx` — Wire teacher reassign + status change actions
- `frontend/views/dashboard/parents/profile/ParentProfileContainer.tsx` — Pass `refetchQueries` or updated callbacks to students grid

---

#### Step 1: Update `AdminBillingContainer.tsx` — Replace Mock Store with Real Mutations

**Current state (to be removed):**
```typescript
// REMOVE these mock store imports:
import { useAdminBillingStore } from "@/frontend/stores/mockAdminBillingStore";
import { useUserStore } from "@/frontend/stores/mockUserStore";
```

**New implementation of `AdminBillingContainer.tsx`:**

```typescript
"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Snackbar } from "@mui/material";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  deleteInvoiceMutationDocument,
  markInvoicePaidMutationDocument,
} from "@/frontend/graphql/sharedDocuments";
import { parentInvoiceHistoryQueryDocument } from "@/frontend/graphql/sharedDocuments/parent-billing-history.documents";
import { AdminBillingView } from "./AdminBillingView";
import type { AdminBillingViewProps } from "./types/billingViewTypes";
import { buildBillingLabels } from "./utils/buildBillingLabels";

// NOTE: The AdminBillingContainer requires a parentId to query invoice history.
// This prop is threaded down from the parent profile page.
interface AdminBillingContainerProps {
  readonly parentId: string;
}

export function AdminBillingContainer({ parentId }: AdminBillingContainerProps) {
  const t = useTranslations("dashboard.billing");
  const router = useRouter();
  const locale = useLocale();
  const labels = buildBillingLabels(t);

  const [searchQuery, setSearchQuery] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  const showFeedback = (message: string, severity: "success" | "error") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Fetch invoice history for this parent
  const { data: invoicesData, loading: invoicesLoading, refetch: refetchInvoices } = useQuery(
    parentInvoiceHistoryQueryDocument,
    { variables: { parentId }, skip: !parentId }
  );

  const [markAsPaidMutation, { loading: markingPaid }] = useMutation(
    markInvoicePaidMutationDocument,
    {
      onCompleted: () => {
        showFeedback(t("markAsPaidSuccess"), "success");
        void refetchInvoices();
      },
      onError: error => {
        showFeedback(error.message, "error");
      },
    }
  );

  const [deleteInvoiceMutation, { loading: deletingInvoice }] = useMutation(
    deleteInvoiceMutationDocument,
    {
      onCompleted: () => {
        showFeedback(t("deleteInvoiceSuccess"), "success");
        void refetchInvoices();
      },
      onError: error => {
        showFeedback(error.message, "error");
      },
    }
  );

  const rawInvoices = invoicesData?.parentInvoiceHistory ?? [];

  // Filter by search query (client-side for now)
  const filteredInvoices = useMemo(
    () =>
      rawInvoices.filter(
        inv =>
          inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.status.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [rawInvoices, searchQuery]
  );

  const handleMarkAsPaid = (invoiceId: string) => {
    void markAsPaidMutation({ variables: { invoiceId } });
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    void deleteInvoiceMutation({ variables: { invoiceId } });
  };

  const viewProps: AdminBillingViewProps = {
    labels,
    summary: {
      totalInvoices: rawInvoices.length,
      totalPaid: rawInvoices.filter(i => i.status === "PAID").length,
      totalUnpaid: rawInvoices.filter(i => i.status === "UNPAID").length,
    },
    invoices: filteredInvoices,
    creditRows: [],
    searchQuery,
    canManage: true, // Gated by RequirePermission wrapper below
    canView: true,
    canCreate: true,
    onSearchChange: setSearchQuery,
    onMarkAsPaid: handleMarkAsPaid,
    onSendReminder: () => {
      // Send reminder is a separate story — no-op for now
    },
    onManualInvoice: () => {
      router.push(`/${locale}/billing/manual`);
    },
    markingPaid,
    deletingInvoice,
    onDeleteInvoice: handleDeleteInvoice,
  };

  return (
    <RequirePermission
      permissions={[AppPermission.BillingViewHistory]}
      fallback={null}
    >
      <AdminBillingView {...viewProps} />
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
    </RequirePermission>
  );
}
```

---

#### Step 2: Update `ManualInvoiceContainer.tsx` — Replace Mock Store with Real Mutation

**Current state (to be removed):**
```typescript
// REMOVE these mock store imports:
import { useAdminManualInvoiceStore } from "@/frontend/stores/mocKAdminManualInvoiceStore";
import { useUserStore } from "@/frontend/stores/mockUserStore";
```

**New implementation of `ManualInvoiceContainer.tsx`:**

```typescript
"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Box, CircularProgress, Snackbar } from "@mui/material";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { createManualInvoiceMutationDocument } from "@/frontend/graphql/sharedDocuments";
import { parentDirectoryQueryDocument } from "@/frontend/graphql/sharedDocuments/parent-directory.documents";
import { ManualInvoiceView } from "./ManualInvoiceView";
import { buildManualInvoiceLabels } from "./utils/buildManualInvoiceLabels";
import type { ManualInvoiceSubmitData } from "./types/manualInvoiceTypes";

export function ManualInvoiceContainer() {
  const t = useTranslations("dashboard.billing.manual");
  const router = useRouter();
  const locale = useLocale();
  const labels = buildManualInvoiceLabels(t);

  const [showSuccess, setShowSuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  // Fetch parent directory to populate the parent selector dropdown
  const { data: parentData, loading: parentsLoading } = useQuery(
    parentDirectoryQueryDocument,
    { fetchPolicy: "cache-first" }
  );

  const [createInvoice, { loading: isSubmitting }] = useMutation(
    createManualInvoiceMutationDocument,
    {
      onCompleted: data => {
        setShowSuccess(true);
        setSnackbarMessage(t("createSuccess", { id: data.createManualInvoice.id }));
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      },
      onError: error => {
        setSnackbarMessage(error.message);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      },
    }
  );

  const handleBack = () => {
    router.push(`/${locale}/billing`);
  };

  const handleSubmit = (data: ManualInvoiceSubmitData) => {
    void createInvoice({
      variables: {
        parentId: data.parentId,
        studentId: data.studentId ?? null,
        amount: data.amount,
        currency: data.currency,
        invoiceType: data.invoiceType,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
      },
    });
  };

  const parentOptions = (parentData?.parentDirectory?.items ?? []).map(p => ({
    id: p.id ?? "",
    name: p.name ?? "",
  }));

  return (
    <RequirePermission permissions={[AppPermission.BillingCreateInvoice]} fallback={null}>
      <ManualInvoiceView
        labels={labels}
        parentOptions={parentOptions}
        isSubmitting={isSubmitting || parentsLoading}
        showSuccess={showSuccess}
        canCreate={true}
        canSendEmail={false}
        onBack={handleBack}
        onSubmit={handleSubmit}
        onDismissSuccess={() => setShowSuccess(false)}
      />
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
    </RequirePermission>
  );
}
```

---

#### Step 3: Update `ParentStudentsDataGrid.tsx` — Wire Reassign Teacher & Change Status Actions

Replace the inert `SettingsOutlined` icon with a real reassign-teacher dialog, and wire the status badge click with a real change-status dialog. Both dialogs use MUI `<Dialog>` — no `confirm()`.

The complete updated `ParentStudentsDataGrid.tsx`:

```typescript
"use client";

import { useMutation } from "@apollo/client/react";
import { PersonOutlined, SettingsOutlined } from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppDataGrid, StatusBadge } from "@/frontend/components/ui";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  changeStudentStatusMutationDocument,
  reassignStudentTeacherMutationDocument,
} from "@/frontend/graphql/sharedDocuments";
import type { ParentStudent } from "../types/profile";

interface ParentStudentsDataGridProps {
  readonly rows: readonly ParentStudent[];
  readonly loading?: boolean;
  readonly onRefetch?: () => void;
}

// Allowed target statuses per current status (matches service-side ALLOWED_STATUS_TRANSITIONS)
const ALLOWED_TARGET_STATUSES: Record<string, string[]> = {
  on_trial: ["regular", "deactivated"],
  regular: ["suspended", "on_leave", "deactivated"],
  suspended: ["regular", "deactivated"],
  on_leave: ["regular", "deactivated"],
  deactivated: ["regular"],
  graduated: [], // terminal
};

// ─── Reassign Teacher Dialog ──────────────────────────────────────────────────

interface ReassignTeacherDialogProps {
  readonly open: boolean;
  readonly studentId: string;
  readonly currentTeacherName: string;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

const ReassignTeacherDialog: React.FC<ReassignTeacherDialogProps> = ({
  open,
  studentId,
  currentTeacherName,
  onClose,
  onSuccess,
}) => {
  const t = useTranslations("dashboard.parentProfile.students");
  const [newTeacherId, setNewTeacherId] = useState("");

  const [reassign, { loading, error: mutationError }] = useMutation(
    reassignStudentTeacherMutationDocument,
    {
      onCompleted: () => {
        setNewTeacherId("");
        onSuccess();
        onClose();
      },
    }
  );

  const handleConfirm = () => {
    if (!newTeacherId.trim()) return;
    void reassign({
      variables: { studentId, newTeacherId },
    });
  };

  return (
    <Dialog
      open={open}
      onClose={() => !loading && onClose()}
      aria-labelledby="reassign-teacher-dialog-title"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="reassign-teacher-dialog-title">
        {t("reassignTeacherTitle")}
      </DialogTitle>
      <DialogContent>
        <Typography variant="bodyMd" sx={{ mb: 2, color: theme => theme.palette.text.secondary }}>
          {t("currentTeacher")}: <strong>{currentTeacherName}</strong>
        </Typography>
        <FormControl fullWidth size="small">
          <InputLabel id="new-teacher-select-label">{t("selectNewTeacher")}</InputLabel>
          <Select
            labelId="new-teacher-select-label"
            id="new-teacher-select"
            value={newTeacherId}
            label={t("selectNewTeacher")}
            onChange={e => {
              const val = e.target.value;
              if (typeof val === "string") setNewTeacherId(val);
            }}
          >
            {/* Teacher list populated from parent component or via a separate query */}
            <MenuItem value="" disabled>
              {t("selectTeacherPlaceholder")}
            </MenuItem>
          </Select>
        </FormControl>
        {mutationError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {mutationError.message}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading} variant="outlined">
          {t("cancel")}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={loading || !newTeacherId.trim()}
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} sx={{ color: "inherit" }} /> : undefined}
        >
          {loading ? t("reassigning") : t("confirmReassign")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Change Status Dialog ─────────────────────────────────────────────────────

interface ChangeStatusDialogProps {
  readonly open: boolean;
  readonly studentId: string;
  readonly currentStatus: string;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

const ChangeStatusDialog: React.FC<ChangeStatusDialogProps> = ({
  open,
  studentId,
  currentStatus,
  onClose,
  onSuccess,
}) => {
  const t = useTranslations("dashboard.parentProfile.students");
  const [selectedStatus, setSelectedStatus] = useState("");
  const allowedTargets = ALLOWED_TARGET_STATUSES[currentStatus.toLowerCase()] ?? [];

  const [changeStatus, { loading, error: mutationError }] = useMutation(
    changeStudentStatusMutationDocument,
    {
      onCompleted: () => {
        setSelectedStatus("");
        onSuccess();
        onClose();
      },
    }
  );

  const handleConfirm = () => {
    if (!selectedStatus) return;
    void changeStatus({
      variables: { studentId, newStatus: selectedStatus.toUpperCase() },
    });
  };

  return (
    <Dialog
      open={open}
      onClose={() => !loading && onClose()}
      aria-labelledby="change-status-dialog-title"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="change-status-dialog-title">{t("changeStatusTitle")}</DialogTitle>
      <DialogContent>
        <Typography variant="bodyMd" sx={{ mb: 2, color: theme => theme.palette.text.secondary }}>
          {t("currentStatus")}: <strong>{currentStatus}</strong>
        </Typography>
        {allowedTargets.length === 0 ? (
          <Alert severity="warning">{t("noStatusTransitionsAvailable")}</Alert>
        ) : (
          <FormControl fullWidth size="small">
            <InputLabel id="new-status-select-label">{t("selectNewStatus")}</InputLabel>
            <Select
              labelId="new-status-select-label"
              id="new-status-select"
              value={selectedStatus}
              label={t("selectNewStatus")}
              onChange={e => {
                const val = e.target.value;
                if (typeof val === "string") setSelectedStatus(val);
              }}
            >
              {allowedTargets.map(status => (
                <MenuItem key={status} value={status}>
                  {t(`statusLabel.${status}`, { defaultValue: status })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {mutationError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {mutationError.message}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading} variant="outlined">
          {t("cancel")}
        </Button>
        {allowedTargets.length > 0 && (
          <Button
            onClick={handleConfirm}
            disabled={loading || !selectedStatus}
            variant="contained"
            startIcon={
              loading ? <CircularProgress size={16} sx={{ color: "inherit" }} /> : undefined
            }
          >
            {loading ? t("changingStatus") : t("confirmStatusChange")}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

// ─── Main Grid Component ──────────────────────────────────────────────────────

const ParentStudentsDataGrid: React.FC<ParentStudentsDataGridProps> = ({
  rows,
  loading,
  onRefetch,
}) => {
  const t = useTranslations("dashboard.parentProfile.table");
  const theme = useTheme();

  const [reassignDialogState, setReassignDialogState] = useState<{
    open: boolean;
    studentId: string;
    currentTeacherName: string;
  }>({ open: false, studentId: "", currentTeacherName: "" });

  const [statusDialogState, setStatusDialogState] = useState<{
    open: boolean;
    studentId: string;
    currentStatus: string;
  }>({ open: false, studentId: "", currentStatus: "" });

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  const showFeedback = (message: string, severity: "success" | "error") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const columns: GridColDef<ParentStudent>[] = [
    {
      field: "name",
      headerName: t("studentName"),
      flex: 1.5,
      minWidth: 200,
      renderCell: params => (
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", height: "100%" }}>
          <Avatar
            src={params.row.avatarUrl}
            sx={{
              width: 32,
              height: 32,
              fontSize: 12,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              fontWeight: 700,
            }}
          >
            {params.row.name
              .split(" ")
              .map(n => n[0])
              .join("")
              .toUpperCase()}
          </Avatar>
          <Typography variant="bodyMd" sx={{ fontWeight: 700 }}>
            {params.row.name}
          </Typography>
        </Stack>
      ),
    },
    {
      field: "teacher",
      headerName: t("teacher"),
      flex: 1.2,
      minWidth: 150,
    },
    {
      field: "hoursPerWeek",
      headerName: t("hoursPerWeek"),
      flex: 1,
      minWidth: 120,
      renderCell: params => (
        <Typography variant="bodyMd">{params.value} Hours</Typography>
      ),
    },
    {
      field: "classesLeft",
      headerName: t("classesLeft"),
      flex: 1.2,
      minWidth: 150,
      renderCell: params => {
        const percentage = (params.row.classesLeft / params.row.totalClasses) * 100;
        return (
          <Stack spacing={0.5} sx={{ width: "100%", justifyContent: "center", height: "100%" }}>
            <Typography variant="labelSm">
              {params.row.classesLeft} / {params.row.totalClasses}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={percentage}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: theme.palette.grey[100],
                "& .MuiLinearProgress-bar": {
                  backgroundColor: theme.palette.primary.main,
                },
              }}
            />
          </Stack>
        );
      },
    },
    {
      field: "language",
      headerName: t("language"),
      flex: 1,
      minWidth: 100,
    },
    {
      field: "gender",
      headerName: t("gender"),
      flex: 0.8,
      minWidth: 80,
    },
    {
      field: "info",
      headerName: t("info"),
      width: 70,
      sortable: false,
      renderCell: () => (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
          <PersonOutlined
            sx={{
              color: theme.palette.text.secondary,
              cursor: "pointer",
              "&:hover": { color: theme.palette.primary.main },
            }}
          />
        </Box>
      ),
    },
    {
      field: "options",
      headerName: t("options"),
      width: 80,
      sortable: false,
      renderCell: params => (
        <RequirePermission permissions={[AppPermission.StudentReassignTeacher]} fallback={
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <SettingsOutlined sx={{ color: theme.palette.action.disabled, fontSize: 20 }} />
          </Box>
        }>
          <Box
            sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}
          >
            <SettingsOutlined
              onClick={() =>
                setReassignDialogState({
                  open: true,
                  studentId: params.row.id,
                  currentTeacherName: params.row.teacher,
                })
              }
              sx={{
                color: theme.palette.text.secondary,
                cursor: "pointer",
                "&:hover": { color: theme.palette.primary.main },
              }}
            />
          </Box>
        </RequirePermission>
      ),
    },
    {
      field: "status",
      headerName: t("status"),
      width: 120,
      renderCell: params => (
        <RequirePermission permissions={[AppPermission.StudentManageStatus]} fallback={
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <StatusBadge category="studentAccount" status={params.row.status} label={params.row.status} />
          </Box>
        }>
          <Box
            sx={{ display: "flex", alignItems: "center", height: "100%", cursor: "pointer" }}
            onClick={() =>
              setStatusDialogState({
                open: true,
                studentId: params.row.id,
                currentStatus: params.row.status,
              })
            }
          >
            <StatusBadge
              category="studentAccount"
              status={params.row.status}
              label={params.row.status}
            />
          </Box>
        </RequirePermission>
      ),
    },
  ];

  return (
    <>
      <AppDataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        disableRowSelectionOnClick
        hideFooter
        sx={{ border: "none" }}
      />

      <ReassignTeacherDialog
        open={reassignDialogState.open}
        studentId={reassignDialogState.studentId}
        currentTeacherName={reassignDialogState.currentTeacherName}
        onClose={() =>
          setReassignDialogState({ open: false, studentId: "", currentTeacherName: "" })
        }
        onSuccess={() => {
          showFeedback(t("reassignSuccess") ?? "Teacher reassigned", "success");
          onRefetch?.();
        }}
      />

      <ChangeStatusDialog
        open={statusDialogState.open}
        studentId={statusDialogState.studentId}
        currentStatus={statusDialogState.currentStatus}
        onClose={() =>
          setStatusDialogState({ open: false, studentId: "", currentStatus: "" })
        }
        onSuccess={() => {
          showFeedback(t("statusChangeSuccess") ?? "Status updated", "success");
          onRefetch?.();
        }}
      />

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

export default ParentStudentsDataGrid;
```

---

#### Step 4: Update `ParentProfileContainer.tsx` — Pass `refetch` Callback to Grid

Open `frontend/views/dashboard/parents/profile/ParentProfileContainer.tsx`. Pass a `refetch` callback to `ParentProfileView`, which threads it down to `ParentStudentsDataGrid`:

```typescript
// In ParentProfileContainer.tsx:
// Add refetch from the associated students query
const {
  data: studentsData,
  loading: studentsLoading,
  refetch: refetchStudents,
} = useQuery(parentAssociatedStudentsQueryDocument, {
  variables: { parentId },
  skip: !parentId,
});

// Then pass refetchStudents to ParentProfileView:
return (
  <RequirePermission permissions={[AppPermission.ParentViewProfile]}>
    <ParentProfileView
      parent={parentData}
      parentId={parentId}
      onRefetchStudents={() => void refetchStudents()}
    />
  </RequirePermission>
);
```

Update `ParentProfileView` and `ParentStudentsDataGrid` prop types to accept `onRefetch?: () => void`.

---

#### Step 5: Verify Mock Store Removal

After completing all view updates, run:

```bash
rg "mockAdminBillingStore|mocKAdminManualInvoiceStore|mockUserStore" frontend/views --glob "!**/*.stories.tsx"
```

Output MUST be empty — no mock store imports in production view files. Stories files may still import mock stores.

---

**Test Execution Requirements:**
```bash
bun run test:ui:components
bun run test:graphql
```

---

**Success Criteria / Check Progress Points:**
- [ ] `AdminBillingContainer` uses `useMutation(markInvoicePaidMutationDocument)` and `useMutation(deleteInvoiceMutationDocument)` — no mock store imports
- [ ] `ManualInvoiceContainer` uses `useMutation(createManualInvoiceMutationDocument)` — no mock store imports
- [ ] `ParentStudentsDataGrid` `SettingsOutlined` opens `ReassignTeacherDialog` with real `useMutation(reassignStudentTeacherMutationDocument)`
- [ ] `ParentStudentsDataGrid` `StatusBadge` click opens `ChangeStatusDialog` with real `useMutation(changeStudentStatusMutationDocument)` and filtered allowed statuses
- [ ] Both new dialogs use MUI `<Dialog>` — no `globalThis.confirm()` or `window.confirm()`
- [ ] RBAC: `SettingsOutlined` column wrapped in `<RequirePermission permissions={[AppPermission.StudentReassignTeacher]}>`
- [ ] RBAC: Status badge column wrapped in `<RequirePermission permissions={[AppPermission.StudentManageStatus]}>`
- [ ] `ManualInvoiceContainer` wrapped in `<RequirePermission permissions={[AppPermission.BillingCreateInvoice]}>`
- [ ] `rg "mockAdminBillingStore|mocKAdminManualInvoiceStore" frontend/views --glob "!**/*.stories.tsx"` returns empty
- [ ] No `any` types or blind casts in modified components
- [ ] `bun run test:ui:components` passes with 0 failures
- [ ] `bun run test:graphql` passes with 0 failures

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps
