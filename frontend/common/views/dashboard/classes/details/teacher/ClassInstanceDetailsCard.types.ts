import type { ReactNode } from "react";
import type { ClassInstanceStatus } from "@/frontend/common/views/dashboard/types/dashboard";

export type SessionBadgeStatus = "active" | "confirmed" | "pending" | "completed" | "cancelled";

export interface ClassInstanceDetailsCardProps {
  readonly studentId: string;
  readonly studentName: string;
  readonly courseModule: string;
  readonly subjectId: string;
  readonly subjectName: string;
  readonly subjectAvatarUrl?: string | null;
  readonly startTime: string;
  readonly endTime: string;
  readonly durationMinutes: number;
  readonly status: ClassInstanceStatus;
  readonly rateAmount: string | null;
  readonly rateCurrency: string | null;
  readonly rateSource: string | null;
  readonly isRateOverridden: boolean;
  readonly hideStudentField?: boolean;
  readonly hideRateSection?: boolean;
  readonly labels: {
    readonly classInstanceDetails: string;
    readonly studentName: string;
    readonly courseModule: string;
    readonly startTime: string;
    readonly endTime: string;
    readonly duration: string;
    readonly status: string;
    readonly viewSubject: string;
    readonly minutes: string;
    readonly statusLabels: Record<ClassInstanceStatus, string>;
    readonly rateSectionTitle: string;
    readonly effectiveRateLabel: string;
    readonly rateCurrencyLabel: string;
    readonly rateSourceLabel: string;
    readonly rateSourceOverride: string;
    readonly rateSourceRecurring: string;
    readonly rateSourceSubject: string;
    readonly rateSourceTeacher: string;
  };
}

export interface DetailFieldProps {
  readonly label: string;
  readonly value: ReactNode;
}

export interface ClassInstanceDetailsHeaderProps {
  readonly title: string;
}

export interface ClassInstanceDetailsFieldsProps {
  readonly studentId: string;
  readonly studentName: string;
  readonly subjectId: string;
  readonly displaySubjectName: string;
  readonly subjectAvatarUrl?: string | null;
  readonly startTime: string;
  readonly endTime: string;
  readonly durationMinutes: number;
  readonly statusKey: SessionBadgeStatus;
  readonly statusLabel: string;
  readonly hideStudentField?: boolean;
  readonly labels: ClassInstanceDetailsCardProps["labels"];
}

export interface ClassInstanceRateSectionProps {
  readonly rateAmount: string;
  readonly rateCurrency: string | null;
  readonly rateSourceLabel: string;
  readonly labels: ClassInstanceDetailsCardProps["labels"];
}
