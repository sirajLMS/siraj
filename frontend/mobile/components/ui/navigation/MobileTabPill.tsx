"use client";

import { Chip } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import Link from "next/link";
import type { KeyboardEvent, Ref } from "react";

export interface MobileTabPillProps {
  readonly label: string;
  readonly isActive: boolean;
  /**
   * Link mode: real hrefs for route-driven tabs. The active tab is focusable
   * while inactive tabs are removed from the tab order so the owning row can
   * implement roving tabindex.
   */
  readonly href?: string;
  /**
   * Tab mode: click-based selection for stateful tab switching. Activation
   * stays on Enter/Space and every pill remains in the tab order.
   */
  readonly onClick?: () => void;
  /**
   * Ref to the underlying anchor element (link mode only). The owning tablist
   * rows use it to drive roving focus for arrow-key navigation.
   */
  readonly tabRef?: Ref<HTMLAnchorElement>;
  /**
   * Key handler supplied by the owning tablist for roving-tabindex arrow-key
   * navigation. Activation stays on Enter/Space (native link behavior in link
   * mode, explicit handling in tab mode).
   */
  readonly onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
}

function buildPillSx(isActive: boolean) {
  return (theme: Theme) => ({
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
  });
}

/**
 * Mobile tab rendered as a pill Chip. Two modes share the active/inactive
 * styling and aria semantics (role/aria-selected/aria-current):
 * - link mode (`href`): Next.js Link pill with real hrefs and no client-side
 *   selection state — Enter/Space activate natively.
 * - tab mode (`onClick`): clickable pill for stateful tab switching —
 *   Enter/Space activate explicitly.
 */
export function MobileTabPill({ label, isActive, href, onClick, tabRef, onKeyDown }: Readonly<MobileTabPillProps>) {
  if (href) {
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
        sx={buildPillSx(isActive)}
      />
    );
  }

  return (
    <Chip
      role="tab"
      aria-selected={isActive}
      aria-current={isActive ? "page" : undefined}
      label={label}
      clickable
      tabIndex={0}
      onClick={onClick}
      onKeyDown={event => {
        onKeyDown?.(event);
        if (!event.defaultPrevented && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onClick?.();
        }
      }}
      sx={buildPillSx(isActive)}
    />
  );
}
