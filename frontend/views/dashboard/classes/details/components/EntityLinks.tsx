"use client";

import { Avatar, Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import Link from "next/link";
import { useLocale } from "next-intl";
import { avatarInitials } from "@/frontend/utils/avatar";

const StyledEntityLink = styled(Link)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 600,
  textDecoration: "none",
  "&:hover": {
    textDecoration: "underline",
  },
}));

const StyledTeacherEntityLink = styled(StyledEntityLink)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

interface StudentEntityLinkProps {
  readonly studentId: string;
  readonly name: string;
  readonly avatarUrl?: string | null;
  readonly avatarSize?: number;
  readonly showAvatar?: boolean;
  readonly variant?: "titleLg" | "bodyLg";
}

export function StudentEntityLink({
  studentId,
  name,
  avatarUrl,
  avatarSize = 64,
  showAvatar = false,
  variant = "titleLg",
}: StudentEntityLinkProps) {
  const locale = useLocale();
  const href = `/${locale}/students/${studentId}`;

  if (showAvatar) {
    return (
      <Box
        component={Link}
        href={href}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <Avatar src={avatarUrl ?? undefined} alt={name} sx={{ width: avatarSize, height: avatarSize }}>
          {avatarInitials(name)}
        </Avatar>
        <Box>
          <Typography variant={variant} sx={{ color: theme => theme.palette.primary.main, fontWeight: 600 }}>
            {name}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <StyledEntityLink href={href}>
      <Typography variant={variant} component="span" sx={{ fontWeight: 600 }}>
        {name}
      </Typography>
    </StyledEntityLink>
  );
}

interface TeacherEntityLinkProps {
  readonly teacherId: string;
  readonly name: string;
  readonly avatarUrl?: string | null;
  readonly avatarSize?: number;
  readonly showAvatar?: boolean;
  readonly variant?: "titleLg" | "bodyLg";
}

export function TeacherEntityLink({
  teacherId,
  name,
  avatarUrl,
  avatarSize = 64,
  showAvatar = false,
  variant = "titleLg",
}: TeacherEntityLinkProps) {
  const locale = useLocale();
  const href = `/${locale}/teachers/${teacherId}/profile`;

  if (showAvatar) {
    return (
      <Box
        component={Link}
        href={href}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <Avatar
          src={avatarUrl ?? undefined}
          alt={name}
          sx={theme => ({
            width: avatarSize,
            height: avatarSize,
            backgroundColor: theme.palette.primaryContainer,
            color: theme.palette.onPrimaryContainer,
          })}
        >
          {avatarInitials(name)}
        </Avatar>
        <Box>
          <Typography variant={variant} sx={{ color: theme => theme.palette.primary.main, fontWeight: 600 }}>
            {name}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <StyledTeacherEntityLink href={href}>
      <Typography variant={variant} component="span" sx={{ fontWeight: 600 }}>
        {name}
      </Typography>
    </StyledTeacherEntityLink>
  );
}
