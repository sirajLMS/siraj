import type { SessionLabels } from "@/shared/locale/types/session";

export const sessionAr: SessionLabels = {
  leaveProcessedDescription: successorId => `تمت معالجة طلب الإجازة، تمت إعادة الجدولة إلى الجلسة ${successorId}.`,
  absentWaitingRemark: "انتظر طوال مدة الحصة.",
  leaveRescheduledRemark: "تمت الموافقة على الإجازة - تمت إعادة جدولة الجلسة.",
  resetDescription: "تمت إعادة تعيين الجلسة بواسطة المشرف.",
  absentEventDescription: "تم تسجيل غياب الطالب بعد فترة الانتظار.",
  autoMissedEventDescription: "تم تحديد الحصة على أنها مفقودة تلقائيًا بعد فترة السماح للتفعيل.",
  manualRescheduleDescription: newStart => `تمت إعادة جدولة الحصة يدويًا إلى ${newStart} بواسطة المشرف.`,
  manualRescheduleRemark: (oldStart, newStart) => `إعادة جدولة: تم النقل من ${oldStart} إلى ${newStart}.`,
  activateDescription: "تم التفعيل",
  forceActivateDescription: "تم التفعيل قسراً",
  startDescription: "بدء الحصة",
  stopDescription: "إيقاف يدوي",
  softDeleteDescription: "حذف ناعم",
  teacherQuotaExhaustedNote: (used, max) =>
    `[إعادة جدولة بواسطة المشرف] استنفد المعلم الحصة الشهرية للإجازات (${used}/${max}).`,
  classTypes: {
    REGULAR: "حصة عادية",
    TRIAL: "حصة تجريبية",
    ADVANCE: "حصة مسبقة",
  },
};
