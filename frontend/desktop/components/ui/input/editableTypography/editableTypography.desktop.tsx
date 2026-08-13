"use client";

import type React from "react";

import {
  EditableTypographyShared,
  type EditableTypographySharedProps,
} from "@/frontend/common/components/ui/input/editableTypography/EditableTypographyShared";

type EditableTypographyDesktopProps = EditableTypographySharedProps;

export const EditableTypographyDesktop: React.FC<EditableTypographyDesktopProps> = props => {
  return <EditableTypographyShared {...props} iconButtonSize="small" />;
};
