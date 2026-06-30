# Creating Custom Agents for Copilot CLI

Comprehensive guide for creating, configuring, and maintaining custom agents for GitHub Copilot CLI in this repository. Based on research conducted against official GitHub documentation and practical testing during the agent creation process (June 2026).

---

## Table of Contents

1. [Agent File Structure](#1-agent-file-structure)
2. [YAML Frontmatter Properties](#2-yaml-frontmatter-properties)
3. [Tool Aliases Reference (Critical)](#3-tool-aliases-reference-critical)
4. [Handoffs & Agent Orchestration](#4-handoffs--agent-orchestration)
5. [MCP Server Integration](#5-mcp-server-integration)
6. [Prompt Body Best Practices](#6-prompt-body-best-practices)
7. [Common Mistakes & Gotchas](#7-common-mistakes--gotchas)
8. [Agent Design Patterns](#8-agent-design-patterns)
9. [Agent Conflict Analysis](#9-agent-conflict-analysis)
10. [Environment-Specific Considerations](#10-environment-specific-considerations)
11. [Testing & Verification Checklist](#11-testing--verification-checklist)
12. [Reference: Current Agent Fleet](#12-reference-current-agent-fleet)

---

## 1. Agent File Structure

Custom agents are Markdown files with YAML frontmatter. Place them in `.github/agents/` at the repository root.

### File naming

- Use `<name>.agent.md` or `<name>.md` as the extension.
- The filename (minus `.agent.md` or `.md`) becomes the **agent ID** used in handoffs and fleet dispatch.
- Example: `.github/agents/review-frontend.agent.md` → agent ID is `review-frontend`.

### Location hierarchy

| Scope | Location | Priority |
|-------|----------|----------|
| Project (repo-level) | `.github/agents/` | **Highest** (overrides below) |
| Project (monorepo sub-dir) | `.github/agents/` in subdirectory | Per-ancestor loading, deepest wins |
| User-level | `~/.copilot/agents/` | Lower than project |
| Plugin-level | `<plugin>/agents/` | Lowest |

For monorepos, the CLI walks upward from the cwd to the Git root, loading `.github/agents/` at each ancestor level. Multiple `.github/agents/` directories are all loaded, with the **deepest** directory taking highest priority.

### Basic file template

```markdown
---
name: my-agent
description: Short description of what this agent does and its expertise
tools:
  - execute
  - read
  - search
  - web
---

# My Agent Title

You are a [role description]. Your responsibilities:
- [responsibility 1]
- [responsibility 2]

## Instructions
[Detailed behavioral instructions]
```

### Character limit

The prompt body (Markdown content below frontmatter) can be a maximum of **30,000 characters**.

---

## 2. YAML Frontmatter Properties

Reference from official docs: https://docs.github.com/en/copilot/reference/custom-agents-configuration

| Property | Type | Required | Purpose |
|----------|------|----------|---------|
| `name` | string | No | Display name. Defaults to filename without `.agent.md`/`.md`. |
| `description` | string | **Yes** | Description shown in the agent list and `task` tool. |
| `tools` | string[] | No | Tools available to the agent. Default: `["*"]` (all tools). |
| `model` | string | No | AI model for this agent. Inherits outer agent's model if unset. |
| `disable-model-invocation` | boolean | No | Prevents auto-delegation. When `true`, agent must be manually selected. Default: `false`. |
| `user-invocable` | boolean | No | When `false`, agent cannot be manually selected, only accessed programmatically. Default: `true`. |
| `infer` | boolean | No | **Retired.** Use `disable-model-invocation` and `user-invocable` instead. |
| `mcp-servers` | object | No | Additional MCP servers and tools. **Not used in VS Code and other IDE custom agents.** |
| `metadata` | object (name + value string pairs) | No | Allows annotation with useful data. **Not used in VS Code and other IDE custom agents.** |
| `target` | string | No | Target environment (`vscode` or `github-copilot`). Default: both. |
| `handoffs` | list | No | **VS Code / Copilot CLI only.** Not supported for cloud agent on GitHub.com (ignored). |

### `handoffs` property (CLI-specific)

Handoffs create guided sequential workflows that transition between agents with suggested next steps. **Only works in Copilot CLI and VS Code**, not in cloud agent.

```yaml
handoffs:
  - label: Display text on handoff button
    agent: target-agent-id
    prompt: Pre-filled prompt to send to the target agent
    send: true           # Optional: auto-submit the prompt (default: false)
    model: Model Name (vendor)  # Optional: override model, e.g. "Claude Sonnet 4.5 (copilot)"
```

When a user sees the handoff button and selects it, they switch to the target agent with the prompt pre-filled. If `send: true`, the prompt automatically submits.

### `tools` property behavior

| Configuration | Result |
|---------------|--------|
| Omitted or `["*"]` | All available tools enabled (including configured MCP server tools) |
| Empty list `[]` | **All tools disabled** |
| Specific list `["read", "execute"]` | Only those tools enabled |
| Unrecognized names | **Silently ignored** — no error thrown |

This "ignore unrecognized" behavior means **typos in tool names are silently swallowed**. Always validate tool names against the alias table below.

---

## 3. Tool Aliases Reference (Critical)

This is the most important section. Tool names in agent frontmatter must use **primary aliases** or their compatible aliases. Any name not in this table is **silently ignored**.

Source: https://docs.github.com/en/copilot/reference/custom-agents-configuration#tool-aliases

### Primary aliases

| Primary Alias | Compatible Aliases | Cloud Agent Mapping | Purpose |
|---------------|-------------------|---------------------|---------|
| `execute` | `shell`, `Bash`, `powershell` | Shell tools: `bash` or `powershell` | Execute a command in the appropriate shell for the OS |
| `read` | `Read`, `NotebookRead` | `view` | Read file contents |
| `edit` | `Edit`, `MultiEdit`, `Write`, `NotebookEdit` | Edit tools: e.g. `str_replace`, `str_replace_editor` | Allow LLM to edit/create files |
| `search` | `Grep`, `Glob` | `search` | Search for files or text in files |
| `agent` | `custom-agent`, `Task` | "Custom agent" tools | Invoke other custom agents (subagent dispatch) |
| `web` | `WebSearch`, `WebFetch` | Currently N/A for cloud agent | Fetch content from URLs and perform web searches |
| `todo` | `TodoWrite` | Currently N/A for cloud agent | Create and manage structured task lists |

### What does NOT exist

These are **NOT valid tool aliases** and will be silently ignored if listed:

| ❌ Invalid Name | Why it doesn't work | Correct approach |
|-----------------|---------------------|------------------|
| `browser` | Not a built-in tool alias | Use `playwright/*` MCP server |
| `shell(git)` | `shell(COMMAND)` is CLI **permission flag** syntax, not an agent tool name | Use `execute` (which covers all shell commands) |
| `shell(rg)` | Same — permission flag syntax | Use `execute` |
| `shell(cat)` | Same — permission flag syntax | Use `execute` or `read` |
| `shell(bun)` | Same — permission flag syntax | Use `execute` |
| `shell(anything)` | Same — permission flag syntax | Use `execute` |
| `Grep` | Valid compatible alias, but prefer primary `search` | Use `search` for consistency |
| `Glob` | Valid compatible alias, but prefer primary `search` | Use `search` for consistency |

### The `shell(COMMAND)` syntax explained

The `shell(COMMAND)` notation is used **only** in CLI command-line flags for permission scoping:

```bash
# Permission flag syntax (NOT for agent frontmatter)
copilot --allow-tool='shell(git)'        # Allow git commands only
copilot --deny-tool='shell(rm)'          # Deny rm commands
copilot --allow-tool='shell'             # Allow all shell commands
copilot --allow-tool='shell(git push)'   # Allow specific git subcommands
```

This is used in the **CLI invocation**, not in agent `tools:` declarations. When you write `shell(git)` in an agent's `tools:` list, Copilot silently ignores it because it doesn't match any valid tool alias.

### MCP server tool references

To reference tools from MCP servers, use the namespace format:

```yaml
tools:
  - read
  - search
  - github/*                    # All tools from the GitHub MCP server
  - github/create_issue         # Specific tool from GitHub MCP server
  - playwright/*                # All tools from the Playwright MCP server
  - playwright/navigate         # Specific Playwright tool
  - my-custom-server/my-tool    # Custom MCP server tool
```

#### Out-of-the-box MCP servers

| MCP Server | Tools Available | Default Access |
|------------|----------------|----------------|
| `github` | All read-only tools. Token scoped to source repository. | Available by default |
| `playwright` | Browser automation: navigate, click, type, screenshot, form handling. Configured for localhost only. | Available by default. Token scoped to source repository. |

### Recommended tool selection by agent type

| Agent Type | `execute` | `read` | `edit` | `search` | `agent` | `web` | `todo` |
|------------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **Read-only reviewer** | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Orchestrator** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Code fixer** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Code generator** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Explorer/analyzer** | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| **Planner** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |

**Rationale for each tool by agent type:**

- **`execute`**: Needed to run `git`, `bun`, `rg`, and other shell commands. Even read-only reviewers need `git diff`, `git status`, etc.
- **`read`**: Essential for all agents — reading file contents.
- **`edit`**: Only for agents that modify code. Read-only reviewers must NOT have this, even if the broader toolset would grant it — the prompt constraint reinforces this.
- **`search`**: Needed for finding files (glob) and searching content (grep). Covered by `search` alias which maps to both `Grep` and `Glob`.
- **`agent`**: Only for orchestrators that dispatch subagents. Prevents unbounded agent recursion if omitted from leaf agents.
- **`web`**: Useful when agents need to check documentation, search for solutions online, or fetch reference material. Recommended for most agents.
- **`todo`**: Useful for orchestrators and multi-step fixers. Not needed for pure reviewers that just report findings.

---

## 4. Handoffs & Agent Orchestration

### How handoffs work in Copilot CLI

Handoffs create sequential agent transitions. After an agent completes its response, handoff buttons appear that let the user move to the next agent with relevant context and a pre-filled prompt.

```yaml
handoffs:
  - label: Review Frontend      # Button display text
    agent: review-frontend      # Target agent ID (filename minus extension)
    prompt: Review all changed files in frontend/...  # Pre-filled prompt
    send: false                 # Optional: auto-submit (default false)
```

### Handoff vs. Fleet vs. Task dispatch

| Mechanism | How it works | Parallelism | When to use |
|-----------|-------------|-------------|-------------|
| **Handoffs** | Sequential transition; user sees button after agent completes | Serial (one at a time) | Guided workflows where user reviews each step |
| **/fleet** | Dispatches multiple agents in parallel, each with isolated context | **Parallel** | Independent review/analysis tasks that don't depend on each other |
| **`agent` tool** | Programmatic subagent invocation within agent logic | Serial or parallel (if called in parallel) | When the orchestrator needs to dynamically decide which agents to invoke |

### Fleet dispatch pattern

The `/fleet` slash command is a Copilot CLI feature that orchestrates parallel subagent execution. Usage in an agent's prompt body:

```
/fleet Run all review agents in parallel:
- @review-frontend: [prompt for frontend agent]
- @review-backend: [prompt for backend agent]
- @review-types: [prompt for types agent]
```

Key rules:
- Each fleet agent gets its own isolated context window
- All agents run simultaneously
- The orchestrator collects results after all agents complete
- Skip agents for layers that have no changes

### Agent communication at runtime

Use `list_agents` and `write_agent` inside custom agents to inspect nearby agents and coordinate work:

| Label | Meaning | Use it to |
|-------|---------|-----------|
| `"self"` | The current agent | Confirm which entry represents the active agent |
| `"sibling"` | An agent launched by the same parent | Coordinate with peer agents through `write_agent` |
| `"child"` | An agent launched by the current agent | Track follow-up work delegated from current agent |

---

## 5. MCP Server Integration

### Adding MCP servers in agent profiles

```yaml
---
name: my-agent-with-mcp
description: Agent that uses a custom MCP server
tools: ['read', 'search', 'custom-mcp/tool-1']
mcp-servers:
  custom-mcp:
    type: 'local'
    command: 'some-command'
    args: ['--arg1', '--arg2']
    tools: ["*"]
    env:
      ENV_VAR_NAME: ${{ secrets.COPILOT_MCP_ENV_VAR_VALUE }}
---
```

### Environment variable patterns for MCP

All of these syntax patterns are supported:

| Pattern | Origin | Example |
|---------|--------|---------|
| `$COPILOT_MCP_ENV_VAR_VALUE` | CLI native | `KEY: $MY_SECRET` |
| `${COPILOT_MCP_ENV_VAR_VALUE}` | Claude Code compatibility | `KEY: ${MY_SECRET}` |
| `${COPILOT_MCP_ENV_VAR_VALUE:-default}` | With default fallback | `KEY: ${MY_SECRET:-fallback}` |
| `${{ secrets.COPILOT_MCP_ENV_VAR_VALUE }}` | GitHub Actions syntax (YAML only) | `KEY: ${{ secrets.MY_SECRET }}` |
| `${{ vars.COPILOT_MCP_ENV_VAR_VALUE }}` | GitHub Actions syntax (YAML only) | `KEY: ${{ vars.MY_VAR }}` |

### MCP server type mapping

| Type | Used by | Notes |
|------|---------|-------|
| `local` | Cloud agent | Standard for local MCP servers |
| `stdio` | Claude Code / VS Code | **Mapped to `local`** automatically for compatibility |

### Secrets requirement

If your MCP server requires secrets or environment variables, these must be configured as **Agents secrets or variables** at the organization or repository level. See: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/customize-cloud-agent/configure-secrets-and-variables

---

## 6. Prompt Body Best Practices

### Structure your prompts clearly

```markdown
# Agent Title

You are a [specific role]. Your responsibilities:
- [concrete action 1]
- [concrete action 2]

## Constraints
[What the agent MUST NOT do]

## Instructions
[Step-by-step behavioral instructions]

## Output Format
[Exact format the agent must follow]
```

### Key principles

1. **Be explicit about read-only vs. read-write**: If an agent should only review and not modify, state this both in the `tools:` list (omit `edit`) and in the prompt body:
   ```markdown
   ## Read-Only Constraint
   You are a review agent. You MUST NOT modify, edit, or create any files.
   Your only job is to read code and report findings. Never use editing tools or write files.
   ```

2. **Define a structured output format**: Agents that need aggregation by an orchestrator should use a machine-parseable format:
   ```
   FINDING|SEVERITY|FILE:LINE|ISSUE_DESCRIPTION
   ```

3. **Scope each agent narrowly**: Each agent should cover one concern area. Scope overlap between agents is acceptable if the orchestrator has deduplication logic.

4. **Use severity levels consistently**: Define CRITICAL / WARNING / SUGGESTION with clear criteria for each level.

5. **Include a "clean" output**: When no issues are found, output a known sentinel:
   ```
   CLEAN|No violations found
   ```

6. **Keep prompts under 30,000 characters**: This is the hard limit. Be concise.

7. **Use `ask_user` for interactive decisions**: Reference the tool by the name the CLI runtime knows:
   ```
   ask_user: {
     question: "Which layers should the review cover?",
     choices: ["All layers", "Frontend only", "Backend only"]
   }
   ```

8. **Specify file writing paths for plan files**: When an agent should write plan files, explicitly state the directory:
   ```
   Write the review report as a plan file to `.ai/plans/<plan_filename>`.
   ```

---

## 7. Common Mistakes & Gotchas

### ❌ Mistake 1: Using `shell(COMMAND)` syntax in agent tools

**Wrong:**
```yaml
tools:
  - shell(git)
  - shell(rg)
  - shell(cat)
```

**Why it fails:** `shell(COMMAND)` is CLI permission flag syntax (`--allow-tool='shell(git)'`), not an agent tool alias. All of these are **silently ignored**, meaning the agent gets **zero tools**.

**Correct:**
```yaml
tools:
  - execute    # Covers git, rg, cat, bun, and ALL shell commands
  - read       # Covers file reading
  - search     # Covers grep/glob patterns
```

### ❌ Mistake 2: Using `browser` as a tool

**Wrong:**
```yaml
tools: [execute, read, browser, search]
```

**Why it fails:** `browser` is not a recognized tool alias. It's silently ignored.

**Correct:** Browser automation is via the `playwright` MCP server:
```yaml
tools: [execute, read, search, playwright/*]
```

### ❌ Mistake 3: Forgetting `web` tool for agents that need online access

**Wrong:**
```yaml
tools: [execute, read, search]  # No web access
```

If the agent needs to search online, fetch documentation, or access URLs, it needs the `web` tool.

**Correct:**
```yaml
tools: [execute, read, search, web]
```

### ❌ Mistake 4: Read-only agent with `edit` in tools

**Wrong:**
```yaml
# Review-only agent, but tools allow editing
tools: [execute, read, edit, search, web]
```

**Why it's risky:** If `edit` is in the tools list, the agent CAN modify files even if the prompt says "read only". The tool restriction is the first line of defense.

**Correct:** Omit `edit` from tools AND add a prompt constraint:
```yaml
tools: [execute, read, search, web]
```
```markdown
## Read-Only Constraint
You MUST NOT modify, edit, or create any files.
```

### ❌ Mistake 5: Unbounded nesting depth with `agent` tool

**Wrong:**
```yaml
# A review subagent that can dispatch any agent type
tools: [execute, read, search, web, agent]
```
Without nesting constraints, the `agent` tool enables unbounded recursive dispatch.

**Correct:** Review agents may have `agent` for nested parallel discovery, but with strict constraints:
- **Max 1 nesting level** — review subagent → `explore` nested subagent only
- **Nested subagents must be `explore` agent_type** — read-only, lightweight
- **Nested subagents CANNOT spawn further subagents**
- Document the nesting rules explicitly in the agent's prompt body

### ❌ Mistake 6: Missing handoff entry for a subagent referenced in the prompt

**Wrong:** The prompt body references `@review-uncommitted` in `/fleet` dispatch but the `handoffs:` section only lists 4 of 5 agents.

**Why it fails:** Without a handoff entry, the Copilot CLI agent framework cannot formally route to the agent. The `/fleet` text may work as a manual prompt, but the agent won't have proper structured handoff metadata.

**Correct:** Ensure every subagent referenced in the prompt also has a corresponding `handoffs:` entry.

### ❌ Mistake 7: Using `infer: false` (retired property)

**Wrong:**
```yaml
infer: false
```

**Why it fails:** `infer` is retired. It still works for backward compatibility but may be removed.

**Correct:**
```yaml
disable-model-invocation: true   # Prevents auto-delegation
user-invocable: true              # Still allows manual selection
```

### ❌ Mistake 8: Using platform-specific tool aliases in cross-platform agent profiles

**Wrong:**
```yaml
tools: [Bash, Read, Grep]  # Using compatible aliases
```

**Technically works** but is inconsistent. Prefer primary aliases for clarity and cross-platform compatibility.

**Correct:**
```yaml
tools: [execute, read, search]  # Primary aliases
```

### ❌ Mistake 9: Assuming tool aliases are case-sensitive

Tool aliases are **case insensitive**, but use the canonical lowercase form for consistency:
- `execute` not `Execute` or `EXECUTE`
- `read` not `Read` or `READ`

### ❌ Mistake 10: Orchestrator doing investigation work in its own context

Orchestrators that run `git diff`, `grep`, `rg`, or read large source files will fill their context window and degrade performance. ALL investigation must be delegated to subagents.

**Wrong:**
```markdown
## Instructions
1. Run `git diff main...HEAD --name-only` to find changed files
2. Read each changed file and identify issues
3. Dispatch review agents
```

**Correct:**
```markdown
## Context Window Discipline Rules
NEVER run git, grep, glob, build/lint/test commands for analysis.
ALWAYS dispatch to subagents:
- File discovery → explore agent
- Code review → review-* handoff agents
- Command execution → task agent
```

### ❌ Mistake 11: Using cloud-agent `questions` JSON schema in CLI agents

The cloud agent format supports a `questions` array with JSON schema (title, type, properties). This is **not supported** in Copilot CLI agents. CLI agents use the `ask_user` tool directly.

**Wrong:**
```yaml
questions:
  - title: "What scope?"
    type: "string"
    enum: ["full", "uncommitted"]
```

**Correct:**
```markdown
Ask the user using ask_user with choices:
ask_user:
  question: "What scope?"
  choices: ["Full repository", "Uncommitted changes only"]
```

### ❌ Mistake 12: Skipping plan validation after writing

Writing a plan file without validating it against the project's architecture rules (AGENTS.md, layer-specific rules) can produce plans that violate conventions. Always invoke a validation skill or review step after plan creation.

**Wrong:**
```markdown
4. Write plan to .ai/plans/review-plan.md
5. Ask user to confirm
```

**Correct:**
```markdown
4. Write plan to .ai/plans/review-plan.md
5. Invoke `plan-review` skill for architecture compliance
6. Incorporate skill findings into the plan
7. Ask user to confirm the improved plan
```

### ❌ Mistake 13: Implementing fixes without loading instruction files

The project has `.github/instructions/*.md` files that define mandatory rules per file type (MUI v9, React 19, backend architecture, test safety, etc.). These are automatically loaded by Copilot CLI for the main agent, **but subagents don't auto-load them**. You must paste instruction rules into subagent prompts.

**Wrong:**
```markdown
Task: fix-mui-prop
  prompt: "Fix invalid style props in frontend/views/dashboard/..."
```

**Correct:**
```markdown
Task: fix-mui-prop
  prompt: |
    Fix invalid style props in frontend/views/dashboard/...

    **Instruction rules** (MUST follow):
    - Style props are NOT valid direct props. Always use `sx`:
      - `<Typography sx={{ fontWeight: 700, mb: 1 }}>` not `<Typography fontWeight={700}>`
    - Icon naming: `*Outline` → `*Outlined`
    ... (paste relevant sections from .github/instructions/frontend.instructions.md)
```

### ❌ Mistake 14: Dispatching subagents sequentially instead of in parallel

Copilot CLI supports launching multiple subagents in a SINGLE response. Dispatching them one at a time (waiting for each to complete before launching the next) wastes time and is the most common performance mistake.

**Wrong:**
```markdown
1. Launch review-frontend → wait for result
2. Launch review-backend → wait for result
3. Launch review-types → wait for result
```

**Correct:**
```markdown
Launch ALL review subagents in a SINGLE response (parallel batch):
1. Launch review-frontend (background)
2. Launch review-backend (background)
3. Launch review-types (background) — ALL in same response
4. Wait for all to complete
```

---

## 8. Agent Design Patterns

### Pattern 1: Orchestrator + Specialized Subagents

Best for: Multi-layer review, multi-step workflows, parallel analysis

```yaml
# .github/agents/orchestrator.agent.md
---
name: orchestrator
description: Dispatches specialized agents, aggregates results, offers action options
tools: [execute, read, agent, edit, search, web, todo]
handoffs:
  - label: Step 1
    agent: specialist-a
    prompt: [scoped prompt A]
  - label: Step 2
    agent: specialist-b
    prompt: [scoped prompt B]
---
```

**Design rules:**
- Orchestrator gets all tools including `agent`, `edit`, and `todo`
- Subagents get restricted tools (no `edit` for reviewers, no `agent` for leaves)
- Orchestrator handles deduplication and aggregation
- Orchestrator writes plan files and asks user questions

### Pattern 2: Standalone Specialist Agent

Best for: Single-concern analysis, focused code generation

```yaml
# .github/agents/specialist.agent.md
---
name: specialist
description: Focused expertise in [domain]
tools: [execute, read, search, web]
---
```

**Design rules:**
- Only include tools the specialist actually needs
- Add explicit read-only constraint if the agent shouldn't modify files
- Define a clear output format for the agent's findings

### Pattern 3: Review Agent with Structured Output

Best for: Code review, convention checking, security auditing

```yaml
# .github/agents/reviewer.agent.md
---
name: reviewer
description: Reviews [scope] for [concerns]
tools: [execute, read, search, web]  # NO edit, NO agent
---

# Reviewer Agent

## Read-Only Constraint
You MUST NOT modify, edit, or create any files.

## Output Format
FINDING|SEVERITY|FILE:LINE|ISSUE_DESCRIPTION

If no violations found:
CLEAN|No violations found
```

**Design rules:**
- Never include `edit` in tools for review agents
- Never include `agent` in tools for leaf review agents **unless** they need to spawn nested explore subagents for parallel discovery
- Always include `web` for documentation lookups
- Use structured output format for programmatic aggregation

### Pattern 4: Context-Window-Disciplined Orchestrator

Best for: Multi-agent orchestrators that must process large amounts of data without context overflow

The orchestrator never performs investigative work itself — all file reading, searching, command execution, and analysis is delegated to subagents. The orchestrator's context only contains:

1. User preferences (from `ask_user` responses)
2. Aggregated finding lines (one line per finding)
3. The plan file content

Key rules:
- ❌ NEVER run `git diff`, `git status`, `grep`, `glob`, `rg`, build/lint/test commands in the orchestrator
- ❌ NEVER read source code files for review content
- ✅ ALWAYS dispatch file discovery to `explore` agent
- ✅ ALWAYS dispatch code review to dedicated `review-*` handoff agents
- ✅ ALWAYS dispatch command execution to `task` agent

```yaml
# Orchestrator tool list — has `agent` for delegation, `edit` for plan writing
tools:
  - execute   # Only for lightweight coordination (mkdir, file creation)
  - read       # Only for reading plan file, not source code
  - edit       # For writing the plan file
  - agent      # For dispatching subagents (CRITICAL)
  - search     # Only for finding agent/skill config files, never for code analysis
  - web        # For doc lookups
  - todo       # For progress tracking
```

### Pattern 5: Full Interactive Confirmation Loop

Best for: Agents that need user buy-in before taking action

The `ask_user` tool supports `choices` arrays for multiple-choice questions. The agent asks questions one at a time, summarizes all answers, and asks for final confirmation. If the user rejects, the agent loops back to the relevant question.

```markdown
## Question Flow
1. ask_user: "What scope?" → choices: ["Full repo", "Uncommitted only", "Specific dirs"]
2. ask_user: "What focus?" → choices: ["Architecture", "Security", "Code quality", "All"]
3. ask_user: "Plan filename?" → choices: ["repo-review-plan.md", "Custom"]
4. ask_user: "Confirm: [summary]. Proceed?" → choices: ["Yes, proceed", "No, change something"]

If "No": ask_user: "What to change?" → choices: ["Scope", "Focus", "Filename", ...]
Then loop back to the relevant question.
```

Key rules:
- One question per `ask_user` call — never batch questions
- Use `choices` array whenever options are predictable
- Allow `allow_freeform: true` when the answer can't be predicted (e.g., custom filenames, directory paths)
- Always do a final confirmation with full summary before proceeding
- Never start work until the user confirms

### Pattern 6: Plan-Review Skill Validation

Best for: Agents that produce plans which must comply with project architecture rules

After writing a plan file, the agent invokes a skill (via the `skill` tool) that validates the plan against the project's architecture rules. The skill reads AGENTS.md files, maps files to layers, and checks for violations.

```markdown
## Post-Plan Validation Flow
1. Write plan file to `.ai/plans/<filename>.md`
2. Invoke `plan-review` skill: `skill: "plan-review"`
3. Skill reads plan → maps files to layers → reads layer AGENTS.md → checks compliance
4. Agent incorporates skill findings into the plan
5. Re-save the plan with updated compliance notes
6. Ask user: "Accept improved plan?" with `ask_user` choices
```

This creates a two-pass quality check:
- **Pass 1**: Subagents find code-level issues (MUI violations, type pattern violations, etc.)
- **Pass 2**: Plan-review skill finds architecture-level issues (layer violations, missing i18n, etc.)

### Pattern 7: Directed-Graph agent (cross-layer aware)

Best for: When agents need awareness of other agents' scope boundaries

Define a reference table in the orchestrator:

```markdown
## Review Agents Reference
| Agent | Scope | Focus |
|-------|-------|-------|
| `@review-frontend` | frontend/... | MUI v9, React 19, ... |
| `@review-backend` | backend/... | Architecture, i18n, ... |
| `@review-types` | backend/types/ + cross-layer | Type naming, duplication, ... |
```

This helps:
1. The orchestrator know which agent covers which scope
2. Identify overlap areas (e.g., Pothos type checks overlap between `review-backend` and `review-types`)
3. Plan deduplication logic

### Pattern 8: Nested Parallel Discovery

Best for: Review agents that need to analyze large scopes fast by spawning parallel explore subagents

Review agents receive `agent` tool and spawn up to 8 parallel `explore` nested subagents for fast file-level discovery. Each nested subagent gets a focused scope (specific check category or file range).

```yaml
# Review subagent with nesting capability
---
name: review-frontend
description: Reviews frontend code for...
tools: [execute, read, search, web, agent]  # agent enables nesting
---
```

```markdown
## Parallel Discovery
Determine scope size, then spawn nested `explore` subagents:

| Scope Size | Nested Subagents | Strategy |
|---|---|---|
| Large (>50 files) | Up to 8 | One per check category |
| Medium (10-50) | 2-4 | Grouped by related categories |
| Small (<10) | 0-1 | Handle directly or single subagent |

Launch ALL nested subagents in a SINGLE response for maximum parallelism.
Aggregate results from all nested subagents into your final output.

## Nesting Rules
- Max depth: 1 level (you → explore subagent)
- Nested subagents MUST be `explore` agent_type (read-only, lightweight)
- Nested subagents CANNOT spawn further subagents
```

Key rules:
- **Max 1 nesting level** — review → explore is allowed, explore → further is NOT
- **Nested subagents must be `explore` agent_type** — read-only, Haiku model, fast
- **Dynamic sizing** — spawn fewer subagents for smaller scopes to save credits
- **Batch launch** — all nested subagents in one response for parallelism
- **Aggregate in parent** — nested subagents return findings, parent combines them

### Pattern 9: Parallel Fix Batching with Full-Tool Subagents

Best for: Orchestrators that implement fixes via general-purpose subagents running in parallel

After a review phase, the orchestrator batches independent fixes into parallel groups of up to 8 `general-purpose` subagents. Each fix subagent has **full tooling** including `edit`.

```markdown
## Fix Dispatch
1. Group findings by file — each group needs one fix subagent
2. Verify fixes in same group edit DIFFERENT files (no write conflicts)
3. Launch all fix subagents in a SINGLE response (parallel batch of up to 8)
4. Each subagent gets: file path, finding description, instruction file content, and "You have full edit access"
5. After all complete, update plan file checkboxes
```

Key rules:
- **Fix subagents use `general-purpose` agent_type** — full tools (execute, read, edit, search, web, agent)
- **No two parallel fixes should target the same file** — causes race conditions
- **Paste instruction file content into fix subagent prompts** — subagents don't auto-load `.github/instructions/`
- **Batch up to 8 per parallel group** — practical limit for credit/rate management
- **Sequential groups if many fixes** — group 1 runs, completes, then group 2

---

## 9. Agent Conflict Analysis

### Scope overlap between agents

When designing multi-agent systems, scope overlap is **expected and manageable**. The key is to:

1. **Document overlaps explicitly** in each agent's scope
2. **Design deduplication** in the orchestrator's aggregation step
3. **Ensure complementary focus** so overlapping agents check different aspects

### Known overlap patterns in this repository

| Overlap Area | Agents Involved | What Overlaps | Resolution |
|---|---|---|---|
| Type definitions in Pothos files | `review-backend` + `review-types` | Both check for local type defs in Pothos | Orchestrator dedup: keep most specific finding |
| Missing `id` field in GraphQL | `review-frontend` + `review-backend` | Frontend checks query selection sets; backend checks object type definitions | Different granularity — both valid, different concerns |
| i18n in backend | `review-backend` + `review-uncommitted` | Backend checks convention violations; uncommitted checks security/data exposure | Complementary — different focus for same scope |
| All uncommitted changes | `review-uncommitted` + all directory-scoped agents | `review-uncommitted` reviews ALL uncommitted files | Explicit scope exclusion in `review-uncommitted` prompt: "Do NOT review style, conventions, lint, naming, or formatting" |

### Conflict prevention rules

1. **No two agents should both have `edit` for the same file scope** — this causes race conditions in parallel execution
2. **Review agents must be read-only** — enforced by `tools:` list AND prompt constraint
3. **Review subagents may dispatch nested `explore` subagents up to ONE level deep** — no deeper nesting. Nested subagents must be read-only (`explore` agent_type). Fix subagents (`general-purpose` agent_type) have full tooling including `edit`.
4. **Orchestrator is the only writer** — it aggregates, writes plan files, and coordinates fixes

---

## 10. Environment-Specific Considerations

### Windows environment (this repository)

This repo runs on **Windows_NT** with PowerShell. Key implications:

| Concern | Impact | Mitigation |
|---------|--------|------------|
| `execute` tool resolves to PowerShell | Shell commands use PowerShell syntax | Agent prompts should reference PowerShell commands, not bash |
| `rg.exe` location | Available via Chocolatey at `C:\ProgramData\chocolatey\bin\rg.exe` | `execute` tool handles PATH resolution |
| `git.exe` location | `C:\Program Files\Git\cmd\git.exe` | Available by default |
| `bun.exe` location | `C:\Users\PC\.bun\bin\bun.exe` | Available; some scripts need `~/.bun/bin/bun` full path |
| Path separators | Windows uses `\` backslash | Agent prompts should use Windows paths |
| `find` command | Not available as Unix `find`; PowerShell `Get-ChildItem` instead | Use `search` tool (glob/grep) instead of `find` |
| `cat`, `head`, `tail`, `ls`, `wc` | PowerShell has `Get-Content`, `Select-Object`, etc. | Use `read` tool for file reading, `execute` for shell commands |

### Available CLI tools in this environment

| Tool | Path | Available |
|------|------|-----------|
| git | `C:\Program Files\Git\cmd\git.exe` | ✅ |
| curl | `C:\Windows\system32\curl.exe` | ✅ |
| gh (GitHub CLI) | `C:\Program Files\GitHub CLI\gh.exe` | ✅ |
| bun | `C:\Users\PC\.bun\bin\bun.exe` | ✅ |
| node | `C:\Program Files\nodejs\node.exe` | ✅ |
| rg (ripgrep) | `C:\ProgramData\chocolatey\bin\rg.exe` | ✅ |

### Copilot CLI version

Current: **1.0.65** (as of June 2026). Features available:
- `/fleet` for parallel subagent dispatch
- Handoffs for sequential agent transitions
- `ask_user` tool for interactive questioning
- Custom agents via `.github/agents/*.agent.md`
- MCP server support (`github`, `playwright` out-of-box)

---

## 11. Testing & Verification Checklist

Before considering a new agent complete, verify:

### Frontmatter validation
- [ ] `name` matches the filename (minus `.agent.md`/`.md`)
- [ ] `description` is present and concise
- [ ] `tools` list uses only valid primary aliases (`execute`, `read`, `edit`, `search`, `agent`, `web`, `todo`) or MCP server references
- [ ] No `shell(COMMAND)` syntax in `tools` list
- [ ] No `browser` in `tools` list (use `playwright/*` instead)
- [ ] `edit` is omitted for read-only agents
- [ ] `agent` is omitted for leaf agents (only orchestrators need it)
- [ ] `web` is included if the agent needs online access
- [ ] `handoffs` entry exists for every subagent referenced in the prompt

### Prompt body validation
- [ ] Read-only constraint explicitly stated for review agents
- [ ] Output format is defined and parseable (for programmatic aggregation)
- [ ] "Clean" sentinel output defined for no-findings case
- [ ] Scope is clearly defined (which directories/files the agent covers)
- [ ] Scope exclusions are stated (what NOT to check)
- [ ] Severity criteria are defined (CRITICAL / WARNING / SUGGESTION)
- [ ] Interactive (`ask_user`) usage is documented if the agent asks questions

### Orchestrator-specific validation
- [ ] Deduplication logic described for overlapping agent findings
- [ ] Aggregation step documented
- [ ] Plan file writing path specified (e.g., `.ai/plans/`)
- [ ] Post-review question flow documented
- [ ] Fix scope options documented
- [ ] Context Window Discipline Rules section present (if orchestrator)
- [ ] Interactive scoping questions with `ask_user` + `choices` defined
- [ ] Final confirmation question before proceeding
- [ ] Loop-back mechanism for parameter changes
- [ ] Plan-review skill invocation step documented
- [ ] All investigation work delegated to subagents (no direct git/grep/read for analysis)

### Cross-agent validation
- [ ] No two agents with `edit` tool share the same file scope
- [ ] Subagent scope overlap is documented and handled by orchestrator deduplication
- [ ] All handoff targets correspond to existing `.github/agents/<name>.agent.md` files
- [ ] Agent IDs are unique (no filename collisions across `.github/agents/` directories)

---

## 12. Reference: Current Agent Fleet

### Agent graph

```
repo-review (orchestrator)
├── review-frontend  (scope: frontend/... — MUI v9, React 19, Apollo, Zustand)
│   └── up to 8 nested explore subagents (parallel discovery)
├── review-backend   (scope: backend/... — Architecture, i18n, logging, repo conventions)
│   └── up to 8 nested explore subagents (parallel discovery)
├── review-types     (scope: backend/types/ + cross-layer — Type naming, duplication)
│   └── up to 6 nested explore subagents (parallel discovery)
├── review-config    (scope: app/, scripts/, .github/ — Next.js 16, CI/CD, env/secrets)
│   └── up to 7 nested explore subagents (parallel discovery)
└── review-uncommitted (scope: uncommitted changes — Security, performance, deploy safety)
    └── up to 6 nested explore subagents (parallel track discovery)
```

### Agent tool assignments

| Agent | execute | read | edit | search | agent | web | todo |
|-------|:-------:|:----:|:----:|:------:|:-----:|:---:|:----:|
| `repo-review` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `review-frontend` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| `review-backend` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| `review-types` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| `review-config` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| `review-uncommitted` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |

### Tool rationale per agent

**repo-review (orchestrator):** Needs all tools — `edit` for post-review fixes and plan file writing, `agent` for `/fleet` dispatch, `todo` for tracking, `web` for doc lookups.

**review-* subagents:** Read-only review — no `edit`, no `todo` (orchestrator's responsibility). All have `agent` for spawning nested `explore` subagents for parallel discovery (up to 8 at once). All have `web` for looking up documentation and best practices during review.

### Evolution history

| Date | Change | Reason |
|------|--------|--------|
| 2026-06-30 | Added `review-uncommitted` to handoffs | Was missing from frontmatter despite being referenced in `/fleet` dispatch |
| 2026-06-30 | Replaced invalid `shell(...)` tool syntax with valid aliases | `shell(COMMAND)` is CLI permission flag syntax, not agent tool aliases — was silently ignored |
| 2026-06-30 | Removed invalid `browser` tool from repo-review | `browser` is not a valid tool alias; browser automation uses `playwright/*` MCP server |
| 2026-06-30 | Added Read-Only Constraint sections to all 5 review subagents | Double enforcement: tools list + prompt constraint prevents accidental file modifications |
| 2026-06-30 | Added `web` tool to all review subagents | Enables online doc lookups, best practice searches, and reference material during review |
| 2026-06-30 | Added pre-review scoping questions (Step 0) | User determines scope, focus mode, and plan filename before agents are dispatched |
| 2026-06-30 | Added plan file writing to `.ai/plans/` | Review results persisted as markdown files for reference and tracking |
| 2026-06-30 | Replaced invalid `questions` JSON format with `ask_user` tool | The original used a cloud-agent JSON schema; Copilot CLI uses the `ask_user` tool |
| 2026-06-30 | Added post-review `ask_user` with scoped fix options | User picks which layers/severities to fix after review completes |
| 2026-06-30 | Added plan file checkbox updates after fixes | `[ ]` → `[x]` tracking in plan file as fixes are applied |
| 2026-06-30 | Full interactive question loop with confirmation | Agent keeps asking `ask_user` until all plan parameters confirmed; loops back on "No, change something" |
| 2026-06-30 | Context Window Discipline Rules | Orchestrator never runs git/diff/search/reads for analysis — ALL investigation delegated to subagents |
| 2026-06-30 | Plan-review skill integration | After writing plan, agent invokes `plan-review` skill for AGENTS.md compliance validation |
| 2026-06-30 | Review+Fix+Verify pipeline | Agent now implements fixes (Phase 6) using instruction files as guardrails, verifies via quality-loop skill (Phase 7), and commits via commit-scoped skill (Phase 8) |
| 2026-06-30 | Instruction file integration | Fixes use `.github/instructions/*.md` (frontend, backend, tests, sonarqube) based on `applyTo` patterns — pasted into subagent prompts |
| 2026-06-30 | Added `agent` tool to all 5 review subagents | Enables nested parallel discovery — each review subagent can spawn up to 8 `explore` subagents |
| 2026-06-30 | Added Parallel Discovery sections to all 5 subagents | Dynamic sizing: large scope → 8 nested, medium → 2-4, small → 0-1 |
| 2026-06-30 | Updated repo-review Phase 2 for parallel batch dispatch | All review subagents launched in SINGLE response for maximum parallelism |
| 2026-06-30 | Updated repo-review Phase 6 for parallel fix batching | Independent fixes batched into groups of up to 8 `general-purpose` subagents with full tooling |
| 2026-06-30 | Updated conflict prevention rule #3 | Changed from "no nesting" to "1-level nesting allowed, explore subagents only" |
| 2026-06-30 | Added Pattern 8 (Nested Parallel Discovery) and Pattern 9 (Parallel Fix Batching) | Documented nesting and parallel fix patterns for future agent creation |

---

## Appendix A: Official Documentation Sources

These are the official GitHub documentation pages used as source material:

| Topic | URL |
|-------|-----|
| Using Copilot CLI | https://docs.github.com/en/copilot/how-tos/use-copilot-agents/use-copilot-cli |
| About Copilot CLI | https://docs.github.com/en/copilot/concepts/agents/about-copilot-cli |
| Custom Agents Configuration | https://docs.github.com/en/copilot/reference/custom-agents-configuration |
| Creating Custom Agents | https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/create-custom-agents |
| CLI Command Reference | https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference |
| VS Code Custom Agents | https://code.visualstudio.com/docs/agent-customization/custom-agents |

## Appendix B: Quick-Reference YAML Template

```yaml
---
# Required
name: agent-id                    # Must match filename (minus .agent.md)
description: What this agent does  # Required — shown in agent list

# Tools — use ONLY these primary aliases
# Options: execute, read, edit, search, agent, web, todo
# Add MCP: github/*, playwright/*, <server>/<tool>
tools:
  - execute
  - read
  - search
  - web

# Optional
model: Model Name (vendor)                   # Override model
disable-model-invocation: true               # Prevent auto-delegation
user-invocable: true                          # Allow manual selection

# Handoffs (CLI / VS Code only — ignored by cloud agent)
handoffs:
  - label: Display Text
    agent: target-agent-id
    prompt: Pre-filled prompt text
    send: false                              # Auto-submit if true
    model: Model Name (vendor)               # Optional model override
---

# Agent Title

## Constraints
[Read-only / scope limitations / must-not-do rules]

## Instructions
[Step-by-step behavioral instructions]

## Output Format
[Structured format for findings, or CLEAN|... sentinel]
```
