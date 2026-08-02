import type { NotificationsLabels } from "@/shared/locale/types/notifications";

export const notificationsAr: NotificationsLabels = {
  invoiceGenerated: {
    title: "فاتورة جديدة",
    body: ({ invoiceId, amount, currency }) => `تم إصدار الفاتورة ${invoiceId} بمبلغ ${amount} ${currency}.`,
  },
  invoiceStatusChanged: {
    proofSubmitted: {
      title: "تم تقديم إثبات الدفع",
      body: ({ invoiceId }) => `تم تقديم إثبات الدفع للفاتورة ${invoiceId} وهو قيد المراجعة.`,
    },
    proofApproved: {
      title: "تمت الموافقة على إثبات الدفع",
      body: ({ invoiceId }) => `تمت الموافقة على إثبات الدفع للفاتورة ${invoiceId}.`,
    },
    proofRejected: {
      title: "تم رفض إثبات الدفع",
      body: ({ invoiceId }) => `تم رفض إثبات الدفع للفاتورة ${invoiceId}. يرجى إعادة تقديمه.`,
    },
    markedPaid: {
      title: "تم دفع الفاتورة",
      body: ({ invoiceId }) => `تم تعليم الفاتورة ${invoiceId} كمدفوعة.`,
    },
  },
  paymentMethodChanged: {
    created: {
      title: "تمت إضافة طريقة دفع",
      body: ({ identifier }) => `تمت إضافة طريقة دفع جديدة (${identifier}) إلى حسابك.`,
    },
    updated: {
      title: "تم تحديث طريقة الدفع",
      body: ({ identifier }) => `تم تحديث طريقة الدفع (${identifier}).`,
    },
    deleted: {
      title: "تم حذف طريقة الدفع",
      body: ({ identifier }) => `تم حذف طريقة الدفع (${identifier}).`,
    },
    setDefault: {
      title: "تم تغيير طريقة الدفع الافتراضية",
      body: ({ identifier }) => `طريقة الدفع الافتراضية الآن هي ${identifier}.`,
    },
    verified: {
      title: "تم التحقق من طريقة الدفع",
      body: ({ identifier }) => `تم التحقق من طريقة الدفع (${identifier}).`,
    },
  },
  classScheduled: {
    title: "تم جدولة حصة",
    body: ({ studentName, scheduledStartAt }) => `تم جدولة حصة للطالب ${studentName} في ${scheduledStartAt}.`,
  },
  classActivated: {
    title: "تم تفعيل الحصة",
    body: ({ studentName, scheduledStartAt }) => `تم تفعيل الحصة للطالب ${studentName} في ${scheduledStartAt}.`,
  },
  classStarted: {
    title: "بدأت الحصة",
    body: ({ studentName, scheduledStartAt }) => `بدأت الحصة المجدولة للطالب ${studentName} في ${scheduledStartAt}.`,
  },
  classCompleted: {
    title: "اكتملت الحصة",
    body: ({ studentName, scheduledStartAt }) => `اكتملت الحصة المجدولة للطالب ${studentName} في ${scheduledStartAt}.`,
  },
  classMarkedAbsent: {
    title: "تم تسجيل الغياب",
    body: ({ studentName, scheduledStartAt }) => `تم تسجيل غياب ${studentName} عن الحصة في ${scheduledStartAt}.`,
  },
  classMarkedMissed: {
    title: "تم تفويت الحصة",
    body: ({ studentName, scheduledStartAt }) =>
      `تم تفويت الحصة المجدولة للطالب ${studentName} في ${scheduledStartAt}.`,
  },
  classLeaveRequested: {
    title: "تم طلب إجازة",
    body: ({ studentName, scheduledStartAt }) => `تم تقديم طلب إجازة لحصة ${studentName} في ${scheduledStartAt}.`,
  },
  classRescheduled: {
    title: "تمت إعادة جدولة الحصة",
    body: ({ studentName, scheduledStartAt, newStartAt }) =>
      `تمت إعادة جدولة حصة ${studentName} من ${scheduledStartAt} إلى ${newStartAt}.`,
  },
  classCancelled: {
    title: "تم إلغاء الحصة",
    body: ({ studentName, scheduledStartAt }) =>
      `تم إلغاء الحصة المجدولة للطالب ${studentName} في ${scheduledStartAt}.`,
  },
  classReset: {
    title: "تمت إعادة ضبط الحصة",
    body: ({ studentName, scheduledStartAt }) =>
      `تمت إعادة ضبط الحصة المجدولة للطالب ${studentName} في ${scheduledStartAt}.`,
  },
  studentTeacherReassigned: {
    parent: {
      title: "تم إعادة تعيين المعلم",
      body: ({ studentName, newTeacherName }) => `تم إعادة تعيين معلم ${studentName} إلى ${newTeacherName}.`,
    },
    oldTeacher: {
      title: "تم نقل الطالب",
      body: ({ studentName, newTeacherName }) => `تم نقل الطالب ${studentName} إلى معلم جديد (${newTeacherName}).`,
    },
    newTeacher: {
      title: "تم تعيين طالب لك",
      body: ({ studentName, oldTeacherName }) => `تم تعيين الطالب ${studentName} لك من ${oldTeacherName}.`,
    },
  },
  studentStatusChanged: {
    title: "تم تغيير حالة الطالب",
    body: ({ studentName, oldStatus, newStatus }) => `تم تغيير حالة ${studentName} من ${oldStatus} إلى ${newStatus}.`,
  },
  studentQuotaOverridden: {
    title: "تم تحديث حصة الطالب",
    body: ({ studentName, newClassesRemaining }) =>
      `العدد المتبقي من حصص ${studentName} هو الآن ${newClassesRemaining}.`,
  },
  lessonReportSubmitted: {
    title: "تم تقديم تقرير حصة",
    body: ({ reportId, teacherName }) => `قدّم ${teacherName} تقرير الحصة ${reportId} لمراجعتك.`,
  },
  lessonReportReviewed: {
    title: "تمت مراجعة تقرير الحصة",
    body: ({ reportId, teacherName, decision }) => `تم ${decision} تقرير حصتك ${reportId} من ${teacherName}.`,
  },
  newComplaint: {
    title: "شكوى جديدة",
    body: ({ complaintId, category }) => `تم تقديم شكوى جديدة من نوع ${category} (${complaintId}).`,
  },
  quotaExpiringSoon: {
    title: "حصة تنتهي قريبًا",
    body: ({ quotaName, validUntil, remaining }) =>
      `تنتهي الحصة "${quotaName}" في ${validUntil}. لديك ${remaining} حصص متبقية.`,
  },
  quotaExpired: {
    title: "انتهت صلاحية الحصة",
    body: ({ quotaName }) => `انتهت صلاحية الحصة "${quotaName}".`,
  },
  quotaLowBalance: {
    title: "رصيد حصة منخفض",
    body: ({ studentName, remaining, totalClasses }) =>
      `رصيد الحصة منخفض للطالب ${studentName}: متبقي ${remaining} من أصل ${totalClasses} حصص.`,
  },
  onDemandInstancePendingCredit: {
    title: "حصة بانتظار الرصيد",
    body: ({ studentName, scheduledStartAt }) =>
      `الحصة الحسب الطلب للطالب ${studentName} في ${scheduledStartAt} تحتاج إلى رصيد إضافي.`,
  },
  onDemandInstanceReminderT3: {
    title: "تذكير بحصة حسب الطلب قادمة",
    body: ({ studentName, scheduledStartAt }) =>
      `حصة حسب الطلب للطالب ${studentName} مجدولة بعد 3 أيام في ${scheduledStartAt}.`,
  },
  onDemandInstanceReminderT1: {
    title: "تذكير بحصة حسب الطلب غداً",
    body: ({ studentName, scheduledStartAt }) =>
      `حصة حسب الطلب للطالب ${studentName} مجدولة غداً في ${scheduledStartAt}.`,
  },
  onDemandTeacherDailyDigest: {
    title: "ملخص الحصص حسب الطلب اليومي",
    body: ({ teacherName, pendingCount }) =>
      `مرحباً ${teacherName}، لديك ${pendingCount} حصص حسب الطلب بانتظار تسوية الرصيد اليوم.`,
  },
  drawerTitle: "الإشعارات",

  managePreferences: "إدارة التفضيلات",
  markAllRead: "تعليم الكل كمقروء",
  markAsRead: "تعليم كمقروء",
  reschedule: "إعادة الجدولة",
  viewEntity: "عرض",
  approveInvoice: "الموافقة على الفاتورة",
  rejectInvoice: "رفض الفاتورة",
  noNotifications: "لا توجد إشعارات",
  unreadCount: count => {
    if (count === 0) return "لا توجد إشعارات غير مقروءة";
    if (count === 1) return "إشعار واحد غير مقروء";
    if (count === 2) return "إشعاران غير مقروءان";
    if (count >= 3 && count <= 10) return `${count} إشعارات غير مقروءة`;
    return `${count} إشعاراً غير مقروءاً`;
  },
};
