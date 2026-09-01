import type { ReactNode } from "react";
import type {
  CurrentTeacherCardProps,
  ManagementControlsCardProps,
  ReassignmentBentoGridProps,
  StudentContextCardProps,
} from "@/frontend/common/views/dashboard/teachers/reassignment/types";
import type { TeacherReassignmentViewModel } from "@/frontend/common/views/dashboard/teachers/reassignment/useTeacherReassignmentViewModel";

export interface TeacherReassignmentViewSlotProps {
  readonly PageContainer: React.ComponentType<{ readonly children: ReactNode }>;
  readonly PageHeader: React.ComponentType<{
    readonly title: string;
    readonly subtitle: string;
    readonly breadcrumbs?: ReadonlyArray<{ readonly label: string; readonly href?: string; readonly active?: boolean }>;
  }>;
  readonly ContentLayout: React.ComponentType<{ readonly children: ReactNode }>;
  readonly LeftPanel: React.ComponentType<{ readonly children: ReactNode }>;
  readonly RightPanel: React.ComponentType<{ readonly children: ReactNode }>;
  readonly StudentContextCard: React.ComponentType<Readonly<StudentContextCardProps>>;
  readonly CurrentTeacherCard: React.ComponentType<Readonly<CurrentTeacherCardProps>>;
  readonly ManagementControlsCard: React.ComponentType<Readonly<ManagementControlsCardProps>>;
  readonly ReassignmentBentoGrid: React.ComponentType<Readonly<ReassignmentBentoGridProps>>;
  readonly statusLabelIdSuffix: string;
  readonly breadcrumbs?: ReadonlyArray<{ readonly label: string; readonly href?: string; readonly active?: boolean }>;
}

export interface TeacherReassignmentViewSharedProps {
  readonly viewModel: Readonly<TeacherReassignmentViewModel>;
  readonly slots: TeacherReassignmentViewSlotProps;
}
