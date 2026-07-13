// scripts/generate-schema.ts

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { printSchema } from "graphql";
import { graphQLSchema } from "@/backend/graphql/gqlSchema";
import logger from "@/backend/lib/logger";

// Use the standard printSchema function
const schemaAsString = printSchema(graphQLSchema);
const outputPath = path.join(process.cwd(), "./frontend/common/graphql/generated/schema.graphql");

fs.writeFileSync(outputPath, schemaAsString);

logger.log("📜 Schema generated at", outputPath);

const codegenProcess = spawn(process.execPath, ["run", "graphql-codegen", "--config", "codegen.ts", "--verbose"], {
  stdio: "inherit",
});

codegenProcess.on("close", code => {
  if (code === 0) {
    logger.log("✅ GraphQL Code Generation completed successfully!");
  } else {
    logger.error(`❌ GraphQL Code Generation failed with exit code ${code}`);
    process.exit(1);
  }
});

codegenProcess.on("error", error => {
  logger.error("❌ Failed to start GraphQL Code Generation:", error.message);
  process.exit(1);
});
