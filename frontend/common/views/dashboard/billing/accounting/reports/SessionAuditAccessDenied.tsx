"use client";

import { PrivacyTipOutlined } from "@mui/icons-material";
import { Box, Button, Chip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import Link from "next/link";
import { PrimaryPageAction } from "@/frontend/common/components/ui/button/ActionButtons";
import type { SessionAuditLabels } from "@/shared/locale/types/dashboard/reports";

const SUPPORT_MAILTO = "mailto:[EMAIL_REDACTED]";

export interface SessionAuditAccessDeniedProps {
  readonly labels: SessionAuditLabels["accessDenied"];
  /** Permission identifier rendered inline so operators know exactly what to request. */
  readonly permissionName: string;
}

/**
 * In-page 403 state for the session audit report: renders the denial card in
 * place of the report without firing any report query, and offers a path back
 * to the dashboard or to support.
 */
export function SessionAuditAccessDenied({ labels, permissionName }: Readonly<SessionAuditAccessDeniedProps>) {
  return (
    <Box
      role="alert"
      sx={theme => ({
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        flexGrow: 1,
        px: 2,
        py: 4,
        minHeight: {
          xs: `calc(100dvh - ${theme.layout.navbarHeight} - ${theme.layout.bottomNavHeight} - ${theme.spacing(4)})`,
          md: `calc(100dvh - ${theme.layout.navbarHeight} - ${theme.layout.pageMargin} * 2)`,
        },
      })}
    >
      <Box
        sx={theme => ({
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          width: "100%",
          maxWidth: 560,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.outlineVariant}`,
          borderRadius: 3,
          boxShadow: theme.palette.shadow.card,
          px: { xs: 3, sm: 6 },
          py: { xs: 5, sm: 6 },
          gap: 2,
        })}
      >
        <Box
          sx={theme => ({
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: 4,
            backgroundColor: theme.palette.errorContainer,
            color: theme.palette.onErrorContainer,
          })}
        >
          <PrivacyTipOutlined sx={{ fontSize: 44 }} />
        </Box>
        <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.text.primary, textWrap: "balance" })}>
          {labels.title}
        </Typography>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, maxWidth: 420 })}>
          {labels.descriptionPrefix}{" "}
          <Box
            component="span"
            dir="ltr"
            sx={theme => ({
              display: "inline-flex",
              verticalAlign: "middle",
              backgroundColor: theme.palette.surfaceContainerHighest,
              color: theme.palette.onSurface,
              borderRadius: 1,
              px: 0.75,
              fontWeight: 600,
            })}
          >
            {permissionName}
          </Box>{" "}
          {labels.descriptionSuffix}
        </Typography>
        <Chip
          variant="outlined"
          size="small"
          label={labels.statusChip}
          sx={theme => ({
            mt: 1,
            color: theme.palette.text.secondary,
            borderColor: alpha(theme.palette.error.main, 0.4),
            fontWeight: 600,
            letterSpacing: "0.05em",
          })}
        />
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 3, mt: 3 }}>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <PrimaryPageAction>{labels.backToDashboard}</PrimaryPageAction>
          </Link>
          <Button
            variant="text"
            href={SUPPORT_MAILTO}
            sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}
          >
            {labels.contactSupport}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
