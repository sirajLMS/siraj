import type { SxProps, Theme } from "@mui/material/styles";
import type { ComponentType, ReactNode } from "react";
import type { BaseAvatarVariant } from "@/frontend/common/components/ui/avatar/BaseAvatar";
import type { UiTypographyVariant } from "@/frontend/common/types/shared.types";
import type { AvailabilityInsightsProps } from "@/frontend/common/views/dashboard/teachers/availability/types";
import type { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

export interface AvailabilityInsightsSharedStyleOptions {
  readonly cardMinHeight: number;
  readonly cardFlex?: number;
  readonly insightTitleMarginBottom: number;
  readonly valueVariant: UiTypographyVariant;
  readonly descriptionVariant: UiTypographyVariant;
  readonly timezoneTitleMarginBottom: number;
  readonly avatarGroupMarginTop: number;
  readonly avatarSize: number;
  readonly iconOffset: number;
  readonly iconFontSize: number;
  readonly layoutSx: SxProps<Theme>;
}

export interface AvailabilityInsightsSharedOptions extends AvailabilityInsightsSharedStyleOptions {
  readonly CardComponent: ComponentType<{ readonly sx?: SxProps<Theme>; readonly children: ReactNode }>;
  readonly AvatarComponent: ComponentType<{
    readonly size?: number;
    readonly variant?: BaseAvatarVariant;
    readonly sx?: SxProps<Theme>;
    readonly children?: ReactNode;
  }>;
  readonly TimezoneDisplayComponent: ComponentType<{ readonly timezone?: IanaTimezone | null }>;
}

export interface AvailabilityInsightsSharedProps extends Readonly<AvailabilityInsightsProps> {
  readonly options: AvailabilityInsightsSharedOptions;
}
