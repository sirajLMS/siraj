## 2026-09-01 - Single-pass loop for SQL group-by metrics aggregation
**Learning:** SQL `GROUP BY` queries return array results containing aggregated metrics per enum status. Performing repeated `Array.prototype.find` linear scans across these small result sets causes redundant iterations. A single `for...of` loop pass populates pre-initialized metric records in $O(n)$ time without allocation overhead.
**Action:** Replace `array.find()` chains over SQL group-by metric query results with single-pass `for...of` loops.
