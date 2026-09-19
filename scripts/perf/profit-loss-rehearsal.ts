/**
 * Performance rehearsal for the profit & loss report queries (NFR-2: p95
 * < 800 ms on a large month). Seeds a large-month fixture directly via SQL
 * (5 000 completed sessions + 100 expenses + 200 income payments), measures
 * the three repository page queries plus their count queries, and removes
 * every seeded row in a tracked cleanup.
 *
 * Run: bun run scripts/perf/profit-loss-rehearsal.ts
 */
import { Pool, type PoolClient } from "pg";

const MONTH = "2098-05";
const SESSION_COUNT = 5_000;
const EXPENSE_COUNT = 100;
const INCOME_COUNT = 200;
const WARMUP_RUNS = 3;
const MEASURED_RUNS = 10;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

interface TimingSample {
  readonly label: string;
  readonly durationMs: number;
}

const samples: TimingSample[] = [];

async function timeQuery(label: string, run: () => Promise<unknown>): Promise<void> {
  const start = performance.now();
  await run();
  samples.push({ label, durationMs: performance.now() - start });
}

function percentile(values: number[], p: number): number {
  const sorted = [...values].toSorted((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

/** One reusable user row; teachers, students, and the expense creator hang off it. */
async function seedUser(client: PoolClient): Promise<string> {
  const result = await client.query<{ id: string }>(
    `INSERT INTO users (name, email, password, created_at, updated_at)
     VALUES ('P&L Perf User', '[EMAIL_REDACTED]', 'not-a-real-password', now(), now())
     RETURNING id`
  );
  return result.rows[0].id;
}

/** Teacher + student fixtures (both require a unique user_id). */
async function seedPeople(client: PoolClient, userId: string): Promise<{ teacherId: string; studentId: string }> {
  const teacher = await client.query<{ id: string }>(
    `INSERT INTO teachers (user_id, created_at, updated_at) VALUES ($1, now(), now()) RETURNING id`,
    [userId]
  );
  const student = await client.query<{ id: string }>(
    `INSERT INTO students (user_id, name, status, idempotency_key, created_at, updated_at)
     VALUES ($1, 'P&L Perf Student', 'REGULAR', 'pl-perf-student', now(), now()) RETURNING id`,
    [userId]
  );
  return { teacherId: teacher.rows[0].id, studentId: student.rows[0].id };
}

/** Subject chain: category → subject (subject_id is NOT NULL on class_instances). */
async function seedSubject(client: PoolClient): Promise<string> {
  const category = await client.query<{ id: string }>(
    `INSERT INTO class_categories (name, slug, created_at, updated_at)
     VALUES ('P&L Perf Category', 'pl-perf-category', now(), now()) RETURNING id`
  );
  const subject = await client.query<{ id: string }>(
    `INSERT INTO class_subjects (category_id, name, slug, created_at, updated_at)
     VALUES ($1, 'P&L Perf Subject', 'pl-perf-subject', now(), now()) RETURNING id`,
    [category.rows[0].id]
  );
  return subject.rows[0].id;
}

/** 5 000 completed sessions inside the rehearsal month. */
async function seedSessions(
  client: PoolClient,
  ids: { teacherId: string; studentId: string; subjectId: string }
): Promise<void> {
  await client.query(
    `INSERT INTO class_instances
       (teacher_id, student_id, subject_id, scheduled_start_at, scheduled_end_at, actual_start_at, actual_end_at,
        duration_minutes, class_type, outcome, execution_state, calculation_status, idempotency_key, created_at, updated_at)
     SELECT $1, $2, $3,
            $4::timestamptz + (g * interval '10 minutes'),
            $4::timestamptz + (g * interval '70 minutes'),
            $4::timestamptz + (g * interval '10 minutes'),
            $4::timestamptz + (g * interval '70 minutes'),
            60, 'REGULAR', 'TAKEN', 'COMPLETED', 'PAID', 'pl-perf-session-' || g, now(), now()
     FROM generate_series(0, $5 - 1) AS g`,
    [ids.teacherId, ids.studentId, ids.subjectId, `${MONTH}-01T08:00:00Z`, SESSION_COUNT]
  );
}

/** 100 expenses dated inside the month. */
async function seedExpenses(client: PoolClient, userId: string): Promise<void> {
  await client.query(
    `INSERT INTO expenses (title, type, expense_value, expense_currency, payment_date, expense_date, created_by_user_id, created_at, updated_at)
     SELECT 'P&L perf expense ' || g, 'Salaries', '10.00', 'SAR', $1, $2, $3, now(), now()
     FROM generate_series(0, $4 - 1) AS g`,
    [`${MONTH}-05`, MONTH, userId, EXPENSE_COUNT]
  );
}

/** Invoice chain: parent (requires user_id) → invoice (requires parent_id). */
async function seedInvoice(client: PoolClient, ids: { userId: string; studentId: string }): Promise<string> {
  const parent = await client.query<{ id: string }>(
    `INSERT INTO parents (user_id, status, created_at, updated_at)
     VALUES ($1, 'REGULAR', now(), now()) RETURNING id`,
    [ids.userId]
  );
  const invoice = await client.query<{ id: string }>(
    `INSERT INTO invoices (parent_id, student_id, issue_date, due_date, amount, currency, status, invoice_type, idempotency_key, created_at, updated_at)
     VALUES ($1, $2, $3, $4, '5000.00', 'SAR', 'PAID', 'MANUAL', 'pl-perf-invoice', now(), now()) RETURNING id`,
    [parent.rows[0].id, ids.studentId, `${MONTH}-01`, `${MONTH}-28`]
  );
  return invoice.rows[0].id;
}

/** 200 income payments created inside the month. */
async function seedIncomePayments(client: PoolClient, invoiceId: string): Promise<void> {
  await client.query(
    `INSERT INTO payments
       (invoice_id, amount, currency, payment_date, payment_method_type, payment_method_snapshot,
        idempotency_key, created_at, updated_at)
     SELECT $1, '25.00', 'SAR', $2::timestamptz + (g * interval '5 minutes'), 'CASH', '{"type":"CASH"}'::jsonb,
            'pl-perf-payment-' || g, $2::timestamptz + (g * interval '5 minutes'), now()
     FROM generate_series(0, $3 - 1) AS g`,
    [invoiceId, `${MONTH}-02T09:00:00Z`, INCOME_COUNT]
  );
}

async function seed(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userId = await seedUser(client);
    const { teacherId, studentId } = await seedPeople(client, userId);
    const subjectId = await seedSubject(client);
    await seedSessions(client, { teacherId, studentId, subjectId });
    await seedExpenses(client, userId);
    const invoiceId = await seedInvoice(client, { userId, studentId });
    await seedIncomePayments(client, invoiceId);

    await client.query("COMMIT");
  } catch (seedError) {
    await client.query("ROLLBACK");
    throw seedError;
  } finally {
    client.release();
  }
}

async function cleanup(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM payments WHERE idempotency_key LIKE 'pl-perf-payment-%'`);
    await client.query(`DELETE FROM invoices WHERE idempotency_key = 'pl-perf-invoice'`);
    await client.query(`DELETE FROM class_instances WHERE idempotency_key LIKE 'pl-perf-session-%'`);
    await client.query(`DELETE FROM expenses WHERE title LIKE 'P&L perf expense %'`);
    await client.query(`DELETE FROM students WHERE name = 'P&L Perf Student'`);
    await client.query(`DELETE FROM teachers WHERE user_id IN (SELECT id FROM users WHERE email = '[EMAIL_REDACTED]')`);
    await client.query(`DELETE FROM parents WHERE user_id IN (SELECT id FROM users WHERE email = '[EMAIL_REDACTED]')`);
    await client.query(`DELETE FROM class_subjects WHERE slug = 'pl-perf-subject'`);
    await client.query(`DELETE FROM class_categories WHERE slug = 'pl-perf-category'`);
    await client.query(`DELETE FROM users WHERE email = '[EMAIL_REDACTED]'`);
    await client.query("COMMIT");
  } catch (cleanupError) {
    await client.query("ROLLBACK");
    throw cleanupError;
  } finally {
    client.release();
  }
}

/** One measured pass over all six queries, timed sequentially inside the pass. */
async function measureOnePass(): Promise<void> {
  await timeQuery("payments page", () =>
    pool.query(
      `SELECT ci.id, ci.scheduled_start_at FROM class_instances ci
       WHERE ci.execution_state = 'COMPLETED' AND to_char(ci.scheduled_start_at, 'YYYY-MM') = $1
       ORDER BY ci.scheduled_start_at DESC
       LIMIT 25 OFFSET 0`,
      [MONTH]
    )
  );
  await timeQuery("payments count", () =>
    pool.query(
      `SELECT count(*) FROM class_instances
       WHERE execution_state = 'COMPLETED' AND to_char(scheduled_start_at, 'YYYY-MM') = $1`,
      [MONTH]
    )
  );
  await timeQuery("expenses page", () =>
    pool.query(`SELECT id, title FROM expenses WHERE expense_date = $1 AND deleted_at IS NULL LIMIT 25 OFFSET 0`, [
      MONTH,
    ])
  );
  await timeQuery("expenses count", () =>
    pool.query(`SELECT count(*) FROM expenses WHERE expense_date = $1 AND deleted_at IS NULL`, [MONTH])
  );
  await timeQuery("income page", () =>
    pool.query(
      `SELECT p.id FROM payments p LEFT JOIN invoices inv ON inv.id = p.invoice_id
       WHERE to_char(p.created_at, 'YYYY-MM') = $1 AND inv.deleted_at IS NULL
       LIMIT 25 OFFSET 0`,
      [MONTH]
    )
  );
  await timeQuery("income count", () =>
    pool.query(
      `SELECT count(*) FROM payments p LEFT JOIN invoices inv ON inv.id = p.invoice_id
       WHERE to_char(p.created_at, 'YYYY-MM') = $1 AND inv.deleted_at IS NULL`,
      [MONTH]
    )
  );
}

/**
 * Chains the measured passes sequentially (reduce, not a loop await): latency
 * samples must not overlap, so parallel execution would distort the p95.
 */
async function measurePasses(runs: number): Promise<void> {
  await Array.from({ length: runs }, () => measureOnePass).reduce(
    (chain, pass) => chain.then(() => pass()),
    Promise.resolve()
  );
}

async function measure(): Promise<void> {
  // Warmup: first touches pay planning cost, so they are excluded from p95.
  await measurePasses(WARMUP_RUNS);
  await measurePasses(MEASURED_RUNS);
}

try {
  console.log(
    `Seeding large-month fixture (${SESSION_COUNT} sessions, ${EXPENSE_COUNT} expenses, ${INCOME_COUNT} income payments)...`
  );
  await seed();
  console.log("Measuring query latency...");
  await measure();

  const byLabel = new Map<string, number[]>();
  for (const sample of samples) {
    const list = byLabel.get(sample.label) ?? [];
    list.push(sample.durationMs);
    byLabel.set(sample.label, list);
  }

  console.log("\n=== p95 latency per query (target < 800 ms) ===");
  let worst = 0;
  for (const [label, values] of byLabel) {
    const p95 = percentile(values, 95);
    worst = Math.max(worst, p95);
    console.log(
      `${label.padEnd(16)} p95: ${p95.toFixed(1)} ms  (min ${Math.min(...values).toFixed(1)} / max ${Math.max(...values).toFixed(1)})`
    );
  }
  console.log(`\nWorst p95: ${worst.toFixed(1)} ms — ${worst < 800 ? "PASS (< 800 ms)" : "FAIL (>= 800 ms)"}`);
  if (worst >= 800) process.exitCode = 1;
} finally {
  console.log("\nCleaning up seeded rows...");
  await cleanup();
  await pool.end();
}
