import { ComplaintCategory, ComplaintStatus, SuggestionStatus } from "@/backend/enum";
import { getFakerForIndex } from "./faker-client";
import type { SeedConfig } from "./seed-config";

const COMPLAINT_STATUSES = [ComplaintStatus.UNANSWERED, ComplaintStatus.ANSWERED] as const;
const COMPLAINT_CATEGORIES = [
  ComplaintCategory.REGARDING_TEACHER,
  ComplaintCategory.REGARDING_SYSTEM,
  ComplaintCategory.OTHER,
] as const;
const SUGGESTION_STATUSES = [SuggestionStatus.PENDING, SuggestionStatus.REVIEWED, SuggestionStatus.DUPLICATE] as const;

export function buildComplaintBody(config: SeedConfig, index: number): string {
  const faker = getFakerForIndex(config.fakerSeed, 5000 + index);
  return faker.lorem.paragraph();
}

export function buildSuggestionBody(config: SeedConfig, index: number): string {
  const faker = getFakerForIndex(config.fakerSeed, 6000 + index);
  return faker.lorem.sentences(2);
}

export function pickComplaintStatus(index: number): ComplaintStatus {
  return COMPLAINT_STATUSES[index % COMPLAINT_STATUSES.length];
}

export function pickComplaintCategory(index: number): ComplaintCategory {
  return COMPLAINT_CATEGORIES[index % COMPLAINT_CATEGORIES.length];
}

export function pickSuggestionStatus(index: number): SuggestionStatus {
  return SUGGESTION_STATUSES[index % SUGGESTION_STATUSES.length];
}

export function buildResourceDisplayName(config: SeedConfig, index: number): string {
  const faker = getFakerForIndex(config.fakerSeed, 7000 + index);
  return faker.book.title();
}

export const LEARNING_RESOURCE_SPECS = [
  { slug: "quran-basics", asset: "documents/sample-resource.pdf" },
  { slug: "tajweed-guide", asset: "documents/sample-resource.pdf" },
  { slug: "arabic-alphabet", asset: "documents/sample-resource.pdf" },
  { slug: "memorization-tips", asset: "documents/sample-resource.pdf" },
  { slug: "parent-handbook", asset: "documents/sample-resource.pdf" },
] as const;
