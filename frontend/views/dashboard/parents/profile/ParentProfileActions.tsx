import {
  EditNoteOutlined,
  PersonAddOutlined,
  PersonOffOutlined,
  PhotoCameraOutlined,
  ReceiptLongOutlined,
  UploadFileOutlined,
} from "@mui/icons-material";
import { Link, Stack, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import type React from "react";

const ParentProfileActions: React.FC = () => {
  const theme = useTheme();
  const t = useTranslations("dashboard.parentProfile.actions");

  const actionLinks = [
    { label: t("editPicture"), icon: PhotoCameraOutlined, color: theme.palette.primary.main },
    { label: t("editProfile"), icon: EditNoteOutlined, color: theme.palette.primary.main },
    { label: t("uploadDocs"), icon: UploadFileOutlined, color: theme.palette.primary.main },
    { label: t("addNewStudent"), icon: PersonAddOutlined, color: theme.palette.primary.main },
    { label: t("viewInvoices"), icon: ReceiptLongOutlined, color: theme.palette.primary.main },
  ];

  return (
    <Stack
      direction="row"
      spacing={4}
      sx={{
        flexWrap: "wrap",
        pb: 2,
        borderBottom: `1px solid ${theme.palette.divider}`,
        mb: theme.layout.sectionGap,
      }}
    >
      {actionLinks.map(({ label, icon: Icon, color }) => (
        <Link
          key={label}
          href="#"
          underline="hover"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: color,
            typography: "labelLarge",
            fontWeight: 700,
          }}
        >
          <Icon sx={{ fontSize: 18 }} />
          {label}
        </Link>
      ))}
      <Link
        href="#"
        underline="hover"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          color: theme.palette.error.main,
          typography: "labelLarge",
          fontWeight: 700,
          ml: "auto !important",
        }}
      >
        <PersonOffOutlined sx={{ fontSize: 18 }} />
        {t("deactivateAccount")}
      </Link>
    </Stack>
  );
};

export default ParentProfileActions;
