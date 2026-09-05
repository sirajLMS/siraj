# Visual Capture — Pass 2 (Session Event Audit)

Session: `sa-cap2-4e6bfa581bd6` (agent-browser, worktree-scoped). Storybook at localhost:6006.
Gate per capture: title == story id; console errors (MUI-X `:first-child` Emotion SSR warnings ignored) = 0; no document-level horizontal overflow (`scrollWidth <= innerWidth`); a11y smoke (0 imgs without alt, 0 icon-only buttons without accessible name); Hanken Grotesk font loaded; content present (innerText length).

| # | File | Viewport | Story | Locale | Title OK | Console Errors | No H-Overflow | A11y OK | Font OK | innerText |
|---|------|----------|-------|--------|----------|----------------|---------------|---------|---------|-----------|
| 1 | sa-p2-populated-en-1440.png | 1440×900 | SessionAuditReportsContainer / PopulatedDesktop | en | ✅ | 0 | ✅ 1440≤1440 | ✅ 0/0 | ✅ true | 1350 |
| 2 | sa-p2-populated-ar-1440.png | 1440×900 | SessionAuditReportsContainer / PopulatedDesktop | ar | ✅ | 0 | ✅ 1440≤1440 | ✅ 0/0 | ✅ true | 1327 |
| 3 | sa-p2-populated-en-834.png | 834×1112 | SessionAuditReportsContainer / PopulatedDesktop | en | ✅ | 0 | ✅ 834≤834 | ✅ 0/0 | ✅ true | 1199 |
| 4 | sa-p2-populated-en-390.png | 390×844 | SessionAuditReportsContainer / PopulatedDesktop | en | ✅ | 0 | ✅ 390≤390 | ✅ 0/0 | ✅ true | 1046 |
| 5 | sa-p2-empty-en-1440.png | 1440×900 | SessionAuditReportsContainer / EmptyState | en | ✅ | 0 | ✅ 1440≤1440 | ✅ 0/0 | ✅ true | 504 |
| 6 | sa-p2-filtered-en-1440.png | 1440×900 | SessionAuditReportsContainer / FilteredState | en | ✅ | 0 | ✅ 1440≤1440 | ✅ 0/0 | ✅ true | 783 |
| 7 | sa-p2-override-en-1440.png | 1440×900 | ClassAuditContainer / OverrideDialogFromDeepLink | en | ✅ | 0 | ✅ 1440≤1440 | ✅ 0/0 | ✅ true | 1734 |
| 8 | sa-p2-override-ar-1440.png | 1440×900 | ClassAuditContainer / OverrideDialogFromDeepLink | ar | ✅ | 0 | ✅ 1440≤1440 | ✅ 0/0 | ✅ true | 1672 |

All 8 captures PASS all gates. No console errors observed on any capture (only MSW/DevTools info logs). Font check `document.fonts.check('16px "Hanken Grotesk"')` returned `true` on the first attempt for every capture — no reload needed.
