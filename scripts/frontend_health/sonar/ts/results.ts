import { COLORS, CONFIG, logInfo, logSuccess, logWarning } from "./config";

interface SonarIssue {
	key: string;
	rule: string;
	severity: string;
	component: string;
	line?: number;
	message: string;
	type: string;
	status: string;
	textRange?: {
		startLine: number;
		endLine: number;
		startOffset: number;
		endOffset: number;
	};
}

interface SonarResponse {
	total: number;
	p: number;
	ps: number;
	paging: {
		pageIndex: number;
		pageSize: number;
		total: number;
	};
	issues: SonarIssue[];
}

interface SonarMeasure {
	metric: string;
	value?: string;
	periods?: Array<{ index: number; value: string }>;
}

interface SonarDuplicationsResponse {
	duplications: Array<{
		blocks: Array<{
			from: number;
			size: number;
			_ref?: string;
		}>;
	}>;
	files: Record<string, { key: string; name: string }>;
}

const SEVERITY_MAP: Record<string, string> = {
	BLOCKER: "error",
	CRITICAL: "error",
	MAJOR: "warning",
	MINOR: "warning",
	INFO: "info",
};

const SEVERITY_SYMBOLS: Record<string, string> = {
	error: "✖",
	warning: "⚠",
	info: "ℹ",
};

const SEVERITY_COLORS: Record<string, string> = {
	error: COLORS.RED,
	warning: COLORS.YELLOW,
	info: COLORS.BLUE,
};

export async function waitForAnalysisProcessing(
	token: string,
	scanStartTime: number,
): Promise<void> {
	logInfo("Waiting for analysis to be processed...");

	const maxAttempts = 30;
	const authHeader = `Basic ${btoa(token + ":")}`;

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		try {
			const response = await fetch(
				`${CONFIG.SONAR_HOST}/api/project_analyses/search?project=${CONFIG.PROJECT_KEY}&ps=1`,
				{
					headers: { Authorization: authHeader },
				},
			);

			if (response.ok) {
				const data = (await response.json()) as {
					analyses: Array<{ date: string }>;
				};
				if (data.analyses.length > 0) {
					const analysisDate = data.analyses[0].date;
					const analysisTimestamp = new Date(analysisDate).getTime();

					if (analysisTimestamp >= scanStartTime) {
						logSuccess(
							`Fresh analysis results are ready (analyzed at: ${analysisDate})`,
						);
						return;
					}
				}
			}
		} catch (err) {
			logWarning(
				`Error while waiting for analysis: ${err instanceof Error ? err.message : String(err)}`,
			);
		}

		process.stdout.write(".");
		await new Promise((resolve) => setTimeout(resolve, 2000));
	}

	globalThis.console.log("");
	logWarning(
		"Analysis results may not be fully processed yet, but continuing...",
	);
}

export async function fetchAndDisplayResults(
	token: string,
	includeDuplications = true,
): Promise<void> {
	logInfo("Fetching analysis results...");

	try {
		const fetchTasks: [
			Promise<SonarIssue[]>,
			Promise<SonarMeasure[]> | Promise<null>,
		] = [
			fetchAllIssues(token),
			includeDuplications
				? fetchDuplicationMetrics(token)
				: Promise.resolve(null),
		];

		const [issues, duplicationMetrics] = await Promise.all(fetchTasks);

		if (includeDuplications && duplicationMetrics) {
			printDuplicationMetrics(duplicationMetrics);
			await fetchAndPrintDuplicatedBlocks(token);
		}

		printIssues(issues);

		globalThis.console.log(
			`\n  View detailed report: ${COLORS.BLUE}${CONFIG.SONAR_HOST}/dashboard?id=${CONFIG.PROJECT_KEY}${COLORS.NC}\n`,
		);
	} catch (error) {
		logWarning(
			`Error fetching results: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

async function fetchAllIssues(token: string): Promise<SonarIssue[]> {
	const allIssues: SonarIssue[] = [];
	let page = 1;
	const pageSize = 500;
	const authHeader = `Basic ${btoa(token + ":")}`;

	while (true) {
		const url = `${CONFIG.SONAR_HOST}/api/issues/search?componentKeys=${CONFIG.PROJECT_KEY}&statuses=OPEN,CONFIRMED&p=${page}&ps=${pageSize}`;
		const response = await fetch(url, {
			headers: { Authorization: authHeader },
		});

		if (!response.ok)
			throw new Error(`SonarQube API error: ${response.status}`);

		const data = (await response.json()) as SonarResponse;
		allIssues.push(...data.issues);

		if (allIssues.length >= data.paging.total) break;
		page++;
	}
	return allIssues;
}

async function fetchDuplicationMetrics(token: string): Promise<SonarMeasure[]> {
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

	const data = (await response.json()) as {
		component: { measures: SonarMeasure[] };
	};
	return data.component.measures;
}

function printDuplicationMetrics(measures: SonarMeasure[]): void {
	const metricsMap = new Map(measures.map((m) => [m.metric, m]));

	globalThis.console.log(
		`${COLORS.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.NC}`,
	);
	globalThis.console.log(
		`${COLORS.CYAN}  CODE DUPLICATION METRICS${COLORS.NC}`,
	);
	globalThis.console.log(
		`${COLORS.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.NC}\n`,
	);

	globalThis.console.log(`${COLORS.MAGENTA}Overall Code:${COLORS.NC}`);
	const duplicatedLinesDensity = metricsMap.get(
		"duplicated_lines_density",
	)?.value;
	if (duplicatedLinesDensity) {
		const density = parseFloat(duplicatedLinesDensity);
		globalThis.console.log(
			`  Density:           ${getDensityColor(density)}${density.toFixed(1)}%${COLORS.NC}`,
		);
	}

	const duplicatedLines = metricsMap.get("duplicated_lines")?.value;
	if (duplicatedLines)
		globalThis.console.log(
			`  Duplicated Lines:  ${COLORS.NC}${duplicatedLines}`,
		);

	const duplicatedBlocks = metricsMap.get("duplicated_blocks")?.value;
	if (duplicatedBlocks)
		globalThis.console.log(
			`  Duplicated Blocks: ${COLORS.NC}${duplicatedBlocks}`,
		);

	const duplicatedFiles = metricsMap.get("duplicated_files")?.value;
	if (duplicatedFiles)
		globalThis.console.log(
			`  Duplicated Files:  ${COLORS.NC}${duplicatedFiles}`,
		);

	globalThis.console.log("");
}

function getDensityColor(density: number): string {
	if (density > 3) return COLORS.RED;
	if (density > 0) return COLORS.YELLOW;
	return COLORS.GREEN;
}

async function fetchAndPrintDuplicatedBlocks(token: string): Promise<void> {
	const measuresUrl = new URL(
		`${CONFIG.SONAR_HOST}/api/measures/component_tree`,
	);
	measuresUrl.searchParams.set("component", CONFIG.PROJECT_KEY);
	measuresUrl.searchParams.set("metricKeys", "duplicated_blocks");
	measuresUrl.searchParams.set("ps", "500");

	const authHeader = `Basic ${btoa(token + ":")}`;
	try {
		const response = await fetch(measuresUrl.toString(), {
			headers: { Authorization: authHeader },
		});
		if (!response.ok) return;

		const data = (await response.json()) as {
			components: Array<{
				key: string;
				path: string;
				qualifier: string;
				measures: SonarMeasure[];
			}>;
		};
		const filesWithDuplications = data.components.filter((comp) => {
			const blocks = comp.measures.find(
				(m) => m.metric === "duplicated_blocks",
			);
			return (
				blocks?.value &&
				parseInt(blocks.value, 10) > 0 &&
				comp.qualifier === "FIL"
			);
		});

		if (filesWithDuplications.length === 0) return;

		globalThis.console.log(
			`${COLORS.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.NC}`,
		);
		globalThis.console.log(
			`${COLORS.CYAN}  DUPLICATED BLOCKS DETAILS${COLORS.NC}`,
		);
		globalThis.console.log(
			`${COLORS.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.NC}\n`,
		);

		for (const file of filesWithDuplications) {
			await printFileDuplicationDetails(file, authHeader);
		}
	} catch (err) {
		logWarning(
			`Error fetching duplicated blocks: ${err instanceof Error ? err.message : String(err)}`,
		);
	}
}

async function printFileDuplicationDetails(
	file: { key: string; path: string; measures: SonarMeasure[] },
	authHeader: string,
): Promise<void> {
	const blockCount =
		file.measures.find((m) => m.metric === "duplicated_blocks")?.value || "0";
	globalThis.console.log(
		`${COLORS.NC}${file.path} ${COLORS.YELLOW}(${blockCount} duplicated blocks)${COLORS.NC}`,
	);

	const dupUrl = `${CONFIG.SONAR_HOST}/api/duplications/show?key=${file.key}`;
	try {
		const dupResponse = await fetch(dupUrl, {
			headers: { Authorization: authHeader },
		});
		if (!dupResponse.ok) return;

		const dupData = (await dupResponse.json()) as SonarDuplicationsResponse;
		for (const [index, group] of dupData.duplications.entries()) {
			globalThis.console.log(
				`  ${COLORS.MAGENTA}Duplication Group ${index + 1}:${COLORS.NC}`,
			);
			for (const block of group.blocks) {
				const refFile = block._ref ? dupData.files[block._ref] : null;
				const refPath = refFile ? refFile.name || block._ref : file.path;
				globalThis.console.log(
					`    ${COLORS.CYAN}→${COLORS.NC} ${refPath} (lines ${block.from}-${block.from + block.size - 1})`,
				);
			}
		}
		globalThis.console.log("");
	} catch (err) {
		logWarning(
			`Error fetching duplication details for ${file.path}: ${err instanceof Error ? err.message : String(err)}`,
		);
	}
}

function printIssues(issues: SonarIssue[]): void {
	if (issues.length === 0) {
		globalThis.console.log(
			`\n${COLORS.GREEN}✨ No code quality issues found!${COLORS.NC}\n`,
		);
		return;
	}

	const grouped = groupIssuesByFile(issues);
	const sortedFiles = Array.from(grouped.keys()).sort((a, b) =>
		a.localeCompare(b),
	);

	globalThis.console.log(
		`\n${COLORS.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.NC}`,
	);
	globalThis.console.log(`${COLORS.CYAN}  CODE QUALITY ISSUES${COLORS.NC}`);
	globalThis.console.log(
		`${COLORS.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.NC}`,
	);

	for (const filePath of sortedFiles) {
		const fileIssues = grouped.get(filePath);
		if (!fileIssues) continue;

		globalThis.console.log(`\n${COLORS.NC}${filePath}`);
		for (const issue of fileIssues) {
			globalThis.console.log(formatIssue(issue));
		}
	}

	const summary = calculateSummary(issues);
	const totalProblems = summary.errors + summary.warnings + summary.infos;
	globalThis.console.log("");
	globalThis.console.log(
		`${COLORS.RED}✖ ${String(totalProblems)} problems ${COLORS.NC}(${COLORS.RED}${String(summary.errors)} errors${COLORS.NC}, ${COLORS.YELLOW}${String(summary.warnings)} warnings${COLORS.NC}, ${COLORS.BLUE}${String(summary.infos)} infos${COLORS.NC})`,
	);
	globalThis.console.log("");
}

function calculateSummary(issues: SonarIssue[]): {
	errors: number;
	warnings: number;
	infos: number;
} {
	let errors = 0,
		warnings = 0,
		infos = 0;
	for (const issue of issues) {
		const severity = SEVERITY_MAP[issue.severity] ?? "warning";
		if (severity === "error") errors++;
		else if (severity === "warning") warnings++;
		else infos++;
	}
	return { errors, warnings, infos };
}

function groupIssuesByFile(issues: SonarIssue[]): Map<string, SonarIssue[]> {
	const grouped = new Map<string, SonarIssue[]>();
	for (const issue of issues) {
		const filePath = issue.component.replace(`${CONFIG.PROJECT_KEY}:`, "");
		const fileIssues = grouped.get(filePath) ?? [];
		fileIssues.push(issue);
		grouped.set(filePath, fileIssues);
	}
	return grouped;
}

function formatIssue(issue: SonarIssue): string {
	const severity = SEVERITY_MAP[issue.severity] ?? "warning";
	const symbol = SEVERITY_SYMBOLS[severity] ?? "•";
	const color = SEVERITY_COLORS[severity] ?? COLORS.NC;
	const line = issue.line ?? issue.textRange?.startLine ?? 0;
	const column = issue.textRange?.startOffset ?? 0;

	return `  ${COLORS.NC}${line}:${column}  ${color}${symbol}${COLORS.NC}  ${issue.message}  ${COLORS.NC}${issue.rule}`;
}
