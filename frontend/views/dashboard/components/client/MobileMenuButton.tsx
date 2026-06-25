"use client";

import { MenuOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { useLayoutStore } from "@/frontend/stores/layoutStore";

export function MobileMenuButton() {
  const toggleMobileDrawer = useLayoutStore(state => state.toggleMobileDrawer);

  return (
    <IconButton
      onClick={toggleMobileDrawer}
      sx={{
        display: { xs: "flex", md: "none" },
      }}
      aria-label="menu"
    >
      <MenuOutlined />
    </IconButton>
  );
}
