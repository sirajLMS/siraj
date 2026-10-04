"use client";

import { useSearchParams } from "next/navigation";
import { type RefObject, useEffect, useRef } from "react";
import {
  CalculationStatus,
  type ClassStatusEventsQuery_classStatusEvents,
  type CurrencyCode,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { PayrollStatusLabels } from "@/frontend/common/views/dashboard/classes/audit/ClassAuditDetailsCard.types";
import type { PayrollLabels } from "@/shared/locale/types/dashboard/billing/payroll";

/** Audit-event type the payroll domain appends for every operator override. */
const PAYROLL_OVERRIDE_EVENT_TYPE = "PAYROLL_OVERRIDE";

/** Anchor id of the payroll card, targeted by the `?highlight=payroll` deep link. */
const PAYROLL_HIGHLIGHT_PARAM = "highlight";
const PAYROLL_HIGHLIGHT_VALUE = "payroll";
export const PAYROLL_SECTION_ID = "payroll-calculation";

/** Bridges the locale status labels (literal keys) onto the generated enum keys the status badge consumes. */
export function buildStatusLabels(status: PayrollLabels["status"]): PayrollStatusLabels {
  return {
    [CalculationStatus.NotCalculated]: status.NOT_CALCULATED,
    [CalculationStatus.Calculated]: status.CALCULATED,
    [CalculationStatus.Partially]: status.PARTIALLY,
    [CalculationStatus.Refund]: status.REFUND,
    [CalculationStatus.WaitingPaid]: status.WAITING_PAID,
    [CalculationStatus.Paid]: status.PAID,
  };
}

/** Keeps the override history oldest-first whatever order the events query returns. */
export function selectOverrideEvents(
  events: readonly ClassStatusEventsQuery_classStatusEvents[]
): ClassStatusEventsQuery_classStatusEvents[] {
  return events
    .filter(event => event.eventType === PAYROLL_OVERRIDE_EVENT_TYPE)
    .toSorted((first, second) => (first.createdAt ?? "").localeCompare(second.createdAt ?? ""));
}

export function formatPaidAmount(amount: string | null, currency: CurrencyCode | null): string {
  if (amount === null) return "—";
  return currency === null ? amount : `${amount} ${currency}`;
}

/**
 * Deep-link focus for the payroll card: when the audit page is opened with
 * `?highlight=payroll` (e.g. from the profit & loss Payments tab), the card
 * scrolls into view and its outline stays emphasized until the operator
 * interacts, so they land on the calculation that produced the revenue row
 * they clicked.
 */
export function usePayrollHighlight(): {
  readonly sectionRef: RefObject<HTMLDivElement | null>;
  readonly isHighlighted: boolean;
} {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();
  const isHighlighted = searchParams?.get(PAYROLL_HIGHLIGHT_PARAM) === PAYROLL_HIGHLIGHT_VALUE;

  useEffect(() => {
    if (!isHighlighted || sectionRef.current === null) return;
    sectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [isHighlighted]);

  return { sectionRef, isHighlighted };
}
