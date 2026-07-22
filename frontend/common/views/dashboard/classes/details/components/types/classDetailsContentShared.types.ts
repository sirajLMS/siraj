import type {
  ClassDetailsContentProps,
  ClassDetailsHeaderProps,
} from "@/frontend/common/views/dashboard/classes/details/types";

export interface ClassDetailsContentSlotProps {
  readonly Header: React.ComponentType<Readonly<ClassDetailsHeaderProps>>;
}

export interface ClassDetailsContentSharedProps {
  readonly props: Readonly<ClassDetailsContentProps>;
  readonly slots: ClassDetailsContentSlotProps;
}
