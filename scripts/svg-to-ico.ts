import { readFileSync, writeFileSync } from "node:fs";
import { sharp } from "sharp";
import toIco from "to-ico";

const svgPath = process.argv[2] || "public/favicon.svg";
const outputPath = process.argv[3] || "app/favicon.ico";

const sizes = [16, 32, 48, 256];

async function convertSvgToIco() {
  const svgBuffer = readFileSync(svgPath);

  const pngBuffers = await Promise.all(sizes.map(size => sharp(svgBuffer).resize(size, size).png().toBuffer()));

  const icoBuffer = await toIco(pngBuffers);
  writeFileSync(outputPath, icoBuffer);
}

void convertSvgToIco();
