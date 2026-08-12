"use client";

import { SuggestionSocialProofShared } from "@/frontend/common/views/dashboard/suggestions/components/__shared__/suggestionSocialProofShared";
import type { SuggestionSocialProofProps } from "@/frontend/common/views/dashboard/suggestions/types/suggestionsView.types";
import { DesktopUserAvatar } from "@/frontend/desktop/components/ui/avatar/DesktopUserAvatar";

export function SuggestionSocialProofDesktop({ labels }: Readonly<SuggestionSocialProofProps>) {
  return (
    <SuggestionSocialProofShared
      labels={labels}
      gap={2}
      renderAvatar={({ key, label, size, sx, children }) => (
        <DesktopUserAvatar key={key} label={label} size={size} sx={sx}>
          {children}
        </DesktopUserAvatar>
      )}
    />
  );
}
