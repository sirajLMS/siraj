"use client";

import { Box, Button } from "@mui/material";
import { type ComponentProps, type ReactNode, useState } from "react";
import { ProfileShell } from "@/frontend/common/views/dashboard/profile/core/ProfileShell";

export function StorybookPageFrame({ children }: { readonly children: ReactNode }) {
  return (
    <Box
      sx={theme => ({
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
        px: { xs: 0, md: theme.layout.pageMargin },
        py: { xs: theme.spacing(2), md: theme.layout.pageMargin },
      })}
    >
      {children}
    </Box>
  );
}

export function MockProfileActions() {
  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      <Button variant="contained" size="small">
        Edit
      </Button>
    </Box>
  );
}

export function MockProfileChildren() {
  return (
    <Box sx={{ p: 2 }}>
      <Box
        sx={theme => ({
          bgcolor: theme.palette.background.paper,
          p: 2,
          borderRadius: 1,
          mb: 2,
        })}
      >
        <h3>Profile Content</h3>
        <p>This section represents dynamic content rendered based on the selected tab.</p>
      </Box>
    </Box>
  );
}

export function TabbedShellStory(args: ComponentProps<typeof ProfileShell>) {
  const [currentTab, setCurrentTab] = useState(args.currentTab ?? "profile");
  return <ProfileShell {...args} currentTab={currentTab} onTabChange={setCurrentTab} />;
}
