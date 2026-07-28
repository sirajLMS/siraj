import type { SearchScheduleDraftFilters } from "@/frontend/common/stores/searchScheduleStore";
import type { SearchScheduleLabels } from "@/shared/locale/types/dashboard/core/searchSchedule";

export interface SearchScheduleFilterDrawerProps {
  readonly labels: SearchScheduleLabels;
  readonly open: boolean;
  readonly draft: SearchScheduleDraftFilters;
  readonly onClose: () => void;
  readonly onDraftChange: (draft: Partial<SearchScheduleDraftFilters>) => void;
  readonly onApply: () => void;
}
