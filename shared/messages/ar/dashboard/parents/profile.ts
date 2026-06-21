import type { ParentProfileLabels } from "../../../types/dashboard/parents";

export const profile: ParentProfileLabels = {
  pageTitle: "الملف الشخصي لولي الأمر",
  status: {
    regular: "عادي",
  },
  actions: {
    editPicture: "تعديل الصورة",
    editProfile: "تعديل الملف الشخصي",
    uploadDocs: "رفع الوثائق",
    addNewStudent: "إضافة طالب جديد",
    viewInvoices: "عرض الفواتير",
    deactivateAccount: "تعطيل الحساب",
    deactivateDialogTitle: "تعطيل حساب ولي الأمر",
    deactivateConfirmText:
      "هل أنت متأكد من رغبتك في تعطيل هذا الحساب؟ سيتم تسجيل خروج ولي الأمر فورًا ويفقد صلاحية الوصول إلى نظام إدارة التعلم (LMS).",
    cancel: "إلغاء",
    deactivating: "جاري التعطيل...",
    deactivateSuccess: "تم تعطيل حساب ولي الأمر بنجاح.",
  },
  errors: {
    invalidId: "معرف ولي الأمر غير صالح.",
    notFound: "ولي الأمر غير موجود.",
  },
  sections: {
    parentInfo: "معلومات ولي الأمر",
    socialMedia: "وسائل التواصل الاجتماعي والاتصالات",
    feesDetails: "تفاصيل الرسوم",
    parentStudents: "طلاب ولي الأمر",
  },
  fields: {
    nationality: "الجنسية",
    email: "البريد الإلكتروني",
    phone: "الهاتف",
    address: "العنوان",
    facebook: "فيسبوك",
    whatsapp: "واتساب",
    skype: "سكايب",
    zoomLink: "رابط زووم",
    invoiceType: "نوع الفاتورة",
    feeAmount: "مبلغ الرسوم",
    paymentMethod: "طريقة الدفع",
    currency: "العملة",
  },
  table: {
    studentName: "اسم الطالب",
    teacher: "المعلم",
    hoursPerWeek: "الساعات/الأسبوع",
    classesLeft: "الحصص المتبقية",
    language: "اللغة",
    gender: "الجنس",
    info: "معلومات",
    options: "خيارات",
    status: "الحالة",
    viewAllStudents: "عرض جميع الطلاب",
  },
};
