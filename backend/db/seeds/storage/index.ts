// Backend seeder barrel — re-exports every `seedOrGet` in this sub-directory.
// Master controller (`backend/db/seeds/index.ts`) imports these aliases.

export { seedOrGet as seedOrGetLearningResources } from "./seed-learning-resources";
export { seedOrGet as seedOrGetSiteContent } from "./seed-site-content";
