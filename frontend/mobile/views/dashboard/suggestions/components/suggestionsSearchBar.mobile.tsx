"use client";

import { SuggestionsSearchBarShared } from "@/frontend/common/views/dashboard/suggestions/components/__shared__/suggestionsSearchBarShared";
import type { SuggestionsSearchBarProps } from "@/frontend/common/views/dashboard/suggestions/types/suggestionsView.types";

export function SuggestionsSearchBarMobile({ value, placeholder, onChange }: Readonly<SuggestionsSearchBarProps>) {
  return <SuggestionsSearchBarShared value={value} placeholder={placeholder} onChange={onChange} fullWidth />;
}
