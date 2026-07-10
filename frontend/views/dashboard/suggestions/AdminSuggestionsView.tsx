"use client";

import { useMediaQuery, useTheme } from "@mui/material";
import { AdminSuggestionsDesktopView } from "@/frontend/views/dashboard/suggestions/AdminSuggestionsDesktopView";
import { AdminSuggestionsMobileView } from "@/frontend/views/dashboard/suggestions/AdminSuggestionsMobileView";
import type { AdminSuggestionsViewProps } from "@/frontend/views/dashboard/suggestions/types/suggestionsView.types";

export function AdminSuggestionsView(props: Readonly<AdminSuggestionsViewProps>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile) {
    return <AdminSuggestionsMobileView {...props} />;
  }

  return <AdminSuggestionsDesktopView {...props} />;
}
