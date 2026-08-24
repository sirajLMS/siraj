import { SUBJECT_RESOURCE_SEEDS } from "@/backend/db/seeds/lib";
import { logger } from "@/backend/lib/logger";
import { ClassCatalogService, LearningResourceService } from "@/backend/services";
import type { SubjectResourceReturnType } from "@/backend/types";

export async function seedOrGet(): Promise<SubjectResourceReturnType[]> {
  logger.info("Seeding subject resources...");

  const subjectSlugs = [...new Set(SUBJECT_RESOURCE_SEEDS.map(spec => spec.subjectSlug))];
  const subjects = await ClassCatalogService.findSubjectsBySlugs(subjectSlugs);
  const subjectBySlug = new Map(subjects.map(subject => [subject.slug, subject]));

  const resourcePaths = [...new Set(SUBJECT_RESOURCE_SEEDS.map(spec => `public/resources/${spec.resourceSlug}.pdf`))];
  const resources = await resourcePaths.reduce<
    Promise<Awaited<ReturnType<typeof LearningResourceService.findByFilePath>>[]>
  >(async (prev, path) => [...(await prev), await LearningResourceService.findByFilePath(path)], Promise.resolve([]));
  const resourceByPath = new Map(
    resources.filter(resource => resource != null).map(resource => [resource.filePath, resource.id] as const)
  );

  const inputs = SUBJECT_RESOURCE_SEEDS.flatMap(spec => {
    const subject = subjectBySlug.get(spec.subjectSlug);
    const learningResourceId = resourceByPath.get(`public/resources/${spec.resourceSlug}.pdf`);
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
