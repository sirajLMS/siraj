"use client";

import { BaseAvatarScaffold, DESKTOP_AVATAR_OPTIONS } from "@/frontend/common/components/ui/avatar/avatarShared";

export function DesktopBaseAvatar(props: Readonly<Parameters<typeof BaseAvatarScaffold>[0]>) {
  return <BaseAvatarScaffold {...props} options={DESKTOP_AVATAR_OPTIONS} />;
}

export type {
  BaseAvatarProps,
  BaseAvatarVariant,
} from "@/frontend/common/components/ui/avatar/types/avatarShared.types";
