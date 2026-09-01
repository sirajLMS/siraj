import type {
  ClassDetailsContentProps,
  ClassDetailsHeaderProps,
  ClassDetailsMetricGridSlot,
} from "@/frontend/common/views/dashboard/classes/details/types";

interface ClassDetailsContentSlotProps {
  readonly Header: React.ComponentType<Readonly<ClassDetailsHeaderProps>>;
  /** Teacher/parent performance overview grid (injected by tier content). */
  readonly TeacherPerformanceMetricGrid: ClassDetailsMetricGridSlot;
  /** Admin live performance grid (injected by tier content). */
  readonly LivePerformanceMetricGrid: ClassDetailsMetricGridSlot;
}

export interface ClassDetailsContentSharedProps {
  readonly props: Readonly<ClassDetailsContentProps>;
  readonly slots: ClassDetailsContentSlotProps;
}
