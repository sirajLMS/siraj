import { ComplaintCategory, ComplaintStatus } from "@/backend/enum";

export function isComplaintCategory(value: string): value is ComplaintCategory {
  return (Object.values(ComplaintCategory) as readonly string[]).includes(value);
}

export function isComplaintStatus(value: string): value is ComplaintStatus {
  return (Object.values(ComplaintStatus) as readonly string[]).includes(value);
}

export function assertComplaintCategory(value: string): ComplaintCategory {
  if (!isComplaintCategory(value)) throw new Error(`Invalid complaint category: ${value}`);
  return value;
}

export function assertComplaintStatus(value: string): ComplaintStatus {
  if (!isComplaintStatus(value)) throw new Error(`Invalid complaint status: ${value}`);
  return value;
}
