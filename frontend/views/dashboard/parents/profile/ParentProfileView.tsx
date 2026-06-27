import { ArrowForwardOutlined, GroupOutlined } from "@mui/icons-material";
import { Alert, Box, Button, Snackbar, Typography, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import type React from "react";
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

const ParentProfileView: React.FC<ParentProfileViewProps> = ({ parent, parentId, onRefetchStudents }) => {
  const t = useTranslations("dashboard.parentProfile");
  const tActions = useTranslations("dashboard.parentProfile.actions");
  const theme = useTheme();
  const router = useRouter();

  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  const handleAvatarUpload = (file: File) => {
    logger.info("Avatar upload requested for parent:", { parentId, fileName: file.name });
    setSnackbarMessage(tActions("avatarUploadSuccess"));
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
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

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default ParentProfileView;
