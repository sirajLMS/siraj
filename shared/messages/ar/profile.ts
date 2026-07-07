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
  actions: {
    edit: "Edit Profile",
    save: "Save Changes",
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
};
