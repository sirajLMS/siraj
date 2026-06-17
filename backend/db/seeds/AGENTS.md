# Agents Instructions

When creating or updating a seeder in this directory, you must adhere to the following rules:

- **"seed or get" Pattern:** Every seeder MUST export a function named `seedOrGet`.
- **Idempotency:** The `seedOrGet` function must be safely runnable multiple times. It should not create duplicate records (use `onConflictDoUpdate`, `onConflictDoNothing`, or similar mechanisms).
- **Return Value:** The function should return the seeded or retrieved entities. This allows other seeders to use those entities without querying the database again.
- **Dependencies:** If your seeder depends on data seeded by another seeder, you must call that seeder's `seedOrGet` function within your own seeder.

This ensures that we avoid duplicating data (such as permission groups or users) even if seeders are run multiple times.
