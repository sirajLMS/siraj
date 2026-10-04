import type { SxProps, Theme } from "@mui/material";
import type {
  SearchScheduleFormProps,
  SearchScheduleSortMenuProps,
} from "@/frontend/common/views/dashboard/search-schedule/types";

export interface SearchScheduleFormSlotProps {
  /** Tier-specific teacher autocomplete — desktop or mobile variant. */
  readonly TeacherAutocomplete: React.FC<{
    readonly value: SearchScheduleFormProps["selectedTeacher"];
    readonly onChange: SearchScheduleFormProps["onSelectTeacher"];
    readonly label: string;
    readonly placeholder: string;
  }>;
  /** Tier-specific sort menu component. */
  readonly SortMenu: React.FC<Readonly<SearchScheduleSortMenuProps>>;
  /** Tier-specific filter drawer component. */
  readonly FilterDrawer: React.FC<{
    readonly labels: SearchScheduleFormProps["labels"];
    readonly open: boolean;
    readonly draft: SearchScheduleFormProps["draft"];
    readonly onClose: () => void;
    readonly onDraftChange: SearchScheduleFormProps["onDraftChange"];
    readonly onApply: () => void;
  }>;
  /** Outer form box sx — desktop uses flex-wrap row, mobile uses column. */
  readonly formBoxSx: SxProps<Theme>;
  /** Date range wrapper Box sx. */
  readonly dateRangeBoxSx: SxProps<Theme>;
  /** Time range wrapper Box sx. */
  readonly timeRangeBoxSx: SxProps<Theme>;
  /** Teacher select wrapper Box sx. */
  readonly teacherBoxSx: SxProps<Theme>;
  /** Action row Box sx (sort + filters + search button container). */
  readonly actionRowBoxSx: SxProps<Theme>;
  /** Inner actions wrapper Box sx (sort + filter icon row). Mobile wraps in a left-aligned box. */
  readonly innerActionsBoxSx?: SxProps<Theme>;
}

export type SearchScheduleFormSharedProps = SearchScheduleFormProps & SearchScheduleFormSlotProps;
