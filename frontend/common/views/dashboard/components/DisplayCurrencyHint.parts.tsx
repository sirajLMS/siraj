"use client";

import CloseIcon from "@mui/icons-material/CloseOutlined";
import { Alert, Button, IconButton, Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Link } from "@/shared/i18n";

interface HintDismissButtonProps {
  readonly label: string;
  readonly onDismiss: () => void;
}

function HintDismissButton({ label, onDismiss }: Readonly<HintDismissButtonProps>) {
  return (
    <Tooltip title={label}>
      <IconButton
        aria-label={label}
        size="small"
        onClick={onDismiss}
        sx={theme => ({
          ml: theme.direction === "rtl" ? 0 : 0.5,
          mr: theme.direction === "rtl" ? 0.5 : 0,
          "&:focus-visible": {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
        })}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}

interface HintAlertActionProps {
  readonly href: string;
  readonly ctaLabel: string;
  readonly dismissLabel: string;
  readonly onDismiss: () => void;
}

function HintAlertAction({ href, ctaLabel, dismissLabel, onDismiss }: Readonly<HintAlertActionProps>) {
  return (
    <>
      <Link href={href} style={{ textDecoration: "none" }}>
        <Button color="inherit" size="small">
          {ctaLabel}
        </Button>
      </Link>
      <HintDismissButton label={dismissLabel} onDismiss={onDismiss} />
    </>
  );
}

interface ViewerHintLabels {
  readonly title: string;
  readonly body: string;
  readonly cta: string;
  readonly dismiss: string;
}

interface ViewerHintAlertProps {
  readonly variant: "full" | "compact";
  readonly labels: ViewerHintLabels;
  readonly href: string;
  readonly onDismiss: () => void;
}

export function ViewerHintAlert({ variant, labels, href, onDismiss }: Readonly<ViewerHintAlertProps>) {
  const action = (
    <HintAlertAction href={href} ctaLabel={labels.cta} dismissLabel={labels.dismiss} onDismiss={onDismiss} />
  );

  if (variant === "compact") {
    return (
      <Alert severity="info" sx={{ mx: 2, my: 1 }} action={action}>
        <strong>{labels.title}</strong>
      </Alert>
    );
  }

  return (
    <Alert
      severity="info"
      sx={theme => ({
        mb: 2,
        borderRadius: "12px",
        border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
        backgroundColor: alpha(theme.palette.info.main, 0.08),
        "& .MuiAlert-icon": {
          color: theme.palette.info.main,
        },
        "& .MuiAlert-action": {
          alignItems: "center",
        },
      })}
      action={action}
    >
      <strong>{labels.title}</strong>
      <br />
      {labels.body}
    </Alert>
  );
}

interface SubjectHintLabels {
  readonly title: string;
  readonly body: string;
  readonly cta: string;
}

interface SubjectHintAlertProps {
  readonly labels: SubjectHintLabels;
  readonly dismissLabel: string;
  readonly href: string;
  readonly onDismiss: () => void;
}

export function SubjectHintAlert({ labels, dismissLabel, href, onDismiss }: Readonly<SubjectHintAlertProps>) {
  return (
    <Alert
      severity="info"
      sx={{ mb: 2 }}
      action={<HintAlertAction href={href} ctaLabel={labels.cta} dismissLabel={dismissLabel} onDismiss={onDismiss} />}
    >
      <strong>{labels.title}</strong>
      <br />
      {labels.body}
    </Alert>
  );
}
