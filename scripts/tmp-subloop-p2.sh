#!/usr/bin/env bash
# Sequential per-file quality verification for Phase 2 files.
cd /home/ahmed/Projects/siraj || exit 1
FILES=(
  "backend/db/schema/billing/package-plans.ts"
  "backend/enum/billing/package-plan.enum.ts"
  "backend/types/billing/package-plan.types.ts"
  "backend/types/billing/accounting-payment.types.ts"
  "backend/types/billing/credit.types.ts"
  "backend/db/repo/billing/package-plan.repository.ts"
  "backend/db/repo/billing/accounting-payment.repository.ts"
  "backend/db/repo/billing/credit.repository.ts"
  "backend/db/repo/students/student.repository.ts"
)
for f in "${FILES[@]}"; do
  echo "===== $f ====="
  timeout 560 ~/.bun/bin/bun run scripts/health/sub-loop.ts "$f" --lifecycle codescene > "/tmp/subloop-$(echo "$f" | tr '/' '_').log" 2>&1
  code=$?
  echo "exit=$code"
  if [ $code -ne 0 ]; then
    echo "--- last lines ---"
    tail -25 "/tmp/subloop-$(echo "$f" | tr '/' '_').log"
  fi
done
echo SUBLOOP-P2-DONE
