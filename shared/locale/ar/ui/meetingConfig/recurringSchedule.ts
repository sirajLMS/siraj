export const uiMeetingConfigRecurringScheduleAr = {
  pageTitle: "اجتماع السلسلة المتكررة",
  scheduleSummary: (student: string, teacher: string, duration: number | string, timezone: string) =>
    `${student} مع ${teacher} · ${duration} دقيقة · ${timezone}`,
  invalidId: "معرّف الجدول غير صالح",
  breadcrumbDashboard: "لوحة التحكم",
  breadcrumbClasses: "الحصص",
  goToClass: "الانتقال إلى الحصة",
  rateSectionTitle: "سعر الحصة المتكررة",
  hourlyRateLabel: "السعر بالساعة",
  currencyLabel: "العملة",
  rateSaveLabel: "حفظ السعر",
  rateClearLabel: "مسح السعر",
  rateSuccessMessage: "تم تحديث السعر بنجاح",
  rateErrorMessage: "فشل تحديث السعر",
};
