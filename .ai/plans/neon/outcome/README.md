# Task Execution Outcome Knowledge Base

**Directory:** `.ai/plans/neon/outcome`  

This directory contains persistent outcome and analysis files produced by each executed task in the `.ai/plans/neon` plan.

### Rules for Executing Agents:
1. **Read Before Execution:** Before executing any task, the executing agent MUST read all existing files in this `outcome/` directory to build context, avoid re-doing past analysis, and take note of documented edge cases or pitfalls.
2. **Write After Execution:** Upon completing a task, the executing agent MUST write a new outcome file in this directory (e.g. `1.1-region-alignment-outcome.md`) documenting analysis findings, web search/doc lookups, implementation details, learnings, and any crucial carry-over points for future tasks.
3. **Task Tracking:** The executing agent MUST update the corresponding task checkbox `[ ]` -> `[x]` in [tasks.md](file://.ai/plans/neon/tasks.md).
