export * from "./classScope";
export * from "./display";
export * from "./enhancements";
export * from "./fields";
export * from "./join";
export * from "./linkedClassInstances";
export * from "./manager";
export * from "./providerSelect";
export * from "./reauthNeeded";
export * from "./recurringSchedule";
export * from "./summary";

import { uiMeetingConfigClassScopeEn as classScope } from "./classScope";
import { uiMeetingConfigDisplayEn as display } from "./display";
import { uiMeetingConfigEnhancementsEn as enhancements } from "./enhancements";
import { uiMeetingConfigFieldsEn as fields } from "./fields";
import { uiMeetingConfigJoinEn as join } from "./join";
import { uiMeetingConfigLinkedClassInstancesEn as linkedClassInstances } from "./linkedClassInstances";
import { uiMeetingConfigManagerEn as manager } from "./manager";
import { uiMeetingConfigProviderSelectEn as providerSelect } from "./providerSelect";
import { uiMeetingConfigReauthNeededEn as reauthNeeded } from "./reauthNeeded";
import { uiMeetingConfigRecurringScheduleEn as recurringSchedule } from "./recurringSchedule";
import { uiMeetingConfigSummaryEn as summary } from "./summary";

export const uiMeetingConfigEn = {
  sectionTitle: "Meeting Settings",
  addConfig: "Add Meeting Config",
  editConfig: "Edit Meeting Config",
  label: "Label",
  provider: "Provider",
  cancel: "Cancel",
  save: "Save",
  loading: "Loading meeting settings…",
  empty: "No meeting config yet",
  display,
  join,
  manager,
  fields,
  classScope,
  providerSelect,
  summary,
  recurringSchedule,
  reauthNeeded,
  linkedClassInstances,
  enhancements,
};
