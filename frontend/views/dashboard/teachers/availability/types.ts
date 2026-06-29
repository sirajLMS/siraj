import type { DayOfWeek, Gender } from "@/frontend/graphql/generated/gql/graphql-types";

export interface AvailabilityEntry {
  readonly id: string;
  readonly teacherName: string;
  readonly localTime: string;
}

export interface WeeklyAvailability {
  readonly [time: string]: {
    readonly [K in DayOfWeek]?: AvailabilityEntry[];
  };
}

export interface TeacherAvailabilityInsights {
  readonly peakLoad: string;
  readonly availableStaff: number;
  readonly timezones: readonly string[];
}

export interface TeacherAvailabilityViewProps {
  readonly availability: WeeklyAvailability;
  readonly insights: TeacherAvailabilityInsights;
  readonly defaultFilters: AvailabilitySearchFormData;
  readonly loading?: boolean;
  readonly onExportPdf?: () => void;
}

export interface WeeklyAvailabilityGridLabels {
  readonly time: string;
  readonly monday: string;
  readonly tuesday: string;
  readonly wednesday: string;
  readonly thursday: string;
  readonly friday: string;
  readonly saturday: string;
  readonly sunday: string;
  readonly mon: string;
  readonly tue: string;
  readonly wed: string;
  readonly thu: string;
  readonly fri: string;
  readonly sat: string;
  readonly sun: string;
}

export interface WeeklyAvailabilityGridProps {
  readonly availability: WeeklyAvailability;
  readonly labels: WeeklyAvailabilityGridLabels;
  readonly onBlockClick?: (entry: AvailabilityEntry) => void;
}

export interface InsightCardProps {
  readonly title: string;
  readonly value: string;
  readonly description: string;
  readonly icon: React.ReactNode;
}

export interface AvailabilityInsightsProps {
  readonly insights: TeacherAvailabilityInsights;
}

export interface TimeFieldProps {
  readonly label: string;
  readonly name: "fromTime" | "toTime";
}

export interface AvailabilitySearchFormData {
  readonly fromTime: Date | null;
  readonly toTime: Date | null;
  readonly gender: Gender | null;
}

export interface AvailabilitySearchFormProps {
  readonly onSearch?: (formData: AvailabilitySearchFormData) => void;
}
