import { COLORS, CONFIG, logWarning } from "@/scripts/health/sonar/ts/config";
import type {
  DuplicationFileDetails,
  DuplicationGroup,
  SonarDuplicationsResponse,
  SonarMeasure,
} from "@/scripts/health/sonar/ts/results.types";

export async function fetchDuplicationMetrics(token: string): Promise<SonarMeasure[]> {
  const metrics = [
    "duplicated_lines_density",
    "duplicated_lines",
    "duplicated_blocks",
    "duplicated_files",
    "new_duplicated_lines_density",
    "new_duplicated_lines",
    "new_duplicated_blocks",
  ].join(",");

  const url = `${CONFIG.SONAR_HOST}/api/measures/component?component=${CONFIG.PROJECT_KEY}&metricKeys=${metrics}`;
  const authHeader = `Basic ${btoa(token + ":")}`;
  const response = await fetch(url, { headers: { Authorization: authHeader } });

  if (!response.ok) throw new Error(`SonarQube API error: ${response.status}`);

  const data: {
    component: { measures: SonarMeasure[] };
  } = await response.json();
  return data.component.measures;
}

function getDensityColor(density: number): string {
  if (density > 3) return COLORS.RED;
  if (density > 0) return COLORS.YELLOW;
  return COLORS.GREEN;
}

export function printDuplicationMetrics(measures: SonarMeasure[]): void {
  const metricsMap = new Map(measures.map(m => [m.metric, m]));

  globalThis.console.log(
    `${COLORS.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.NC}`
  );
  globalThis.console.log(`${COLORS.CYAN}  CODE DUPLICATION METRICS${COLORS.NC}`);
  globalThis.console.log(
    `${COLORS.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.NC}\n`
  );

  globalThis.console.log(`${COLORS.MAGENTA}Overall Code:${COLORS.NC}`);
  const duplicatedLinesDensity = metricsMap.get("duplicated_lines_density")?.value;
  if (duplicatedLinesDensity) {
    const density = Number.parseFloat(duplicatedLinesDensity);
    globalThis.console.log(`  Density:           ${getDensityColor(density)}${density.toFixed(1)}%${COLORS.NC}`);
  }

  const duplicatedLines = metricsMap.get("duplicated_lines")?.value;
  if (duplicatedLines) globalThis.console.log(`  Duplicated Lines:  ${COLORS.NC}${duplicatedLines}`);

  const duplicatedBlocks = metricsMap.get("duplicated_blocks")?.value;
  if (duplicatedBlocks) globalThis.console.log(`  Duplicated Blocks: ${COLORS.NC}${duplicatedBlocks}`);

  const duplicatedFiles = metricsMap.get("duplicated_files")?.value;
  if (duplicatedFiles) globalThis.console.log(`  Duplicated Files:  ${COLORS.NC}${duplicatedFiles}`);

  globalThis.console.log("");
}

export async function fetchAndPrintDuplicatedBlocks(token: string): Promise<DuplicationFileDetails[] | null> {
  const measuresUrl = new URL(`${CONFIG.SONAR_HOST}/api/measures/component_tree`);
  measuresUrl.searchParams.set("component", CONFIG.PROJECT_KEY);
  measuresUrl.searchParams.set("metricKeys", "duplicated_blocks");
  measuresUrl.searchParams.set("ps", "500");

  const authHeader = `Basic ${btoa(token + ":")}`;
  try {
    const response = await fetch(measuresUrl.toString(), {
      headers: { Authorization: authHeader },
    });
    if (!response.ok) return null;

    const data: {
      components: Array<{
        key: string;
        path: string;
        qualifier: string;
        measures: SonarMeasure[];
      }>;
    } = await response.json();
    const filesWithDuplications = data.components.filter(comp => {
      const blocks = comp.measures.find(m => m.metric === "duplicated_blocks");
      return blocks?.value && Number.parseInt(blocks.value, 10) > 0 && comp.qualifier === "FIL";
    });

    if (filesWithDuplications.length === 0) return null;

    globalThis.console.log(
      `${COLORS.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.NC}`
    );
    globalThis.console.log(`${COLORS.CYAN}  DUPLICATED BLOCKS DETAILS${COLORS.NC}`);
    globalThis.console.log(
      `${COLORS.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.NC}\n`
    );

    const processFile = async (index: number, acc: DuplicationFileDetails[]): Promise<DuplicationFileDetails[]> => {
      if (index >= filesWithDuplications.length) return acc;
      const file = filesWithDuplications[index];
      const details = await printFileDuplicationDetails({ file, authHeader });
      if (details) acc.push(details);
      return processFile(index + 1, acc);
    };

    const duplicationDetails = await processFile(0, []);
    return duplicationDetails;
  } catch (err) {
    logWarning(`Error fetching duplicated blocks: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

async function printFileDuplicationDetails(options: {
  file: { key: string; path: string; measures: SonarMeasure[] };
  authHeader: string;
}): Promise<DuplicationFileDetails | null> {
  const { file, authHeader } = options;
  const blockCount = file.measures.find(m => m.metric === "duplicated_blocks")?.value ?? "0";
  globalThis.console.log(`${COLORS.NC}${file.path} ${COLORS.YELLOW}(${blockCount} duplicated blocks)${COLORS.NC}`);

  const dupUrl = `${CONFIG.SONAR_HOST}/api/duplications/show?key=${file.key}`;
  try {
    const dupResponse = await fetch(dupUrl, {
      headers: { Authorization: authHeader },
    });
    if (!dupResponse.ok) return null;

    const dupData: SonarDuplicationsResponse = await dupResponse.json();
    const details: DuplicationFileDetails = {
      file: file.path,
      blockCount: Number.parseInt(blockCount, 10),
      groups: [],
    };

    for (const [index, group] of dupData.duplications.entries()) {
      globalThis.console.log(`  ${COLORS.MAGENTA}Duplication Group ${index + 1}:${COLORS.NC}`);
      const groupDetails: DuplicationGroup = {
        blocks: [],
      };
      for (const block of group.blocks) {
        const refKey = "_ref";
        const refFile = block[refKey] ? dupData.files[block[refKey]] : null;
        const refPath = refFile ? ((refFile.name || block[refKey]) ?? "unknown") : file.path;
        globalThis.console.log(
          `    ${COLORS.CYAN}→${COLORS.NC} ${refPath} (lines ${block.from}-${block.from + block.size - 1})`
        );
        groupDetails.blocks.push({
          refPath,
          from: block.from,
          to: block.from + block.size - 1,
          size: block.size,
        });
      }
      details.groups.push(groupDetails);
    }
    globalThis.console.log("");
    return details;
  } catch (err) {
    logWarning(
      `Error fetching duplication details for ${file.path}: ${err instanceof Error ? err.message : String(err)}`
    );
    return null;
  }
}
