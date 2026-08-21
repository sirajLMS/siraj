"use client";

import type * as React from "react";
import { GenderSelectorShared } from "@/frontend/common/components/ui/input/genderSelector/ButtonGroupSelectorShared";
import type { ButtonGroupSelectorOptions } from "@/frontend/common/components/ui/input/genderSelector/buttonGroupSelectorTypes";
import type { Gender } from "@/frontend/common/graphql/generated/gql/graphql";

export type GenderSelectorProps = {
  readonly gender: Gender | null;
  readonly setGenderAction: (gender: Gender | null) => void;
  readonly error?: boolean;
  readonly required?: boolean;
  readonly fullWidth?: boolean;
  readonly labels?: {
    readonly title?: string;
    readonly male?: string;
    readonly female?: string;
    readonly any?: string;
    readonly ariaLabel?: string;
  };
  readonly allowEmpty?: boolean;
};

const MOBILE_OPTIONS: ButtonGroupSelectorOptions = { buttonGroupWidth: "100%", buttonSx: { minHeight: 40 } };

export const GenderSelectorMobile: React.FC<GenderSelectorProps> = (props): React.ReactNode => (
  <GenderSelectorShared {...props} options={MOBILE_OPTIONS} />
);
