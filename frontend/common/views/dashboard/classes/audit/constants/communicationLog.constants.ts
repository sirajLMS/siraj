// NEW FOR PLAN v5: Lifted communication type + icon map out of tier (specs.md §5 N9/N5).
// Map height is 2 entries (under N5 toggle threshold of 5) but the map and the
// CommunicationType enum are duplicated byte-for-byte across mobile and desktop tier
// files, so they must live ONCE in common per specs.md §0 rule 2.
import { EmailOutlined, SmsOutlined } from "@mui/icons-material";

import type { CommunicationType } from "@/frontend/common/views/dashboard/classes/audit/types";

export type CommunicationIconComponent = typeof EmailOutlined;

export const COMMUNICATION_ICONS: Record<CommunicationType, CommunicationIconComponent> = {
  email: EmailOutlined,
  sms: SmsOutlined,
};
