"use client";

import type React from "react";

import {
  EditableTypographyShared,
  type EditableTypographySharedProps,
} from "@/frontend/common/components/ui/input/editableTypography/EditableTypographyShared";

type EditableTypographyMobileProps = EditableTypographySharedProps;

export const EditableTypographyMobile: React.FC<EditableTypographyMobileProps> = props => {
  return <EditableTypographyShared {...props} iconButtonSize="medium" defaultTextFieldSize />;
};
