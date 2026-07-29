// NEW FOR PLAN v5 (newly created for the migration wave)
import type { PermissionsLabels } from "@/shared/locale";
export type OverridesToolbarMode = "effective" | "edit";

export interface OverridesToolbarProps {
  readonly labels: PermissionsLabels;
  readonly mode: OverridesToolbarMode;
  readonly onModeChange: (mode: OverridesToolbarMode) => void;
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
}
