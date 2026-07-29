import type * as React from "react";

export type ScheduleSessionPersonAccentTone = "teacher" | "student" | "default";

export interface ScheduleSessionMetaStatItem {
  readonly label: string;
  readonly value: React.ReactNode;
  readonly tone?: ScheduleSessionPersonAccentTone;
}

export interface ScheduleSessionCardPersonCellProps {
  readonly name: string;
  readonly label: string;
  readonly tone: ScheduleSessionPersonAccentTone;
  readonly href?: string;
  readonly avatarUrl?: string | null;
}
