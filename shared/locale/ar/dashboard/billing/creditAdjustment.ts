import type { CreditAdjustmentLabels } from "@/shared/locale/types/dashboard/billing/creditAdjustment";

export const dashboardBillingCreditAdjustmentAr: CreditAdjustmentLabels = {
  title: "رصيد الطلاب",
  adjustCredits: "تعديل الرصيد",
  adjustCreditsSubtitle: "تعديل أرصدة الطلاب وإدارة التزامات الترحيل.",
  adjustmentType: {
    title: "نوع التعديل",
    add: "إضافة",
    subtract: "خصم",
    subtractWithCarryover: "خصم مع الترحيل",
    addDescription: "منح ساعات إضافية",
    subtractDescription: "خصم ساعات غير مستحقة",
    subtractWithCarryoverDescription: "خصم ساعات مع التزام دفع للمعلم",
  },
  carryover: {
    bannerTitle: "الترحيل — تخصيص للمعلم",
    bannerCaption: "الساعات المخصومة تتوقف عن الاحتساب لهذا الطالب؛ ويُستحق للمعلم قيمتها مع دفعة بحلول تاريخ الدفع.",
    teacher: "المعلم",
    fromDate: "من تاريخ",
    toDate: "إلى تاريخ",
    paymentDate: "تاريخ الدفع",
  },
  reason: { label: "السبب" },
  hours: { label: "الساعات" },
  form: {
    balance: "الرصيد",
    internalNotes: "ملاحظات داخلية",
    internalNotesHint: "مرئية للموظفين فقط — لا تظهر للطلاب أو أولياء الأمور.",
  },
  preview: {
    balance: (from, to) => {
      if (to === 1) return `الساعات المتبقية: من ${from} إلى ساعة واحدة`;
      if (to === 2) return `الساعات المتبقية: من ${from} إلى ساعتين`;
      if (to >= 3 && to <= 10) return `الساعات المتبقية: من ${from} إلى ${to} ساعات`;
      return `الساعات المتبقية: من ${from} إلى ${to} ساعة`;
    },
  },
  summary: {
    add: (hours, student) => {
      if (hours === 1) return `إضافة ساعة واحدة إلى ${student}`;
      if (hours === 2) return `إضافة ساعتين إلى ${student}`;
      if (hours >= 3 && hours <= 10) return `إضافة ${hours} ساعات إلى ${student}`;
      return `إضافة ${hours} ساعة إلى ${student}`;
    },
    subtract: (hours, student) => {
      if (hours === 1) return `خصم ساعة واحدة من ${student}`;
      if (hours === 2) return `خصم ساعتين من ${student}`;
      if (hours >= 3 && hours <= 10) return `خصم ${hours} ساعات من ${student}`;
      return `خصم ${hours} ساعة من ${student}`;
    },
    carryover: (hours, teacher, paymentDate) => {
      if (hours === 1) return `خصم ساعة واحدة؛ ساعة دفع واحدة إلى ${teacher} بتاريخ ${paymentDate}`;
      if (hours === 2) return `خصم ساعتين؛ ساعتا دفع إلى ${teacher} بتاريخ ${paymentDate}`;
      if (hours >= 3 && hours <= 10)
        return `خصم ${hours} ساعات؛ ${hours} ساعات دفع إلى ${teacher} بتاريخ ${paymentDate}`;
      return `خصم ${hours} ساعة؛ ${hours} ساعة دفع إلى ${teacher} بتاريخ ${paymentDate}`;
    },
  },
  resultsCappedHint: limit => `يتم عرض أول ${limit} من الطلاب. حسّن بحثك لتضييق القائمة.`,
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
