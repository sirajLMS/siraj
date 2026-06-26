import { create } from "zustand";
import type { ClassAuditData } from "@/frontend/views/dashboard/classes/audit/types";

interface ClassAuditState {
  readonly audit: ClassAuditData | null;
  resendNotifications: () => void;
  updateAdminNote: () => void;
}

export const useClassAuditStore = create<ClassAuditState>(() => ({
  audit: null,
  resendNotifications: () => {},
  updateAdminNote: () => {},
}));
