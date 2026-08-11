"use client";

import type React from "react";

import type { EditableTypographySharedProps } from "@/frontend/common/components/ui/input/editableTypography/EditableTypographyShared";
import { EditableTypographyShared } from "@/frontend/common/components/ui/input/editableTypography/EditableTypographyShared";

type EditableTypographyProps = EditableTypographySharedProps;

export const EditableTypography: React.FC<EditableTypographyProps> = props => {
  return <EditableTypographyShared {...props} iconButtonSize="small" />;
};
