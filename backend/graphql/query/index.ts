// GraphQL Query root field definitions — grouped by domain.
// Each sub-directory has its own index.ts barrel that side-effect-imports
// every query file. This top-level barrel imports every sub-directory so
// `import "@/backend/graphql/query"` (from gqlSchema.ts) registers all queries.

import "./auth";
import "./billing";
import "./classes";
import "./meeting";
import "./notifications";
import "./parents";
import "./profile";
import "./reports";
import "./scheduling";
import "./shared";
import "./storage";
import "./students";
import "./supervisor";
import "./teachers";
import "./whatsapp";
import "./system";
import "./books";
import "./cron";
