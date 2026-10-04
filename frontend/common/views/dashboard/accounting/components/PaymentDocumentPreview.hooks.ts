"use client";

import { useEffect, useState } from "react";
import {
  type DocumentAvailability,
  resolveDocumentAvailability,
} from "@/frontend/common/views/dashboard/accounting/components/PaymentDocumentPreview.helpers";

/** Probes the receipt URL once per src change and reports whether it renders. */
export function useDocumentAvailability(src: string | null): {
  readonly documentAvailability: DocumentAvailability;
  readonly hasDocument: boolean;
} {
  const [checkedSrc, setCheckedSrc] = useState<string | null>(null);
  const [documentStatus, setDocumentStatus] = useState<DocumentAvailability>("checking");
  const documentAvailability = resolveDocumentAvailability(src, checkedSrc, documentStatus);
  // Toolbar actions stay disabled until the document probe confirms a renderable
  // receipt, so the empty placeholder never shows active zoom/rotate/expand controls.
  const hasDocument = documentAvailability === "available";

  useEffect(() => {
    if (!src) return undefined;
    let isCurrent = true;
    const probeDocument = async () => {
      try {
        const response = await fetch(src, { credentials: "include" });
        if (isCurrent) {
          setCheckedSrc(src);
          setDocumentStatus(response.ok ? "available" : "unavailable");
        }
      } catch {
        if (isCurrent) {
          setCheckedSrc(src);
          setDocumentStatus("unavailable");
        }
      }
    };
    void probeDocument();
    return () => {
      isCurrent = false;
    };
  }, [src]);

  return { documentAvailability, hasDocument };
}
