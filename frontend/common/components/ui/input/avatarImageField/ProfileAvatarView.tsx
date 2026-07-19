"use client";

import { PersonOutlined } from "@mui/icons-material";
import { alpha, Box, Typography } from "@mui/material";
import Image from "next/image";

const AVATAR_SIZE_PX = 112;

export type ProfileAvatarViewProps = {
  readonly imageUrl?: string | null;
  readonly label: string;
  readonly title?: string;
};

/**
 * Read-only avatar panel matching the mobile edit avatar card
 * (frosted surface, centered title, conic ring).
 */
export function ProfileAvatarView({ imageUrl, label, title }: Readonly<ProfileAvatarViewProps>): React.ReactNode {
  const heading = title ?? label;

  return (
    <Box
      sx={theme => ({
        width: "100%",
        borderRadius: theme.layout.radius.section,
        border: `1px solid ${alpha(theme.palette.outlineVariant, 0.6)}`,
        backgroundColor: alpha(theme.palette.surfaceContainer, 0.72),
        backdropFilter: "blur(16px)",
        px: 2,
        py: 2.5,
      })}
    >
      <Typography
        sx={theme => ({
          typography: "titleMd",
          color: theme.palette.onSurface,
          mb: 2,
          textAlign: "center",
        })}
      >
        {heading}
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Box
          sx={theme => ({
            width: AVATAR_SIZE_PX,
            height: AVATAR_SIZE_PX,
            borderRadius: "50%",
            p: "3px",
            background: `conic-gradient(from 210deg, ${theme.palette.primary.main} 0 62%, transparent 62% 100%)`,
          })}
        >
          <Box
            sx={theme => ({
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              overflow: "hidden",
              backgroundColor: theme.palette.surfaceContainerHighest,
              border: `2px solid ${theme.palette.surface}`,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            {imageUrl ? (
              <Image src={imageUrl} alt={label} fill priority unoptimized style={{ objectFit: "cover" }} />
            ) : (
              <PersonOutlined sx={theme => ({ fontSize: 40, color: theme.palette.text.secondary })} />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
