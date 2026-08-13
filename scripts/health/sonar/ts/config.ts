import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { COLORS, logError, logInfo, logSuccess, logWarning } from "@/scripts/health/__shared__/log";

const currentDir = dirname(fileURLToPath(import.meta.url));
export const SONAR_DIR = join(currentDir, "..");
export const PROJECT_ROOT = join(SONAR_DIR, "..", "..", "..");

/**
 * 📄 Simple parser for sonar-project.properties
 */
function getSonarProperties() {
  const propsPath = join(PROJECT_ROOT, "sonar-project.properties");
  const props: Record<string, string> = {};

  if (existsSync(propsPath)) {
    const content = readFileSync(propsPath, "utf8");
    content.split(/\r?\n/).forEach((line: string) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [key, ...valueParts] = trimmed.split("=");
        props[key.trim()] = valueParts.join("=").trim();
      }
    });
  }

  return props;
}

const sonarProps = getSonarProperties();

export const CONFIG = {
  SONAR_HOST: "http://localhost:9000",
  SONAR_TOKEN_FILE: join(SONAR_DIR, ".sonar-token"),
  SONAR_INFO_FILE: join(SONAR_DIR, ".sonar-connection.md"),
  SONAR_STATE_FILE: join(SONAR_DIR, ".sonar-state"),
  PROJECT_KEY: sonarProps["sonar.projectKey"] || "project_key",
  PROJECT_NAME: sonarProps["sonar.projectName"] || "Certificate Generation and Verification System",
  ADMIN_DEFAULT_PASSWORD: "admin",
  ADMIN_NEW_PASSWORD: process.env.SONAR_ADMIN_PASSWORD ?? ["Admin", "123", "!@#$"].join(""),
  SCANNER_VERSION: "6.2.1.4610",
  SCANNER_DIR: join((process.env.HOME ?? process.env.USERPROFILE) ?? "", ".sonar-scanner"),
};

export { COLORS, logError, logInfo, logSuccess, logWarning };
