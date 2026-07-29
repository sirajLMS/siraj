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
import { getScheduleSessionNameInitials } from "@/frontend/common/views/dashboard/components/scheduleSessionCardLayout.utils";
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
          <StyledScheduleSessionMetaValue variant="bodyMd" tone={item.tone}>
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
          {getScheduleSessionNameInitials(name)}
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
