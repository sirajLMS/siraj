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
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { QuotaKind, QuotaPeriodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useQuotaFormViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaFormViewModel";

interface QuotaFormContainerProps {
  quotaId?: string;
}

export function QuotaFormContainer({ quotaId }: QuotaFormContainerProps) {
  const { t, isEditing, formData, setFormData, handleSubmit, loading } = useQuotaFormViewModel(quotaId);

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
          <Stack spacing={2.5}>
            {!isEditing && (
              <TextField
                fullWidth
                label={t.fields.student}
                value={formData.studentId}
                onChange={e => setFormData({ studentId: e.target.value })}
                placeholder="Student UUID"
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
                  onChange={e => setFormData({ kind: e.target.value as QuotaKind })}
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
                  onChange={e =>
                    setFormData({
                      periodType: (e.target.value as QuotaPeriodType) || null,
                    })
                  }
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
              <Button variant="contained" onClick={handleSubmit} disabled={loading}>
                {isEditing ? t.actions.save : t.actions.create}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
