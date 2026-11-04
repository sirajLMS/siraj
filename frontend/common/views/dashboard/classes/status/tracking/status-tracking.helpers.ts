import {
  getDateTimeFormatter,
  parseDateInput,
} from "@/frontend/common/components/intl/dateFormat";
import {
  ClassExecutionState,
  StudentStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";

export enum SessionStatus {
  REGULAR = "regular",
  SUSPENDED_PENDING = "suspended_pending",
  ON_LEAVE = "on_leave",
  PENDING_VERIFICATION = "pending_verification",
}

export function computeSessionStatus(
  studentStatus: string | null,
  isFrozen: boolean | null,
  executionState: string | null,
): SessionStatus {
  if (isFrozen === true || studentStatus === StudentStatus.Suspended) {
    return SessionStatus.SUSPENDED_PENDING;
  }
  if (studentStatus === StudentStatus.OnLeave) {
    return SessionStatus.ON_LEAVE;
  }
  if (executionState === ClassExecutionState.NotActivated) {
    return SessionStatus.PENDING_VERIFICATION;
  }
  return SessionStatus.REGULAR;
}

const TIME_2DIGIT_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
};

/**
 * Formats a start and end timestamp pair into a localized schedule time range.
 * Uses cached Intl.DateTimeFormat instances via getDateTimeFormatter to bypass
 * repeated ICU initialization and toLocaleTimeString overhead across data grid rows.
 */
export function formatScheduleRange(
  start: string | null,
  end: string | null,
  locale: string,
): string {
  const formatter = getDateTimeFormatter(
    getLatnLocaleTag(locale),
    TIME_2DIGIT_OPTIONS,
  );
  const fmt = (d: string | null): string => {
    if (!d) return "";
    const parsed = parseDateInput(d);
    return parsed ? formatter.format(parsed) : "Invalid Date";
  };
  return `${fmt(start)} - ${fmt(end)}`;
}
