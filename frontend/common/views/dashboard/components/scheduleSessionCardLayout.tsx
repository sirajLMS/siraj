"use client";

import type { Theme } from "@mui/material";
import { PersonProfileLink } from "@/frontend/common/components/ui";
import {
  getPersonAccentColor,
  StyledScheduleSessionMetaLabel,
  StyledScheduleSessionMetaPanel,
  StyledScheduleSessionMetaTile,
  StyledScheduleSessionMetaValue,
  StyledScheduleSessionPersonCell,
} from "@/frontend/common/views/dashboard/components/scheduleSessionCardLayout.styles";
import type {
  ScheduleSessionCardPersonCellProps,
  ScheduleSessionMetaStatItem,
  ScheduleSessionPersonAccentTone,
} from "@/frontend/common/views/dashboard/components/scheduleSessionCardLayout.types";

export type {
  ScheduleSessionCardPersonCellProps,
  ScheduleSessionMetaStatItem,
  ScheduleSessionPersonAccentTone,
} from "@/frontend/common/views/dashboard/components/scheduleSessionCardLayout.types";

export function ScheduleSessionCardMetaBar({ items }: { readonly items: readonly ScheduleSessionMetaStatItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <StyledScheduleSessionMetaPanel>
      {items.map(item => (
        <StyledScheduleSessionMetaTile key={item.label}>
          <StyledScheduleSessionMetaLabel variant="labelMd" title={item.label}>
            {item.label}
          </StyledScheduleSessionMetaLabel>
          {/* Use `component="span"` when the value is a React element (e.g. a
              ScheduleTimezoneOffsetCell that renders a <div>/<Tooltip>) so the
              Typography doesn't render a <p> containing a block-level <div>,
              which triggers a React hydration error. Plain string values keep
              the default <p>. */}
          <StyledScheduleSessionMetaValue
            variant="bodyMd"
            tone={item.tone}
            {...(typeof item.value !== "string" && typeof item.value !== "number" && typeof item.value !== "boolean"
              ? { component: "span" }
              : {})}
          >
            {item.value}
          </StyledScheduleSessionMetaValue>
        </StyledScheduleSessionMetaTile>
      ))}
    </StyledScheduleSessionMetaPanel>
  );
}

/**
 * Keeps the teacher/student accent on the linked name while reusing the shared
 * profile-link primitive: the tone color always wins over the primitive's
 * default link coloring, matching how the bespoke cell colored the name.
 */
function personCellSx(tone: ScheduleSessionPersonAccentTone) {
  return (theme: Theme) => ({
    "& .MuiStack-root > .MuiTypography-root:last-child": {
      color: getPersonAccentColor(tone, theme),
    },
    "& a:hover .MuiStack-root > .MuiTypography-root:last-child": {
      textDecoration: "underline",
    },
  });
}

export function ScheduleSessionCardPersonCell({
  name,
  label,
  tone,
  href,
  avatarUrl,
}: ScheduleSessionCardPersonCellProps) {
  return (
    <StyledScheduleSessionPersonCell sx={personCellSx(tone)}>
      <PersonProfileLink href={href} name={name} label={label} avatarUrl={avatarUrl} avatarSize={32} />
    </StyledScheduleSessionPersonCell>
  );
}
