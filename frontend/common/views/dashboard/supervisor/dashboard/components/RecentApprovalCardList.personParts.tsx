import { Avatar, Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  getPersonAccentColor,
  type PersonAccentTone,
} from "@/frontend/common/views/dashboard/admin/home/utils/scheduleCardHelpers";
import { getNameInitials } from "@/frontend/common/views/dashboard/utils/nameInitials";
import { Link } from "@/shared/i18n";

const StyledPersonCell = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: theme.spacing(0.75),
  minWidth: 0,
  overflow: "hidden",
  "&:first-of-type": {
    paddingInlineEnd: theme.spacing(0.75),
    borderInlineEnd: `1px solid ${theme.palette.border.light}`,
  },
}));

const StyledPersonContentRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  minWidth: 0,
  width: "100%",
}));

const StyledPersonAvatar = styled(Avatar)(({ theme }) => ({
  width: 32,
  height: 32,
  flexShrink: 0,
  fontSize: theme.typography.labelSm.fontSize,
  fontWeight: theme.typography.labelSm.fontWeight,
  backgroundColor: theme.palette.surfaceContainerHigh,
  color: theme.palette.onSurfaceVariant,
}));

const StyledPersonText = styled(Box)({
  minWidth: 0,
  flex: 1,
  overflow: "hidden",
});

const StyledPersonLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}));

const StyledPersonName = styled(Typography, {
  shouldForwardProp: prop => prop !== "tone",
})<{ tone: PersonAccentTone }>(({ theme, tone }) => ({
  color: getPersonAccentColor(tone, theme),
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  display: "block",
}));

interface PersonCellProps {
  readonly name: string;
  readonly label: string;
  readonly tone: PersonAccentTone;
  readonly href?: string;
  readonly avatarUrl?: string | null;
}

export function PersonCell({ name, label, tone, href, avatarUrl }: PersonCellProps) {
  return (
    <StyledPersonCell>
      <StyledPersonLabel variant="labelMd" title={label}>
        {label}
      </StyledPersonLabel>
      <StyledPersonContentRow>
        <StyledPersonAvatar src={avatarUrl ?? undefined} alt={name} aria-hidden={!avatarUrl}>
          {getNameInitials(name)}
        </StyledPersonAvatar>
        <StyledPersonText>
          <StyledPersonName
            variant="bodyMd"
            title={name}
            tone={tone}
            {...(href ? { component: Link, href } : {})}
            sx={
              href
                ? {
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                  }
                : undefined
            }
          >
            {name}
          </StyledPersonName>
        </StyledPersonText>
      </StyledPersonContentRow>
    </StyledPersonCell>
  );
}
