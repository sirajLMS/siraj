import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import * as sharpModule from "sharp";
import toIco from "to-ico";

const sharp = sharpModule.default;

const svgPath = process.argv[2] || "public/favicon.svg";
const icoSizes = [16, 32, 48, 256];
const pngSizes = [
  { size: 512, filename: "icon.png" },
  { size: 180, filename: "apple-icon.png" },
];

async function ensureDir(filePath: string): Promise<void> {
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });
}

async function convertSvgToIco(svgBuffer: Buffer, outputDir: string): Promise<void> {
  const pngBuffers = await Promise.all(icoSizes.map(size => sharp(svgBuffer).resize(size, size).png().toBuffer()));
  const icoBuffer = await toIco(pngBuffers);
  const icoPath = resolve(outputDir, "favicon.ico");
  await ensureDir(icoPath);
  await writeFile(icoPath, icoBuffer);
  console.log(`Generated: ${icoPath}`);
}

async function convertSvgToPng(svgBuffer: Buffer, outputDir: string): Promise<void> {
  await Promise.all(
    pngSizes.map(async ({ size, filename }) => {
      const pngBuffer = await sharp(svgBuffer).resize(size, size).png().toBuffer();
      const pngPath = resolve(outputDir, filename);
      await ensureDir(pngPath);
      await writeFile(pngPath, pngBuffer);
      console.log(`Generated: ${pngPath}`);
    })
  );
}

async function generateIcons(): Promise<void> {
  const svgBuffer = await readFile(svgPath);
  const appDir = resolve(process.cwd(), "app");

  await Promise.all([convertSvgToIco(svgBuffer, appDir), convertSvgToPng(svgBuffer, appDir)]);

  console.log("All icons generated successfully.");
}

void generateIcons();
