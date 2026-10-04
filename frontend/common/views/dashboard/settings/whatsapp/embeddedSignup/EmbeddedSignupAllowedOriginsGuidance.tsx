"use client";

import InfoOutlined from "@mui/icons-material/InfoOutlined";
import OpenInNewOutlined from "@mui/icons-material/OpenInNewOutlined";
import { Box, Button, Typography } from "@mui/material";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

/**
 * First-time operator guidance: Embedded Signup (FB.login) rejects origins not
 * registered in the App Dashboard, so the launch surface deep-links to the
 * "Facebook Login for Business" settings panel in a new tab with the exact
 * origin to register.
 */
export function EmbeddedSignupAllowedOriginsGuidance({
  labels,
  url,
}: Readonly<{ labels: WhatsappLabels; url: string }>) {
  // The dialog only renders in the browser after a user click; the guard keeps
  // static rendering safe without changing what users see.
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const body = labels.embeddedSignupAllowedOriginsBody(origin);
  const originIndex = origin === "" ? -1 : body.indexOf(origin);
  const [beforeOrigin, afterOrigin] =
    originIndex === -1 ? [body, ""] : [body.slice(0, originIndex), body.slice(originIndex + origin.length)];
  return (
    <Box
      component="section"
      sx={theme => ({
        display: "flex",
        flexDirection: "column",
        gap: 1,
        p: 2,
        border: 1,
        borderColor: theme.palette.divider,
        // String radius: numeric values are multiplied by shape.borderRadius in
        // this theme's sx system, which would turn the token into a pill corner.
        borderRadius: `${theme.shape.borderRadius}px`,
      })}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <InfoOutlined fontSize="small" sx={{ color: theme => theme.palette.text.secondary }} />
        <Typography variant="labelMd" sx={{ fontWeight: 700 }}>
          {labels.embeddedSignupAllowedOriginsTitle}
        </Typography>
      </Box>
      <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, lineHeight: 1.7 }}>
        {beforeOrigin}
        {originIndex === -1 ? null : (
          <Box
            component="code"
            dir="ltr"
            sx={theme => ({
              fontFamily: "monospace",
              fontSize: "0.8125em",
              px: 0.75,
              py: 0.25,
              mx: 0.5,
              borderRadius: "4px",
              backgroundColor: theme.palette.action.hover,
              color: theme.palette.text.primary,
            })}
          >
            {origin}
          </Box>
        )}
        {afterOrigin}
      </Typography>
      <Button
        variant="outlined"
        color="inherit"
        size="small"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        endIcon={<OpenInNewOutlined fontSize="small" />}
        sx={{ alignSelf: "flex-start", gap: 0.5 }}
      >
        {labels.embeddedSignupAllowedOriginsLink}
      </Button>
    </Box>
  );
}
