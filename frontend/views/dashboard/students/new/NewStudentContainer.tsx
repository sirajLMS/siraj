"use client";

import { PersonAddOutlined } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { PageContainer } from "@/frontend/components/ui/PageContainer";
import { PageHeader } from "@/frontend/components/ui/PageHeader";
import { useRouter } from "@/shared/i18n/routing";

export function NewStudentContainer() {
  const t = useTranslations("dashboard.studentDirectory");
  const router = useRouter();
  const notifications = useNotifications();

  useEffect(() => {
    notifications.show("Student registration is coming soon.", {
      severity: "info",
      autoHideDuration: 5000,
    });
  }, [notifications]);

  const handleGoBack = () => {
    router.push("/students");
  };

  return (
    <PageContainer>
      <PageHeader title={t("addStudent")} subtitle="Student registration will be available soon." />

      <Box
        sx={theme => ({
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "40vh",
          gap: 3,
          backgroundColor: theme.palette.background.paper,
          borderRadius: "xl",
          boxShadow: theme.palette.shadow.card,
          border: `1px solid ${theme.palette.border.light}`,
          p: 6,
        })}
      >
        <Box
          sx={theme => ({
            width: 80,
            height: 80,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.palette.primaryContainer,
            color: theme.palette.onPrimaryContainer,
          })}
        >
          <PersonAddOutlined sx={{ fontSize: 40 }} />
        </Box>
        <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main })}>
          {t("addStudent")}
        </Typography>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant, textAlign: "center" })}>
          Student registration is coming soon. Please check back later.
        </Typography>
        <Button variant="outlined" onClick={handleGoBack} sx={theme => ({ borderColor: theme.palette.border.main })}>
          {t("previous")}
        </Button>
      </Box>
    </PageContainer>
  );
}
