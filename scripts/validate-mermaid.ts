/**
 * Mermaid validator — parses and validates Mermaid diagram definitions.
 *
 * Supports two input kinds:
 *   - `.mmd` files  → the whole file is treated as a single Mermaid definition
 *   - `.md` files   → every ```mermaid fenced block is validated in place
 *
 * Usage:
 *   bun run scripts/validate-mermaid.ts <file> [file2 ...]
 *
 * If no files are passed, validates Diagram.md by default.
 *
 * Why a DOMPurify shim: mermaid's parser imports "dompurify" and calls
 * DOMPurify.addHook, which only exists once DOMPurify is bound to a
 * window. Under bun there's no DOM, so we shadow the "dompurify"
 * module in node_modules with a jsdom-bound version before importing
 * mermaid. On exit we restore the original package.
 */
import fs from "node:fs";
import path from "node:path";

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

const DOMPURIFY_DIR = "node_modules/dompurify";
const DOMPURIFY_REAL = "node_modules/dompurify-real";

const SHIM_INDEX = `import { JSDOM } from "jsdom";
import createDOMPurify from "../dompurify-real/dist/purify.es.mjs";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
const DOMPurify = createDOMPurify(dom.window);

export default DOMPurify;
export const addHook = DOMPurify.addHook.bind(DOMPurify);
export const sanitize = DOMPurify.sanitize.bind(DOMPurify);
export const removeAllHooks = DOMPurify.removeAllHooks.bind(DOMPurify);
export const removeHook = DOMPurify.removeHook.bind(DOMPurify);
export const setConfig = DOMPurify.setConfig.bind(DOMPurify);
`;

const SHIM_PKG = '{"name":"dompurify","version":"3.4.13","main":"index.js","type":"module"}\n';

function installShim(): void {
  if (fs.existsSync(DOMPURIFY_REAL)) return; // already shimmed
  if (!fs.existsSync(DOMPURIFY_DIR)) {
    throw new Error("dompurify not installed. Run: bun install");
  }
  fs.renameSync(DOMPURIFY_DIR, DOMPURIFY_REAL);
  fs.mkdirSync(DOMPURIFY_DIR, { recursive: true });
  fs.writeFileSync(path.join(DOMPURIFY_DIR, "package.json"), SHIM_PKG);
  fs.writeFileSync(path.join(DOMPURIFY_DIR, "index.js"), SHIM_INDEX);
}

function uninstallShim(): void {
  if (!fs.existsSync(DOMPURIFY_REAL)) return; // nothing to restore
  if (fs.existsSync(DOMPURIFY_DIR)) {
    fs.rmSync(DOMPURIFY_DIR, { recursive: true, force: true });
  }
  fs.renameSync(DOMPURIFY_REAL, DOMPURIFY_DIR);
}

interface MermaidModule {
  parse: (definition: string) => Promise<unknown>;
}

const blockRe = /```mermaid\n([\s\S]*?)```/g;

async function validateFile(file: string, mermaid: MermaidModule): Promise<boolean> {
  const content = fs.readFileSync(file, "utf8");
  const ext = path.extname(file).toLowerCase();

  // .mmd → whole file is one definition
  if (ext === ".mmd") {
    try {
      await mermaid.parse(content.trim());
      console.log(`OK   ${file}`);
      return true;
    } catch (err) {
      console.error(`FAIL ${file}: ${errorMessage(err)}`);
      return false;
    }
  }

  // .md / .markdown → extract fenced ```mermaid blocks
  const definitions: string[] = [];
  for (const match of content.matchAll(blockRe)) {
    definitions.push(match[1].trim());
  }
  if (definitions.length === 0) console.warn(`WARN ${file}: no mermaid blocks found`);

  const results = await Promise.all(
    definitions.map(async (definition, i) => {
      try {
        await mermaid.parse(definition);
        console.log(`OK   ${file} block ${i + 1}`);
        return true;
      } catch (err) {
        console.error(`FAIL ${file} block ${i + 1}: ${errorMessage(err)}`);
        return false;
      }
    })
  );
  return results.every(Boolean);
}

const defaultFiles = ["Diagram.md"];
const files = process.argv.slice(2).length > 0 ? process.argv.slice(2) : defaultFiles;

installShim();
let hadError: boolean;
try {
  const mermaid = (await import("mermaid")).default as MermaidModule;
  const results = await Promise.all(
    files.map(async file => {
      if (!fs.existsSync(file)) {
        console.error(`SKIP ${file}: file not found`);
        return false;
      }
      return validateFile(file, mermaid);
    })
  );
  hadError = results.some(ok => !ok);
} finally {
  uninstallShim();
}

process.exit(hadError ? 1 : 0);
