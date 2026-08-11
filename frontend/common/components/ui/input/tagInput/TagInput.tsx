"use client";

import type React from "react";
import {
  TagInputShared,
  type TagInputSharedProps,
} from "@/frontend/common/components/ui/input/tagInput/TagInputShared";

export type TagInputProps = TagInputSharedProps;

export function TagInput(props: TagInputProps): React.ReactNode {
  return <TagInputShared {...props} />;
}
