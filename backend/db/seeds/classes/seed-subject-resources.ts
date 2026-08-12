import { logger } from "@/backend/lib/logger";
import { ClassCatalogService, LearningResourceService } from "@/backend/services";
import type { SubjectResourceReturnType } from "@/backend/types";

const SUBJECT_RESOURCE_SPECS = [
  {
    subjectSlug: "quran-recitation",
    resourceFilePath: "public/resources/quran-basics.pdf",
    resourceType: "worksheet",
    sortOrder: 1,
  },
  {
    subjectSlug: "arabic-grammar",
    resourceFilePath: "public/resources/arabic-alphabet.pdf",
    resourceType: "worksheet",
    sortOrder: 1,
  },
] as const;

export async function seedOrGet(): Promise<SubjectResourceReturnType[]> {
  logger.info("Seeding subject resources...");

  const subjectSlugs = [...new Set(SUBJECT_RESOURCE_SPECS.map(spec => spec.subjectSlug))];
  const subjects = await ClassCatalogService.findSubjectsBySlugs(subjectSlugs);
  const subjectBySlug = new Map(subjects.map(subject => [subject.slug, subject]));

  const resourcePaths = [...new Set(SUBJECT_RESOURCE_SPECS.map(spec => spec.resourceFilePath))];
  const resources = await Promise.all(resourcePaths.map(path => LearningResourceService.findByFilePath(path)));
  const resourceByPath = new Map(
    resources.filter(resource => resource != null).map(resource => [resource.filePath, resource.id] as const)
  );

  const inputs = SUBJECT_RESOURCE_SPECS.flatMap(spec => {
    const subject = subjectBySlug.get(spec.subjectSlug);
    const learningResourceId = resourceByPath.get(spec.resourceFilePath);
    if (!subject || !learningResourceId) return [];

    return [
      {
        subjectId: subject.id,
        learningResourceId,
        resourceType: spec.resourceType,
        sortOrder: spec.sortOrder,
      },
    ];
  });

  const results = await ClassCatalogService.createManySubjectResources(inputs);
  logger.info(`Subject resources seeded (${results.length} rows).`);
  return results;
}
