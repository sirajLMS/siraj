"use client";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";

export function UserSelectOptionRow({
  option,
  showEmail = false,
}: {
  readonly option: PersonOption;
  readonly showEmail?: boolean;
}) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0, width: "100%" }}>
      <Avatar src={option.avatarUrl ?? undefined} alt="" sx={{ width: 28, height: 28, flexShrink: 0 }}>
        {option.name.slice(0, 1)}
      </Avatar>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="bodyMd" noWrap>
          {option.name}
        </Typography>
        {showEmail && option.email ? (
          <Typography variant="bodyMd" noWrap sx={theme => ({ color: theme.palette.text.secondary })}>
            {option.email}
          </Typography>
        ) : null}
      </Box>
    </Stack>
  );
}
