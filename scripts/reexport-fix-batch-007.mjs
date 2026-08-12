import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

// Symbols that come from @/shared/constants/class-instance-detail.enum
const CLASS_ENUM_SYMBOLS = new Set(["ClassExecutionState", "ClassOutcome", "ClassType"]);

// Symbols that come from @/shared/constants/currency.enum
const CURRENCY_ENUM_SYMBOLS = new Set(["CurrencyCode"]);

// Map of symbol -> source path
const SHARED_SOURCE_MAP = {
  classInstanceDetail: "@/shared/constants/class-instance-detail.enum",
  currency: "@/shared/constants/currency.enum",
};

// Find all files that import ClassExecutionState/ClassOutcome/ClassType/CurrencyCode from @/backend/enum
function findFiles() {
  const result = execSync(
    `grep -rn 'ClassExecutionState\\|ClassOutcome\\|ClassType\\|CurrencyCode' --include='*.ts' --include='*.tsx' . | grep 'from.*@/backend/enum' | grep -v '.kilo/' | grep -v '.agents/' | grep -v node_modules | grep -v generated | sed 's/:.*//' | sort -u`,
    { encoding: "utf8" }
  );
  return result.trim().split("\n").filter(Boolean);
}

// Parse an import line and return { typeImports: [], valueImports: [], source: string }
function parseImportLine(line) {
  // Match: import { A, type B, C } from "@/backend/enum"
  // or: import type { A, B } from "@/backend/enum"
  const typeOnlyMatch = line.match(/^import\s+type\s+\{([^}]+)\}\s+from\s+"([^"]+)";?$/);
  if (typeOnlyMatch) {
    const symbols = typeOnlyMatch[1].split(",").map(s => s.trim()).filter(Boolean);
    return { typeOnly: true, symbols, source: typeOnlyMatch[2] };
  }

  const mixedMatch = line.match(/^import\s+\{([^}]+)\}\s+from\s+"([^"]+)";?$/);
  if (mixedMatch) {
    const rawSymbols = mixedMatch[1].split(",").map(s => s.trim()).filter(Boolean);
    const valueImports = [];
    const typeImports = [];
    for (const raw of rawSymbols) {
      // Check if symbol has "type" prefix: "type Foo"
      const typeMatch = raw.match(/^type\s+(\w+)$/);
      if (typeMatch) {
        typeImports.push(typeMatch[1]);
      } else {
        valueImports.push(raw);
      }
    }
    return { typeOnly: false, valueImports, typeImports, source: mixedMatch[2] };
  }

  return null;
}

function formatImport(symbols, source, typeOnly) {
  if (symbols.length === 0) return null;
  const parts = symbols.map(s => typeOnly ? `type ${s}` : s);
  return `import ${typeOnly ? "type " : ""}{ ${parts.join(", ")} } from "${source}";`;
}

function formatMixedImport(valueImports, typeImports, source) {
  if (valueImports.length === 0 && typeImports.length === 0) return null;
  const parts = [];
  for (const s of valueImports) parts.push(s);
  for (const s of typeImports) parts.push(`type ${s}`);
  return `import { ${parts.join(", ")} } from "${source}";`;
}

function processFile(filePath) {
  const content = readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const newLines = [];
  let modified = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip lines that don't import from @/backend/enum
    if (!trimmed.includes('from "@/backend/enum"')) {
      newLines.push(line);
      continue;
    }

    const parsed = parseImportLine(trimmed);
    if (!parsed) {
      newLines.push(line);
      continue;
    }

    // Categorize symbols
    const classEnumValue = [];
    const classEnumType = [];
    const currencyEnumValue = [];
    const currencyEnumType = [];
    const remainingValue = [];
    const remainingType = [];

    if (parsed.typeOnly) {
      for (const sym of parsed.symbols) {
        if (CLASS_ENUM_SYMBOLS.has(sym)) {
          classEnumType.push(sym);
        } else if (CURRENCY_ENUM_SYMBOLS.has(sym)) {
          currencyEnumType.push(sym);
        } else {
          remainingType.push(sym);
        }
      }
    } else {
      for (const sym of parsed.valueImports) {
        if (CLASS_ENUM_SYMBOLS.has(sym)) {
          classEnumValue.push(sym);
        } else if (CURRENCY_ENUM_SYMBOLS.has(sym)) {
          currencyEnumValue.push(sym);
        } else {
          remainingValue.push(sym);
        }
      }
      for (const sym of parsed.typeImports) {
        if (CLASS_ENUM_SYMBOLS.has(sym)) {
          classEnumType.push(sym);
        } else if (CURRENCY_ENUM_SYMBOLS.has(sym)) {
          currencyEnumType.push(sym);
        } else {
          remainingType.push(sym);
        }
      }
    }

    // Build new import lines
    const imports = [];
    const wasTypeOnly = parsed.typeOnly;

    if (wasTypeOnly) {
      // Was `import type { ... } from "@/backend/enum"`
      if (remainingType.length > 0) {
        imports.push(formatImport(remainingType, "@/backend/enum", true));
      }
      if (classEnumType.length > 0) {
        imports.push(formatImport(classEnumType, SHARED_SOURCE_MAP.classInstanceDetail, true));
      }
      if (currencyEnumType.length > 0) {
        imports.push(formatImport(currencyEnumType, SHARED_SOURCE_MAP.currency, true));
      }
    } else {
      // Was `import { ... } from "@/backend/enum"`
      // For remaining: separate value and type imports
      if (remainingValue.length > 0 || remainingType.length > 0) {
        imports.push(formatMixedImport(remainingValue, remainingType, "@/backend/enum"));
      }
      // For class enum and currency: separate value and type
      const classValue = classEnumValue;
      const classType = classEnumType;
      const currValue = currencyEnumValue;
      const currType = currencyEnumType;

      if (classValue.length > 0 || classType.length > 0) {
        imports.push(formatMixedImport(classValue, classType, SHARED_SOURCE_MAP.classInstanceDetail));
      }
      if (currValue.length > 0 || currType.length > 0) {
        imports.push(formatMixedImport(currValue, currType, SHARED_SOURCE_MAP.currency));
      }
    }

    if (imports.length === 0) {
      // This shouldn't happen — means all symbols were moved out
      modified = true;
      continue;
    }

    // Check if anything actually changed
    const newImports = imports.filter(Boolean);
    if (newImports.length === 1 && newImports[0] === trimmed) {
      newLines.push(line);
      continue;
    }

    modified = true;
    for (const imp of newImports) {
      newLines.push(imp);
    }
  }

  if (modified) {
    writeFileSync(filePath, newLines.join("\n"));
    return true;
  }
  return false;
}

const files = findFiles();
console.log(`Found ${files.length} files to process`);

let modifiedCount = 0;
const modifiedFiles = [];
for (const file of files) {
  const changed = processFile(file);
  if (changed) {
    modifiedCount++;
    modifiedFiles.push(file);
    console.log(`Modified: ${file}`);
  }
}

console.log(`\nTotal modified: ${modifiedCount}/${files.length}`);
