import { IF_REGEX, RETURN_REGEX } from "@/scripts/translate-locale-ar.constants";
import {
  applyBracket,
  depthZero,
  skipInterpolation,
  skipQuoted,
  skipSpecial,
  zeroDepth,
} from "@/scripts/translate-locale-ar.scanner";

// ─── Function-shape validation ──────────────────────────────────────────────

/** Extract `${...}` placeholder expression texts from a source slice.
 *  Strings are skipped; backticks are walked char-wise so template contents
 *  are still scanned. */
function extractPlaceholders(src: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'") {
      i = skipQuoted(src, i);
      continue;
    }
    if (c === "$" && src[i + 1] === "{") {
      const end = skipInterpolation(src, i + 2);
      out.push(src.slice(i + 2, end - 1).trim());
      i = end;
      continue;
    }
    i++;
  }
  return out;
}

/** Extract the parameter identifier list from an arrow function source. */
function extractParams(fnSrc: string): string[] | null {
  const arrow = topLevelArrow(fnSrc);
  if (arrow < 0) return null;
  const head = fnSrc.slice(0, arrow).trim();
  if (!head) return null;
  if (head.startsWith("(")) {
    if (!head.endsWith(")")) return null;
    const inner = head.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map(p => p.split(":")[0].split("=")[0].trim());
  }
  return [head.split(":")[0].trim()];
}

/** Find a top-level `=>` (not inside strings/templates/nesting). */
export function topLevelArrow(src: string): number {
  const d = zeroDepth();
  let i = 0;
  while (i < src.length - 1) {
    const skipped = skipSpecial(src, i);
    if (skipped > i) {
      i = skipped;
      continue;
    }
    if (depthZero(d) && src[i] === "=" && src[i + 1] === ">") return i;
    applyBracket(src[i], d);
    i++;
  }
  return -1;
}

function countMatches(src: string, re: RegExp): number {
  return [...src.matchAll(re)].length;
}

function isBalanced(src: string): boolean {
  const d = zeroDepth();
  let i = 0;
  while (i < src.length) {
    const skipped = skipSpecial(src, i);
    if (skipped > i) {
      i = skipped;
      continue;
    }
    applyBracket(src[i], d);
    if (d.paren < 0 || d.bracket < 0 || d.brace < 0) return false;
    i++;
  }
  return depthZero(d);
}

/** Validate a proposed function translation against the ENGLISH function.
 *  Returns notes; empty = clean. */
export function validateFunctionProposal(enFn: string, proposed: string): string[] {
  const notes: string[] = [];
  if (topLevelArrow(proposed) < 0) {
    notes.push("proposal is not an arrow function");
    return notes;
  }
  if (!isBalanced(proposed)) notes.push("unbalanced braces/parens/brackets");

  const enParams = extractParams(enFn);
  const propParams = extractParams(proposed);
  if (enParams === null || propParams === null) {
    notes.push("could not extract parameter list");
  } else if (JSON.stringify(enParams) !== JSON.stringify(propParams)) {
    notes.push(`parameter list changed: (${enParams.join(", ")}) -> (${propParams.join(", ")})`);
  }

  const enPh = extractPlaceholders(enFn).toSorted((a, b) => a.localeCompare(b));
  const propPh = extractPlaceholders(proposed).toSorted((a, b) => a.localeCompare(b));
  if (JSON.stringify(enPh) !== JSON.stringify(propPh)) {
    notes.push(`\${...} placeholders differ: en=[${enPh.join(" | ")}] proposed=[${propPh.join(" | ")}]`);
  }

  const enReturns = countMatches(enFn, RETURN_REGEX);
  const propReturns = countMatches(proposed, RETURN_REGEX);
  if (enReturns !== propReturns) {
    notes.push(`return count changed: ${enReturns} -> ${propReturns}`);
  }
  const enIfs = countMatches(enFn, IF_REGEX);
  const propIfs = countMatches(proposed, IF_REGEX);
  if (enIfs !== propIfs) {
    notes.push(`if-branch count changed: ${enIfs} -> ${propIfs}`);
  }
  return notes;
}

/** Validate a proposed plain-string translation against the English text. */
export function validateStringProposal(enText: string, proposed: string): string[] {
  const notes: string[] = [];
  if (!proposed.trim()) notes.push("proposal is empty");
  if (proposed === enText) {
    const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFE]/u.test(enText);
    if (!hasArabic && enText.length > 3 && !/^\d+$/.test(enText)) {
      notes.push("proposal identical to English source (possibly untranslated)");
    }
  }
  if (proposed.includes("```")) notes.push("proposal contains markdown fences");
  return notes;
}
