import type { TeacherAvailabilityLabels } from "@/shared/locale/types/dashboard/teachers";

export const dashboardTeacherAvailabilityAr: TeacherAvailabilityLabels = {
  pageTitle: "أداة توفر المعلمين",
  pageSubtitle: "عرض والبحث عن الفترات الزمنية المتاحة عبر كادر هيئة التدريس.",
  exportPdf: "تصدير PDF",
  exportPdfComingSoon: "تصدير PDF قريبًا",
  teacherSlotSelected: (name, id) => `تم تحديد فترة ${name} (المعلم ${id})`,
  searchTitle: "البحث في جداول المعلمين",
  from: "من",
  to: "إلى",
  gender: "الجنس",
  any: "الكل",
  male: "ذكر",
  female: "أنثى",
  submit: "إرسال",
  breadcrumbs: {
    teachers: "المعلمون",
    availability: "التوفر",
  },
  errors: {
    missingTimeRange: "يرجى تحديد وقت البداية والنهاية.",
  },
  validation: {
    invalidGender: "قيمة الجنس غير صالحة",
  },
  table: {
    time: "الوقت",
    monday: "الاثنين",
    tuesday: "الثلاثاء",
    wednesday: "الأربعاء",
    thursday: "الخميس",
    friday: "الجمعة",
    saturday: "السبت",
    sunday: "الأحد",
    mon: "إ",
    tue: "ث",
    wed: "ر",
    thu: "خ",
    fri: "ج",
    sat: "س",
    sun: "أ",
    availableSlot: (teacherName, time) => `${teacherName} متاح في ${time}`,
  },
  insights: {
    peakLoad: "ذروة التحميل",
    peakLoadDesc: "أعلى نسبة إشغال للمعلمين يومي الاثنين والأربعاء.",
    availableStaff: "الموظفون المتاحون",
    availableStaffDesc: "القدرة الحالية لتخصيص الدورات الفورية.",
    teachersCount: count => `${count} معلم`,
    localTimezones: "المناطق الزمنية المحلية",
    localTimezonesDesc: "تغطي هيئة التدريس العالمية 5 مناطق زمنية متميزة.",
  },
  mobile: {
    pageTitle: "أداة التوفر",
    pageSubtitle: "ابحث عن الفترات الشاغرة عبر هيئة التدريس.",
  },
  status: {
    live: "مباشر",
    lastUpdate: minutes => {
      if (minutes === 1) return `منذ ${minutes} دقيقة`;
      return `منذ ${minutes} دقائق`;
    },
  },
  availabilityGridTitle: "الفترات المتاحة",
};
