"use client";

import { BaseAvatarScaffold, MOBILE_AVATAR_OPTIONS } from "@/frontend/common/components/ui/avatar/avatarShared";

export function MobileBaseAvatar(props: Readonly<Parameters<typeof BaseAvatarScaffold>[0]>) {
  return <BaseAvatarScaffold {...props} options={MOBILE_AVATAR_OPTIONS} />;
}

export type {
  BaseAvatarProps,
  BaseAvatarVariant,
} from "@/frontend/common/components/ui/avatar/types/avatarShared.types";
