import type { ProfileLabels } from "../types/profile";

export const profile: ProfileLabels = {
  shell: {
    tabs: {
      profile: "الملف الشخصي",
      banking: "الحسابات البنكية",
      students: "الطلاب",
      notifications: "الإشعارات",
      permissions: "الصلاحيات",
    },
    loading: "جارٍ تحميل الملف الشخصي...",
    error: {
      retry: "أعد المحاولة",
    },
  },
  pageTitle: "Profile",
  editTitle: "Edit Profile",
  notSet: "Not set",
  adminEditHint: "Use the staff profile tools for full administrative editing.",
  role: {
    teacher: "معلم",
    parent: "ولي أمر",
    staff: "موظف",
  },
  actions: {
    edit: "تعديل الملف الشخصي",
    save: "حفظ التغييرات",
    cancel: "إلغاء",
    retry: "إعادة المحاولة",
  },
  errors: {
    failedToLoad: "Failed to load profile.",
    notFound: "Profile not found.",
  },
  teacher: {
    subtitle: "View your official profile and compensation details.",
    sections: {
      contact: "Contact Information",
      salary: "Salary Details",
    },
    baseSalary: "Base salary: {amount} {currency}",
    paymentMethod: "Payment method: {method}",
    fields: {
      phone: "Phone",
      zoomLink: "Zoom link",
    },
  },
  parent: {
    subtitle: "Manage your contact and communication details.",
    sections: {
      contact: "Contact Information",
      social: "Social & Communication",
    },
    fields: {
      phone: "Phone",
      whatsapp: "WhatsApp",
      facebook: "Facebook",
      twitter: "Twitter",
      skype: "Skype",
      defaultZoomLink: "Default Zoom link",
    },
  },
  staff: {
    subtitle: "View your staff profile details.",
    sections: {
      contact: "Contact Information",
    },
    fields: {
      phone: "Phone",
      skypeId: "Skype ID",
    },
  },
  banking: {
    title: "Banking & Payment Details",
    adminOnly: "Admin Only",
    encryptedNotice: "This information is encrypted and only visible to authorized administrators.",
    sections: {
      banking: "Primary Account Information",
      verification: "Verification",
    },
    fields: {
      beneficiaryName: "Beneficiary Name",
      bankName: "Bank Name",
      accountNumber: "Account Number",
      routingNumber: "Routing Number",
      swiftBic: "SWIFT/BIC",
      iban: "IBAN",
      verifiedAt: "Verified At",
      verifiedBy: "Verified By",
    },
    verified: "Verified",
    notVerified: "Pending verification",
    notProvided: "Not provided",
    empty: {
      title: "No banking details on file",
      description: "This teacher has not submitted banking information yet.",
    },
    actions: {
      manage: "Manage Banking Details",
      editHint: "Banking updates require closing the current record and submitting new details through staff tools.",
    },
  },
  students: {
    title: "الطلاب المعينون",
    description: "راجع الطلاب المعينين حالياً لهذا المعلم.",
    allClasses: "جميع الصفوف",
    mobileListLabel: "قائمة الطلاب المعينين",
    pagination: "عرض {start} إلى {end} من أصل {total} سجل",
    noRows: "لا يوجد طلاب معينون",
    columns: {
      studentName: "اسم الطالب",
      parent: "ولي الأمر",
      class: "الصف",
      status: "الحالة",
      hoursPerWeek: "الساعات أسبوعياً",
      classes: "الحصص",
    },
    classUnknown: "صف غير محدد",
    parentUnknown: "ولي أمر غير محدد",
    empty: {
      title: "لا يوجد طلاب معينون حالياً",
      description: "لا توجد تعيينات طلاب نشطة لهذا المعلم في الوقت الحالي.",
    },
    errors: {
      failedToLoad: "تعذر تحميل الطلاب المعينين.",
      retry: "إعادة المحاولة",
    },
  },
};
