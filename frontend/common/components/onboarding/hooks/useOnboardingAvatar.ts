"use client";

import { useState } from "react";
import { useAvatarUpload } from "@/frontend/common/hooks/useAvatarUpload";

export type UseOnboardingAvatarResult = {
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
};

export function useOnboardingAvatar(): UseOnboardingAvatarResult {
  // Lazy initializer: generate the pending-avatar storage key once per hook
  // instance. Using useState with a lazy initializer (instead of useRef) avoids
  // reading ref.current during render (which trips `react-hooks/refs`).
  const [pendingAvatarKey] = useState(() => `pending-${crypto.randomUUID()}`);
  const { onUploadAvatar } = useAvatarUpload({ storageOwnerKey: pendingAvatarKey });
  return { onUploadAvatar };
}
