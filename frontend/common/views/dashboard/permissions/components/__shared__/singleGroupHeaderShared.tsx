"use client";

import { ArrowBackOutlined, EditOutlined } from "@mui/icons-material";
import { Box, type ButtonProps, Typography } from "@mui/material";
import { type SxProps, styled, type Theme } from "@mui/material/styles";
import type { ComponentType } from "react";
import type { StatusBadgeCategory } from "@/frontend/common/components/ui/badge";
import { FilterButton, PrimaryPageAction } from "@/frontend/common/components/ui/button";
import type { SingleGroupHeaderProps } from "@/frontend/common/views/dashboard/permissions/types";
import { resolveLocalizedString } from "@/shared/lib/localized-string";

export interface SingleGroupHeaderSharedOptions {
  readonly headerPanelSx: SxProps<Theme>;
  readonly actionButtonsSx: SxProps<Theme>;
  readonly actionButtonSx: SxProps<Theme>;
}

export interface SingleGroupHeaderSharedSlots {
  readonly StatusBadge: ComponentType<{
    readonly category: StatusBadgeCategory;
    readonly status: string;
    readonly label: string;
  }>;
  /** Outlined action preset for the back-navigation buttons (FilterButton / tier variant). */
  readonly backButton?: ComponentType<ButtonProps>;
  /** Contained action preset for the edit button (PrimaryPageAction / tier variant). */
  readonly editButton?: ComponentType<ButtonProps>;
}

const StyledBreadcrumbNav = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 1,
});

const StyledBreadcrumbSeparator = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.disabled,
}));

const StyledBreadcrumbName = styled(Typography)({
  fontWeight: 600,
});

const StyledHeaderInfo = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: 1,
});

const StyledHeaderTitleRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 2,
});

const StyledHeaderTitle = styled(Typography)({
  fontWeight: 600,
});

const StyledHeaderDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

export function SingleGroupHeaderShared({
  labels,
  group,
  onBack,
  onEditGroup,
  options,
  slots,
}: Readonly<
  SingleGroupHeaderProps & { options: SingleGroupHeaderSharedOptions; slots: SingleGroupHeaderSharedSlots }
>) {
  const t = labels;
  const groupName = resolveLocalizedString(group.name);
  const groupDescription = resolveLocalizedString(group.description);
  const { StatusBadge } = slots;
  const BackButton = slots.backButton ?? FilterButton;
  const EditButton = slots.editButton ?? PrimaryPageAction;

  return (
    <>
      <StyledBreadcrumbNav>
        <BackButton onClick={onBack} size="small" startIcon={<ArrowBackOutlined />}>
          {t.groupsTab}
        </BackButton>
        <StyledBreadcrumbSeparator variant="bodyMd">/</StyledBreadcrumbSeparator>
        <StyledBreadcrumbName variant="bodyMd">{groupName}</StyledBreadcrumbName>
      </StyledBreadcrumbNav>

      <Box
        sx={[
          theme => ({
            padding: 3,
            borderRadius: 4,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.surfaceContainerLow,
            display: "flex",
            justifyContent: "space-between",
            gap: 2.5,
          }),
          ...(Array.isArray(options.headerPanelSx) ? options.headerPanelSx : [options.headerPanelSx]),
        ]}
      >
        <StyledHeaderInfo>
          <StyledHeaderTitleRow>
            <StyledHeaderTitle variant="headlineMd">{groupName}</StyledHeaderTitle>
            <StatusBadge
              category="groupType"
              status={group.isSystem ? "system" : "custom"}
              label={group.isSystem ? t.systemBadge : t.customBadge}
            />
          </StyledHeaderTitleRow>
          <StyledHeaderDescription variant="bodyMd">
            {groupDescription || t.noDescriptionProvided}
          </StyledHeaderDescription>
        </StyledHeaderInfo>

        <Box
          sx={[
            {
              display: "flex",
              gap: 1.5,
            },
            ...(Array.isArray(options.actionButtonsSx) ? options.actionButtonsSx : [options.actionButtonsSx]),
          ]}
        >
          <BackButton onClick={onBack} sx={options.actionButtonSx}>
            {t.backToAllGroups}
          </BackButton>
          <EditButton
            startIcon={<EditOutlined fontSize="small" />}
            onClick={() => group.id && onEditGroup(group.id)}
            sx={options.actionButtonSx}
          >
            {t.editGroupDetails}
          </EditButton>
        </Box>
      </Box>
    </>
  );
}
