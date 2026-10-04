import type { MeetingConfigEnhancementLabels } from "@/shared/locale/types/ui";

/** Enhancement label keys consumed by the form content (Test Config + copy URL). */
export type MeetingConfigFormContentEnhancementLabels = Pick<
  MeetingConfigEnhancementLabels,
  "testConfig" | "previewUrlGenerated" | "copyMeetingUrl"
>;
