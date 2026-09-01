"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ComponentType, ReactNode } from "react";
import type { BaseAvatarVariant } from "@/frontend/common/components/ui/avatar/BaseAvatar";
import type { UiTypographyVariant } from "@/frontend/common/types/shared.types";
import type { SupportContactProps } from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";

export interface SupportContactSharedProps extends Readonly<SupportContactProps> {
  readonly options: SupportContactSharedOptions;
}

interface SupportContactSharedOptions {
  readonly CardComponent: ComponentType<{ readonly sx?: SxProps<Theme>; readonly children: ReactNode }>;
  readonly AvatarComponent: ComponentType<{
    readonly src?: string | null;
    readonly label?: string;
    readonly size?: number;
    readonly variant?: BaseAvatarVariant;
    readonly sx?: SxProps<Theme>;
    readonly children?: ReactNode;
  }>;
  readonly PhoneDisplayComponent: ComponentType<{
    readonly phone?: string | null;
    readonly typographyVariant?: UiTypographyVariant;
    readonly sx?: SxProps<Theme>;
  }>;
  readonly cardPadding: number;
  readonly titleVariant: UiTypographyVariant;
  readonly titleMarginBottom: number;
  readonly stackSpacing: number;
  readonly avatarSize: number;
  readonly phoneTypographyVariant: UiTypographyVariant;
  readonly buttonMarginTop: number;
  readonly buttonBorderRadius: number;
  readonly buttonPaddingY: number;
}

export function SupportContactShared({
  contact,
  onContactAdmin,
  supportContactLabel,
  contactAdminLabel,
  options,
}: Readonly<SupportContactSharedProps>) {
  const {
    CardComponent,
    AvatarComponent,
    PhoneDisplayComponent,
    cardPadding,
    titleVariant,
    titleMarginBottom,
    stackSpacing,
    avatarSize,
    phoneTypographyVariant,
    buttonMarginTop,
    buttonBorderRadius,
    buttonPaddingY,
  } = options;

  return (
    <CardComponent
      sx={theme => ({
        p: cardPadding,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.border.main}`,
        boxShadow: theme.palette.shadow.card,
      })}
    >
      <Typography
        variant={titleVariant}
        sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main, mb: titleMarginBottom })}
      >
        {supportContactLabel}
      </Typography>

      {contact && (
        <Stack
          direction="row"
          spacing={stackSpacing}
          sx={{
            alignItems: "center",
          }}
        >
          <AvatarComponent src={contact.avatarUrl} label={contact.name ?? ""} size={avatarSize} />
          <Box>
            <Typography variant="bodyMd" sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main })}>
              {contact.name}
            </Typography>
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {contact.role}
            </Typography>
            <PhoneDisplayComponent
              phone={contact.phone}
              typographyVariant={phoneTypographyVariant}
              sx={theme => ({ color: theme.palette.onSurfaceVariant })}
            />
          </Box>
        </Stack>
      )}

      <Button
        fullWidth
        variant="outlined"
        onClick={onContactAdmin}
        sx={theme => ({
          mt: buttonMarginTop,
          borderRadius: buttonBorderRadius,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.05em",
          color: theme.palette.primary.main,
          borderColor: theme.palette.border.main,
          py: buttonPaddingY,
          "&:hover": {
            backgroundColor: theme.palette.action.hover,
            borderColor: theme.palette.primary.main,
          },
        })}
      >
        {contactAdminLabel}
      </Button>
    </CardComponent>
  );
}
