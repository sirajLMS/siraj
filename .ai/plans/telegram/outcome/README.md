# Telegram Plan — Outcome Directory

This directory stores **execution outcome documents** produced as agents complete tasks from [trackable-tasks.md](../trackable-tasks.md).

## Purpose

Each outcome file captures research, implementation decisions, pitfalls discovered, and carry-over knowledge so later tasks (and future agents) do not repeat analysis.

## Naming Convention

| Pattern | When |
|---------|------|
| `<task-id>-outcome.md` | After completing a parent task (e.g. `1-outcome.md`, `13-outcome.md`) |
| `29-knowledge-propagation-outcome.md` | Final knowledge-propagation task |

## Protocol

1. **Before** starting any task: read **all** files in this directory plus relevant [WhatsApp outcome files](../../whatsapp/outcome/).
2. **After** completing a task and passing quality checks: write a new outcome file summarizing what was done and what the next agent should know.
3. The final task (29) synthesizes all outcomes into `docs/services/telegram-bot-api.md`.

## Prerequisite

Execution is **blocked** until the [WhatsApp plan](../../whatsapp/trackable-tasks.md) reaches 100% completion. **Read `0-research-confirmation-outcome.md` first** — it consolidates Bot API 10.2 verification from 7 parallel research subagents (2026-08-01).

## Related Documents

- [Requirements (specs.md)](../specs.md)
- [Implementation Guide (implementation.md)](../implementation.md)
- [Trackable Tasks (trackable-tasks.md)](../trackable-tasks.md)
