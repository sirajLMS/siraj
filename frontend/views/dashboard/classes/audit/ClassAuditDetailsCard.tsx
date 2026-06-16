"use client";

import { AccountCircleOutlined, EventNoteOutlined, HistoryOutlined, UpdateOutlined } from "@mui/icons-material";
import { alpha, Box, Chip, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { BaseCard } from "@/frontend/components/ui";
import type { ClassAuditData } from "@/frontend/stores/classAuditStore";

interface ClassAuditDetailsCardProps {
  readonly audit: ClassAuditData;
  readonly labels: {
    readonly courseCode: string;
    readonly teacher: string;
    readonly originalDate: string;
    readonly rescheduledDate: string;
    readonly timeSlot: string;
    readonly venue: string;
    readonly auditTrailTitle: string;
    readonly statusRescheduled: string;
    readonly classDetails: string;
  };
}

interface DetailFieldProps {
  readonly label: string;
  readonly children: ReactNode;
}

function DetailField({ label, children }: DetailFieldProps) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        alignItems: "center",
      }}
    >
      <Typography
        variant="labelMd"
        sx={theme => ({
          textTransform: "uppercase",
          color: theme.palette.onSurfaceVariant,
        })}
      >
        {label} :
      </Typography>
      {children}
    </Box>
  );
}

export function ClassAuditDetailsCard({ audit, labels }: ClassAuditDetailsCardProps) {
  return (
    <BaseCard sx={{ p: 0, overflow: "hidden" }}>
      <ClassAuditHeader auditName={audit.className} statusLabel={labels.statusRescheduled} />

      <ClassAuditFields audit={audit} labels={labels} />

      <ClassAuditTrail audit={audit} labels={labels} />
    </BaseCard>
  );
}

function ClassAuditHeader({ auditName, statusLabel }: Readonly<{ auditName: string; statusLabel: string }>) {
  return (
    <Box
      sx={theme => ({
        px: 3,
        py: 2,
        bgcolor: theme.palette.primary.main,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 1.5,
      })}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <EventNoteOutlined sx={theme => ({ color: theme.palette.onPrimary, fontSize: 28 })} />
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onPrimary })}>
          {auditName}
        </Typography>
      </Box>
      <Chip
        label={statusLabel}
        size="small"
        sx={theme => ({
          bgcolor: theme.palette.background.paper,
          color: theme.palette.primary.main,
          typography: "labelUppercase",
          border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
        })}
      />
    </Box>
  );
}

function ClassAuditFields({ audit, labels }: ClassAuditDetailsCardProps) {
  return (
    <Box
      sx={{
        p: 3,
        display: { xs: "flex", md: "grid" },
        flexDirection: "column",
        gap: 3,
        gridTemplateColumns: { md: "1fr 1fr" },
      }}
    >
      <DetailField label={labels.courseCode}>
        <Typography variant="bodyLg" sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main })}>
          {audit.courseCode}
        </Typography>
      </DetailField>
      <DetailField label={labels.teacher}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AccountCircleOutlined sx={theme => ({ fontSize: 20, color: theme.palette.primary.main })} />
          <Typography variant="bodyLg" sx={theme => ({ color: theme.palette.onSurface })}>
            {audit.teacherName}
          </Typography>
        </Box>
      </DetailField>
      <DetailField label={labels.originalDate}>
        <Typography
          variant="bodyLg"
          sx={theme => ({ color: theme.palette.onSurfaceVariant, textDecoration: "line-through", opacity: 0.6 })}
        >
          {audit.originalDate}
        </Typography>
      </DetailField>
      <DetailField label={labels.rescheduledDate}>
        <Typography variant="bodyLg" sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main })}>
          {audit.rescheduledDate}
        </Typography>
      </DetailField>
      <DetailField label={labels.timeSlot}>
        <Typography variant="bodyLg" sx={theme => ({ color: theme.palette.onSurface })}>
          {audit.timeSlot}
        </Typography>
      </DetailField>
      <DetailField label={labels.venue}>
        <Typography variant="bodyLg" sx={theme => ({ color: theme.palette.onSurface })}>
          {audit.venue}
        </Typography>
      </DetailField>
    </Box>
  );
}

function ClassAuditTrail({ audit, labels }: ClassAuditDetailsCardProps) {
  return (
    <Box
      sx={theme => ({
        px: 3,
        py: 3,
        bgcolor: theme.palette.surfaceContainerLow,
        borderTop: `1px solid ${theme.palette.border.light}`,
      })}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <HistoryOutlined sx={theme => ({ color: theme.palette.primary.main })} />
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
          {labels.auditTrailTitle}
        </Typography>
      </Box>
      <Box
        sx={theme => ({
          bgcolor: theme.palette.background.paper,
          p: 2,
          borderRadius: 2,
          borderLeft: `4px solid ${theme.palette.header}`,
          boxShadow: theme.palette.shadow.card,
        })}
      >
        <Typography
          variant="bodyMd"
          sx={theme => ({ fontStyle: "italic", color: theme.palette.onSurface, lineHeight: 1.6 })}
        >
          &ldquo;{audit.auditRemark}&rdquo;
        </Typography>
        <Box
          sx={theme => ({
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            mt: 1.5,
            color: theme.palette.onSurfaceVariant,
          })}
        >
          <UpdateOutlined sx={{ fontSize: 14 }} />
          <Typography variant="labelMd">{audit.auditLoggedAt}</Typography>
        </Box>
      </Box>
    </Box>
  );
}
