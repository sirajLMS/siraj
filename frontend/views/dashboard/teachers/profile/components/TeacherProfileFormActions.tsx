import { SaveOutlined } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import { useTranslations } from "next-intl";

import { PrimaryPageAction } from "@/frontend/components/ui/button/ActionButtons";
import type { TeacherProfileFormActionsProps } from "../types";

export function TeacherProfileFormActions({
  isSaving,
  isMobile,
  updatedAt,
  onDiscard,
}: Readonly<TeacherProfileFormActionsProps>) {
  const t = useTranslations("dashboard.teacherProfile");

  return (
    <Box
      sx={theme => ({
        pt: 4,
        borderTop: `1px solid ${theme.palette.outlineVariant}`,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: "center",
        justifyContent: "space-between",
        gap: 3,
      })}
    >
      <Box
        sx={{
          display: "flex",
          gap: 2,
          width: { xs: "100%", md: "auto" },
        }}
      >
        <PrimaryPageAction
          type="submit"
          disabled={isSaving}
          startIcon={<SaveOutlined />}
          fullWidth={isMobile}
          sx={theme => ({
            backgroundColor: theme.palette.success.main,
            color: theme.palette.onSuccess,
            boxShadow: theme.palette.shadow.button,
            "&:hover": {
              backgroundColor: theme.palette.success.dark,
              boxShadow: theme.palette.shadow.buttonHover,
            },
            px: 4,
            py: 1.5,
          })}
        >
          {t("actions.saveProfile")}
        </PrimaryPageAction>
        <Button
          variant="outlined"
          fullWidth={isMobile}
          onClick={onDiscard}
          sx={theme => ({
            borderRadius: theme.layout.radius.button,
            px: 4,
            py: 1.5,
            color: theme.palette.onSurface,
            borderColor: theme.palette.outline,
            "&:hover": {
              borderColor: theme.palette.outlineVariant,
              backgroundColor: theme.palette.surfaceVariant,
            },
          })}
        >
          {t("actions.discardChanges")}
        </Button>
      </Box>

      <Box sx={{ textAlign: { xs: "center", md: "right" } }}>
        <Typography
          variant="labelUppercase"
          sx={theme => ({
            color: theme.palette.onSurfaceVariant,
            display: "block",
            mb: 0.5,
          })}
        >
          {t("actions.lastModified", { date: new Date(updatedAt).toLocaleDateString() })}
        </Typography>
      </Box>
    </Box>
  );
}
