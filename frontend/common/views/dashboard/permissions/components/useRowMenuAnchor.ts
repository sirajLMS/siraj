// NEW FOR PLAN v5 (newly created for the migration wave)
import { useCallback, useState } from "react";

export interface RowMenuAnchor {
  readonly anchorEl: HTMLElement | null;
  readonly openMenu: (event: React.MouseEvent<HTMLElement>) => void;
  readonly closeMenu: () => void;
  readonly setAnchorEl: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
}

/**
 * Common hook wrapping the transient MUI popover `anchorEl` state pattern.
 *
 * Lifted (NS-2 / NS-3 N7 lift) so tier row components do not call `useState`
 * directly. The ViewModel composes this hook once per row that needs a popover
 * (or, when only one popover is open at a time across a list, a single shared
 * instance suffices). The hook returns callbacks the tier wires into the
 * row's "more" button + `<Menu>` component.
 *
 * Per specs §6.2, the ViewModel is the sole owner of state; tier views receive
 * `{ anchorEl, openMenu, closeMenu, setAnchorEl }` as plain props.
 */
export function useRowMenuAnchor(): RowMenuAnchor {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const openMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const closeMenu = useCallback(() => {
    setAnchorEl(null);
  }, []);

  return { anchorEl, openMenu, closeMenu, setAnchorEl };
}
