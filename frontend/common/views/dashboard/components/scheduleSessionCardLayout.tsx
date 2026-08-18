"use client";

import {
  StyledScheduleSessionMetaLabel,
  StyledScheduleSessionMetaPanel,
  StyledScheduleSessionMetaTile,
  StyledScheduleSessionMetaValue,
  StyledScheduleSessionPersonAvatar,
  StyledScheduleSessionPersonCell,
  StyledScheduleSessionPersonContentRow,
  StyledScheduleSessionPersonLabel,
  StyledScheduleSessionPersonName,
  StyledScheduleSessionPersonText,
} from "@/frontend/common/views/dashboard/components/scheduleSessionCardLayout.styles";
import type {
  ScheduleSessionCardPersonCellProps,
  ScheduleSessionMetaStatItem,
} from "@/frontend/common/views/dashboard/components/scheduleSessionCardLayout.types";
import { getNameInitials } from "@/frontend/common/views/dashboard/utils/nameInitials";
import { Link } from "@/shared/i18n";

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

export function ScheduleSessionCardPersonCell({
  name,
  label,
  tone,
  href,
  avatarUrl,
}: ScheduleSessionCardPersonCellProps) {
  return (
    <StyledScheduleSessionPersonCell>
      <StyledScheduleSessionPersonLabel variant="labelMd" title={label}>
        {label}
      </StyledScheduleSessionPersonLabel>
      <StyledScheduleSessionPersonContentRow>
        <StyledScheduleSessionPersonAvatar src={avatarUrl ?? undefined} alt={name} aria-hidden={!avatarUrl}>
          {getNameInitials(name)}
        </StyledScheduleSessionPersonAvatar>
        <StyledScheduleSessionPersonText>
          <StyledScheduleSessionPersonName
            variant="bodyMd"
            title={name}
            tone={tone}
            {...(href ? { component: Link, href } : {})}
            sx={
              href
                ? {
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                  }
                : undefined
            }
          >
            {name}
          </StyledScheduleSessionPersonName>
        </StyledScheduleSessionPersonText>
      </StyledScheduleSessionPersonContentRow>
    </StyledScheduleSessionPersonCell>
  );
}
