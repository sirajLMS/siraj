"use client";

import { Chip } from "@mui/material";
import Link from "next/link";
import type { KeyboardEvent, Ref } from "react";

export interface MobileTabPillProps {
  readonly label: string;
  readonly href: string;
  readonly isActive: boolean;
  /**
   * Ref to the underlying anchor element. The owning tablist rows use it to
   * drive roving focus for arrow-key navigation.
   */
  readonly tabRef?: Ref<HTMLAnchorElement>;
  /**
   * Key handler supplied by the owning tablist for roving-tabindex arrow-key
   * navigation. Activation stays on Enter/Space via native link behavior.
   */
  readonly onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
}

/**
 * Mobile tab rendered as a Link-wrapped pill Chip. The pill keeps link-tab
 * semantics (real hrefs, no client-side selection state): the active tab is
 * focusable while inactive tabs are removed from the tab order so the owning
 * row can implement roving tabindex.
 */
export function MobileTabPill({ label, href, isActive, tabRef, onKeyDown }: Readonly<MobileTabPillProps>) {
  return (
    <Chip
      component={Link}
      href={href}
      scroll={false}
      role="tab"
      aria-selected={isActive}
      aria-current={isActive ? "page" : undefined}
      label={label}
      clickable
      tabIndex={isActive ? 0 : -1}
      ref={tabRef}
      onKeyDown={onKeyDown}
      sx={theme => ({
        flexShrink: 0,
        textDecoration: "none",
        ...(isActive
          ? {
              bgcolor: theme.palette.primary.main,
              color: theme.palette.onPrimary,
              borderColor: theme.palette.primary.dark,
            }
          : {
              bgcolor: "transparent",
              color: theme.palette.text.primary,
              borderColor: theme.palette.divider,
            }),
        borderWidth: 1,
        borderStyle: "solid",
      })}
    />
  );
}
