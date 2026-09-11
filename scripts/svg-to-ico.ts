import { readFile, writeFile } from "node:fs/promises";
import { sharp } from "sharp";
import toIco from "to-ico";

const svgPath = process.argv[2] || "public/favicon.svg";
const outputPath = process.argv[3] || "app/favicon.ico";

const sizes = [16, 32, 48, 256];

async function convertSvgToIco() {
  const svgBuffer = await readFile(svgPath);

  const pngBuffers = await Promise.all(sizes.map(size => sharp(svgBuffer).resize(size, size).png().toBuffer()));

  const icoBuffer = await toIco(pngBuffers);
  await writeFile(outputPath, icoBuffer);
}

void convertSvgToIco();
