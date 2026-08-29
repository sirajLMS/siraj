import type { CreditAdjustmentLabels } from "@/shared/locale/types/dashboard/billing/creditAdjustment";

export const dashboardBillingCreditAdjustmentAr: CreditAdjustmentLabels = {
  title: "رصيد الطلاب",
  adjustCredits: "تعديل الرصيد",
  adjustmentType: {
    title: "نوع التعديل",
    add: "إضافة",
    subtract: "خصم",
    subtractWithCarryover: "خصم مع الترحيل",
  },
  carryover: {
    bannerTitle: "الترحيل — تخصيص للمعلم",
    teacher: "المعلم",
    fromDate: "من تاريخ",
    toDate: "إلى تاريخ",
    paymentDate: "تاريخ الدفع",
  },
  reason: { label: "السبب" },
  hours: { label: "الساعات" },
  validation: {
    fromAfterTo: "لا يمكن أن يكون تاريخ البداية بعد تاريخ النهاية",
    paymentTooFar: "لا يمكن أن يتجاوز تاريخ الدفع يوماً واحداً",
    insufficientClasses: "لا يوجد رصيد كافٍ للطالب",
    hoursPositive: "يجب أن تكون الساعات رقماً صحيحاً موجباً",
  },
  success: {
    added: hours => `تمت إضافة ${hours} ساعة معتمدة`,
    subtracted: hours => `تم خصم ${hours} ساعة معتمدة`,
    carryover: (hours, teacher) => `تم خصم ${hours} ساعة وترحيلها إلى ${teacher}`,
  },
};
