import type { CatalogImageUploadLabels } from "@/shared/messages/types/ui/catalog-image-upload";

export const catalogImageUpload: CatalogImageUploadLabels = {
  upload: "رفع صورة",
  uploading: "جارٍ الرفع…",
  remove: "إزالة",
  optional: "اختياري",
  logoUrlLabel: "رابط الشعار",
  helperText: "PNG أو JPG أو WebP · الحد الأقصى {maxMb} ميجابايت",
  previewAlt: "معاينة الشعار",
  invalidType: "نوع الملف غير مدعوم. يُسمح فقط بـ PNG أو JPG أو WebP.",
  fileTooLarge: "حجم الملف يتجاوز {maxMb} ميجابايت.",
  uploadFailed: "تعذّر رفع الصورة. حاول مرة أخرى.",
};
