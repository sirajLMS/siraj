import type { Dirent } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { logger } from "@/backend/lib/logger";

interface SkillValidationResult {
  name: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  descriptionSnippet?: string;
}

const SKILLS_DIR = join(process.cwd(), ".agents/skills");

function validateFrontmatter(fm: string, result: SkillValidationResult): void {
  const nameMatch = /^name:\s*([^\r\n]+)/m.exec(fm);
  if (!nameMatch) {
    result.errors.push("Missing 'name' field in frontmatter");
    result.valid = false;
  } else {
    const declaredName = nameMatch[1].trim().replace(/^['"]|['"]$/g, "");
    if (!/^[a-z0-9-]+$/.test(declaredName)) {
      result.warnings.push(`Skill name '${declaredName}' should only contain lowercase alphanumeric and hyphens`);
    }
  }

  const descMatch = /^description:\s*([^\r\n]+)/m.exec(fm);
  if (!descMatch?.[1]?.trim()) {
    result.errors.push("Missing or empty 'description' field in frontmatter");
    result.valid = false;
  } else {
    const cleanDesc = descMatch[1].trim().replace(/\s+/g, " ");
    result.descriptionSnippet = cleanDesc.length > 80 ? `${cleanDesc.slice(0, 77)}...` : cleanDesc;
  }
}

async function validateSkillEntry(skillName: string): Promise<SkillValidationResult> {
  const skillPath = join(SKILLS_DIR, skillName, "SKILL.md");
  const result: SkillValidationResult = {
    name: skillName,
    valid: true,
    errors: [],
    warnings: [],
  };

  try {
    const fileStat = await stat(skillPath);
    if (fileStat.size === 0) {
      result.errors.push("SKILL.md is empty");
      result.valid = false;
    }
  } catch {
    result.errors.push("Missing SKILL.md file");
    result.valid = false;
    return result;
  }

  const content = await readFile(skillPath, "utf-8");
  const frontmatterMatch = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content);

  if (!frontmatterMatch) {
    result.errors.push("Missing or invalid YAML frontmatter delimiters (---)");
    result.valid = false;
    return result;
  }

  validateFrontmatter(frontmatterMatch[1], result);
  return result;
}

function printValidationSummary(results: SkillValidationResult[]): boolean {
  let totalValid = 0;
  let totalInvalid = 0;

  for (const r of results) {
    if (r.valid) {
      totalValid++;
      logger.info(`✅ [${r.name}] Valid`);
      if (r.descriptionSnippet) {
        logger.info(`   Description: ${r.descriptionSnippet}`);
      }
      for (const w of r.warnings) {
        logger.warn(`   ⚠️ Warning: ${w}`);
      }
    } else {
      totalInvalid++;
      logger.error(`❌ [${r.name}] Invalid:`);
      for (const e of r.errors) {
        logger.error(`   • ${e}`);
      }
    }
  }

  logger.info(`\n📊 Summary: ${totalValid} valid, ${totalInvalid} invalid out of ${results.length} skills.\n`);

  return totalInvalid === 0;
}

export async function validateSkills(): Promise<boolean> {
  logger.info(`\n🔍 Validating skills in ${SKILLS_DIR}...\n`);

  let entries: Dirent[];
  try {
    entries = await readdir(SKILLS_DIR, { withFileTypes: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`❌ Failed to read skills directory: ${message}`);
    return false;
  }

  const skillDirs = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);

  const results = await Promise.all(skillDirs.map(name => validateSkillEntry(name)));

  return printValidationSummary(results);
}

if (import.meta.main) {
  const success = await validateSkills();
  if (!success) {
    process.exit(1);
  }
}
