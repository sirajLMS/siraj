"use client";

import { alpha, Stack, type Theme } from "@mui/material";
import type { ReactNode } from "react";
import {
  ActionButtons,
  ClassInfo,
  DateSquare,
} from "@/frontend/common/views/dashboard/teachers/futureSchedule/components/futureClassCardShared.parts";
import type { FutureClassCardScaffoldProps } from "@/frontend/common/views/dashboard/teachers/futureSchedule/types/futureClassCardShared.types";

const desktopCardSx = (theme: Theme) => ({
  p: 3,
  "&:hover": { border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` },
  transition: theme.transitions.create("all", { duration: 200 }),
});

function buildCardSx(outerDirection: "row" | "column") {
  return outerDirection === "row" ? desktopCardSx : undefined;
}

export function FutureClassCardShared({
  item,
  onRequestLeave,
  labels,
  slots,
  style,
}: Readonly<FutureClassCardScaffoldProps>) {
  const { CardComponent } = slots;
  const isRescheduled = item.isRescheduled === true;
  const cardSx = buildCardSx(style.outerDirection);

  const innerContent: ReactNode = (
    <Stack direction={style.outerDirection} spacing={2} sx={{ justifyContent: "space-between" }}>
      <Stack direction="row" spacing={2} sx={{ flex: 1 }}>
        <DateSquare date={item.scheduledDate ?? ""} isRescheduled={isRescheduled} />
        <ClassInfo item={item} labels={labels} slots={slots} style={style} />
      </Stack>
      <ActionButtons item={item} onRequestLeave={onRequestLeave} labels={labels} slots={slots} style={style} />
    </Stack>
  );

  return <CardComponent sx={cardSx}>{innerContent}</CardComponent>;
}
