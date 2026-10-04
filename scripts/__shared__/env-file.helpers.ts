import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const PROJECT_ROOT = process.cwd();

/**
 * Updates or appends a key=value pair in an environment file.
 */
export function updateEnvFile(filePath: string, secretKey: string, secretValue: string): boolean {
  const absPath = resolve(PROJECT_ROOT, filePath);
  if (!existsSync(absPath)) {
    return false;
  }

  const content = readFileSync(absPath, "utf8");
  const regex = new RegExp(`^${secretKey}=.*$`, "m");

  let updatedContent: string;
  if (regex.test(content)) {
    updatedContent = content.replace(regex, `${secretKey}=${secretValue}`);
  } else {
    const trailingNewline = content.endsWith("\n") ? "" : "\n";
    updatedContent = `${content}${trailingNewline}${secretKey}=${secretValue}\n`;
  }

  writeFileSync(absPath, updatedContent, "utf8");
  return true;
}
