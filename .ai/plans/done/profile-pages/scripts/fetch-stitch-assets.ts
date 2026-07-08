/**
 * Re-download canonical Stitch screens to stitch-assets/.
 * Requires Stitch API key in ~/.cursor/mcp.json
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const PROJECT_ID = "3409377417207008542";
const BASE = join(import.meta.dir, "..", "stitch-assets");

const SCREENS: Record<string, string> = {
  "teacher-profile-desktop-happy": "7175120a1b7449488fb370b59ae10146",
  "teacher-profile-mobile-happy": "e57caae245be49b7824abd80f7af78b9",
  "teacher-profile-desktop-loading": "8a9888f969d842aeb16354fefb7a7169",
  "teacher-profile-desktop-empty": "9f6f34efcaa14b56b40c0621494a6e1e",
  "teacher-profile-desktop-error": "90bb190963ea44bfa587fbd89d4b1376",
  "parent-profile-desktop-happy": "57a69f7fe3084128abc0a0b0bdc11241",
  "parent-profile-mobile-happy": "582ef0ac72a2464ba46103eb26e76503",
  "staff-profile-desktop-happy": "169b54c8dffd43e0a309a89294073045",
  "staff-profile-mobile-static": "9348fe3a9e6c43fea11a70568ff7e525",
  "teacher-banking-desktop-happy": "04e10561a3d7470b82d9decae0cd9b20",
  "teacher-banking-mobile-static": "ccfe165f84ae4bca82b713071d6ffd35",
  "assigned-students-desktop-happy": "e185317d3a684c0d8d5686d5c5e99a5a",
  "assigned-students-mobile-static": "6c0c5c5a908447e394cbc7b16e7d54b4",
};

async function main() {
  const mcp = JSON.parse(await Bun.file(`${process.env.HOME}/.cursor/mcp.json`).text());
  const apiKey = mcp.mcpServers?.stitch?.headers?.["X-Goog-Api-Key"];
  if (!apiKey) throw new Error("Stitch API key not found in ~/.cursor/mcp.json");

  await mkdir(join(BASE, "html"), { recursive: true });
  await mkdir(join(BASE, "screenshots"), { recursive: true });

  const items = [];
  for (const [name, screenId] of Object.entries(SCREENS)) {
    const res = await fetch("https://stitch.googleapis.com/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "get_screen", arguments: { projectId: PROJECT_ID, screenId } },
      }),
    });
    const data = await res.json();
    const screen = JSON.parse(data.result.content[0].text).screen;
    const meta: Record<string, string> = { name, id: screenId, title: screen.title, deviceType: screen.deviceType ?? "" };
    if (screen.htmlCode?.downloadUrl) {
      const html = await fetch(screen.htmlCode.downloadUrl).then(r => r.text());
      const rel = `stitch-assets/html/${name}.html`;
      await Bun.write(join(BASE, "html", `${name}.html`), html);
      meta.html = rel;
    }
    if (screen.screenshot?.downloadUrl) {
      const buf = await fetch(screen.screenshot.downloadUrl).then(r => r.arrayBuffer());
      const rel = `stitch-assets/screenshots/${name}.png`;
      await Bun.write(join(BASE, "screenshots", `${name}.png`), buf);
      meta.screenshot = rel;
    }
    items.push(meta);
    console.log(`ok ${name}`);
  }
  await writeFile(join(BASE, "manifest.json"), JSON.stringify({ projectId: PROJECT_ID, screens: items }, null, 2));
  console.log(`Downloaded ${items.length} screens`);
}

main().catch(e => { console.error(e); process.exit(1); });
