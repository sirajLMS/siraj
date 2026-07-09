import { joinSession } from "@github/copilot-sdk/extension";

async function fixImportAliases(args, invocation) {
  const { scope, customPath } = args;
  const { bash, edit, logger } = invocation.tools;

  let targetPaths = [];
  switch (scope) {
    case "frontend":
      targetPaths = ["frontend"];
      break;
    case "backend":
      targetPaths = ["backend"];
      break;
    case "both":
      targetPaths = ["frontend", "backend"];
      break;
    case "custom":
      if (customPath) {
        targetPaths = [customPath];
      } else {
        logger.error("Custom path must be provided");
        return { resultType: "failure", textResultForLlm: "Custom path must be provided when scope is 'custom'" };
      }
      break;
    default:
      logger.error("Invalid scope");
      return { resultType: "failure", textResultForLlm: "Invalid scope specified" };
  }

  // Find files with relative imports
  logger.info(`Finding files with relative imports in: ${targetPaths.join(", ")}`);

  const filesWithRelativeImports = await bash({
    command: `find ${targetPaths.join(" ")} -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -l "import.*['"']../|import.*['"']./" | head -100`,
    description: "Find files with relative imports",
  });

  if (!filesWithRelativeImports?.stdout?.trim()) {
    logger.info("No files with relative imports found.");
    return { resultType: "success", textResultForLlm: "No files with relative imports found." };
  }

  const files = filesWithRelativeImports.stdout.trim().split("\n").filter(Boolean);
  logger.info(`Found ${files.length} files with relative imports`);

  // Process each file
  let successCount = 0;
  let errorCount = 0;
  const results = [];

  for (const filePath of files) {
    try {
      // Get current imports
      const grepResult = await bash({
        command: `grep -n "import.*['"']../|import.*['"']./" "${filePath}"`,
        description: "Find relative imports in file",
      });

      if (!grepResult?.stdout?.trim()) continue;

      const imports = grepResult.stdout.trim().split("\n").filter(Boolean);
      let fileContent = await invocation.tools.view({ path: filePath });
      const originalContent = fileContent;
      let hasChanges = false;

      // Process each import
      for (const imp of imports) {
        const lineParts = imp.split(":");
        const _lineNumber = parseInt(lineParts[0], 10);
        const importStatement = lineParts.slice(1).join(":").trim();

        // Determine if frontend or backend
        let basePath = "@";
        if (filePath.includes("/frontend/")) {
          basePath = "@/frontend";
        } else if (filePath.includes("/backend/")) {
          basePath = "@/backend";
        }

        // Extract the relative path using regex
        const match = importStatement.match(/from ["'](\.\/|\.\.\/)(.*?)["']/);
        if (match?.[1] && match[2]) {
          const relativePath = match[2];
          const slashCount = match[1].split("../").length - 1;

          // Get the directory path of current file
          const fileDir = filePath.split("/").slice(0, -1).join("/");
          const pathParts = fileDir.split("/");

          // Remove the appropriate number of directory levels
          const baseDirParts = pathParts.slice(0, pathParts.length - slashCount);
          const baseDir = baseDirParts.join("/");

          // Find the relative path from the base directory
          let importPath = filePath
            .substring(baseDir.length + 1)
            .split("/")
            .slice(0, -1)
            .join("/");
          if (!filePath.includes(baseDir)) {
            // Handle case where we can't determine relative path
            importPath = relativePath;
          }

          const newImportPath = `${basePath}/${importPath}/${relativePath}`.replace(/\/+/g, "/");

          // Replace in the file content
          fileContent = fileContent.replace(
            importStatement,
            importStatement.replace(/from ["'].*?["']/, `from "${newImportPath}"`)
          );
          hasChanges = true;
        }
      }

      if (hasChanges) {
        // Update the file
        await edit({
          path: filePath,
          old_str: originalContent,
          new_str: fileContent,
        });

        // Verify with lint
        const relativeFilePath = filePath.replace(/^\/home\/ahmed\/Projects\/siraj\//, "");
        const lintCheck = await bash({
          command: `curl -s -X POST http://localhost:4777/lint -H "Content-Type: application/json" -d '{"id":"fix-imports","files":["${relativeFilePath}"]}'`,
          description: "Run lint check on file",
        });

        const lintOutput = JSON.parse(lintCheck.stdout || "{}");
        if (lintOutput.success) {
          successCount++;
          results.push(`✓ Fixed ${relativeFilePath}`);
          logger.info(`✓ Fixed ${relativeFilePath}`);
        } else {
          errorCount++;
          results.push(`✗ Lint failed for ${relativeFilePath}: ${lintOutput.output}`);
          logger.error(`✗ Lint failed for ${relativeFilePath}: ${lintOutput.output}`);
        }
      }
    } catch (error) {
      errorCount++;
      results.push(`✗ Error processing ${filePath}: ${error}`);
      logger.error(`✗ Error processing ${filePath}: ${error}`);
    }
  }

  // Report summary
  const summary = [
    `--- Summary ---`,
    `Files processed: ${files.length}`,
    `Successfully fixed: ${successCount}`,
    `Errors: ${errorCount}`,
    ...results,
  ].join("\n");

  if (errorCount > 0) {
    logger.warn(`Some files had errors. Check the logs for details.`);
    return { resultType: "failure", textResultForLlm: summary };
  }

  return { resultType: "success", textResultForLlm: summary };
}

// Join the session
const session = await joinSession({
  name: "fix-import-aliases",
  description: "Fix import path aliases to use @/ instead of relative ./ or ../ imports",

  tools: [
    {
      name: "fix_import_aliases",
      description:
        "Fix import path aliases to use @/ instead of relative ./ or ../ imports. Asks for scope (frontend, backend, both, or custom path) and fixes relative imports.",
      parameters: {
        type: "object",
        properties: {
          scope: {
            type: "string",
            enum: ["frontend", "backend", "both", "custom"],
            description: "Scope to fix imports: frontend, backend, both, or custom",
            default: "backend",
          },
          customPath: {
            type: "string",
            description: "Custom path to fix imports (required if scope is 'custom')",
          },
        },
        required: ["scope"],
      },
      handler: fixImportAliases,
    },
  ],

  hooks: {
    onSessionStart: () => {
      session.log("fix-import-aliases extension loaded");
    },
  },
});
