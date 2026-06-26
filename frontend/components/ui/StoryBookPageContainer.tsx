import { Box, type Theme } from "@mui/material";

interface StoryBookPageContainerProps {
  readonly children: React.ReactNode;
  readonly bgcolor?: string | ((theme: Theme) => string);
  readonly color?: string | ((theme: Theme) => string);
}

export function StoryBookPageContainer({ children, bgcolor, color }: StoryBookPageContainerProps) {
  return (
    <Box
      sx={theme => ({
        minHeight: "100vh",
        width: "100%",
        boxSizing: "border-box",
        backgroundColor: typeof bgcolor === "function" ? bgcolor(theme) : (bgcolor ?? theme.palette.background.default),
        color: typeof color === "function" ? color(theme) : color,
        p: 3,
      })}
    >
      {children}
    </Box>
  );
}
