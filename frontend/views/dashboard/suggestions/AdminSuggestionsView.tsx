"use client";

import { useMediaQuery, useTheme } from "@mui/material";
import { AdminSuggestionsDesktopView } from "./AdminSuggestionsDesktopView";
import { AdminSuggestionsMobileView } from "./AdminSuggestionsMobileView";
import type { AdminSuggestionsViewProps } from "./types/suggestionsViewTypes";

export function AdminSuggestionsView(props: Readonly<AdminSuggestionsViewProps>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile) {
    return <AdminSuggestionsMobileView {...props} />;
  }

  return <AdminSuggestionsDesktopView {...props} />;
}
