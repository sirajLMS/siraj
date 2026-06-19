"use client";

import { ArrowBackOutlined, EditOutlined } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { StatusBadge } from "@/frontend/components/ui";
import type { PermissionGroup } from "@/frontend/graphql/generated/gql/graphql-types";

interface SingleGroupHeaderProps {
  readonly group: PermissionGroup;
  readonly onBack: () => void;
  readonly onEditGroup: (id: string) => void;
}

export function SingleGroupHeader({ group, onBack, onEditGroup }: Readonly<SingleGroupHeaderProps>) {
  const t = useTranslations("dashboard.permissions");

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Button
          onClick={onBack}
          size="small"
          variant="text"
          startIcon={<ArrowBackOutlined />}
          sx={theme => ({
            color: theme.palette.text.secondary,
            textTransform: "none",
            fontSize: "0.875rem",
            "&:hover": {
              bgcolor: "transparent",
              color: theme.palette.primary.main,
            },
          })}
        >
          {t("groupsTab")}
        </Button>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.disabled })}>
          /
        </Typography>
        <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
          {group.name}
        </Typography>
      </Box>

      <Box
        sx={theme => ({
          p: 3,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.surfaceContainerLow ?? theme.palette.background.paper,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          gap: 2.5,
        })}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="headlineMd" sx={{ fontWeight: 600 }}>
              {group.name}
            </Typography>
            <StatusBadge
              category="session"
              status={group.isSystem ? "active" : "pending"}
              label={group.isSystem ? t("systemBadge") : t("customBadge")}
            />
          </Box>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {group.description || "No description provided."}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, alignSelf: { xs: "stretch", md: "center" } }}>
          <Button
            variant="outlined"
            onClick={onBack}
            sx={theme => ({
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              textTransform: "none",
              borderRadius: 1.5,
              fontWeight: 600,
            })}
          >
            Back to All Groups
          </Button>
          {!group.isSystem && (
            <Button
              variant="contained"
              startIcon={<EditOutlined fontSize="small" />}
              onClick={() => group.id && onEditGroup(group.id)}
              sx={theme => ({
                bgcolor: theme.palette.primary.main,
                color: theme.palette.onPrimary,
                textTransform: "none",
                borderRadius: 1.5,
                fontWeight: 600,
                "&:hover": {
                  bgcolor: theme.palette.primary.dark,
                },
              })}
            >
              Edit Group Details
            </Button>
          )}
        </Box>
      </Box>
    </>
  );
}
