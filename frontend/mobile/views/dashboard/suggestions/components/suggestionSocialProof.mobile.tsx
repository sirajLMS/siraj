"use client";

import { SuggestionSocialProofShared } from "@/frontend/common/views/dashboard/suggestions/components/__shared__/suggestionSocialProofShared";
import type { SuggestionSocialProofProps } from "@/frontend/common/views/dashboard/suggestions/types/suggestionsView.types";
import { MobileUserAvatar } from "@/frontend/mobile/components/ui";

export function SuggestionSocialProofMobile({ labels }: Readonly<SuggestionSocialProofProps>) {
  return (
    <SuggestionSocialProofShared
      labels={labels}
      gap={1.5}
      renderAvatar={({ key, label, size, sx, children }) => (
        <MobileUserAvatar key={key} label={label} size={size} sx={sx}>
          {children}
        </MobileUserAvatar>
      )}
    />
  );
}
