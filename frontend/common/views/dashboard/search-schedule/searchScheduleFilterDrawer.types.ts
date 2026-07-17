import type { SearchScheduleDraftFilters } from "@/frontend/common/stores/searchScheduleStore";

export interface SearchScheduleFilterDrawerProps {
  readonly open: boolean;
  readonly draft: SearchScheduleDraftFilters;
  readonly onClose: () => void;
  readonly onDraftChange: (draft: Partial<SearchScheduleDraftFilters>) => void;
  readonly onApply: () => void;
}
