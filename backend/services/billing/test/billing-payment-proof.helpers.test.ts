import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { getPaymentProofUrl } from "../billing-payment-proof.helpers";

describe("billing-payment-proof.helpers", () => {
  const originalBucket = process.env.STORAGE_BUCKET_NAME;

  beforeEach(() => {
    process.env.STORAGE_BUCKET_NAME = "test-bucket";
  });

  afterEach(() => {
    if (originalBucket === undefined) {
      delete process.env.STORAGE_BUCKET_NAME;
    } else {
      process.env.STORAGE_BUCKET_NAME = originalBucket;
    }
  });

  describe("getPaymentProofUrl", () => {
    test("returns null when fileName is null", () => {
      expect(getPaymentProofUrl(null)).toBeNull();
    });

    test("returns null when fileName is empty string", () => {
      expect(getPaymentProofUrl("")).toBeNull();
    });

    test("returns formatted S3 URL when valid fileName is provided", () => {
      process.env.STORAGE_BUCKET_NAME = "my-test-bucket";
      const result = getPaymentProofUrl("proofs/invoice-123.png");
      expect(result).toBe("https://my-test-bucket.s3.amazonaws.com/proofs/invoice-123.png");
    });
  });
});
