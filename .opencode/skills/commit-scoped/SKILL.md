---
name: commit-scoped
description: Use ONLY when committing plan-related changes. Triggers on git commit, staging, committing scoped changes. Ensures only intended files are committed.
---

# Commit Scoped Skill

Stage only plan-related files, verify the staging area, unstage any extras, commit with a descriptive message, and verify the result.

## Workflow

1. Run `git status` to see all modified files.
2. Stage only the files related to the current plan/task:
   ```bash
   git add <file1> <file2> ...
   ```
3. Verify what is staged:
   ```bash
   git diff --cached --name-only
   ```
4. If any unintended files are staged, unstage them:
   ```bash
   git reset HEAD <unintended-file>
   ```
5. Commit with a descriptive message following the project's convention:
   - Use imperative mood (e.g., "Add feature" not "Added feature")
   - Be specific about what changed and why
   - Reference issue/plan numbers if applicable
   ```bash
   git commit -m "<descriptive message>"
   ```
6. Verify the commit:
   ```bash
   git show --stat
   ```

## Key Rules

- NEVER stage files that are not part of the current task/plan.
- NEVER commit secrets, API keys, or `.env` files.
- Always verify the staging area before committing — `git diff --cached --name-only` must show only intended files.
- If a file has both intended and unintended changes, use `git add -p` to stage only the relevant hunks.
- Do NOT use `git add .` or `git add -A` — always stage files explicitly.
- After committing, `git show --stat` should confirm the commit contains only the expected files.