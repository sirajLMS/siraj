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
 *
 * (mermaid's stylis version is handled by a nested `"mermaid": { "stylis" }`
 * override in package.json — the repo-wide stylis pin stays at 4.2.0 for
 * Emotion, per docs/frontend/emotion-rtl-stylis.md.)
 */
import fs from "node:fs";
import path from "node:path";

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

interface ShimSpec {
  dir: string;
  real: string;
  pkg: string;
  index: string;
}

const DOMPURIFY_SHIM: ShimSpec = {
  dir: "node_modules/dompurify",
  real: "node_modules/dompurify-real",
  pkg: '{"name":"dompurify","version":"3.4.13","main":"index.js","type":"module"}\n',
  index: `import { JSDOM } from "jsdom";
import createDOMPurify from "../dompurify-real/dist/purify.es.mjs";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
const DOMPurify = createDOMPurify(dom.window);

export default DOMPurify;
export const addHook = DOMPurify.addHook.bind(DOMPurify);
export const sanitize = DOMPurify.sanitize.bind(DOMPurify);
export const removeAllHooks = DOMPurify.removeAllHooks.bind(DOMPurify);
export const removeHook = DOMPurify.removeHook.bind(DOMPurify);
export const setConfig = DOMPurify.setConfig.bind(DOMPurify);
`,
};

const SHIMS = [DOMPURIFY_SHIM];

function installShims(): void {
  for (const shim of SHIMS) {
    if (fs.existsSync(shim.real)) continue; // already shimmed
    if (!fs.existsSync(shim.dir)) {
      throw new Error(`${shim.dir} not installed. Run: bun install`);
    }
    fs.renameSync(shim.dir, shim.real);
    fs.mkdirSync(shim.dir, { recursive: true });
    fs.writeFileSync(path.join(shim.dir, "package.json"), shim.pkg);
    fs.writeFileSync(path.join(shim.dir, "index.js"), shim.index);
  }
}

function uninstallShims(): void {
  for (const shim of SHIMS) {
    if (!fs.existsSync(shim.real)) continue; // nothing to restore
    if (fs.existsSync(shim.dir)) {
      fs.rmSync(shim.dir, { recursive: true, force: true });
    }
    fs.renameSync(shim.real, shim.dir);
  }
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

installShims();
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
  uninstallShims();
}

process.exit(hadError ? 1 : 0);
