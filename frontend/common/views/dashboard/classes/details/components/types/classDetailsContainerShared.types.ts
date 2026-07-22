import type { ClassDetailsViewModel } from "@/frontend/common/views/dashboard/classes/details/hooks/useClassDetailsViewModel";
import type { ClassDetailsContentProps } from "@/frontend/common/views/dashboard/classes/details/types";

export interface ClassDetailsContainerSlotProps {
  readonly PageContainer: React.ComponentType<{ readonly children: React.ReactNode }>;
  readonly ClassDetailsContent: React.ComponentType<Readonly<ClassDetailsContentProps>>;
}

export interface ClassDetailsContainerBodyProps {
  readonly viewModel: ClassDetailsViewModel;
  readonly slots: ClassDetailsContainerSlotProps;
}
