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
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppDataGrid, StatusBadge } from "@/frontend/components/ui";
import { AppPermission, StudentStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  changeStudentStatusMutationDocument,
  reassignStudentTeacherMutationDocument,
} from "@/frontend/graphql/sharedDocuments";
import { useRouter } from "@/shared/i18n/routing";
import type { ParentStudent } from "../types/profile";

interface ParentStudentsDataGridProps {
  readonly rows: readonly ParentStudent[];
  readonly loading?: boolean;
  readonly onRefetch?: () => void;
}

const ALLOWED_TARGET_STATUSES: Record<string, string[]> = {
  [StudentStatus.OnTrial.toLowerCase()]: [StudentStatus.Regular.toLowerCase(), StudentStatus.Deactivated.toLowerCase()],
  [StudentStatus.Regular.toLowerCase()]: [
    StudentStatus.Suspended.toLowerCase(),
    StudentStatus.OnLeave.toLowerCase(),
    StudentStatus.Deactivated.toLowerCase(),
  ],
  [StudentStatus.Suspended.toLowerCase()]: [
    StudentStatus.Regular.toLowerCase(),
    StudentStatus.Deactivated.toLowerCase(),
  ],
  [StudentStatus.OnLeave.toLowerCase()]: [StudentStatus.Regular.toLowerCase(), StudentStatus.Deactivated.toLowerCase()],
  [StudentStatus.Deactivated.toLowerCase()]: [StudentStatus.Regular.toLowerCase()],
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

  const [reassign, { loading, error: mutationError }] = useMutation(reassignStudentTeacherMutationDocument, {
    onCompleted: () => {
      setNewTeacherId("");
      onSuccess();
      onClose();
    },
  });

  const handleConfirm = () => {
    if (!newTeacherId.trim()) return;
    void reassign({
      variables: { studentId, newTeacherId, expectedVersion: null },
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
      <DialogTitle id="reassign-teacher-dialog-title">{t("reassignTeacherTitle")}</DialogTitle>
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
            <MenuItem value="" disabled>
              {t("selectTeacherPlaceholder")}
            </MenuItem>
          </Select>
        </FormControl>
        {mutationError != null && (
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

  const [changeStatus, { loading, error: mutationError }] = useMutation(changeStudentStatusMutationDocument, {
    onCompleted: () => {
      setSelectedStatus("");
      onSuccess();
      onClose();
    },
  });

  const handleConfirm = () => {
    if (!selectedStatus) return;
    void changeStatus({
      variables: { studentId, newStatus: selectedStatus.toUpperCase(), expectedVersion: null },
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
        {mutationError != null && (
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
            startIcon={loading ? <CircularProgress size={16} sx={{ color: "inherit" }} /> : undefined}
          >
            {loading ? t("changingStatus") : t("confirmStatusChange")}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

// ─── Main Grid Component ──────────────────────────────────────────────────────

const ParentStudentsDataGrid: React.FC<ParentStudentsDataGridProps> = ({ rows, loading, onRefetch }) => {
  const t = useTranslations("dashboard.parentProfile.table");
  const tStudents = useTranslations("dashboard.parentProfile.students");
  const theme = useTheme();
  const router = useRouter();
  const notifications = useNotifications();

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
      renderCell: params => <Typography variant="bodyMd">{params.value} Hours</Typography>,
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
      renderCell: params => (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
          <PersonOutlined
            onClick={() => router.push(`/students/${params.row.id}`)}
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
        <RequirePermission
          permissions={[AppPermission.StudentReassignTeacher]}
          fallback={
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
              <SettingsOutlined sx={{ color: theme.palette.action.disabled, fontSize: 20 }} />
            </Box>
          }
        >
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
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
        <RequirePermission
          permissions={[AppPermission.StudentManageStatus]}
          fallback={
            <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
              <StatusBadge category="studentAccount" status={params.row.status} label={params.row.status} />
            </Box>
          }
        >
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
            <StatusBadge category="studentAccount" status={params.row.status} label={params.row.status} />
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
        onClose={() => setReassignDialogState({ open: false, studentId: "", currentTeacherName: "" })}
        onSuccess={() => {
          notifications.show(tStudents("reassignSuccess"), { severity: "success", autoHideDuration: 4000 });
          onRefetch?.();
        }}
      />

      <ChangeStatusDialog
        open={statusDialogState.open}
        studentId={statusDialogState.studentId}
        currentStatus={statusDialogState.currentStatus}
        onClose={() => setStatusDialogState({ open: false, studentId: "", currentStatus: "" })}
        onSuccess={() => {
          notifications.show(tStudents("statusChangeSuccess"), { severity: "success", autoHideDuration: 4000 });
          onRefetch?.();
        }}
      />
    </>
  );
};

export default ParentStudentsDataGrid;
