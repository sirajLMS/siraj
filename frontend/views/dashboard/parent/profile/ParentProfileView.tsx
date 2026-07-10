"use client";

import { ArrowForwardOutlined, GroupOutlined } from "@mui/icons-material";
import { Box, Button, Typography, useTheme } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ProfileAdministrationPanel } from "@/frontend/components/auth/ProfileAdministrationPanel";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { logger } from "@/frontend/utils/logger";
import { AvatarUploadDialog } from "@/frontend/views/dashboard/parent/profile/AvatarUploadDialog";
import ParentProfileActions from "@/frontend/views/dashboard/parent/profile/ParentProfileActions";
import { PaymentMethodsManager } from "@/frontend/views/dashboard/profile/shared/payment-methods";
import ParentProfileDetails from "@/frontend/views/dashboard/parent/profile/ParentProfileDetails";
import ParentProfileHeader from "@/frontend/views/dashboard/parent/profile/ParentProfileHeader";
import ParentStudentsDataGrid from "@/frontend/views/dashboard/parent/profile/ParentStudentsDataGrid";
import type { ParentProfileData } from "@/frontend/views/dashboard/parent/types/profile";
import { useRouter } from "@/shared/i18n/routing";

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

      <ParentProfileActions parentId={parentId} userId={parent.userId} onEditAvatar={() => setAvatarDialogOpen(true)} />

      <ParentProfileDetails parent={parent} />

      <SectionPanel title={t("sections.paymentMethods")} sx={{ mt: theme.layout.sectionGap }}>
        <Box sx={{ p: 3 }}>
          <PaymentMethodsManager targetUserId={parent.userId} slot="payin" canManage />
        </Box>
      </SectionPanel>

      <ProfileAdministrationPanel profileUserId={parent.userId} profileUserName={parent.name} />

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
          <RequirePermission permissions={[AppPermission.StudentsCreate]}>
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
          </RequirePermission>
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
