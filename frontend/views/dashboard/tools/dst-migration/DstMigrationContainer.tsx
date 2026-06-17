"use client";

import { useEffect, useState } from "react";
import { useDstMigrationStore } from "@/frontend/stores/mockDstMigrationStore";
import { DstMigrationView } from "./DstMigrationView";

export function DstMigrationContainer() {
  const metrics = useDstMigrationStore(state => state.metrics);
  const updatedSessions = useDstMigrationStore(state => state.updatedSessions);
  const conflictGroups = useDstMigrationStore(state => state.conflictGroups);
  const checkedEmptyItems = useDstMigrationStore(state => state.checkedEmptyItems);
  const migrationStatus = useDstMigrationStore(state => state.migrationStatus);
  const runMigration = useDstMigrationStore(state => state.runMigration);
  const resetMigrationStatus = useDstMigrationStore(state => state.resetMigrationStatus);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (migrationStatus !== "complete") return undefined;
    setShowSuccess(true);
    const timer = setTimeout(() => {
      resetMigrationStatus();
    }, 3000);
    return () => {
      clearTimeout(timer);
    };
  }, [migrationStatus, resetMigrationStatus]);

  const handleUpdate = () => {
    void runMigration();
  };

  return (
    <DstMigrationView
      metrics={metrics}
      updatedSessions={updatedSessions}
      conflictGroups={conflictGroups}
      checkedEmptyItems={checkedEmptyItems}
      migrationStatus={migrationStatus}
      showSuccess={showSuccess}
      onUpdate={handleUpdate}
      onDismissSuccess={() => {
        setShowSuccess(false);
        resetMigrationStatus();
      }}
    />
  );
}
