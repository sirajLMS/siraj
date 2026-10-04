"use client";

import { Box, CircularProgress, Typography } from "@mui/material";

/**
 * Loading and empty feedback for chat thread message lists: a centered
 * aria-busy spinner while loading, and a muted empty-copy line once loading
 * finishes with no messages.
 */
export function ThreadMessagesFeedback({
  loading,
  messages,
  emptyText,
}: Readonly<{ loading: boolean; messages: readonly unknown[]; emptyText: string }>) {
  return (
    <>
      {loading ? (
        <Box component="output" sx={{ display: "flex", justifyContent: "center", py: 4 }} aria-busy>
          <CircularProgress size={28} />
        </Box>
      ) : null}
      {!loading && messages.length === 0 ? (
        <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
          {emptyText}
        </Typography>
      ) : null}
    </>
  );
}
