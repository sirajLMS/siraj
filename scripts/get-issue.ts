import fs from "node:fs";
import path from "node:path";

const dbAnalysisPath = path.join(process.cwd(), ".ai", "db analysis.md");

function getIssue(issueNum: number) {
  if (!fs.existsSync(dbAnalysisPath)) {
    console.error(`Error: File not found at ${dbAnalysisPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(dbAnalysisPath, "utf-8");
  const lines = content.split("\n");

  let issueStartIndex = -1;
  let issueEndIndex = -1;

  const startRegex = new RegExp(`^###\\s+\\*\\*${issueNum}\\.`);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (startRegex.test(line)) {
      issueStartIndex = i;
      break;
    }
  }

  if (issueStartIndex === -1) {
    console.error(`Error: Issue #${issueNum} not found in the analysis file.`);
    process.exit(1);
  }

  // Find the end of the issue section (delimited by '---', another main heading, or end of file)
  for (let i = issueStartIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "---" || line.startsWith("## ") || line.startsWith("### ")) {
      issueEndIndex = i;
      break;
    }
  }

  if (issueEndIndex === -1) {
    issueEndIndex = lines.length;
  }

  const issueContent = lines.slice(issueStartIndex, issueEndIndex).join("\n").trim();
  console.log(issueContent);
}

const args = process.argv.slice(2);
const issueNumber = parseInt(args[0], 10);

if (Number.isNaN(issueNumber)) {
  console.error("Usage: bun scripts/get-issue.ts <issue_number>");
  process.exit(1);
}

getIssue(issueNumber);
