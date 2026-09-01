/**
 * Shared frontend types that have no GraphQL-generated equivalent.
 *
 * These types are used by both stores and views and are intentionally
 * UI-only — they represent filter states, display options, or other
 * concepts that exist only on the frontend.
 */

import type { SvgIconComponent } from "@mui/icons-material";
import type { TypographyProps } from "@mui/material/Typography";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import type {
  ClassExecutionState,
  ClassOutcome,
  CurrencyCode,
  EffectiveMeetingFieldsFragment,
  InvoiceType,
  ManagerOnboardingInput,
  MeetingProviderFieldsFragment,
  ParentOnboardingInput,
  TeacherProgressFeedEventKind,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { OnboardingPaymentMethodFormValues } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/paymentMethodFormSchema";

// --- Parent Complaints ---

export interface ParentStudentOption {
  readonly id: string;
  readonly label: string;
}

// --- Dashboard ---

/**
 * Keys for admin dashboard metrics, used for type-safe translation keys.
 */
export type AdminMetricKey =
  | "total"
  | "regular"
  | "trial"
  | "advance"
  | "rescheduled"
  | "suspended"
  | "taken"
  | "pending"
  | "activated"
  | "running"
  | "absent"
  | "leave";

export interface MetricItem {
  readonly key: string;
  readonly count: number | string;
  readonly labelKey: string;
  readonly label?: string;
  readonly icon: SvgIconComponent;
  readonly subLabel?: string;
  readonly variant?: "default" | "error" | "highlight" | "danger";
}

export type MetricItemVariant = NonNullable<MetricItem["variant"]>;
export type UiTypographyVariant = NonNullable<TypographyProps["variant"]>;
export type UiTypographyVariantLoose = UiTypographyVariant | (string & {});

export interface TeacherFilterItem {
  readonly id: string;
  readonly name: string;
}

export interface DashboardFilters {
  readonly date: string;
  readonly teacherId: string;
  readonly selectedTeacher: PersonOption | null;
  readonly searchQuery: string;
  readonly debouncedSearchQuery: string;
  readonly selectedStatus: AdminMetricKey | null;
}

export interface Pagination {
  readonly page: number;
  readonly totalItems: number;
  readonly pageSize: number;
}

// --- Learning Resources ---

export type ResourceFileType = "pdf" | "pptx" | "xlsx" | "docx";

export type ResourceSortBy = "date" | "name";

export type ResourceFilterType = ResourceFileType | "all";

// --- Managers Directory ---

export type ManagerRoleFilter = "all" | "admin" | "manager" | "supervisor";

export type ManagerStatusFilter = "all" | "active" | "offline";

// --- Reschedule ---

export interface RescheduleSession {
  readonly sessionId: string;
  readonly teacherName: string;
  readonly studentName: string;
  readonly teacherTimezone: string;
  readonly effectiveMeeting?:
    | import("@/frontend/common/graphql/generated/gql/graphql").EffectiveMeetingFieldsFragment
    | null;
}

// --- Teacher Dashboard ---

export type TeacherSessionStatus =
  | "missed"
  | "pending"
  | "upcoming"
  | "completed"
  | "active"
  | "connecting"
  | "activated";

export interface TeacherScheduleRow {
  readonly id: string;
  readonly rowNumber: number;
  readonly classId: string;
  readonly studentName: string;
  readonly studentInitials: string;
  readonly timeRange: string;
  readonly status: TeacherSessionStatus;
  readonly executionState?: ClassExecutionState | null;
  readonly outcome?: ClassOutcome | null;
  readonly videoEnabled: boolean;
  readonly activateEnabled: boolean;
  readonly activateDisabledReason?: "before_window" | "after_window" | null;
  readonly markAbsentEnabled?: boolean;
  readonly durationMinutes?: number;
  readonly scheduledStartAt?: Date;
  readonly scheduledEndAt?: Date;
  readonly courseTitle?: string;
  readonly locationLabel?: string;
  readonly isLive?: boolean;
  readonly isCurrent?: boolean;
  readonly studentId?: string;
  readonly meetingJoinUrl?: string | null;
  readonly meetingUrlStatus?: string | null;
  readonly meetingUrlError?: string | null;
  readonly effectiveMeeting?: EffectiveMeetingFieldsFragment | null;
  readonly isFrozen?: boolean | null;
}

export interface StudentProgressFeedItem {
  readonly id: string;
  readonly studentId: string;
  readonly studentName: string;
  readonly studentInitials: string;
  readonly summary: string;
  readonly scheduledTime: string | null;
  readonly durationMinutes: number | null;
  readonly eventKind: TeacherProgressFeedEventKind;
  readonly occurredAt: string | Date;
  readonly timeAgo: string;
  readonly infoTooltip: string | null;
}

export interface MissedClassAlert {
  readonly classId: string;
  readonly scheduledTime: string;
}

// --- Onboarding Form Data ---
// These types derive from GraphQL generated input types but adjust
// nullability for form field handling (forms use empty strings,
// while the GQL input uses null for optional fields).

type CleanField<T> = T extends null ? undefined : T;
type CleanInput<T> = {
  [K in keyof T as undefined extends CleanField<T[K]> ? K : never]?: CleanField<T[K]>;
} & {
  [K in keyof T as undefined extends CleanField<T[K]> ? never : K]: CleanField<T[K]>;
};

export type ManagerOnboardingFormData = Omit<CleanInput<ManagerOnboardingInput>, "timezone" | "displayCurrency"> & {
  timezone: string;
  displayCurrency?: CurrencyCode | null;
};

export type ParentOnboardingFormData = Omit<
  CleanInput<ParentOnboardingInput>,
  "phone" | "address" | "feeAmount" | "currency" | "invoiceType" | "initialPayinMethod" | "timezone" | "displayCurrency"
> & {
  phone?: string;
  address?: string;
  feeAmount?: string;
  currency: CurrencyCode;
  invoiceType?: InvoiceType | null;
  payinMethod?: OnboardingPaymentMethodFormValues | null;
  timezone: string;
  displayCurrency?: CurrencyCode | null;
  meetingProvider?: MeetingProviderFieldsFragment | null;
  meetingUrl?: string;
  meetingLabel?: string;
};
