"use client";

import { Box, Skeleton, Typography } from "@mui/material";

const LIST_SKELETON_KEYS = ["skeleton-0", "skeleton-1", "skeleton-2"] as const;

/** Inline error notice shown while the list has no rows to display. */
export function MobileListErrorNotice(props: Readonly<{ visible: boolean; message: string }>) {
  const { visible, message } = props;
  if (!visible) return null;
  return (
    <Typography variant="bodyMd" sx={theme => ({ px: 2, color: theme.palette.error.main })}>
      {message}
    </Typography>
  );
}

/** Placeholder cards rendered while the initial page of rows loads. */
export function MobileListCardSkeletons(props: Readonly<{ height: number }>) {
  const { height } = props;
  return (
    <>
      {LIST_SKELETON_KEYS.map(key => (
        <Box key={key} sx={{ px: 2 }}>
          <Skeleton variant="rounded" height={height} />
        </Box>
      ))}
    </>
  );
}

/** Centered notice shown when the list finished loading with zero rows. */
export function MobileListEmptyNotice(props: Readonly<{ visible: boolean; message: string }>) {
  const { visible, message } = props;
  if (!visible) return null;
  return (
    <Typography variant="bodyMd" sx={{ px: 2, textAlign: "center", py: 4 }}>
      {message}
    </Typography>
  );
}
