import type { SkillContext } from "@opencode-ai/plugin";

export async function execute(context: SkillContext) {
  const { askUser, bash, edit } = context.tools;
  const { logger } = context;

  // Ask user for scope
  const scopeResponse = await askUser({
    message: "Which imports would you like to fix?",
    requestedSchema: {
      properties: {
        scope: {
          type: "string",
          title: "Scope",
          enum: ["frontend", "backend", "both", "custom"],
          default: "backend",
          description: "Choose whether to fix frontend, backend, both, or provide a custom path",
        },
        customPath: {
          type: "string",
          title: "Custom path",
          description: "If you selected 'custom', specify the path to fix (relative to project root)",
        },
      },
      required: ["scope"],
    },
  });

  let targetPaths: string[] = [];
  switch (scopeResponse.scope) {
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
      if (scopeResponse.customPath) {
        targetPaths = [scopeResponse.customPath];
      } else {
        logger.error("Custom path must be provided");
        return;
      }
      break;
  }

  // Find files with relative imports
  logger.info(`Finding files with relative imports in: ${targetPaths.join(", ")}`);

  const filesWithRelativeImports = await bash({
    command: `find ${targetPaths.join(" ")} -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -l "import.*['"]../|import.*['"]./" | head -100`,
    description: "Find files with relative imports",
  });

  if (!filesWithRelativeImports?.stdout?.trim()) {
    logger.info("No files with relative imports found.");
    return;
  }

  const files = filesWithRelativeImports.stdout.trim().split("\n").filter(Boolean);
  logger.info(`Found ${files.length} files with relative imports`);

  // Process each file
  let successCount = 0;
  let errorCount = 0;

  for (const filePath of files) {
    try {
      // Get current imports
      const grepResult = await bash({
        command: `grep -n "import.*['"]../|import.*['"]./" "${filePath}"`,
        description: "Find relative imports in file",
      });

      if (!grepResult?.stdout?.trim()) continue;

      const imports = grepResult.stdout.trim().split("\n").filter(Boolean);
      let fileContent = await context.tools.view({ path: filePath });
      const originalContent = fileContent;

      // Process each import
      let hasChanges = false;
      for (const imp of imports) {
        const _lineNumber = parseInt(imp.split(":")[0], 10);
        const importStatement = imp.split(":").slice(1).join(":").trim();

        // Determine if frontend or backend
        let basePath = "@";
        if (filePath.includes("/frontend/")) {
          basePath = "@/frontend";
        } else if (filePath.includes("/backend/")) {
          basePath = "@/backend";
        }

        // Extract the relative path
        const match = importStatement.match(/from ["'](\.\/|\.\.\/)(.*?)["']/);
        if (match?.[1] && match[2]) {
          const _relativeImport = match[1] + match[2];
          const newImport = `${basePath}/${match[2].replace(/^\.+\//, "")}`;

          // Replace in the file content
          fileContent = fileContent.replace(
            importStatement,
            importStatement.replace(/from ["'].*?["']/, `from "${newImport}"`)
          );
          hasChanges = true;
        }
      }

      if (hasChanges) {
        // Update the file
        await edit({
          path: filePath,
          old_str: originalContent as string,
          new_str: fileContent as string,
        });

        // Verify with lint
        const relativeFilePath = filePath.replace(/\/home\/ahmed\/Projects\/siraj\//, "");
        const lintCheck = await bash({
          command: `~/.bun/bin/bun run scripts/lint-service.ts -f "${relativeFilePath}" --id fix-imports --json`,
          description: "Run lint check on file",
        });

        const lintResult = JSON.parse(lintCheck?.stdout || "{}");
        if (lintResult.success === true) {
          successCount++;
          logger.info(`✓ Fixed ${filePath}`);
        } else {
          errorCount++;
          logger.error(`✗ Lint failed for ${filePath}`);
        }
      }
    } catch (error) {
      errorCount++;
      logger.error(`✗ Error processing ${filePath}: ${error}`);
    }
  }

  // Report summary
  logger.info(`\n--- Summary ---`);
  logger.info(`Files processed: ${files.length}`);
  logger.info(`Successfully fixed: ${successCount}`);
  logger.info(`Errors: ${errorCount}`);

  if (errorCount > 0) {
    logger.warn(`Some files had errors. Check the logs for details.`);
  }
}
