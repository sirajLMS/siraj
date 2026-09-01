"use client";

import { BaseAvatarScaffold } from "@/frontend/common/components/ui/avatar/avatarShared";
import { DEFAULT_MOBILE_AVATAR_OPTIONS } from "@/frontend/common/components/ui/avatar/avatarShared.options";

export function MobileBaseAvatar(props: Readonly<Parameters<typeof BaseAvatarScaffold>[0]>) {
  return <BaseAvatarScaffold {...props} options={DEFAULT_MOBILE_AVATAR_OPTIONS} />;
}
