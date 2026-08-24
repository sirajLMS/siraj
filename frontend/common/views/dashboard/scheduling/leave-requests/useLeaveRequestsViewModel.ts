"use client";

import type { SelfServiceRescheduleLabels } from "@/shared/locale/types/dashboard/scheduling/self-service-reschedule";

export interface LeaveRequestRow {
  readonly id: string;
  readonly classInstanceId: string;
  readonly requesterType: string;
  readonly requestType: string | null;
  readonly proposedStartAt: string | null;
  readonly reason: string | null;
  readonly status: string;
  readonly createdAt: string;
  readonly processedAt: string | null;
}

export interface LeaveRequestsViewModel {
  readonly labels: SelfServiceRescheduleLabels;
  readonly requests: readonly LeaveRequestRow[];
  readonly loading: boolean;
  readonly error: boolean;
}
