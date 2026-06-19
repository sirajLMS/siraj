"use client";

import { Avatar, Box, Typography } from "@mui/material";
import type { PermissionGroup, User } from "@/frontend/graphql/generated/gql/graphql-types";

interface OverridesUserSidebarProps {
  readonly user: User;
  readonly userGroups: readonly PermissionGroup[];
}

export function OverridesUserSidebar({ user, userGroups }: Readonly<OverridesUserSidebarProps>) {
  return (
    <Box
      sx={theme => ({
        width: { xs: "100%", md: "25%" },
        borderRight: { xs: "none", md: `1px solid ${theme.palette.divider}` },
        borderBottom: { xs: `1px solid ${theme.palette.divider}`, md: "none" },
        p: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        bgcolor: theme.palette.surfaceContainerLow ?? "transparent",
        gap: 3,
      })}
    >
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <Avatar
          src={user.avatarUrl ?? undefined}
          alt={user.name ?? ""}
          sx={theme => ({
            width: 80,
            height: 80,
            bgcolor: theme.palette.primaryContainer,
            color: theme.palette.onPrimaryContainer,
            fontSize: "2rem",
            fontWeight: 600,
          })}
        >
          {user.name
            ?.split(" ")
            .map(w => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="titleLg" sx={{ fontWeight: 600 }}>
            {user.name}
          </Typography>
          <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
            {user.email}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ width: "100%", textAlign: "left" }}>
        <Typography
          variant="bodyMd"
          sx={theme => ({
            textTransform: "uppercase",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: theme.palette.text.secondary,
            mb: 1.5,
            letterSpacing: "0.05em",
          })}
        >
          Current Groups
        </Typography>
        {userGroups.length === 0 ? (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.disabled, fontStyle: "italic" })}>
            No assigned groups
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {userGroups.map(g => (
              <Box
                key={g.id || g.slug}
                sx={theme => ({
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 2,
                  py: 1,
                  borderRadius: 1.5,
                  border: `1px solid ${theme.palette.border?.light ?? theme.palette.divider}`,
                  bgcolor: theme.palette.secondaryContainer,
                  color: theme.palette.onSecondaryContainer,
                })}
              >
                <Typography variant="bodyMd" sx={{ fontWeight: 500, fontSize: "0.875rem" }}>
                  {g.name}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
