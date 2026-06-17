"use client";

import { CheckOutlined, ReportProblemOutlined } from "@mui/icons-material";
import { alpha, Box, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { CheckedEmptyItem } from "@/frontend/stores/mockDstMigrationStore";

interface Props {
  readonly items: readonly CheckedEmptyItem[];
}

export function CheckedEmptyPanel({ items }: Readonly<Props>) {
  const t = useTranslations("dashboard.dstMigration");

  return (
    <Box
      sx={theme => ({
        bgcolor: theme.palette.surfaceContainerLowest,
        borderRadius: 3,
        border: `1px solid ${theme.palette.outlineVariant}`,
        overflow: "hidden",
        boxShadow: theme.palette.shadow.card,
      })}
    >
      <Box
        sx={theme => ({
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          bgcolor: alpha(theme.palette.warning.main, 0.1),
          borderBottom: `1px solid ${theme.palette.outlineVariant}`,
        })}
      >
        <Box
          sx={theme => ({
            width: 32,
            height: 32,
            borderRadius: "50%",
            bgcolor: theme.palette.warning.main,
            color: theme.palette.onWarning,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <ReportProblemOutlined sx={{ fontSize: 18 }} />
        </Box>
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.warning.dark })}>
          {t("sections.checkedEmpty")}
        </Typography>
      </Box>
      <Box component="ul" sx={{ p: 3, m: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map(item => (
          <Box component="li" key={item.id} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
            <CheckOutlined sx={theme => ({ color: theme.palette.warning.main, mt: 0.25 })} />
            <Box>
              <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.primary.main })}>
                {item.title}
              </Typography>
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                {item.description}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
