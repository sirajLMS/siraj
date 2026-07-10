import { AvailabilityStatus } from "@/backend/enum";

export type BookCatalogSeed = {
  readonly name: string;
  readonly availabilityStatus: AvailabilityStatus;
};

export type ClassCategoryCatalogSeed = {
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly sortOrder: number;
};

export type ClassSubjectCatalogSeed = {
  readonly slug: string;
  readonly name: string;
  readonly categorySlug: string;
  readonly description: string;
  readonly sortOrder: number;
};

export type SubjectResourceCatalogSeed = {
  readonly subjectSlug: string;
  readonly resourceSlug: string;
  readonly resourceType: string;
  readonly sortOrder: number;
};

export const BOOK_CATALOG_SEEDS: readonly BookCatalogSeed[] = [
  { name: "Noorani Qaida", availabilityStatus: AvailabilityStatus.AVAILABLE },
  { name: "Juz Amma", availabilityStatus: AvailabilityStatus.AVAILABLE },
  { name: "Tajweed Rules Companion", availabilityStatus: AvailabilityStatus.AVAILABLE },
  { name: "Arabic Alphabet Workbook", availabilityStatus: AvailabilityStatus.OUT_OF_STOCK },
] as const;

export const CLASS_CATEGORY_SEEDS: readonly ClassCategoryCatalogSeed[] = [
  {
    slug: "quran-studies",
    name: "Quran Studies",
    description: "Foundational and advanced Quran learning tracks",
    sortOrder: 1,
  },
  {
    slug: "arabic-language",
    name: "Arabic Language",
    description: "Reading, writing, and comprehension in Arabic",
    sortOrder: 2,
  },
  {
    slug: "islamic-studies",
    name: "Islamic Studies",
    description: "Faith, history, and character development",
    sortOrder: 3,
  },
] as const;

export const CLASS_SUBJECT_SEEDS: readonly ClassSubjectCatalogSeed[] = [
  {
    slug: "tajweed",
    name: "Tajweed",
    categorySlug: "quran-studies",
    description: "Pronunciation and recitation rules",
    sortOrder: 1,
  },
  {
    slug: "hifz",
    name: "Hifz",
    categorySlug: "quran-studies",
    description: "Quran memorization support",
    sortOrder: 2,
  },
  {
    slug: "arabic-reading",
    name: "Arabic Reading",
    categorySlug: "arabic-language",
    description: "Letter recognition and fluent reading",
    sortOrder: 1,
  },
  {
    slug: "seerah",
    name: "Seerah",
    categorySlug: "islamic-studies",
    description: "Life of the Prophet (peace be upon him)",
    sortOrder: 1,
  },
] as const;

export const SUBJECT_RESOURCE_SEEDS: readonly SubjectResourceCatalogSeed[] = [
  { subjectSlug: "tajweed", resourceSlug: "tajweed-guide", resourceType: "guide", sortOrder: 1 },
  { subjectSlug: "hifz", resourceSlug: "memorization-tips", resourceType: "guide", sortOrder: 1 },
  { subjectSlug: "arabic-reading", resourceSlug: "arabic-alphabet", resourceType: "workbook", sortOrder: 1 },
  { subjectSlug: "seerah", resourceSlug: "parent-handbook", resourceType: "handbook", sortOrder: 1 },
] as const;
