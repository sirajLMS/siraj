"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import type { SupportContactProps } from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";
import { MobileUserAvatar } from "@/frontend/mobile/components/ui/avatar";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";
import { MobilePhoneDisplay } from "@/frontend/mobile/components/ui/display/phoneDisplay";

/**
 * Mobile variant of the support-contact card.
 *
 * Plan v5: per specs.md §3 N1 + N17 + §6.2, the tier-side
 * `useMutation(logTeacherSupportRequestMutationDocument)` +
 * `useNotifications()` side-effects were lifted into
 * `useFutureScheduleViewModel` (which now exposes `onSupportContact` + the
 * support-contact labels). The tier is purely presentational and consumes
 * the bound callback + labels from props.
 */
export function SupportContactMobile({
  contact,
  onContactAdmin,
  supportContactLabel,
  contactAdminLabel,
}: Readonly<SupportContactProps>) {
  return (
    <MobileBaseCard
      sx={theme => ({
        p: 2,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.border.main}`,
        boxShadow: theme.palette.shadow.card,
      })}
    >
      <Typography variant="labelMd" sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main, mb: 1.5 })}>
        {supportContactLabel}
      </Typography>

      {contact && (
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: "center",
          }}
        >
          <MobileUserAvatar src={contact.avatarUrl} label={contact.name ?? ""} size={36} />
          <Box>
            <Typography variant="bodyMd" sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main })}>
              {contact.name}
            </Typography>
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {contact.role}
            </Typography>
            <MobilePhoneDisplay
              phone={contact.phone}
              typographyVariant="labelMd"
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
          mt: 2,
          borderRadius: 1.5,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.05em",
          color: theme.palette.primary.main,
          borderColor: theme.palette.border.main,
          py: 0.75,
          "&:hover": {
            backgroundColor: theme.palette.action.hover,
            borderColor: theme.palette.primary.main,
          },
        })}
      >
        {contactAdminLabel}
      </Button>
    </MobileBaseCard>
  );
}
