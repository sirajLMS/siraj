import { ArrowForwardOutlined, GroupOutlined } from "@mui/icons-material";
import { Box, Button, Typography, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import type React from "react";
import { PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import type { ParentProfileData } from "../types/profile";
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
  const theme = useTheme();

  return (
    <PageContainer>
      <PageHeader title={t("pageTitle")} />

      <ParentProfileHeader name={parent.name} avatarUrl={parent.avatarUrl} status={parent.status} />

      <ParentProfileActions parentId={parentId} />

      <ParentProfileDetails parent={parent} />

      <SectionPanel
        title={t("sections.parentStudents")}
        actions={
          <Button
            variant="text"
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
            bgcolor: theme.palette.primary.main,
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
    </PageContainer>
  );
};

export default ParentProfileView;
