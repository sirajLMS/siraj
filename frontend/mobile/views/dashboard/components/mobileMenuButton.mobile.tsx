"use client";

import { MenuOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { useLayoutStore } from "@/frontend/common/stores/layoutStore";
import { Translation, useAppTranslation } from "@/shared/locale";

export function MobileMenuButton() {
  const toggleMobileDrawer = useLayoutStore(state => state.toggleMobileDrawer);
  const t = useAppTranslation(Translation.Common);

  return (
    <IconButton
      onClick={toggleMobileDrawer}
      sx={{
        display: { xs: "flex", md: "none" },
      }}
      aria-label={t.ariaMenu}
    >
      <MenuOutlined />
    </IconButton>
  );
}
