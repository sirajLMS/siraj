import type {
  AvailabilityEntry,
  WeeklyAvailability,
  WeeklyAvailabilityGridLabels,
} from "@/frontend/common/views/dashboard/teachers/availability/types";

/**
 * Tier-specific layout options that differ between desktop and mobile variants.
 */
export interface WeeklyAvailabilityGridSharedOptions {
  /** CSS grid template columns (time column + 7 day columns). */
  readonly gridTemplateColumns: string;
  /** Padding on header cells. Desktop: 2, Mobile: 1. */
  readonly headerPadding: number;
  /** MUI Typography variant for header labels. */
  readonly headerLabelVariant: "labelUppercase" | "labelSm";
  /** Padding inside availability blocks. Desktop: 1, Mobile: 0.5. */
  readonly blockPadding: number;
  /** Minimum height of grid rows in px. Desktop: 80, Mobile: 60. */
  readonly rowMinHeight: number;
  /** Padding on day cells. Desktop: 0.5, Mobile: 0.25. */
  readonly cellPadding: number;
  /** Minimum width of the grid container for horizontal scroll. Desktop: 1000, Mobile: 600. */
  readonly gridMinWidth: number;
  /** Whether to add momentum scroll styling (mobile). */
  readonly momentumScroll: boolean;
}

export interface WeeklyAvailabilityGridSharedProps {
  readonly availability: WeeklyAvailability;
  readonly labels: WeeklyAvailabilityGridLabels;
  readonly onBlockClick?: (entry: AvailabilityEntry) => void;
  readonly options: WeeklyAvailabilityGridSharedOptions;
}
