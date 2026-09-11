# Drizzle ORM Best Practices (PostgreSQL)

## Structure

```
drizzle-best-practices/
  SKILL.md                # Main skill file - read this first
  AGENTS.md               # This navigation guide
  CLAUDE.md               # Symlink to AGENTS.md
  references/
    engine-postgres.md    # Postgres-specific types, features, and idioms
    schema-*.md           # Schema design patterns
    query-*.md            # Query patterns
    relations-*.md        # Relation definitions and relational queries
    migrations-*.md       # Drizzle Kit configuration and workflow
    types-*.md            # TypeScript type inference and custom types
    perf-*.md             # Performance optimization
    driver-*.md           # Driver setup and serverless configuration
    advanced-*.md         # Dynamic queries, raw SQL, power-user patterns
    _sections.md          # Full index of all reference files
```

## Usage

1. Read `SKILL.md` for the main skill instructions
2. Browse `references/` for detailed documentation on specific topics (full index in `references/_sections.md`)
3. Reference files are loaded on-demand — read only what you need. Each one pairs an incorrect and a correct code example with a brief rationale.

## When to Apply

Reference these guidelines when:

- Defining table schemas with `pgTable`
- Writing select, insert, update, or delete queries
- Setting up relations between tables
- Configuring `drizzle-kit` for migrations
- Inferring TypeScript types from your schema
- Choosing between the SQL-like API and the relational query API
- Optimizing query performance
- Integrating Drizzle with serverless Postgres providers (Neon, Supabase, etc.)

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Schema Design | CRITICAL | `schema-` |
| 2 | Query Patterns | CRITICAL | `query-` |
| 3 | Relations | HIGH | `relations-` |
| 4 | Migrations | HIGH | `migrations-` |
| 5 | Type Safety | MEDIUM-HIGH | `types-` |
| 6 | Performance | MEDIUM | `perf-` |
| 7 | Database Drivers | MEDIUM | `driver-` |
| 8 | Advanced Patterns | LOW | `advanced-` |

## References

- https://orm.drizzle.team/docs/overview
- https://orm.drizzle.team/docs/sql-schema-declaration
- https://orm.drizzle.team/docs/relations-v2
- https://orm.drizzle.team/docs/perf-queries
- https://orm.drizzle.team/docs/kit-overview
- https://orm.drizzle.team/llms.txt
