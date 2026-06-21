"use client";

import { useMutation } from "@apollo/client/react";
import { useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { executeDstBulkUpdateMutationDocument } from "@/frontend/graphql/sharedDocuments/dst-migration.documents";
import { logger } from "@/frontend/utils/logger";
import { DstMigrationView } from "./DstMigrationView";

export function DstMigrationContainer() {
  const [executeDstUpdate, { loading, data }] = useMutation(executeDstBulkUpdateMutationDocument);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleUpdate = async () => {
    try {
      await executeDstUpdate({
        variables: {
          offsetMinutes: 60,
          description: "DST adjustment executed by admin",
        },
      });
      setShowSuccess(true);
    } catch (error) {
      logger.error("DST bulk update failed", { error });
    }
  };

  const report = data?.executeDstBulkUpdate;

  const metrics = {
    totalAudited: report?.total ?? 0,
    successful: report?.updated ?? 0,
    conflicts: report?.conflicts ?? 0,
    unchanged: report?.unchanged ?? 0,
  };

  const migrationStatus = loading ? "running" : report ? "complete" : "idle";

  return (
    <RequirePermission permissions={[AppPermission.SystemBulkUpdateDst]}>
      <DstMigrationView
        metrics={metrics}
        updatedSessions={[]}
        conflictGroups={[]}
        checkedEmptyItems={[]}
        migrationStatus={migrationStatus}
        showSuccess={showSuccess}
        onUpdate={handleUpdate}
        onDismissSuccess={() => {
          setShowSuccess(false);
        }}
      />
    </RequirePermission>
  );
}
