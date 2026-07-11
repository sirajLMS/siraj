/**
 * Shared frontend types that have no GraphQL-generated equivalent.
 *
 * These types are used by both stores and views and are intentionally
 * UI-only — they represent filter states, display options, or other
 * concepts that exist only on the frontend.
 */

import type { SvgIconComponent } from "@mui/icons-material";
import type {
  ClassExecutionState,
  ClassOutcome,
  CountryCode,
  CurrencyCode,
  EffectiveMeeting,
  Gender,
  InvoiceType,
  ManagerOnboardingInput,
  ParentOnboardingInput,
  TeacherOnboardingInput,
} from "@/frontend/graphql/generated/gql/graphql-types";
import type { MeetingProviderFieldsFragment } from "@/frontend/graphql/generated/gql/operations";
import type { OnboardingPaymentMethodFormValues } from "@/frontend/views/dashboard/profile/shared/payment-methods/paymentMethodFormSchema";

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
  readonly variant?: "default" | "error" | "highlight" | "danger" | "compact";
}

export interface TeacherFilterItem {
  readonly id: string;
  readonly name: string;
}

export interface DashboardFilters {
  readonly date: string;
  readonly teacherId: string;
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

export type ManagerRoleFilter = "all" | "admin" | "staff";

export type ManagerStatusFilter = "all" | "active" | "offline";

// --- Reschedule ---

export interface RescheduleSession {
  readonly sessionId: string;
  readonly teacherName: string;
  readonly studentName: string;
  readonly teacherTimezone: string;
  readonly effectiveMeeting?:
    | import("@/frontend/graphql/types/meeting-class-config.operations").EffectiveMeetingFieldsFragment
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
  readonly effectiveMeeting?: EffectiveMeeting | null;
  readonly isFrozen?: boolean | null;
}

export interface TeacherDashboardMetrics {
  readonly totalClasses: number;
  readonly missedSlots: number;
  readonly completed: number;
  readonly studentsToday: number;
  readonly activeSessions?: number;
}

export type TeacherProgressFeedEventKind =
  | "auto_missed"
  | "marked_absent"
  | "activated"
  | "started"
  | "completed"
  | "leave"
  | "other";

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

export type ManagerOnboardingFormData = CleanInput<ManagerOnboardingInput>;

export type ParentOnboardingFormData = Omit<
  CleanInput<ParentOnboardingInput>,
  "password" | "phone" | "address" | "feeAmount" | "currency" | "invoiceType" | "initialPayinMethod" | "timezone"
> & {
  phone: string;
  address: string;
  feeAmount: string;
  currency: CurrencyCode;
  invoiceType: InvoiceType;
  payinMethod: OnboardingPaymentMethodFormValues;
  timezone: string;
  meetingProvider?: MeetingProviderFieldsFragment | null;
  meetingUrl?: string;
  meetingLabel?: string;
};

export type TeacherOnboardingFormData = Omit<
  CleanInput<TeacherOnboardingInput>,
  | "password"
  | "timezoneId"
  | "nationalId"
  | "phone"
  | "countryCode"
  | "timezone"
  | "hourlyRate"
  | "rateCurrency"
  | "initialPayoutMethod"
  | "gender"
> & {
  nationalId: string;
  phone: string;
  countryCode: CountryCode;
  timezone: string;
  hourlyRate: string;
  rateCurrency: CurrencyCode;
  payoutMethod: OnboardingPaymentMethodFormValues;
  gender: Gender;
  meetingProvider?: MeetingProviderFieldsFragment | null;
  meetingUrl?: string;
  meetingLabel?: string;
};
