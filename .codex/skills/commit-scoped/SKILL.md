---
name: commit-scoped
description: >
  Stage and commit only files related to a specific plan or task, ensuring no unrelated changes
  are included. Use when asked to commit plan files, commit only specific changes, or create
  a clean commit for a specific task.
allowed-tools: shell
---

## Scoped Commit Workflow

### Step 1: Identify plan files

List all files that are part of the plan or task. This is the commit scope.

### Step 2: Stage only plan files

```bash
git add <file1> <file2> <file3> ...
```

Stage each file explicitly by path. Do NOT use `git add .` or `git add -A`.

### Step 3: Verify staged files match the plan

```bash
git diff --cached --name-only
```

Compare the output against the plan's file list. Every staged file must be in the plan. Every plan file must be staged.

### Step 4: Remove any extra files

If extra files are staged (not in the plan), unstage them:

```bash
git reset HEAD <extra-file>
```

### Step 5: Create the commit

```bash
git commit -m "<descriptive message matching the plan scope>"
```

Add `--no-verify` only if explicitly requested.

### Step 6: Verify the commit

```bash
git show --stat
```

Confirm the commit contains only the intended files. If it includes extras, amend or reset and re-do from Step 2.

### Handling unstaged plan changes

If a plan file has no unstaged changes but is in scope, it still gets listed by `git add` — that's fine. If a plan file has both staged and unstaged changes, `git add` stages the current working tree version.
