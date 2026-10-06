import { ComplaintCategory, ComplaintStatus } from "@/backend/enum";

// Pre-allocated Set caches avoid Object.values(Enum) array allocations and linear O(N) scans.
const COMPLAINT_CATEGORY_SET = new Set<string>(Object.values(ComplaintCategory));
const COMPLAINT_STATUS_SET = new Set<string>(Object.values(ComplaintStatus));

export function isComplaintCategory(value: string): value is ComplaintCategory {
  return COMPLAINT_CATEGORY_SET.has(value);
}

export function isComplaintStatus(value: string): value is ComplaintStatus {
  return COMPLAINT_STATUS_SET.has(value);
}

export function assertComplaintCategory(value: string): ComplaintCategory {
  if (!isComplaintCategory(value)) throw new Error(`Invalid complaint category: ${value}`);
  return value;
}

export function assertComplaintStatus(value: string): ComplaintStatus {
  if (!isComplaintStatus(value)) throw new Error(`Invalid complaint status: ${value}`);
  return value;
}
