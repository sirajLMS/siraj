-- Fix: Change CHECK constraint from `reserved_classes <= remaining` to
-- `reserved_classes + remaining <= total_classes`. The original constraint
-- made it impossible to reserve more than 50% of the pool: after
-- `remaining -= count` and `reservedClasses += count` happen atomically,
-- `reservedClasses <= remaining` fails when count > totalClasses / 2.
-- The new constraint correctly models the invariant that the sum of
-- reserved and available remaining must not exceed the total pool.
ALTER TABLE "quotas" DROP CONSTRAINT IF EXISTS "quotas_reserved_not_exceed_remaining_chk";
ALTER TABLE "quotas" ADD CONSTRAINT "quotas_reserved_plus_remaining_chk"
  CHECK ("reserved_classes" + "remaining" <= "total_classes");
