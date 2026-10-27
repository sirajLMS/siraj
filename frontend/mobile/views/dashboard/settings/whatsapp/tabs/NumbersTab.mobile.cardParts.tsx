"use client";

import { PersonAddAlt1Outlined, VisibilityOffOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box, IconButton, InputAdornment, LinearProgress, Tooltip, Typography } from "@mui/material";
import type { WhatsappAccountRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

/** Visibility toggle adornment for the token field — access-token accounts only. */
export function TokenVisibilityAdornmentMobile({
  isToken,
  show,
  labels,
  onToggle,
}: Readonly<{
  readonly isToken: boolean;
  readonly show: boolean;
  readonly labels: WhatsappLabels;
  readonly onToggle: () => void;
}>) {
  if (!isToken) return undefined;
  return (
    <InputAdornment position="end">
      <IconButton aria-label={show ? labels.hideToken : labels.showToken} onClick={onToggle} edge="end">
        {show ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
      </IconButton>
    </InputAdornment>
  );
}

/** Card affordance opening the recipients manage dialog — test numbers only. */
export function ManageRecipientsMobileAction({
  account,
  label,
  disabled,
  onOpen,
}: Readonly<{
  readonly account: WhatsappAccountRow;
  readonly label: string | undefined;
  readonly disabled: boolean;
  readonly onOpen: (accountId: string) => void;
}>) {
  if (account.isTestNumber !== true || label === undefined || label === "") {
    return null;
  }
  const isDisabled = disabled || !account.id;
  const button = (
    <IconButton
      size="small"
      aria-label={label}
      disabled={isDisabled}
      onClick={() => {
        if (account.id) {
          onOpen(account.id);
        }
      }}
    >
      <PersonAddAlt1Outlined />
    </IconButton>
  );

  return (
    <Tooltip title={label}>
      {isDisabled ? (
        <Box component="span" aria-disabled={true} sx={{ display: "inline-flex" }}>
          {button}
        </Box>
      ) : (
        button
      )}
    </Tooltip>
  );
}

export function SkeletonAccountCard() {
  return (
    <Box sx={{ position: "relative" }}>
      <LinearProgress sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 1 }} />
      <Box
        sx={{
          p: 2,
          borderRadius: 1,
          border: theme => `1px solid ${theme.palette.divider}`,
          opacity: 0.6,
        }}
      >
        <Typography variant="bodyMd" sx={{ mb: 1 }}>
          &nbsp;
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          <Box sx={theme => ({ width: 80, height: 20, bgcolor: theme.palette.action.hover, borderRadius: 1 })} />
          <Box sx={theme => ({ width: 100, height: 20, bgcolor: theme.palette.action.hover, borderRadius: 1 })} />
        </Box>
      </Box>
    </Box>
  );
}
