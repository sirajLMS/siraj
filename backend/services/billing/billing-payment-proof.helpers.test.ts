import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import {
  buildProofSnapshot,
  buildProofTransactionSnapshot,
  getPaymentProofUrl,
} from "@/backend/services/billing/billing-payment-proof.helpers";
import { env } from "@/backend/services/system/environment-config.service";

describe("billing-payment-proof.helpers", () => {
  describe("getPaymentProofUrl", () => {
    let originalBucket: string;

    beforeEach(() => {
      originalBucket = env.STORAGE_BUCKET_NAME;
      env.STORAGE_BUCKET_NAME = "test-bucket";
    });

    afterEach(() => {
      env.STORAGE_BUCKET_NAME = originalBucket;
    });

    test("returns null when fileName is null", () => {
      const url = getPaymentProofUrl(null);
      expect(url).toBeNull();
    });

    test("returns null when fileName is empty string", () => {
      const url = getPaymentProofUrl("");
      expect(url).toBeNull();
    });

    test("returns valid S3 URL when fileName is provided", () => {
      const url = getPaymentProofUrl("receipt-12345.png");
      expect(url).toBe("https://test-bucket.s3.amazonaws.com/receipt-12345.png");
    });

    test("dynamically uses updated STORAGE_BUCKET_NAME from env", () => {
      env.STORAGE_BUCKET_NAME = "custom-my-bucket";
      const url = getPaymentProofUrl("proof.pdf");
      expect(url).toBe("https://custom-my-bucket.s3.amazonaws.com/proof.pdf");
    });
  });

  describe("buildProofSnapshot", () => {
    test("constructs valid PaymentProofSnapshot", () => {
      const submittedAt = new Date("2026-03-31T12:00:00.000Z");
      const snapshot = buildProofSnapshot(
        "file-100",
        "uploads/receipt.pdf",
        "application/pdf",
        "user-200",
        submittedAt
      );

      expect(snapshot).toEqual({
        fileId: "file-100",
        filePath: "uploads/receipt.pdf",
        mimeType: "application/pdf",
        submittedByUserId: "user-200",
        submittedAt: "2026-03-31T12:00:00.000Z",
      });
    });
  });

  describe("buildProofTransactionSnapshot", () => {
    test("constructs valid PaymentProofTransactionSnapshot", () => {
      const proof = {
        fileId: "file-100",
        filePath: "uploads/receipt.pdf",
        mimeType: "application/pdf",
        submittedByUserId: "user-200",
        submittedAt: "2026-03-31T12:00:00.000Z",
      };

      const txSnapshot = buildProofTransactionSnapshot(proof);

      expect(txSnapshot).toEqual({
        type: PaymentMethodType.PROOF_UPLOAD,
        proof,
        snapshottedAt: "2026-03-31T12:00:00.000Z",
      });
    });
  });
});
