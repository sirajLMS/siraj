import { appendFileSync, existsSync, readFileSync, unlinkSync } from "node:fs";
import { CONFIG, logSuccess, logWarning } from "./config";

export function isStepCompleted(step: string): boolean {
  if (!existsSync(CONFIG.SONAR_STATE_FILE)) return false;
  const content = readFileSync(CONFIG.SONAR_STATE_FILE, "utf8");
  return content.split("\n").some((line: string) => line.trim() === `${step}=true`);
}

export function markStepCompleted(step: string): void {
  if (isStepCompleted(step)) return;
  appendFileSync(CONFIG.SONAR_STATE_FILE, `${step}=true\n`);
}

export function resetSetup(): void {
  logWarning("Resetting SonarQube setup state...");
  if (existsSync(CONFIG.SONAR_STATE_FILE)) {
    unlinkSync(CONFIG.SONAR_STATE_FILE);
  }
  logSuccess("Setup state reset. Next run will perform full setup.");
}
