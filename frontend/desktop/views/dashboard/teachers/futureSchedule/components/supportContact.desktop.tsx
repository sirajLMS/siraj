"use client";

import { useMutation } from "@apollo/client/react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { logTeacherSupportRequestMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import type { SupportContactProps } from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";
import { DesktopUserAvatar } from "@/frontend/desktop/components/ui/avatar";
import { DesktopBaseCard } from "@/frontend/desktop/components/ui/card";
import { DesktopPhoneDisplay } from "@/frontend/desktop/components/ui/display";
import { useAppTranslation } from "@/shared/locale";

export function SupportContactDesktop({ contact }: Readonly<SupportContactProps>) {
  const t = useAppTranslation().dashboardTranslations.teacherFutureSchedule;
  const notifications = useNotifications();
  const [logSupportRequest] = useMutation(logTeacherSupportRequestMutationDocument);

  const handleContactAdmin = async () => {
    try {
      await logSupportRequest({
        variables: {
          input: { reason: t.supportRequestReason },
        },
      });
      notifications.show(t.notifications.supportRequestSent, { severity: "success" });
    } catch {
      notifications.show(t.errors.supportRequestFailed, { severity: "error" });
    }
  };

  return (
    <DesktopBaseCard
      sx={theme => ({
        p: 3,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.border.main}`,
        boxShadow: theme.palette.shadow.card,
      })}
    >
      <Typography variant="bodyMd" sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main, mb: 2 })}>
        {t.supportContact}
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
        onClick={handleContactAdmin}
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
        {t.contactAdmin}
      </Button>
    </DesktopBaseCard>
  );
}
