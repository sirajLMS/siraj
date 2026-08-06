"use client";

import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import {
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import Link from "next/link";
import { QuotaKind, QuotaPeriodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useQuotaFormViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaFormViewModel";

interface QuotaFormContainerProps {
  readonly quotaId?: string;
}

function toQuotaKind(value: unknown): QuotaKind | undefined {
  if (value === QuotaKind.Package || value === QuotaKind.Periodic) return value;
  return undefined;
}

function toQuotaPeriodType(value: unknown): QuotaPeriodType | undefined {
  if (value === QuotaPeriodType.Weekly || value === QuotaPeriodType.Monthly || value === QuotaPeriodType.Custom) {
    return value;
  }
  return undefined;
}

export function QuotaFormContainer({ quotaId }: Readonly<QuotaFormContainerProps>) {
  const {
    t,
    isEditing,
    formData,
    setFormData,
    handleSubmit,
    loading,
    snackbarOpen,
    snackbarMessage,
    handleSnackbarClose,
  } = useQuotaFormViewModel(quotaId);

  return (
    <Stack spacing={3} sx={{ maxWidth: 600, mx: "auto", py: 3 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <Button startIcon={<ArrowBackOutlinedIcon />} component={Link} href="/quotas" color="inherit">
          {t.actions.cancel}
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {isEditing ? t.editQuota : t.newQuota}
        </Typography>
      </Stack>

      <Card variant="outlined">
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              {!isEditing && (
                <TextField
                  fullWidth
                  label={t.fields.student}
                  value={formData.studentId}
                  onChange={e => setFormData({ studentId: e.target.value })}
                  placeholder={t.fields.studentIdPlaceholder}
                />
              )}

              <TextField
                fullWidth
                label={t.fields.name}
                value={formData.name}
                onChange={e => setFormData({ name: e.target.value })}
              />

              {!isEditing && (
                <FormControl fullWidth>
                  <InputLabel>{t.fields.kind}</InputLabel>
                  <Select
                    value={formData.kind}
                    label={t.fields.kind}
                    onChange={(e: SelectChangeEvent) => setFormData({ kind: toQuotaKind(e.target.value) })}
                  >
                    <MenuItem value={QuotaKind.Package}>{t.kinds.PACKAGE}</MenuItem>
                    <MenuItem value={QuotaKind.Periodic}>{t.kinds.PERIODIC}</MenuItem>
                  </Select>
                </FormControl>
              )}

              {!isEditing && (
                <TextField
                  fullWidth
                  type="number"
                  label={t.fields.totalClasses}
                  value={formData.totalClasses}
                  onChange={e => setFormData({ totalClasses: Number(e.target.value) })}
                />
              )}

              <TextField
                fullWidth
                type="date"
                label={t.fields.validUntil}
                value={formData.validUntil ?? ""}
                onChange={e => setFormData({ validUntil: e.target.value || null })}
                slotProps={{ inputLabel: { shrink: true } }}
              />

              {!isEditing && formData.kind === QuotaKind.Periodic && (
                <FormControl fullWidth>
                  <InputLabel>{t.fields.periodType}</InputLabel>
                  <Select
                    value={formData.periodType ?? ""}
                    label={t.fields.periodType}
                    onChange={(e: SelectChangeEvent) => setFormData({ periodType: toQuotaPeriodType(e.target.value) })}
                  >
                    <MenuItem value={QuotaPeriodType.Weekly}>{t.periodTypes.WEEKLY}</MenuItem>
                    <MenuItem value={QuotaPeriodType.Monthly}>{t.periodTypes.MONTHLY}</MenuItem>
                    <MenuItem value={QuotaPeriodType.Custom}>{t.periodTypes.CUSTOM}</MenuItem>
                  </Select>
                </FormControl>
              )}

              <TextField
                fullWidth
                type="number"
                label={t.fields.priority}
                value={formData.priority}
                onChange={e => setFormData({ priority: Number(e.target.value) })}
              />

              <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", pt: 1 }}>
                <Button variant="outlined" component={Link} href="/quotas" color="inherit">
                  {t.actions.cancel}
                </Button>
                <Button type="submit" variant="contained" disabled={loading}>
                  {isEditing ? t.actions.save : t.actions.create}
                </Button>
              </Stack>
            </Stack>
          </form>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Stack>
  );
}
