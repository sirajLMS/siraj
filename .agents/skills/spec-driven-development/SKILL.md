---
name: spec-driven-development
description: Systematic three-phase approach to feature development using Requirements, Design, and Tasks phases. Transforms vague feature ideas into well-defined, implementable solutions that reduce ambiguity, improve quality, and enable effective AI collaboration.
license: MIT
compatibility: Claude Code, Cursor, VS Code, Windsurf
metadata:
  category: methodology
  complexity: intermediate
  author: Kiro Team
  version: "1.1.0"
---

# Spec-Driven Development

A comprehensive methodology for systematic software feature development that ensures quality, maintainability, and successful delivery through structured planning.

All feature plans created using this skill live under `.ai/plans/<feature-name>/` and automatically include a dedicated outcome directory: `.ai/plans/<feature-name>/outcome/`.

## Outcome Knowledge Base & Execution Rules

Every feature plan enforces three mandatory execution rules across all tasks:

1. **Pre-Execution Outcome Knowledge Read:**  
   Before executing ANY task, the executing agent MUST read ALL existing files in `.ai/plans/<feature-name>/outcome/`. This ensures the agent absorbs prior research, web search results, documentation lookups, pitfalls, and misunderstandings without re-doing past analysis.

2. **Post-Execution Outcome File Creation:**  
   Upon completing a task, the executing agent MUST create a new outcome document under `.ai/plans/<feature-name>/outcome/<task-id>-outcome.md` detailing research findings, docs/web search results, implementation details, and carry-over points for future subtasks.

3. **Task Progress Checkbox Tracking:**  
   The executing agent MUST update the task checkbox `[ ]` -> `[x]` in `tasks.md` upon completing each subtask.

## When to Use This Skill

**Ideal scenarios:**
- Complex features with multiple components, integrations, or user interactions
- High-stakes projects where rework costs are significant
- Team collaboration requiring shared understanding
- AI-assisted development where clear structure improves output quality
- Knowledge preservation for future maintainers

**Less suitable:**
- Simple bug fixes with obvious solutions
- Experimental prototypes for rapid iteration
- Time-critical hotfixes requiring immediate action
- Well-established patterns with minimal ambiguity

## The Three-Phase Workflow

### Phase 1: Requirements Gathering

**Purpose:** Transform vague feature ideas into clear, testable requirements

**Process:**
1. Capture user stories expressing value and purpose
2. Define acceptance criteria using EARS format (Easy Approach to Requirements Syntax)
3. Include Feature 6 (Outcome Knowledge Base & Progress Tracking) as standard criteria
4. Identify edge cases and constraints
5. Validate completeness and feasibility

**EARS Format Patterns:**
```
WHEN [event] THEN [system] SHALL [response]
IF [precondition] THEN [system] SHALL [response]
WHEN [event] AND [condition] THEN [system] SHALL [response]
```

**Example:**
```markdown
**User Story:** As a new user, I want to create an account, so that I can access personalized features.

**Acceptance Criteria:**
1. WHEN user provides valid email and password THEN system SHALL create new account
2. WHEN user provides existing email THEN system SHALL display "email already registered" error
3. WHEN user provides password shorter than 8 characters THEN system SHALL display "password too short" error
4. WHEN account creation succeeds THEN system SHALL send confirmation email
```

### Phase 2: Design Documentation

**Purpose:** Create a comprehensive technical plan for implementation

**Process:**
1. Research technical approaches and constraints
2. Define system architecture and component interactions
3. Specify data models and interfaces
4. Plan error handling and testing strategies

**Design Document Structure:**
```markdown
## Overview
[High-level summary of approach. Explain how this design addresses the requirements and fits into the overall system architecture.]

### Design Goals
- [Primary goal 1]
- [Primary goal 2]
- [Primary goal 3]

### Key Design Decisions
- [Decision 1 and rationale]
- [Decision 2 and rationale]
- [Decision 3 and rationale]

### UX/Navigation Specification (REQUIRED)
Every feature plan MUST include a UX/Navigation section defining:
- **New Routes & URLs**: Complete list of new pages/routes with path, purpose, and permission
- **Sidebar/Navigation Integration**: Where items appear in navigation (group, parent, order)
- **Role-Based Access Matrix**: Which roles (superadmin, admin, parent, student, teacher, supervisor, staff, etc.) access each route
- **Per-Audience Rendering**: How pages/tabs differ for each audience (student vs parent vs teacher vs supervisor)
- **Mobile vs Desktop Variants**: Any differences in navigation/presentation
- **Permission Mapping**: Exact permission strings required for each route/component

### Outcome & Knowledge Transfer Protocol (`.ai/plans/<feature-name>/outcome/`)
- **BEFORE Execution:** Executing agents MUST read ALL existing files in `.ai/plans/<feature-name>/outcome/` to avoid re-analysis.
- **AFTER Execution:** Executing agents MUST write `.ai/plans/<feature-name>/outcome/<task-id>-outcome.md` with research/doc findings and implementation details.
- **PROGRESS TRACKING:** Executing agents MUST update task checkboxes `[ ]` -> `[x]` in `tasks.md`.
```

**Decision Documentation:**
```markdown
### Decision: [Title]
**Context:** [Situation requiring decision]
**Options Considered:**
1. [Option 1] - Pros: [benefits] / Cons: [drawbacks]
2. [Option 2] - Pros: [benefits] / Cons: [drawbacks]
**Decision:** [Chosen option]
**Rationale:** [Why this was selected]
```

### Phase 3: Task Planning

**Purpose:** Break design into actionable, sequential implementation steps

**Process:**
1. Convert design elements into specific coding tasks
2. Sequence tasks to enable incremental progress
3. Define clear objectives and completion criteria
4. Reference requirements for traceability

**Task Structure:**
```markdown
- [ ] 1. [Epic/Major Component]
- [ ] 1.1 [Specific implementation task]
  - [Implementation details]
  - [Files/components to create]
  - _Requirements: [Requirement references]_
```

**Task Sequencing Strategies:**
- **Foundation-First:** Core interfaces before dependent components
- **Feature-Slice:** End-to-end vertical slices for early validation
- **Risk-First:** Tackle uncertain areas early
- **Hybrid:** Combine approaches based on project needs

## Plan Templates

The official process templates for generating feature specifications are located in `.agents/spec-process-guide/templates/`:
- [requirements-template.md](file://.agents/spec-process-guide/templates/requirements-template.md) — Phase 1: Requirements Gathering Template
- [design-template.md](file://.agents/spec-process-guide/templates/design-template.md) — Phase 2: Technical Design Template
- [tasks-template.md](file://.agents/spec-process-guide/templates/tasks-template.md) — Phase 3: Actionable Tasks Template
- [quick-spec-template.md](file://.agents/spec-process-guide/templates/quick-spec-template.md) — 1–3 Day Features Quick Spec Template
- [micro-spec-template.md](file://.agents/spec-process-guide/templates/micro-spec-template.md) — < 1 Day Changes Micro Spec Template

## Quality Checklists

### Requirements Checklist
- [ ] All user roles identified and addressed
- [ ] Normal, edge, and error cases covered
- [ ] Requirements are testable and measurable
- [ ] No conflicting requirements
- [ ] EARS format used consistently

### Design Checklist
- [ ] All requirements addressed in design
- [ ] Component responsibilities well-defined
- [ ] Interfaces between components specified
- [ ] Error handling covers expected failures
- [ ] Security considerations addressed
- [ ] **UX/Navigation Specification complete** (routes, sidebar, roles, per-audience, mobile/desktop, permissions)

### Tasks Checklist
- [ ] All design components have implementation tasks
- [ ] Tasks ordered to respect dependencies
- [ ] Each task produces testable code
- [ ] Requirements references included
- [ ] Scope is appropriate (2-4 hours each)
- [ ] **Quality loop task per file** (tsgo + biome:check + lint queue)
- [ ] **Instruction verification task per subtask** (validate against layer AGENTS.md + .agents/instructions)
- [ ] **Drizzle schema handled correctly** (push for schema, migrate for custom SQL only)

## Integration with AI Workflows

**For Claude Code / AI Assistants:**

1. **Start with context:** Provide project background, constraints, and goals
2. **Work in phases:** Complete requirements before design, design before tasks
3. **Iterate:** Refine outputs through conversation rather than single requests
4. **Validate:** Ask AI to review outputs against checklists
5. **Trace:** Maintain links between requirements, design, and tasks

**Example prompt for starting a spec:**
```
I'm working on [project context]. We need to add [feature description].

Context:
- Technology: [stack]
- Users: [target audience]
- Constraints: [key limitations]

Please help me develop requirements using the EARS format, starting with user stories and acceptance criteria.
```

## Standard Task Enhancement Rules (Applied to Every Feature Plan)

### 1. Navigation/Sidebar/Tabs & Permissions (Default in Every Plan)
Every feature plan MUST include:
- Complete route table with paths, purposes, permissions
- Sidebar navigation placement (group, parent, children, mobile bottom nav)
- Role-based access matrix for all user types (SUPER_ADMIN, ACADEMY_ADMIN, SUPERVISOR, TEACHER, PARENT, STUDENT, STAFF, USER, GUEST)
- Per-audience rendering specifications (what each role sees differently)
- Mobile vs Desktop navigation differences

### 2. Quality Loop Per File (Default in Every Subtask)
After creating/modifying ANY file, the executing agent MUST run:
```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:4777/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify","files":["<the-file>"]}'
```
Fix all errors before proceeding to next file/subtask.

### 3. Instruction Verification Per Subtask (Default in Every Subtask)
After quality loop passes, the agent MUST validate the file against ALL applicable instruction files:
- **Layer AGENTS.md**: Absolute path to each layer's AGENTS.md (e.g., `/home/ahmed/Projects/siraj/backend/db/schema/AGENTS.md`)
- **.agents/instructions/*.md**: Absolute paths to all matching instruction files (e.g., `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md`)

The task-to-instructions mapping is defined in the implementation guide and must be included in every plan.

### 4. Drizzle Schema Convention
- **Schema changes** (new tables, columns, indexes): Use `bun run db push` — creates schema automatically
- **Custom SQL migrations** (seed data, complex transforms): Use `bun db migrate` — for non-Drizzle SQL only
- Document this distinction in every plan's implementation guide

### 5. Layer AGENTS.md Compliance
Every task in the plan MUST specify:
- Absolute paths to all applicable AGENTS.md files for the files being modified
- Absolute paths to all applicable `.agents/instructions/*.md` files
- These paths must be included in the task definition so subagents have them immediately

## Common Pitfalls to Avoid

1. **Skipping phases:** Each phase builds on the previous; shortcuts create problems
2. **Vague requirements:** "System should be fast" vs specific, measurable criteria
3. **Implementation details in requirements:** Focus on what, not how
4. **Over-engineering design:** Solve current requirements, not hypothetical future ones
5. **Monolithic tasks:** Break down into 2-4 hour increments
6. **Missing error cases:** Always consider what happens when things go wrong
7. **Missing UX/Navigation spec:** Every feature needs routes, sidebar, permissions, audiences defined
8. **Missing quality loop:** Every file must pass tsgo + biome + lint before moving on
9. **Missing instruction verification:** Every file must be validated against layer rules
10. **Confusing migrate vs push:** Use push for Drizzle schema, migrate for custom SQL only

## Next Steps

After completing a spec:
1. Begin implementation following task sequence
2. Track progress by marking tasks complete
3. Update spec if implementation reveals gaps
4. Validate completed work against requirements
5. Document learnings for future specs

---

[← Back to Templates](README.md) | [Design Template →](design-template.md)