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
  form: { balance: "الرصيد" },
  resultsCappedHint: limit => `يتم عرض أول ${limit} طالباً. حدد البحث بشكل أدق لتضييق القائمة.`,
  validation: {
    fromAfterTo: "لا يمكن أن يكون تاريخ البداية بعد تاريخ النهاية",
    paymentTooFar: "لا يمكن أن يتجاوز تاريخ الدفع يوماً واحداً",
    insufficientClasses: "لا يوجد رصيد كافٍ للطالب",
    hoursPositive: "يجب أن تكون الساعات رقماً صحيحاً موجباً",
  },
  success: {
    added: hours => {
      if (hours === 1) return "تمت إضافة ساعة معتمدة واحدة";
      if (hours === 2) return "تمت إضافة ساعتين معتمدتين";
      if (hours >= 3 && hours <= 10) return `تمت إضافة ${hours} ساعات معتمدة`;
      return `تمت إضافة ${hours} ساعة معتمدة`;
    },
    subtracted: hours => {
      if (hours === 1) return "تم خصم ساعة معتمدة واحدة";
      if (hours === 2) return "تم خصم ساعتين معتمدتين";
      if (hours >= 3 && hours <= 10) return `تم خصم ${hours} ساعات معتمدة`;
      return `تم خصم ${hours} ساعة معتمدة`;
    },
    carryover: (hours, teacher) => {
      if (hours === 1) return `تم خصم ساعة واحدة وترحيلها إلى ${teacher}`;
      if (hours === 2) return `تم خصم ساعتين وترحيلهما إلى ${teacher}`;
      if (hours >= 3 && hours <= 10) return `تم خصم ${hours} ساعات وترحيلها إلى ${teacher}`;
      return `تم خصم ${hours} ساعة وترحيلها إلى ${teacher}`;
    },
  },
};
