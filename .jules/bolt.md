## 2026-09-07 - Sequential Async Iteration Helpers
**Learning:** Using `Array.prototype.reduce` with async callbacks to force sequential execution creates unnecessary `Promise` allocation overhead and intermediate array chaining on every iteration.
**Action:** Replace `items.reduce(async ...)` patterns with standard `for...of` loops and direct `await` when sequential execution across async items is required.
