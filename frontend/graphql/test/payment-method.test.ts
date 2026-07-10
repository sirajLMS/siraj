import { describe, expect, test } from "bun:test";
import { PaymentDirection, PaymentMethodType } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  createUserPaymentMethodMutationDocument,
  deleteUserPaymentMethodMutationDocument,
  userPaymentMethodQueryDocument,
  userPaymentMethodsQueryDocument,
} from "@/frontend/graphql/sharedDocuments/billing/payment-method.documents";
import { authenticatedRequest, cleanupTestEntities, loginAndProvision } from "@/frontend/graphql/test/helpers";
import { setupTestServerLifecycle } from "@/frontend/graphql/test/lifecycle";

describe("GraphQL Payment Method Integration Tests", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";
  let parentUserId = "";
  let paymentMethodId = "";

  const entityIds = {
    studentId: "",
    teacherId: "",
    studentUserId: "",
    teacherUserId: "",
    parentUserId: "",
    parentId: "",
  };

  test("provision test entities and login", async () => {
    const result = await loginAndProvision("PaymentMethodTest");
    superAdminToken = result.superAdminToken;
    parentUserId = result.parentUserId;

    entityIds.studentId = result.studentId;
    entityIds.teacherId = result.teacherId;
    entityIds.studentUserId = result.studentUserId;
    entityIds.teacherUserId = result.teacherUserId;
    entityIds.parentUserId = result.parentUserId;
    entityIds.parentId = result.parentId;

    expect(superAdminToken).not.toBe("");
    expect(parentUserId).not.toBe("");
  });

  test("super admin can create a cash pay-in method for parent", async () => {
    const data = await authenticatedRequest(superAdminToken, "mutate", createUserPaymentMethodMutationDocument, {
      input: {
        userId: parentUserId,
        type: PaymentMethodType.Cash,
        direction: PaymentDirection.Payin,
        isDefault: true,
        label: "Desk cash",
        details: {
          note: "Front desk collection",
          walletId: null,
          phone: null,
          paymentLinkId: null,
          url: null,
          onlineAccountId: null,
          identifier: null,
          iban: null,
          bankName: null,
          beneficiaryName: null,
          swiftBic: null,
          accountNumber: null,
          routingNumber: null,
        },
      },
    });

    const method = data.createUserPaymentMethod;
    expect(method).toBeDefined();
    expect(method?.id).toBeDefined();
    expect(method?.userId).toBe(parentUserId);
    expect(method?.type).toBe(PaymentMethodType.Cash);
    expect(method?.direction).toBe(PaymentDirection.Payin);
    expect(method?.isDefault).toBe(true);

    paymentMethodId = method?.id ?? "";
    expect(paymentMethodId).not.toBe("");
  });

  test("super admin can list parent payment methods", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", userPaymentMethodsQueryDocument, {
      userId: parentUserId,
      direction: null,
    });

    const methods = data.userPaymentMethods ?? [];
    expect(Array.isArray(methods)).toBeTrue();
    expect(methods.some(method => method?.id === paymentMethodId)).toBeTrue();
  });

  test("super admin can fetch a single payment method by id", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", userPaymentMethodQueryDocument, {
      id: paymentMethodId,
    });

    const method = data.userPaymentMethod;
    expect(method?.id).toBe(paymentMethodId);
    expect(method?.label).toBe("Desk cash");
  });

  test("super admin can delete the payment method", async () => {
    const data = await authenticatedRequest(superAdminToken, "mutate", deleteUserPaymentMethodMutationDocument, {
      id: paymentMethodId,
    });

    expect(data.deleteUserPaymentMethod).toBe(true);

    const listData = await authenticatedRequest(superAdminToken, "query", userPaymentMethodsQueryDocument, {
      userId: parentUserId,
      direction: null,
    });
    const methods = listData.userPaymentMethods ?? [];
    expect(methods.some(method => method?.id === paymentMethodId)).toBeFalse();
  });

  test("cleanup test entities", async () => {
    await cleanupTestEntities(superAdminToken, entityIds);
  });
});
