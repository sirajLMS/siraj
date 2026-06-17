"use client";

import { CheckCircleOutlined, InfoOutlined } from "@mui/icons-material";
import { Box, Button, CircularProgress, FormControl, MenuItem, Select, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { BaseCard, StatusBadge } from "@/frontend/components/ui";
import { labelSx, outlinedInputSx } from "@/frontend/components/ui/form";
import type { TeacherDirectoryRow } from "@/frontend/stores/mockTeachersStore";

interface ManagementControlsCardProps {
  readonly teachers: readonly TeacherDirectoryRow[];
  readonly currentStatus: string;
}

function TeacherSelection({ teachers }: Readonly<{ teachers: readonly TeacherDirectoryRow[] }>) {
  const t = useTranslations("dashboard.teacherReassignment.controls");
  return (
    <Box>
      <Typography component="label" sx={labelSx}>
        {t("assignTeacher")}
      </Typography>
      <FormControl fullWidth sx={{ mt: 1.5 }}>
        <Select displayEmpty defaultValue="" inputProps={{ "aria-label": "Without label" }} sx={outlinedInputSx}>
          <MenuItem value="" disabled>
            {t("assignTeacherPlaceholder")}
          </MenuItem>
          {teachers.map(teacher => (
            <MenuItem key={teacher.id} value={teacher.id}>
              {teacher.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Typography
        variant="labelSm"
        sx={theme => ({ mt: 1, color: theme.palette.onSurfaceVariant, fontStyle: "italic", display: "block" })}
      >
        {t("teacherAvailabilityNotice")}
      </Typography>
    </Box>
  );
}

function StatusUpdate({ currentStatus }: Readonly<{ currentStatus: string }>) {
  const t = useTranslations("dashboard.teacherReassignment.controls");

  const statusMap: Record<string, string> = {
    Regular: "regular",
    "On Leave": "on_leave",
    Suspended: "suspended",
  };

  const statusKey = statusMap[currentStatus] || currentStatus.toLowerCase().replace(/\s+/g, "_");

  return (
    <Box>
      <Typography component="label" sx={labelSx}>
        {t("statusUpdate")}
      </Typography>
      <FormControl fullWidth sx={{ mt: 1.5 }}>
        <Select defaultValue="regular" sx={outlinedInputSx}>
          <MenuItem value="regular">Regular</MenuItem>
          <MenuItem value="leave">On Leave</MenuItem>
          <MenuItem value="suspended">Suspended</MenuItem>
        </Select>
      </FormControl>
      <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {t("currentStatus", { status: "" }).replace(":", "").trim()}:
        </Typography>
        <StatusBadge category="studentAccount" status={statusKey} label={currentStatus} />
      </Box>
    </Box>
  );
}

interface ActionButtonsProps {
  readonly loading: boolean;
  readonly saved: boolean;
  readonly onCancel: () => void;
}

function ActionButtons({ loading, saved, onCancel }: Readonly<ActionButtonsProps>) {
  const t = useTranslations("dashboard.teacherReassignment");

  const getButtonContent = (): React.ReactNode => {
    if (loading) return <CircularProgress size={20} color="inherit" />;
    if (saved) {
      return (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "center" }}>
          <CheckCircleOutlined sx={{ fontSize: 18 }} />
          <Typography variant="buttonText">{t("actions.saved")}</Typography>
        </Stack>
      );
    }
    return <Typography variant="buttonText">{t("actions.submit")}</Typography>;
  };

  return (
    <Box
      sx={theme => ({
        pt: 4,
        borderTop: `1px solid ${theme.palette.border.main}`,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
      })}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={theme => ({ alignItems: "center", color: theme.palette.onSurfaceVariant })}
      >
        <InfoOutlined fontSize="small" sx={theme => ({ color: theme.palette.primary.main })} />
        <Typography variant="labelSm">{t("actions.info")}</Typography>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ width: { xs: "100%", md: "auto" } }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          sx={theme => ({
            flex: 1,
            minWidth: 120,
            py: 1.5,
            fontWeight: 700,
            color: theme.palette.onSurfaceVariant,
            borderColor: theme.palette.border.main,
            "&:hover": {
              borderColor: theme.palette.border.main,
              bgcolor: theme.palette.surfaceContainerLow,
            },
          })}
        >
          {t("actions.cancel")}
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading || saved}
          sx={theme => ({
            flex: 1,
            minWidth: 160,
            py: 1.5,
            fontWeight: 700,
            bgcolor: saved ? theme.palette.success.main : theme.palette.primary.main,
            color: saved ? theme.palette.onSuccess : theme.palette.onPrimary,
            "&:hover": {
              bgcolor: saved ? theme.palette.success.dark : theme.palette.primary.dark,
            },
            "&.Mui-disabled": {
              bgcolor: theme.palette.surfaceContainerHighest,
              color: theme.palette.onSurfaceVariant,
            },
          })}
        >
          {getButtonContent()}
        </Button>
      </Stack>
    </Box>
  );
}

export function ManagementControlsCard({ teachers, currentStatus }: Readonly<ManagementControlsCardProps>) {
  const t = useTranslations("dashboard.teacherReassignment");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.SyntheticEvent): void => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
      }, 2000);
    }, 1500);
  };

  return (
    <BaseCard sx={{ p: 4, boxShadow: theme => theme.palette.shadow.card }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700, mb: 1 })}>
          {t("controls.title")}
        </Typography>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {t("controls.subtitle")}
        </Typography>
      </Box>

      <Stack component="form" spacing={4} onSubmit={handleSubmit}>
        <TeacherSelection teachers={teachers} />
        <StatusUpdate currentStatus={currentStatus} />
        <ActionButtons loading={loading} saved={saved} onCancel={() => { }} />
      </Stack>
    </BaseCard>
  );
}
