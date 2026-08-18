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

import { uiMeetingConfigClassScopeAr as classScope } from "./classScope";
import { uiMeetingConfigDisplayAr as display } from "./display";
import { uiMeetingConfigEnhancementsAr as enhancements } from "./enhancements";
import { uiMeetingConfigFieldsAr as fields } from "./fields";
import { uiMeetingConfigJoinAr as join } from "./join";
import { uiMeetingConfigLinkedClassInstancesAr as linkedClassInstances } from "./linkedClassInstances";
import { uiMeetingConfigManagerAr as manager } from "./manager";
import { uiMeetingConfigProviderSelectAr as providerSelect } from "./providerSelect";
import { uiMeetingConfigReauthNeededAr as reauthNeeded } from "./reauthNeeded";
import { uiMeetingConfigRecurringScheduleAr as recurringSchedule } from "./recurringSchedule";
import { uiMeetingConfigSummaryAr as summary } from "./summary";

export const uiMeetingConfigAr = {
  sectionTitle: "إعدادات الاجتماعات",
  addConfig: "إضافة إعداد اجتماع",
  editConfig: "تعديل إعداد الاجتماع",
  label: "التسمية",
  provider: "المزود",
  cancel: "إلغاء",
  save: "حفظ",
  loading: "جارٍ تحميل إعدادات الاجتماع...",
  empty: "لا توجد إعدادات اجتماع بعد",
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
  providerLogoAlt: (providerName: string) => `شعار ${providerName}`,
  providerLogoFallbackAlt: "شعار مزود الاجتماع",
};
