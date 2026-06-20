import type { SearchScheduleLabels } from "../../../types/dashboard/core";

export const searchSchedule: SearchScheduleLabels = {
  pageTitle: "البحث عن توفر الجدول",
  fromTime: "من",
  toTime: "إلى",
  gender: "الجنس",
  allGenders: "الكل",
  male: "ذكر",
  female: "أنثى",
  searchBtn: "بحث",
  noResults: "لم يتم العثور على فترات زمنية متاحة للمعايير المحددة.",
  resultsCount: "{count} معلمين مع {gaps} فترات متاحة",
  errorLoading: "فشل في تحميل بيانات التوفر.",
  day: {
    monday: "الاثنين",
    tuesday: "الثلاثاء",
    wednesday: "الأربعاء",
    thursday: "الخميس",
    friday: "الجمعة",
    saturday: "السبت",
    sunday: "الأحد",
  },
};
