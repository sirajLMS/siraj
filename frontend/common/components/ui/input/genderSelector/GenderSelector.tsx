"use client";

import type * as React from "react";
import { GenderSelectorShared } from "@/frontend/common/components/ui/input/genderSelector/ButtonGroupSelectorShared";
import type { ButtonGroupSelectorOptions } from "@/frontend/common/components/ui/input/genderSelector/buttonGroupSelectorTypes";
import type { Gender } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { GenderSelectorLabels } from "@/shared/locale";

export type GenderSelectorProps = {
  readonly gender: Gender | null;
  readonly setGenderAction: (gender: Gender | null) => void;
  readonly error?: boolean;
  readonly required?: boolean;
  readonly fullWidth?: boolean;
  readonly labels?: Partial<GenderSelectorLabels>;
  readonly allowEmpty?: boolean;
};

const DESKTOP_OPTIONS: ButtonGroupSelectorOptions = { buttonGroupWidth: "70%" };

export const GenderSelector: React.FC<GenderSelectorProps> = (props): React.ReactNode => (
  <GenderSelectorShared {...props} options={DESKTOP_OPTIONS} />
);
