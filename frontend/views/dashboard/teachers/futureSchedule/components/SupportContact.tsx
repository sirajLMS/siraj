"use client";

import { Avatar, Box, Button, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { BaseCard } from "@/frontend/components/ui/BaseCard";

export function SupportContact() {
  const t = useTranslations("dashboard.teacherFutureSchedule");

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
        {t("supportContact")}
      </Typography>

      <Stack
        direction="row"
        spacing={2}
        sx={{
          alignItems: "center",
        }}
      >
        <Avatar alt="Sarah Jenkins" src="/demo/avatars/01.png" sx={{ width: 40, height: 40 }} />
        <Box>
          <Typography variant="bodyMd" sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main })}>
            Sarah Jenkins
          </Typography>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            Faculty Coordinator
          </Typography>
        </Box>
      </Stack>

      <Button
        fullWidth
        variant="outlined"
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
        {t("contactAdmin")}
      </Button>
    </BaseCard>
  );
}
