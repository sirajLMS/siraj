#!/usr/bin/env node
/**
 * Script to fix consumers of @/backend/db/repo and @/backend/db
 * by rewriting imports to point to sub-directory barrels.
 *
 * Usage: node scripts/reexport-fix-consumers.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const ROOT = process.cwd();

// Symbol → target barrel mapping
const SYMBOL_MAP = {
  AuditRepository: "@/backend/db/repo/audit",
  ImpersonationRepository: "@/backend/db/repo/auth",
  BillingRepository: "@/backend/db/repo/billing",
  CreditRepository: "@/backend/db/repo/billing",
  CurrencyHedgeRepository: "@/backend/db/repo/billing",
  InvoicePaymentSubmissionRepository: "@/backend/db/repo/billing",
  QuotaLedgerRepository: "@/backend/db/repo/billing",
  QuotaRepository: "@/backend/db/repo/billing",
  SupportedCurrencyRepository: "@/backend/db/repo/billing",
  SupportedMobileWalletRepository: "@/backend/db/repo/billing",
  SupportedOnlineAccountRepository: "@/backend/db/repo/billing",
  SupportedPaymentLinkRepository: "@/backend/db/repo/billing",
  UserPaymentMethodRepository: "@/backend/db/repo/billing",
  BookRepository: "@/backend/db/repo/books",
  ReportGroupingMode: "@/backend/db/repo/books",
  ReportRepository: "@/backend/db/repo/books",
  ClassCategoryRepository: "@/backend/db/repo/classes",
  ClassPerformanceRepository: "@/backend/db/repo/classes",
  ClassSubjectRepository: "@/backend/db/repo/classes",
  DstMigrationRepository: "@/backend/db/repo/classes",
  GroupClassRepository: "@/backend/db/repo/classes",
  PendingReviewFilters: "@/backend/db/repo/classes",
  LessonReportRepository: "@/backend/db/repo/classes",
  SubjectResourceRepository: "@/backend/db/repo/classes",
  ComplaintRepository: "@/backend/db/repo/complaints",
  ComplaintResponseRepository: "@/backend/db/repo/complaints",
  CronRepository: "@/backend/db/repo/cron",
  toScheduleReturnType: "@/backend/db/repo/cron",
  FxSyncRepository: "@/backend/db/repo/fx-sync.repository",
  MeetingProviderRepository: "@/backend/db/repo/meeting",
  UserMeetingConfigRepository: "@/backend/db/repo/meeting",
  NotificationPreferencesRepository: "@/backend/db/repo/notifications",
  NotificationRepository: "@/backend/db/repo/notifications",
  ParentRepository: "@/backend/db/repo/parents",
  SuggestionRepository: "@/backend/db/repo/parents",
  PermissionManagementRepository: "@/backend/db/repo/permissions",
  SchedulingRepository: "@/backend/db/repo/scheduling",
  CacheDbRepository: "@/backend/db/repo/shared",
  RateLimitRepository: "@/backend/db/repo/shared",
  SessionRepository: "@/backend/db/repo/shared",
  SignedUrlRepository: "@/backend/db/repo/shared",
  SoftDeleteRepository: "@/backend/db/repo/shared",
  SystemSettingsRepository: "@/backend/db/repo/shared",
  LearningResourceRepository: "@/backend/db/repo/storage",
  SiteContentRepository: "@/backend/db/repo/storage",
  StorageDbRepository: "@/backend/db/repo/storage",
  StudentHistoryRepository: "@/backend/db/repo/students",
  StudentRepository: "@/backend/db/repo/students",
  StaffProfileRepository: "@/backend/db/repo/teachers",
  TeacherAvailabilityRepository: "@/backend/db/repo/teachers",
  TeacherDueRepository: "@/backend/db/repo/teachers",
  TeacherNotesRepository: "@/backend/db/repo/teachers",
  TeacherRepository: "@/backend/db/repo/teachers",
  SessionConfigRepository: "@/backend/db/repo/users",
  UserRepository: "@/backend/db/repo/users",
  WhatsappAccountRepository: "@/backend/db/repo/whatsapp",
  UserReturnType: "@/backend/types",
  UserSelectType: "@/backend/types",
};

// Type-only symbols
const TYPE_ONLY_SYMBOLS = new Set([
  "PendingReviewFilters",
  "UserReturnType",
  "UserSelectType",
]);

// Source barrels we're fixing
const REPO_SOURCE = '@/backend/db/repo"';
const DB_SOURCE = '@/backend/db"';

function findTsFiles(dir, files = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (entry === "node_modules" || entry === ".next" || entry === ".next-test-prod" || entry === ".git") continue;
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      findTsFiles(fullPath, files);
    } else if (extname(entry) === ".ts" || extname(entry) === ".tsx") {
      files.push(fullPath);
    }
  }
  return files;
}

function parseImportSymbols(importBlock) {
  // Parse symbols from import block like: { A, B, type C }
  // Returns array of { name, isType }
  const inner = importBlock.replace(/[{}]/g, "").trim();
  const parts = inner.split(",").map(s => s.trim()).filter(s => s.length > 0);
  const symbols = [];
  for (const part of parts) {
    if (part.startsWith("type ")) {
      symbols.push({ name: part.slice(5).trim(), isType: true });
    } else {
      symbols.push({ name: part, isType: false });
    }
  }
  return symbols;
}

function fixFile(filePath) {
  let content = readFileSync(filePath, "utf8");
  let modified = false;
  const changes = [];

  // Match: import { ... } from "@/backend/db/repo";
  // or multi-line: import {\n  A,\n  B,\n} from "@/backend/db/repo";
  // Also match: export { ... } from "@/backend/db/repo";
  // and: export * from "@/backend/db/repo";

  // Pattern for import/export blocks with the source
  // We need to handle both import and export, and both @/backend/db/repo and @/backend/db

  for (const sourcePattern of [REPO_SOURCE, DB_SOURCE]) {
    const isRepo = sourcePattern === REPO_SOURCE;
    const sourceLabel = isRepo ? "@/backend/db/repo" : "@/backend/db";

    // Match: import { ... } from "source";
    // Using a regex that captures the brace content
    const importRegex = new RegExp(
      `import\\s*\\{([^}]*)\\}\\s*from\\s*"${sourceLabel.replace(/"/g, "")}"`,
      "g"
    );

    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const symbolBlock = match[1];
      const symbols = parseImportSymbols(symbolBlock);

      // Separate symbols into repo symbols and non-repo symbols
      // For @/backend/db/repo - all symbols are repo symbols
      // For @/backend/db - some are repo symbols, some are from other parts (queryDb, db, etc.)
      const repoSymbols = [];
      const nonRepoSymbols = [];

      for (const sym of symbols) {
        if (SYMBOL_MAP[sym.name]) {
          repoSymbols.push(sym);
        } else {
          nonRepoSymbols.push(sym);
        }
      }

      if (repoSymbols.length === 0) continue;

      // Group repo symbols by target barrel
      const byTarget = new Map();
      for (const sym of repoSymbols) {
        const target = SYMBOL_MAP[sym.name];
        if (!byTarget.has(target)) {
          byTarget.set(target, []);
        }
        byTarget.get(target).push(sym);
      }

      // Build replacement import statements
      const newImports = [];

      // If there are non-repo symbols, keep them importing from the original source
      if (nonRepoSymbols.length > 0) {
        const nonRepoStr = nonRepoSymbols
          .map(s => (s.isType ? `type ${s.name}` : s.name))
          .join(", ");
        newImports.push(`import { ${nonRepoStr} } from "${sourceLabel}";`);
      }

      // For each target barrel, create an import
      for (const [target, syms] of byTarget) {
        const typeSyms = syms.filter(s => s.isType || TYPE_ONLY_SYMBOLS.has(s.name));
        const valueSyms = syms.filter(s => !s.isType && !TYPE_ONLY_SYMBOLS.has(s.name));

        // For @/backend/db/repo, we don't need type-only imports since export * handles everything
        // But for @/backend/types, we should use type imports
        if (target === "@/backend/types") {
          if (typeSyms.length > 0) {
            const typeStr = typeSyms.map(s => s.name).join(", ");
            newImports.push(`import type { ${typeStr} } from "${target}";`);
          }
          if (valueSyms.length > 0) {
            const valueStr = valueSyms.map(s => s.name).join(", ");
            newImports.push(`import { ${valueStr} } from "${target}";`);
          }
        } else {
          // Regular repo barrels - combine type and value imports
          const allSyms = syms.map(s => {
            if (s.isType) return `type ${s.name}`;
            return s.name;
          });
          newImports.push(`import { ${allSyms.join(", ")} } from "${target}";`);
        }
      }

      const replacement = newImports.join("\n");
      content = content.replace(fullMatch, replacement);
      modified = true;
      changes.push(`  ${sourceLabel} → ${newImports.length} import(s)`);
      // Re-exec to continue matching
      importRegex.lastIndex = 0;
    }

    // Match: export * from "@/backend/db/repo";
    const exportStarRegex = new RegExp(
      `export\\s*\\*\\s*from\\s*"${sourceLabel.replace(/"/g, "")}"`,
      "g"
    );

    if (isRepo && exportStarRegex.test(content)) {
      // For export * from "@/backend/db/repo" — this is in backend/db/index.ts
      // We need to replace it with export * from each subdirectory barrel
      const subdirs = [
        "@/backend/db/repo/audit",
        "@/backend/db/repo/auth",
        "@/backend/db/repo/billing",
        "@/backend/db/repo/books",
        "@/backend/db/repo/classes",
        "@/backend/db/repo/complaints",
        "@/backend/db/repo/cron",
        "@/backend/db/repo/fx-sync.repository",
        "@/backend/db/repo/meeting",
        "@/backend/db/repo/notifications",
        "@/backend/db/repo/parents",
        "@/backend/db/repo/permissions",
        "@/backend/db/repo/scheduling",
        "@/backend/db/repo/shared",
        "@/backend/db/repo/storage",
        "@/backend/db/repo/students",
        "@/backend/db/repo/teachers",
        "@/backend/db/repo/users",
        "@/backend/db/repo/whatsapp",
      ];
      // Note: UserReturnType, UserSelectType come from @/backend/types, not @/backend/db/repo
      // So we need export type { UserReturnType, UserSelectType } from "@/backend/types" too
      const replacement = subdirs
        .map(s => `export * from "${s}";`)
        .join("\n");
      content = content.replace(
        new RegExp(`export\\s*\\*\\s*from\\s*"${sourceLabel.replace(/"/g, "")}"`, "g"),
        replacement
      );
      modified = true;
      changes.push(`  export * from ${sourceLabel} → ${subdirs.length} sub-exports`);
    }
  }

  if (modified) {
    writeFileSync(filePath, content, "utf8");
    console.log(`FIXED: ${filePath}`);
    for (const change of changes) {
      console.log(change);
    }
    return true;
  }
  return false;
}

const allFiles = findTsFiles(ROOT);
let fixedCount = 0;
for (const file of allFiles) {
  if (file.includes("reexport-fix-consumers")) continue;
  if (fixFile(file)) {
    fixedCount++;
  }
}
console.log(`\nTotal files fixed: ${fixedCount}`);
