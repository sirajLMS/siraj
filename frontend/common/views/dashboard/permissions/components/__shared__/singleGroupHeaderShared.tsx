"use client";

import { ArrowBackOutlined, EditOutlined } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import { type SxProps, styled, type Theme } from "@mui/material/styles";
import type { ComponentType } from "react";
import type { StatusBadgeCategory } from "@/frontend/common/components/ui/badge";
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
}

const StyledBreadcrumbNav = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 1,
});

const StyledBackButton = styled(Button)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textTransform: "none",
  fontSize: theme.typography.bodyMd.fontSize,
  "&:hover": {
    backgroundColor: "transparent",
    color: theme.palette.primary.main,
  },
}));

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

const StyledBackToGroupsButton = styled(Button)(({ theme }) => ({
  borderColor: theme.palette.divider,
  color: theme.palette.text.primary,
  textTransform: "none",
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  fontWeight: 600,
}));

const StyledEditButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  textTransform: "none",
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  fontWeight: 600,
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
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

  return (
    <>
      <StyledBreadcrumbNav>
        <StyledBackButton onClick={onBack} size="small" variant="text" startIcon={<ArrowBackOutlined />}>
          {t.groupsTab}
        </StyledBackButton>
        <StyledBreadcrumbSeparator variant="bodyMd">/</StyledBreadcrumbSeparator>
        <StyledBreadcrumbName variant="bodyMd">{groupName}</StyledBreadcrumbName>
      </StyledBreadcrumbNav>

      <Box
        sx={[
          {
            padding: 3,
            borderRadius: 4,
            border: 1,
            borderColor: "divider",
            backgroundColor: "surfaceContainerLow",
            display: "flex",
            justifyContent: "space-between",
            gap: 2.5,
          },
          ...(Array.isArray(options.headerPanelSx) ? options.headerPanelSx : [options.headerPanelSx]),
        ]}
      >
        <StyledHeaderInfo>
          <StyledHeaderTitleRow>
            <StyledHeaderTitle variant="headlineMd">{groupName}</StyledHeaderTitle>
            <StatusBadge
              category="session"
              status={group.isSystem ? "active" : "pending"}
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
          <StyledBackToGroupsButton variant="outlined" onClick={onBack} sx={options.actionButtonSx}>
            Back to All Groups
          </StyledBackToGroupsButton>
          {!group.isSystem && (
            <StyledEditButton
              variant="contained"
              startIcon={<EditOutlined fontSize="small" />}
              onClick={() => group.id && onEditGroup(group.id)}
              sx={options.actionButtonSx}
            >
              Edit Group Details
            </StyledEditButton>
          )}
        </Box>
      </Box>
    </>
  );
}
