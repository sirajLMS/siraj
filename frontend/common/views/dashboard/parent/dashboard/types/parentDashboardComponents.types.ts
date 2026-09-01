// NEW FOR PLAN v5: Lifted tier-paired Props out of mobile/desktop per specs.md §4.1
// (Class B — unified originals; the mobile/desktop twin interfaces were byte-equal
// modulo whitespace). Both tier files now import these shared declarations.
import type {
  ParentDashboardMetrics,
  ParentLiveClassStatus,
  StudentProgressItem,
  WorkshopPromo,
} from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";

export interface ParentSupportFabProps {
  readonly label: string;
  readonly onClick: () => void;
}

export interface ParentWelcomeHeroProps {
  readonly userName: string;
  readonly welcomeBackLabel: string;
  readonly pendingMessagesLabel: (count: number) => string;
  readonly pendingMessagesCount: number;
}

interface ParentDashboardMetricsRowLabels {
  readonly totalStudents: string;
  readonly todaysClasses: string;
  readonly pendingInvoices: string;
  readonly performanceAvg: string;
}

export interface ParentDashboardMetricsRowProps {
  readonly metrics: ParentDashboardMetrics;
  readonly labels: ParentDashboardMetricsRowLabels;
}

export interface ParentClassStatusIndicatorProps {
  readonly status: ParentLiveClassStatus;
  readonly label: string;
}

interface AcademicProgressSummaryLabels {
  readonly title: string;
  readonly subtitle: string;
  readonly completion: (percent: number) => string;
  readonly downloadReport: string;
}

export interface AcademicProgressSummaryProps {
  readonly studentProgress: readonly StudentProgressItem[];
  readonly labels: AcademicProgressSummaryLabels;
  readonly onDownloadReport: () => void;
}

interface WorkshopPromoCardLabels {
  readonly badge: string;
  readonly learnMore: string;
}

export interface WorkshopPromoCardProps {
  readonly promo: WorkshopPromo;
  readonly labels: WorkshopPromoCardLabels;
  readonly onLearnMore: () => void;
}
