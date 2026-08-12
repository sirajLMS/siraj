"use client";

import { BaseAvatarScaffold } from "@/frontend/common/components/ui/avatar/avatarShared";
import type { BaseAvatarProps } from "@/frontend/common/components/ui/avatar/types/avatarShared.types";

export type {
  BaseAvatarProps,
  BaseAvatarVariant,
} from "@/frontend/common/components/ui/avatar/types/avatarShared.types";

export function BaseAvatar(props: Readonly<BaseAvatarProps>) {
  return <BaseAvatarScaffold {...props} />;
}
