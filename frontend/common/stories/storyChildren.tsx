import { Typography } from "@mui/material";
import type { ReactNode } from "react";

/**
 * Preview children used by mobile card/container stories that need a
 * `args.children` slot but otherwise have no inputs. Three dup patterns from
 * Sonar cluster 1:
 *  1. The "Low-level mobile BaseCard — theme radius, border, and shadow..."
 *     block.
 *  2. The "This is a MobileBaseCard component..." block.
 *  3. The "Content of the section panel goes here..." block.
 *
 * Use these helpers instead of repeating the literal JSX in each story file.
 */

export function mobileBaseCardCorePreview(
  text = "Low-level mobile BaseCard — theme radius, border, and shadow. Used internally by MobileMetricCard."
): ReactNode {
  return <Typography variant="body1">{text}</Typography>;
}

export function mobileBaseCardPreview(
  text = "This is a MobileBaseCard component. It provides a standard container with theme-compliant radius, border, and shadow."
): ReactNode {
  return <Typography variant="body1">{text}</Typography>;
}

export function mobileSectionPanelPreview(
  text = "Content of the section panel goes here. It is wrapped in a mobile-tuned Paper shell with optional edge-to-edge layout."
): ReactNode {
  return <Typography variant="bodyMd">{text}</Typography>;
}

/**
 * Generic one-line preview block — used for stories that just need to drop a
 * label into a slot. Keeps the inline JSX out of the story file.
 */
export function previewTypography(text: string, variant: "body1" | "bodyMd" | "body2" = "bodyMd"): ReactNode {
  return <Typography variant={variant}>{text}</Typography>;
}
