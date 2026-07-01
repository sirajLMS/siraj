"use client";

import { ArrowForwardOutlined, GroupOutlined } from "@mui/icons-material";
import { Box, Button, Typography, useTheme } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import { logger } from "@/frontend/utils/logger";
import { useRouter } from "@/shared/i18n/routing";
import type { ParentProfileData } from "../types/profile";
import { AvatarUploadDialog } from "./AvatarUploadDialog";
import ParentProfileActions from "./ParentProfileActions";
import ParentProfileDetails from "./ParentProfileDetails";
import ParentProfileHeader from "./ParentProfileHeader";
import ParentStudentsDataGrid from "./ParentStudentsDataGrid";

interface ParentProfileViewProps {
  readonly parent: ParentProfileData;
  readonly parentId: string;
  readonly onRefetchStudents?: () => void;
}

function ParentProfileView({ parent, parentId, onRefetchStudents }: ParentProfileViewProps) {
  const t = useTranslations("dashboard.parentProfile");
  const tActions = useTranslations("dashboard.parentProfile.actions");
  const theme = useTheme();
  const router = useRouter();
  const notifications = useNotifications();

  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);

  const handleAvatarUpload = (file: File) => {
    logger.info("Avatar upload requested for parent:", { parentId, fileName: file.name });
    notifications.show(tActions("avatarUploadSuccess"), { severity: "success", autoHideDuration: 4000 });
  };

  return (
    <PageContainer>
      <PageHeader title={t("pageTitle")} />

      <ParentProfileHeader
        name={parent.name}
        avatarUrl={parent.avatarUrl}
        status={parent.status}
        onEditAvatar={() => setAvatarDialogOpen(true)}
      />

      <ParentProfileActions parentId={parentId} onEditAvatar={() => setAvatarDialogOpen(true)} />

      <ParentProfileDetails parent={parent} />

      <SectionPanel
        title={t("sections.parentStudents")}
        actions={
          <Button
            variant="text"
            onClick={() => router.push(`/students?parentId=${parentId}`)}
            sx={{
              color: theme.palette.primary.main,
              typography: "labelLarge",
              fontWeight: 700,
            }}
          >
            {t("table.viewAllStudents")}
          </Button>
        }
        sx={{ mt: theme.layout.sectionGap }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 3,
            py: 1.5,
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.onPrimary,
          }}
        >
          <GroupOutlined />
          <Typography variant="titleLg">{t("sections.parentStudents")}</Typography>
        </Box>
        <ParentStudentsDataGrid rows={parent.students} onRefetch={onRefetchStudents} />
        <Box
          sx={{
            p: 2,
            backgroundColor: theme.palette.background.default,
            borderTop: `1px solid ${theme.palette.divider}`,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Button
            variant="text"
            endIcon={<ArrowForwardOutlined />}
            onClick={() => router.push(`/students/onboarding?parentId=${parentId}`)}
            sx={{
              color: theme.palette.primary.main,
              typography: "labelLarge",
              fontWeight: 700,
              gap: 1,
              "&:hover": { gap: 2 },
              transition: "gap 0.2s",
            }}
          >
            {t("actions.addNewStudent")}
          </Button>
        </Box>
      </SectionPanel>

      <AvatarUploadDialog
        open={avatarDialogOpen}
        onClose={() => setAvatarDialogOpen(false)}
        currentAvatarUrl={parent.avatarUrl}
        parentName={parent.name}
        onUpload={handleAvatarUpload}
      />
    </PageContainer>
  );
}

export default ParentProfileView;
