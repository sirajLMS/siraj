import { writeFileSync } from "node:fs";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { CONFIG, logError, logInfo, logSuccess, logWarning } from "@/scripts/health/sonar/ts/config";
import { markStepCompleted } from "@/scripts/health/sonar/ts/state";

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

export async function validateToken(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const authHeader = `Basic ${btoa(token + ":")}`;
    const response = await fetch(`${CONFIG.SONAR_HOST}/api/authentication/validate`, {
      headers: { Authorization: authHeader },
    });
    if (response.ok) {
      const data: unknown = await response.json();
      if (isRecord(data) && typeof data.valid === "boolean") {
        return data.valid;
      }
    }
  } catch {
    return false;
  }
  return false;
}

export async function changeAdminPassword(): Promise<void> {
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
    logInfo(`Password check error: ${e instanceof Error ? e.message : String(e)}`);
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
  try {
    const existingToken = (await readFile(CONFIG.SONAR_TOKEN_FILE, "utf8")).trim();
    if (await validateToken(existingToken)) {
      logSuccess("Using existing SonarQube token");
      return existingToken;
    }
    logWarning("Existing SonarQube token is invalid or expired. Generating a new token...");
    try {
      await unlink(CONFIG.SONAR_TOKEN_FILE);
    } catch {
      // Ignore deletion error
    }
  } catch {
    // File does not exist or read failed, proceed to generate token
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

  await writeFile(CONFIG.SONAR_TOKEN_FILE, token, { mode: 0o600 });
  logSuccess("Token generated and saved");
  return token;
}

export async function createProject(token: string): Promise<void> {
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
