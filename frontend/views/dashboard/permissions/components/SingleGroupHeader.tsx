"use client";

import { ArrowBackOutlined, EditOutlined } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import { StatusBadge } from "@/frontend/components/ui";
import type { PermissionGroup } from "@/frontend/graphql/generated/gql/graphql-types";

const StyledBreadcrumbNav = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 1,
});

const StyledBackButton = styled(Button)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textTransform: "none",
  fontSize: "0.875rem",
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

const StyledHeaderPanel = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: Number(theme.shape.borderRadius) * 2,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.surfaceContainerLow ?? theme.palette.background.paper,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: theme.spacing(2.5),
  [theme.breakpoints.up("md")]: {
    flexDirection: "row",
    alignItems: "center",
  },
}));

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

const StyledActionButtons = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1.5),
  alignSelf: "stretch",
  [theme.breakpoints.up("md")]: {
    alignSelf: "center",
  },
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

interface SingleGroupHeaderProps {
  readonly group: PermissionGroup;
  readonly onBack: () => void;
  readonly onEditGroup: (id: string) => void;
}

export function SingleGroupHeader({ group, onBack, onEditGroup }: Readonly<SingleGroupHeaderProps>) {
  const t = useTranslations("dashboard.permissions");

  return (
    <>
      {/* Breadcrumb Navigation */}
      <StyledBreadcrumbNav>
        <StyledBackButton onClick={onBack} size="small" variant="text" startIcon={<ArrowBackOutlined />}>
          {t("groupsTab")}
        </StyledBackButton>
        <StyledBreadcrumbSeparator variant="bodyMd">/</StyledBreadcrumbSeparator>
        <StyledBreadcrumbName variant="bodyMd">{group.name}</StyledBreadcrumbName>
      </StyledBreadcrumbNav>

      {/* Main Header Panel */}
      <StyledHeaderPanel>
        {/* Header Info Section */}
        <StyledHeaderInfo>
          <StyledHeaderTitleRow>
            <StyledHeaderTitle variant="headlineMd">{group.name}</StyledHeaderTitle>
            <StatusBadge
              category="session"
              status={group.isSystem ? "active" : "pending"}
              label={group.isSystem ? t("systemBadge") : t("customBadge")}
            />
          </StyledHeaderTitleRow>
          <StyledHeaderDescription variant="bodyMd">
            {group.description || "No description provided."}
          </StyledHeaderDescription>
        </StyledHeaderInfo>

        {/* Action Buttons */}
        <StyledActionButtons>
          <StyledBackToGroupsButton variant="outlined" onClick={onBack}>
            Back to All Groups
          </StyledBackToGroupsButton>
          {!group.isSystem && (
            <StyledEditButton
              variant="contained"
              startIcon={<EditOutlined fontSize="small" />}
              onClick={() => group.id && onEditGroup(group.id)}
            >
              Edit Group Details
            </StyledEditButton>
          )}
        </StyledActionButtons>
      </StyledHeaderPanel>
    </>
  );
}
