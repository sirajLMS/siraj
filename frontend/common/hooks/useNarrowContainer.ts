"use client";

import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";

// NEW FOR PLAN v5: migrated hook from frontend/common/components/ui/input/localizedString/useNarrowContainer.ts
//   to frontend/common/hooks/ to satisfy specs.md §2.4 allowlist —
//   to frontend/common/hooks/ to satisfy specs.md §2.4 allowlist —
//   @/frontend/common/hooks/** is the only hooks allowlist for tier imports.

/**
 * Returns `true` when the observed element's layout width is below the theme
 * `sm` breakpoint (default 600px).
 *
 * Use this instead of viewport-only `useMediaQuery(down("sm"))` so compact
 * adornments activate inside narrow desktop panels (dialogs, grid columns,
 * sidebars) as well as on phones.
 */
export function useNarrowContainer(
  containerRef: React.RefObject<HTMLElement | null>,
  /** Pixel width below which the container counts as narrow; defaults to theme `sm`. */
  narrowMaxWidth?: number
): boolean {
  const theme = useTheme();
  const threshold = narrowMaxWidth ?? theme.breakpoints.values.sm;
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const measure = () => {
      setIsNarrow(element.getBoundingClientRect().width < threshold);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef, threshold]);

  return isNarrow;
}
