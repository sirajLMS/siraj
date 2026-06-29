import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function test() {
  const c = await pool.connect();
  try {
    // Check RLS status on tables
    const rlsRes = await c.query("SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname IN ('users', 'class_instances', 'user_notification_preferences', 'student_progress', 'user_device_tokens', 'notification_deliveries')");
    console.log("RLS status:");
    for (const row of rlsRes.rows) {
      console.log("  ", row.relname, "rls:", row.relrowsecurity, "force:", row.relforcerowsecurity);
    }

    // Check policies on these tables
    const polRes = await c.query("SELECT c.relname, p.polname, p.polcmd, p.polpermissive FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid WHERE c.relname IN ('users', 'class_instances', 'user_notification_preferences', 'student_progress', 'user_device_tokens', 'notification_deliveries') ORDER BY c.relname, p.polname");
    console.log("Policies:");
    for (const row of polRes.rows) {
      console.log("  ", row.relname, row.polname, "cmd:", row.polcmd, "permissive:", row.polpermissive);
    }
  } finally {
    c.release();
    await pool.end();
  }
}

test().catch(console.error);
