// GraphQL Mutation root field definitions — grouped by domain.
// Each sub-directory has its own index.ts barrel that side-effect-imports
// every mutation file. This top-level barrel imports every sub-directory so
// `import "@/backend/graphql/mutation"` (from gqlSchema.ts) registers all mutations.

import "./auth";
import "./billing";
import "./classes";
import "./meeting";
import "./notifications";
import "./profile";
import "./scheduling";
import "./shared";
import "./storage";
import "./students";
import "./teachers";
