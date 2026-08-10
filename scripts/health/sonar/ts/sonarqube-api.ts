import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { CONFIG, logError, logInfo, logSuccess, logWarning } from "@/scripts/health/sonar/ts/config";
import { isStepCompleted, markStepCompleted } from "@/scripts/health/sonar/ts/state";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function waitForSonarQube(): Promise<void> {
  logInfo("Waiting for SonarQube to be ready...");

  const maxAttempts = 60;

  async function attempt(attemptIndex: number): Promise<void> {
    if (attemptIndex >= maxAttempts) {
      globalThis.console.log("");
      logError("SonarQube failed to start within expected time");
      process.exit(1);
    }

    try {
      const response = await fetch(`${CONFIG.SONAR_HOST}/api/system/status`);
      if (response.ok) {
        const data: unknown = await response.json();
        if (isRecord(data) && typeof data.status === "string" && data.status === "UP") {
          logSuccess("SonarQube is ready");
          return;
        }
      }
    } catch (e) {
      logWarning(`Connection attempt ${attemptIndex + 1} failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    process.stdout.write(".");
    await new Promise(resolve => setTimeout(resolve, 2000));
    return attempt(attemptIndex + 1);
  }

  await attempt(0);
}

export async function changeAdminPassword(): Promise<void> {
  if (isStepCompleted("password_changed")) {
    logSuccess("Admin password already configured (skipped)");
    return;
  }

  logInfo("Checking admin password...");

  const authHeaderNew = `Basic ${btoa("admin:" + CONFIG.ADMIN_NEW_PASSWORD)}`;
  try {
    const response = await fetch(`${CONFIG.SONAR_HOST}/api/authentication/validate`, {
      headers: { Authorization: authHeaderNew },
    });
    if (response.ok) {
      const data: unknown = await response.json();
      if (isRecord(data) && typeof data.valid === "boolean" && data.valid) {
        logSuccess(`Admin password is already set to ${CONFIG.ADMIN_NEW_PASSWORD}`);
        markStepCompleted("password_changed");
        return;
      }
    }
  } catch (e) {
    logInfo(`Password not yet configured: ${e instanceof Error ? e.message : String(e)}`);
  }

  logInfo(`Changing admin password from '${CONFIG.ADMIN_DEFAULT_PASSWORD}' to '${CONFIG.ADMIN_NEW_PASSWORD}'...`);
  const authHeaderDefault = `Basic ${btoa("admin:" + CONFIG.ADMIN_DEFAULT_PASSWORD)}`;
  const formData = new URLSearchParams();
  formData.append("login", "admin");
  formData.append("previousPassword", CONFIG.ADMIN_DEFAULT_PASSWORD);
  formData.append("password", CONFIG.ADMIN_NEW_PASSWORD);

  const response = await fetch(`${CONFIG.SONAR_HOST}/api/users/change_password`, {
    method: "POST",
    headers: { Authorization: authHeaderDefault },
    body: formData,
  });

  if (response.ok) {
    logSuccess(`Admin password changed to ${CONFIG.ADMIN_NEW_PASSWORD}`);
    markStepCompleted("password_changed");
  } else {
    logWarning("Could not change password (may already be changed)");
    markStepCompleted("password_changed");
  }
}

export async function generateToken(): Promise<string> {
  if (existsSync(CONFIG.SONAR_TOKEN_FILE)) {
    logSuccess("Using existing SonarQube token");
    return readFileSync(CONFIG.SONAR_TOKEN_FILE, "utf8").trim();
  }

  logInfo("Generating SonarQube authentication token...");

  const authHeader = `Basic ${btoa("admin:" + CONFIG.ADMIN_NEW_PASSWORD)}`;
  const formData = new URLSearchParams();
  formData.append("name", `scanner-token-${Date.now()}`);

  const response = await fetch(`${CONFIG.SONAR_HOST}/api/user_tokens/generate`, {
    method: "POST",
    headers: { Authorization: authHeader },
    body: formData,
  });

  if (!response.ok) {
    logError("Failed to generate token");
    process.exit(1);
  }

  const data: unknown = await response.json();
  if (!isRecord(data) || typeof data.token !== "string" || data.token.length === 0) {
    logError("Failed to parse token from response");
    process.exit(1);
  }
  const token = data.token;

  writeFileSync(CONFIG.SONAR_TOKEN_FILE, token, { mode: 0o600 });
  logSuccess("Token generated and saved");
  return token;
}

export async function createProject(token: string): Promise<void> {
  if (isStepCompleted("project_created")) {
    logSuccess("Project already configured (skipped)");
    return;
  }

  logInfo("Checking if project exists...");
  const authHeader = `Basic ${btoa(token + ":")}`;
  const searchResponse = await fetch(`${CONFIG.SONAR_HOST}/api/projects/search?projects=${CONFIG.PROJECT_KEY}`, {
    headers: { Authorization: authHeader },
  });

  if (searchResponse.ok) {
    const data: unknown = await searchResponse.json();
    if (
      isRecord(data) &&
      Array.isArray(data.components) &&
      (data.components as unknown[]).some(c => isRecord(c) && typeof c.key === "string" && c.key === CONFIG.PROJECT_KEY)
    ) {
      logSuccess("Project already exists");
      markStepCompleted("project_created");
      return;
    }
  }

  logInfo("Creating project...");
  const formData = new URLSearchParams();
  formData.append("name", CONFIG.PROJECT_NAME);
  formData.append("project", CONFIG.PROJECT_KEY);

  const createResponse = await fetch(`${CONFIG.SONAR_HOST}/api/projects/create`, {
    method: "POST",
    headers: { Authorization: authHeader },
    body: formData,
  });

  if (createResponse.ok) {
    logSuccess("Project created");
    markStepCompleted("project_created");
  } else {
    logError("Failed to create project");
  }
}

export function writeConnectionInfo(token: string): void {
  const content = `# SonarQube Connection Details

Generated on: ${new Date().toLocaleString()}

## Server Information
- **URL**: ${CONFIG.SONAR_HOST}
- **Connection Name**: Local SonarQube

## Authentication
- **User Token**: \`${token}\`
- **Username**: \`admin\`
- **Password**: \`${CONFIG.ADMIN_NEW_PASSWORD}\`

## Project Information
- **Project Key**: \`${CONFIG.PROJECT_KEY}\`
- **Project Name**: ${CONFIG.PROJECT_NAME}

---
*Note: This file is automatically generated and git-ignored.*
`;

  writeFileSync(CONFIG.SONAR_INFO_FILE, content);
  logSuccess(`Connection info saved to ${CONFIG.SONAR_INFO_FILE}`);
}
