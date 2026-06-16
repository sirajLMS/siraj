import { Box, type Theme, Typography } from "@mui/material";
import type { ElementType } from "react";

export {
  BadgeOutlined,
  PaymentsOutlined,
  SettingsSuggestOutlined,
} from "@mui/icons-material";

interface SectionHeaderProps {
  readonly title: string;
  readonly icon: ElementType;
}

export function SectionHeader({ title, icon: Icon }: Readonly<SectionHeaderProps>) {
  return (
    <Box
      sx={(theme: Theme) => ({
        borderBottom: `1px solid ${theme.palette.border.light}`,
        pb: 2,
        mb: 4,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        color: theme.palette.primary.main,
      })}
    >
      <Icon />
      <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
    </Box>
  );
}
