"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import { BaseCard } from "@/frontend/common/components/ui";
import type { SupportContactProps } from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";
import { DesktopUserAvatar } from "@/frontend/desktop/components/ui/avatar/DesktopUserAvatar";
import { DesktopPhoneDisplay } from "@/frontend/desktop/components/ui/display";

/**
 * Desktop variant of the support-contact card.
 *
 * Plan v5: per specs.md §3 N1 + N17 + §6.2, the tier-side
 * `useMutation(logTeacherSupportRequestMutationDocument)` +
 * `useNotifications()` side-effects were lifted into
 * `useFutureScheduleViewModel` (which now exposes `onSupportContact` + the
 * support-contact labels). The tier is purely presentational and consumes
 * the bound callback + labels from props.
 */
export function SupportContactDesktop({
  contact,
  onContactAdmin,
  supportContactLabel,
  contactAdminLabel,
}: Readonly<SupportContactProps>) {
  return (
    <BaseCard
      sx={theme => ({
        p: 3,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.border.main}`,
        boxShadow: theme.palette.shadow.card,
      })}
    >
      <Typography variant="bodyMd" sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main, mb: 2 })}>
        {supportContactLabel}
      </Typography>

      {contact && (
        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems: "center",
          }}
        >
          <DesktopUserAvatar src={contact.avatarUrl} label={contact.name ?? ""} size={40} />
          <Box>
            <Typography variant="bodyMd" sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main })}>
              {contact.name}
            </Typography>
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {contact.role}
            </Typography>
            <DesktopPhoneDisplay
              phone={contact.phone}
              typographyVariant="bodyMd"
              sx={theme => ({ color: theme.palette.onSurfaceVariant })}
            />
          </Box>
        </Stack>
      )}

      <Button
        fullWidth
        variant="outlined"
        onClick={onContactAdmin}
        sx={theme => ({
          mt: 3,
          borderRadius: 2,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.05em",
          color: theme.palette.primary.main,
          borderColor: theme.palette.border.main,
          py: 1,
          "&:hover": {
            backgroundColor: theme.palette.action.hover,
            borderColor: theme.palette.primary.main,
          },
        })}
      >
        {contactAdminLabel}
      </Button>
    </BaseCard>
  );
}
