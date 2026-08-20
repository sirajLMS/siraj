---
name: idor-testing
description: >
  Comprehensive IDOR (Insecure Direct Object Reference) and BOLA (Broken Object Level Authorization)
  testing & defense engineering master guide. Use when tasked to:
  (1) audit, test, or harden GraphQL queries, mutations, and DataLoaders for object-level authorization leaks,
  (2) probe horizontal privilege escalation across tenant partitions (User-to-User, Tenant-to-Tenant),
  (3) probe vertical privilege escalation (low-privilege actors executing elevated or administrative functions),
  (4) audit and defend against Broken Object Property-Level Authorization (BOPLA / Mass Assignment),
  (5) detect composite parent-child tenancy disconnects and second-order / asynchronous IDOR flaws,
  (6) author automated IDOR/BOLA regression test suites in bun:test.
---

# Master IDOR & Broken Object Level Authorization (BOLA) Guide

This guide is an exhaustive reference for assessing, testing, exploiting, and defending against Insecure Direct Object References (IDOR), Broken Object Level Authorization (BOLA), Broken Object Property-Level Authorization (BOPLA / Mass Assignment), and Broken Function-Level Authorization (BFLA) in modern full-stack web applications and APIs.

---

## Table of Contents
1. [Core Vulnerability Taxonomy & Threat Classes](#1-core-vulnerability-taxonomy--threat-classes)
2. [Multi-Tenant Relationship & Boundary Model](#2-multi-tenant-relationship--boundary-model)
3. [Object Identifier Types & Exposure Analysis](#3-object-identifier-types--exposure-analysis)
4. [Complete Attack Surface & Parameter Discovery](#4-complete-attack-surface--parameter-discovery)
5. [Multi-Account Differential (A-B) Testing Methodology](#5-multi-account-differential-a-b-testing-methodology)
6. [In-Depth Penetration Testing Playbooks](#6-in-depth-penetration-testing-playbooks)
   - [6.1 GraphQL Resolver & Root Query BOLA](#61-graphql-resolver--root-query-bola)
   - [6.2 Nested Resolver Traversal & DataLoader Leakage](#62-nested-resolver-traversal--dataloader-leakage)
   - [6.3 Mutation IDOR & State Transition Tampering](#63-mutation-idor--state-transition-tampering)
   - [6.4 Broken Object Property-Level Authorization (BOPLA / Mass Assignment)](#64-broken-object-property-level-authorization-bopla--mass-assignment)
   - [6.5 Composite & Parent-Child Relational Tenancy Disconnects](#65-composite--parent-child-relational-tenancy-disconnects)
   - [6.6 Broken Function-Level Authorization (BFLA / Vertical Escalation)](#66-broken-function-level-authorization-bfla--vertical-escalation)
   - [6.7 Second-Order & Asynchronous Worker IDOR](#67-second-order--asynchronous-worker-idor)
   - [6.8 Blind, Export & Out-of-Band IDOR](#68-blind-export--out-of-band-idor)
   - [6.9 File Storage & Document Access IDOR](#69-file-storage--document-access-idor)
   - [6.10 REST Route Handler & HTTP Verb Tampering](#610-rest-route-handler--http-verb-tampering)
7. [Automated Security Test Harness Patterns (`bun:test`)](#7-automated-security-test-harness-patterns-buntest)
8. [Defensive Architecture & Systematic Remediation](#8-defensive-architecture--systematic-remediation)
9. [Pre-Commit & Security Review Checklist](#9-pre-commit--security-review-checklist)

---

## 1. Core Vulnerability Taxonomy & Threat Classes

Authorization flaws represent the single most prevalent vulnerability class in distributed APIs and multi-tenant systems. They occur whenever an application accepts a client-provided object identifier to perform an operation without independently verifying that the authenticated caller holds legitimate access rights to that specific entity.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           AUTHORIZATION THREAT TAXONOMY                         │
├────────────────────────────────┬────────────────────────────────────────────────┤
│ Threat Class                   │ Operational Definition                         │
├────────────────────────────────┼────────────────────────────────────────────────┤
│ BOLA (IDOR)                    │ Horizontal access control failure where an     │
│ (Broken Object Level Auth)     │ actor accesses/mutates data of a sibling actor.│
├────────────────────────────────┼────────────────────────────────────────────────┤
│ BOPLA (Mass Assignment)        │ Object property authorization failure where an │
│ (Property-Level Auth)          │ actor modifies sensitive/elevated properties.  │
├────────────────────────────────┼────────────────────────────────────────────────┤
│ BFLA                           │ Vertical access control failure where an actor │
│ (Function-Level Auth)          │ invokes higher-privilege methods/mutations.    │
├────────────────────────────────┼────────────────────────────────────────────────┤
│ Composite Tenancy Disconnect   │ Relational validation failure between linked   │
│                                │ parent and child resources across tenants.     │
├────────────────────────────────┼────────────────────────────────────────────────┤
│ Second-Order IDOR              │ Storing an unauthorized reference in a draft/  │
│ (Deferred Execution)           │ queue that triggers later with worker rights.  │
└────────────────────────────────┴────────────────────────────────────────────────┘
```

### Detailed Breakdown of Categories:

1. **BOLA (Broken Object Level Authorization / IDOR)**:
   - *Mechanism*: An endpoint exposes an object reference (e.g. `userId`, `invoiceId`, `documentId`, `accountId`). An authenticated user replaces their own identifier with that of another user, and the server fulfills the request without verifying ownership.
   - *Impact*: Unauthorized reading, modification, or deletion of sensitive private records across tenants.

2. **BOPLA (Broken Object Property-Level Authorization / Mass Assignment)**:
   - *Mechanism*: An endpoint allows updating an entity but fails to restrict which specific object properties the client can modify. The application takes the input object and blindly writes it or spreads it into the database entity.
   - *Impact*: Privilege escalation (modifying `role`, `isAdmin`, `permissions`), financial fraud (modifying `balance`, `credits`, `discountRate`), account hijacking (modifying `emailVerified`, `twoFactorEnabled`).

3. **BFLA (Broken Function-Level Authorization / Vertical Privilege Escalation)**:
   - *Mechanism*: Administrative, analytical, or supervisor functions rely on security through obscurity, client-side UI hiding, or missing server-side permission checks.
   - *Impact*: Base-level users triggering administrative actions (system triggers, user deletion, configuration overrides, impersonation).

4. **Composite Relational IDOR (Parent-Child Disconnect)**:
   - *Mechanism*: An operation involves multiple related resources (e.g., updating a student belonging to a parent, or an invoice line item belonging to a billing account). The server validates that the caller owns the primary entity, but fails to check whether the referenced child sub-resource actually belongs to that primary entity.
   - *Impact*: Splicing and modifying sub-resources across tenant boundaries.

5. **Second-Order / Asynchronous IDOR**:
   - *Mechanism*: An attacker cannot directly read or mutate a victim's resource synchronously, but can inject the victim's resource identifier into an asynchronous pipeline, draft record, shopping cart, or background job. When the background job executes under system-level credentials, the unauthorized action succeeds.
   - *Impact*: Delayed or background data tampering and billing corruption.

---

## 2. Multi-Tenant Relationship & Boundary Model

To perform rigorous authorization auditing, you must map the target codebase's relationship hierarchy into explicit trust boundaries:

```
                  ┌─────────────────────────────────┐
                  │    Elevated Administrative      │  (Global/Super Admin)
                  │    - Full multi-tenant access   │
                  └────────────────┬────────────────┘
                                   │
                  ┌────────────────▼────────────────┐
                  │    Partition / Org Admin        │  (Scoped to single org/branch)
                  │    - Manages assigned partition │
                  └────────────────┬────────────────┘
                                   │
                  ┌────────────────▼────────────────┐
                  │    Authorized Delegate / Parent │  (Supervisor / Manager / Parent)
                  │    - Scoped to linked entities  │
                  └────────────────┬────────────────┘
                                   │
                  ┌────────────────▼────────────────┐
                  │    Primary Resource Owner       │  (End User / Student / Teacher)
                  │    - Direct ownership only      │
                  └─────────────────────────────────┘
                                   ▲
                                   │ (BLOCKED)
                  ┌────────────────┴────────────────┐
                  │    Unrelated Sibling Tenant     │  (Same role, different tenant)
                  │    - Complete isolation required│
                  └─────────────────────────────────┘
```

### Trust Boundary Rules:
- **Rule 1 (Strict Isolation)**: An actor in Tenant A MUST NEVER be permitted to read, list, mutate, or delete resources belonging to Tenant B unless an explicit multi-tenant permission grant exists in the database.
- **Rule 2 (Context Authority)**: The authenticated caller's identity MUST ALWAYS be established from server-validated session tokens or context (`ctx.user.id`, `ctx.tenantId`), never from client-supplied URL parameters, request bodies, or custom headers.
- **Rule 3 (Relational Integrity)**: When an operation accepts multiple identifiers representing a hierarchy (e.g., `orgId`, `teamId`, `memberId`), the system MUST verify that all entities belong to the same organizational graph and that the caller owns that specific root.

---

## 3. Object Identifier Types & Exposure Analysis

Attackers exploit different types of object identifiers depending on their structure and predictability:

| Identifier Type | Structure Example | Predictability | Exposure & Harvesting Vectors | Testing Methodology |
| :--- | :--- | :--- | :--- | :--- |
| **Sequential Integer** | `1001`, `1002`, `1003` | **Critical** (100% predictable) | Path params, query strings, database serial IDs. | Increment/decrement sequentially (`id+1`, `id-1`). |
| **UUID v4 (Random)** | `550e8400-e29b-41d4-a716-446655440000` | **Low** (Cryptographically random) | Leaked in public listings, search responses, export files, shared links, or GraphQL queries. | Harvest victim UUIDs from related public endpoints, then replay in private endpoints. |
| **UUID v1 (Time-based)** | `6fa459ea-ee8a-11d4-9d8f-0090279e899e` | **High** (Timestamp + MAC address) | Older databases or distributed timestamp ID generators. | Extract timestamp component, generate adjacent UUIDs within the target creation window. |
| **Encoded / Obfuscated** | `eyJpZCI6IDEwMDF9` (Base64) | **High** (Deterministic decoding) | Query strings, cookies, state parameters. | Base64-decode, XOR-decode, or URL-decode; modify inner value; re-encode and resubmit. |
| **Hashed Identifier** | `356a192b7913b04c54574d18c28d46e6395428ab` | **Medium** (MD5/SHA1 of sequential IDs) | Obfuscation layers hiding sequential numbers. | Test if hash matches `md5(id)` or `sha1(id)` of small integers or emails. |
| **Composite Key** | `org_99/user_42/file_88` | **High** (Component swapping) | Nested REST endpoints and hierarchical database keys. | Swap each sub-component independently to find which layer lacks authorization checks. |
| **Slug / Vanity URL** | `/profile/johndoe` | **Critical** (Dictionary / OSINT guessable) | Usernames, domain names, public handle fields. | Dictionary wordlists, user enumeration endpoints, autocomplete queries. |

---

## 4. Complete Attack Surface & Parameter Discovery

Object identifiers appear across multiple layers of modern web architectures. Systematic testing requires auditing all of the following surfaces:

```
                                  API ATTACK SURFACES
                                          │
       ┌──────────────────┬───────────────┴───────────────┬──────────────────┐
       ▼                  ▼                               ▼                  ▼
┌──────────────┐   ┌──────────────┐                ┌──────────────┐   ┌──────────────┐
│ GraphQL Args │   │ HTTP Headers │                │ Request Body │   │ URL Paths &  │
│ & Variables  │   │ & Cookies    │                │ & JSON DTOs  │   │ Query Params │
└──────────────┘   └──────────────┘                └──────────────┘   └──────────────┘
```

### Comprehensive Location Checklist:

1. **GraphQL Query Arguments**:
   - Direct entity lookups: `query { getInvoice(id: "<id>") { ... } }`
   - Filter/Search criteria: `query { listTransactions(filter: { accountId: "<id>", userId: "<id>" }) { ... } }`
   - Pagination cursors: Base64-encoded cursors containing underlying record IDs.

2. **GraphQL Mutation Arguments & Input Payloads**:
   - Entity mutation targets: `mutation { updateProfile(id: "<id>", input: { ... }) }`
   - Nested relationship inputs: `mutation { assignTeacher(classId: "<id>", teacherId: "<id>") }`
   - State transition commands: `mutation { cancelOrder(orderId: "<id>") }`

3. **GraphQL Nested Resolver Traversal**:
   - Multi-hop relationship querying: `query { me { organization { members { privateFinancialDetails { ... } } } } }`
   - DataLoader batch loading across tenants without post-filtering.

4. **REST URL Paths & Query Parameters**:
   - Path variables: `GET /api/v1/accounts/:accountId/statements/:statementId`
   - Query filters: `GET /api/v1/reports?orgId=123&authorId=456`
   - Wildcards / Exports: `GET /api/v1/export.csv?tenant=target`

5. **JSON Request Payloads & DTO Properties**:
   - Top-level entity identifiers: `{"targetUserId": "...", "action": "update"}`
   - Mass assignment injection fields: `{"name": "test", "role": "admin", "credits": 1000}`

6. **HTTP Headers & Session Cookies**:
   - Custom tenant headers: `X-Tenant-ID: ...`, `X-Organization-ID: ...`, `X-User-ID: ...`
   - Cookie parameters: `organization_id=...`, `active_account=...`

7. **Storage, Media & File Endpoints**:
   - Direct download links: `GET /api/storage/files/:fileId`
   - Media streaming endpoints: `GET /api/media/recordings?sessionId=...`

---

## 5. Multi-Account Differential (A-B) Testing Methodology

The most definitive and reliable technique for proving or disproving BOLA/IDOR vulnerabilities is **Multi-Account Differential Matrix Testing**.

```
Differential Testing Architecture:
 ┌───────────────────────────────┐               ┌───────────────────────────────┐
 │   Account A (Attacker Role)   │               │    Account B (Victim Role)    │
 │   • User ID: user_A           │               │    • User ID: user_B          │
 │   • Tenant: Tenant_A          │               │    • Tenant: Tenant_B         │
 │   • Session: Token_A          │               │    • Session: Token_B         │
 └───────────────┬───────────────┘               └───────────────┬───────────────┘
                 │                                               │
                 │                                               ▼
                 │                                   Create Target Entity under B:
                 │                                   Resource_B = { id: "res_B_999" }
                 │                                               │
                 ▼                                               │
  1. Replay Request as Account A ◄───────────────────────────────┘
     Targeting Resource_B ("res_B_999")
     Using Token_A Auth Headers
                 │
                 ├──► [Case 1: HTTP 200 / Data Payload Returned] ──► 🚨 CRITICAL BOLA / IDOR
                 ├──► [Case 2: HTTP 200 / State Modified in DB]  ──► 🚨 CRITICAL MUTATION IDOR
                 ├──► [Case 3: 403 Forbidden / 404 Not Found]    ──► ✅ SECURE
                 └──► [Case 4: HTTP 200 / Empty Data / null]     ──► ✅ SECURE (Filtered)
```

### The Differential Matrix Protocol:

1. **Step 1 (Provisioning)**: Provision two completely distinct user accounts belonging to separate tenant partitions: `User_A` (Attacker) and `User_B` (Victim).
2. **Step 2 (Baseline Execution)**: Perform legitimate operations using `User_B`'s session (`Token_B`) to create and retrieve resources. Record all generated object identifiers (`Resource_B_IDs`).
3. **Step 3 (Replay Probe)**: Re-execute the exact same request using `User_A`'s session (`Token_A`), but substitute `User_B`'s resource identifiers into the arguments/payload.
4. **Step 4 (Validation & Side-Effect Verification)**:
   - For **Read operations**: Inspect whether `User_A` receives `User_B`'s private data in the response body.
   - For **Write/Mutation operations**: Query the database or re-fetch as `User_B` to verify whether `User_B`'s entity was mutated by `User_A`'s request.
5. **Step 5 (Cross-Role Testing)**: Repeat the process across role boundaries (e.g., Guest attempting to access End-User records; End-User attempting to access Supervisor records).

---

## 6. In-Depth Penetration Testing Playbooks

---

### 6.1 GraphQL Resolver & Root Query BOLA

- **Vulnerability Mechanism**: A GraphQL root query accepts an `id` argument and resolves the record directly from the database without verifying that `record.tenantId === ctx.user.tenantId` or `record.userId === ctx.user.id`.
- **Target Pattern**:
  ```graphql
  query ProbeEntityBOLA($id: String!) {
    getEntityById(id: $id) {
      id
      privateSensitiveField
      billingDetails
      ownerId
    }
  }
  ```
- **Testing Procedure**:
  1. Log in as Account B, create an entity, note its `id`.
  2. Log in as Account A, query `getEntityById(id: "<victimId>")`.
  3. If data is returned instead of an authorization error or `null`, BOLA is confirmed.
- **Architectural Defense**:
  ```typescript
  // ❌ VULNERABLE: Direct lookup ignoring tenant context
  resolve: async (_, { id }, ctx) => {
    return db.query.entities.findFirst({ where: eq(entities.id, id) });
  }

  // ✅ SECURE: Tenancy enforced directly in query
  resolve: async (_, { id }, ctx) => {
    const result = await db.query.entities.findFirst({
      where: and(
        eq(entities.id, id),
        eq(entities.tenantId, ctx.user.tenantId)
      ),
    });
    if (!result) {
      throw new NotFoundError("Entity not found");
    }
    return result;
  }
  ```

---

### 6.2 Nested Resolver Traversal & DataLoader Leakage

- **Vulnerability Mechanism**: While root queries might enforce authorization, nested relationship resolvers or DataLoaders batch-load related entities purely by key without filtering against the active caller's tenancy.
- **Target Pattern (Relation Traversal)**:
  ```graphql
  query NestedRelationLeakage {
    me {
      organization {
        publicProjects {
          # Traversal hop into private user details of other members
          collaborators {
            userProfile {
              email
              phoneNumber
              internalSalaryNotes
            }
          }
        }
      }
    }
  }
  ```
- **Target Pattern (DataLoader Batching)**:
  When a GraphQL query requests multiple IDs, a DataLoader batches them into a single `SELECT * FROM items WHERE id IN (...)`. If the DataLoader returns all fetched records without asserting that each item belongs to the caller's tenant, authorization is bypassed.
- **Architectural Defense**:
  ```typescript
  // ✅ SECURE: Tenancy-scoped DataLoader batching
  export function createScopedDataLoader(ctx: RequestContext) {
    return new DataLoader<string, Entity>(async (ids) => {
      const items = await db.select().from(entities)
        .where(and(
          inArray(entities.id, ids),
          eq(entities.tenantId, ctx.user.tenantId)
        ));
      
      const itemMap = new Map(items.map(item => [item.id, item]));
      return ids.map(id => itemMap.get(id) ?? null);
    });
  }
  ```

---

### 6.3 Mutation IDOR & State Transition Tampering

- **Vulnerability Mechanism**: A mutation accepts an entity ID and updates its state (e.g., status, cancellation, deletion, reassignment) without verifying ownership.
- **Target Vectors**:
  - `updateEntity(id: "<victimId>", input: { ... })`
  - `deleteEntity(id: "<victimId>")`
  - `cancelSubscription(subscriptionId: "<victimId>")`
  - `reassignTask(taskId: "<victimId>", assigneeId: "<attackerId>")`
- **Testing Procedure**:
  1. Trigger the mutation as Account A using Account B's entity ID.
  2. Check response for success status.
  3. Inspect Account B's entity state to verify unauthorized alteration.
- **Architectural Defense**:
  ```typescript
  // ✅ SECURE: Update query with compound ownership predicate
  export async function updateEntitySafely(
    id: string,
    callerTenantId: string,
    input: UpdateInput,
    tx: DBTransaction
  ) {
    const [updated] = await tx.update(entities)
      .set({ ...input, updatedAt: new Date() })
      .where(and(
        eq(entities.id, id),
        eq(entities.tenantId, callerTenantId)
      ))
      .returning();

    if (!updated) {
      throw new ForbiddenError("Not authorized to modify this resource");
    }
    return updated;
  }
  ```

---

### 6.4 Broken Object Property-Level Authorization (BOPLA / Mass Assignment)

- **Vulnerability Mechanism**: A service accepts an input DTO and spreads it (`{ ...input }`) into the database update query. An attacker injects privileged, financial, or system properties into the payload.
- **Target Injections**:
  ```json
  {
    "name": "Legitimate Name Update",
    "role": "SUPER_ADMIN",
    "isAdmin": true,
    "isVerified": true,
    "balance": 999999,
    "creditsRemaining": 500,
    "organizationId": "victim_org_id",
    "tier": "enterprise_unlimited",
    "permissions": ["*"]
  }
  ```
- **Testing Procedure**:
  1. Identify standard profile, settings, or resource update endpoints.
  2. Craft request payloads containing injected administrative properties.
  3. Submit request and verify whether the elevated attributes were written to the database.
- **Architectural Defense**:
  ```typescript
  // ❌ VULNERABLE: Blind spread allows mass assignment
  await tx.update(users).set({ ...input }).where(eq(users.id, userId));

  // ✅ SECURE: Explicit DTO destructuring and whitelist mapping
  const { name, bio, avatarUrl } = input;
  await tx.update(users)
    .set({
      name,
      bio,
      avatarUrl,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
  ```

---

### 6.5 Composite & Parent-Child Relational Tenancy Disconnects

- **Vulnerability Mechanism**: The endpoint validates that the caller owns the primary (parent) entity, but accepts a separate child identifier without validating that the child entity actually belongs to that parent.
- **Scenario**:
  - Attacker owns `Parent_A` and `Child_A`.
  - Victim owns `Parent_B` and `Child_B`.
  - Attacker sends request: `updateChild(parentId: "Parent_A", childId: "Child_B", input: { ... })`.
  - The server verifies `caller.owns(Parent_A)` (passes!), but updates `Child_B` directly in the database without checking `Child_B.parentId === Parent_A`.
- **Architectural Defense**:
  ```typescript
  // ✅ SECURE: Verifying complete relational hierarchy in query
  await tx.update(childRecords)
    .set({ ...allowedFields })
    .where(and(
      eq(childRecords.id, inputChildId),
      eq(childRecords.parentId, verifiedCallerParentId)
    ));
  ```

---

### 6.6 Broken Function-Level Authorization (BFLA / Vertical Escalation)

- **Vulnerability Mechanism**: Administrative or sensitive functions fail to enforce server-side role/permission validation.
- **Target Vectors**:
  - Triggering cron jobs or batch workers manually: `mutation { cronRunTrigger(jobKind: "BILLING_SWEEP") }`
  - Modifying system configurations: `mutation { updateSystemSettings(key: "MAINTENANCE_MODE", value: "true") }`
  - Elevating user roles: `mutation { assignUserRole(userId: "<id>", role: "ADMIN") }`
  - Accessing internal audit logs: `query { getSystemAuditLogs { ... } }`
- **Testing Procedure**:
  1. Obtain session token for a standard end-user role.
  2. Send requests to administrative mutations/queries.
  3. Verify that the server returns `403 Forbidden` and executes zero database operations.
- **Architectural Defense**:
  ```typescript
  // ✅ SECURE: Pothos Resolver Authorization Scope
  t.field({
    type: SystemConfigType,
    authScopes: {
      admin: true, // Enforced before resolver execution
    },
    resolve: async (root, args, ctx) => {
      ctx.assertHasPermission("system:config:write");
      return ConfigService.update(args);
    },
  });
  ```

---

### 6.7 Second-Order & Asynchronous Worker IDOR

- **Vulnerability Mechanism**: An attacker saves an unauthorized object ID into a persistent draft, template, or queue item. When an asynchronous background worker processes the queue, it runs under elevated system privileges and completes the unauthorized action on behalf of the victim.
- **Example Flow**:
  1. Attacker creates a recurring payment schedule or draft schedule referencing `victimAccountId`.
  2. Synchronous creation endpoint only checks if `victimAccountId` is a valid UUID format (missing ownership check on draft save).
  3. Nightly cron worker wakes up, reads all schedules, and charges `victimAccountId` to credit Attacker's account.
- **Architectural Defense**:
  - Always validate tenant ownership at **both** ingestion time (draft creation) and execution time (worker processing).

---

### 6.8 Blind, Export & Out-of-Band IDOR

- **Vulnerability Mechanism**: An endpoint initiates an asynchronous export, email report, or PDF generation by accepting an object ID, and delivers the resulting payload out-of-band (e.g. to the caller's email or a webhook).
- **Target Vector**:
  ```http
  POST /api/reports/export-pdf
  Content-Type: application/json
  Authorization: Bearer <AttackerToken>

  {
    "invoiceId": "<VictimInvoiceId>",
    "deliveryEmail": "attacker@evil.com"
  }
  ```
- **Architectural Defense**:
  - Validate that the requested export resource belongs to the authenticated caller before enqueueing the background delivery job.

---

### 6.9 File Storage & Document Access IDOR

- **Vulnerability Mechanism**: Private documents (invoices, medical records, identification uploads, private contracts) are stored with predictable file keys or served through route handlers that accept a `fileId` without tenancy checks.
- **Target Vector**:
  - `GET /api/storage/download?fileId=1042`
  - Direct S3 bucket access without signed URLs: `https://bucket.s3.amazonaws.com/invoices/inv_1042.pdf`
- **Architectural Defense**:
  - Use cryptographically random UUID v4 keys for storage paths (`storage/tenants/<tenantId>/<uuid>.pdf`).
  - Serve files only via temporary signed URLs (TTL < 15 minutes) generated after verifying tenant ownership.

---

### 6.10 REST Route Handler & HTTP Verb Tampering

- **Vulnerability Mechanism**: A route handler enforces authentication and authorization on `GET` and `POST`, but developers omit authorization middleware on `PUT`, `PATCH`, `DELETE`, or `HEAD` methods.
- **Target Testing Matrix**:
  ```http
  GET    /api/v1/workspaces/123   --> 403 Forbidden
  PUT    /api/v1/workspaces/123   --> 200 OK (Vulnerable!)
  DELETE /api/v1/workspaces/123   --> 200 OK (Vulnerable!)
  PATCH  /api/v1/workspaces/123   --> 200 OK (Vulnerable!)
  ```
- **Architectural Defense**:
  - Apply authorization middleware at the router level across all HTTP verbs, or centralize data-access policies inside the repository layer.

---

## 7. Automated Security Test Harness Patterns (`bun:test`)

Author automated security tests to guarantee authorization barriers remain enforced across codebase modifications.

### 7.1 Generic Multi-Tenant Differential Query Test Harness
```typescript
import { describe, expect, test } from "bun:test";
import { setupTestServerLifecycle, testClient } from "@/test/helpers";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";

/**
 * Verifies horizontal tenant isolation for any GraphQL query.
 */
export function testBolaQueryIsolation<TData, TVars extends { id: string }>(config: {
  suiteName: string;
  document: TypedDocumentNode<TData, TVars>;
  createVictimEntity: () => Promise<{ id: string }>;
  getAttackerToken: () => Promise<string>;
  entityKey: keyof TData;
}) {
  describe(`BOLA Security Probe: ${config.suiteName}`, () => {
    setupTestServerLifecycle();

    test("blocks unauthorized tenant from reading target entity", async () => {
      const victim = await config.createVictimEntity();
      const attackerToken = await config.getAttackerToken();

      const response = await testClient.query({
        query: config.document,
        variables: { id: victim.id } as TVars,
        context: {
          headers: { Authorization: `Bearer ${attackerToken}` },
        },
      });

      // Assert access was denied or returned null
      const dataPayload = response.data?.[config.entityKey];
      const hasError = Boolean(response.error || response.errors?.length);
      expect(hasError || dataPayload === null).toBe(true);
    });
  });
}
```

---

### 7.2 Parent-Child Relational Tenancy Disconnect Test
```typescript
import { describe, expect, test } from "bun:test";
import { setupTestServerLifecycle, testClient } from "@/test/helpers";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";

export function testCompositeTenancyIntegrity<TData, TVars extends Record<string, unknown>>(config: {
  suiteName: string;
  mutation: TypedDocumentNode<TData, TVars>;
  setupMismatchScenario: () => Promise<{
    attackerParentId: string;
    victimChildId: string;
    attackerToken: string;
    payload: Record<string, unknown>;
  }>;
}) {
  describe(`Composite Tenancy Probe: ${config.suiteName}`, () => {
    setupTestServerLifecycle();

    test("rejects mutation when child resource belongs to another tenant", async () => {
      const { attackerParentId, victimChildId, attackerToken, payload } =
        await config.setupMismatchScenario();

      const response = await testClient.mutate({
        mutation: config.mutation,
        variables: {
          parentId: attackerParentId,
          childId: victimChildId,
          ...payload,
        } as unknown as TVars,
        context: {
          headers: { Authorization: `Bearer ${attackerToken}` },
        },
      });

      expect(response.error).toBeDefined();
    });
  });
}
```

---

### 7.3 Mass Assignment / BOPLA Rejection Test
```typescript
import { describe, expect, test } from "bun:test";
import { setupTestServerLifecycle, testClient } from "@/test/helpers";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";

export function testBoplaMassAssignmentDefense<TData, TVars extends Record<string, unknown>>(config: {
  suiteName: string;
  mutation: TypedDocumentNode<TData, TVars>;
  setupCaller: () => Promise<{ id: string; token: string }>;
  fetchCurrentEntityInDb: (id: string) => Promise<Record<string, unknown>>;
  maliciousPayload: Record<string, unknown>;
  protectedKeys: string[];
}) {
  describe(`BOPLA Property Injection Probe: ${config.suiteName}`, () => {
    setupTestServerLifecycle();

    test("ignores injected administrative properties during update", async () => {
      const { id, token } = await config.setupCaller();
      const beforeState = await config.fetchCurrentEntityInDb(id);

      await testClient.mutate({
        mutation: config.mutation,
        variables: {
          id,
          input: {
            ...config.maliciousPayload,
          },
        } as unknown as TVars,
        context: {
          headers: { Authorization: `Bearer ${token}` },
        },
      });

      const afterState = await config.fetchCurrentEntityInDb(id);

      // Verify protected keys were NOT modified in the database
      for (const key of config.protectedKeys) {
        expect(afterState[key]).toEqual(beforeState[key]);
      }
    });
  });
}
```

---

### 7.4 Database Repository Rollback Isolation Test (`runInRollback`)
```typescript
import { describe, expect, test } from "bun:test";
import { runInRollback } from "@/backend/db/test/test-utils";
import { eq, and } from "drizzle-orm";

describe("Repository Multi-Tenant Query Scoping", () => {
  test("enforces tenantId filter in repository read methods", async () => {
    await runInRollback(async (tx) => {
      // 1. Provision two test tenants directly in rollback transaction
      // 2. Perform query targeting Tenant B ID while authenticated as Tenant A
      // 3. Assert zero records returned
    });
  });
});
```

---

## 8. Defensive Architecture & Systematic Remediation

To prevent authorization flaws systematically across the entire codebase, enforce these four core architectural pillars:

### Pillar 1: Context-Derived Identity (Never Trust Client Identifiers)
```typescript
// ❌ VULNERABLE: Trusts client-supplied user identifier
resolve: async (_, args, ctx) => {
  return InvoiceRepository.getInvoicesForUser(args.userId);
}

// ✅ SECURE: Always derives identity from verified authentication session
resolve: async (_, args, ctx) => {
  const verifiedUserId = ctx.user.id;
  return InvoiceRepository.getInvoicesForUser(verifiedUserId);
}
```

### Pillar 2: Compound Database Tenancy Queries
Every repository lookup for tenant-owned entities must include the tenant boundary in the query `WHERE` clause:
```typescript
// ❌ VULNERABLE: Direct primary key lookup without tenant verification
export async function getDocumentById(id: string, tx: DBTransaction) {
  return tx.query.documents.findFirst({
    where: eq(documents.id, id),
  });
}

// ✅ SECURE: Compound WHERE clause enforcing tenant ownership
export async function getDocumentById(id: string, tenantId: string, tx: DBTransaction) {
  return tx.query.documents.findFirst({
    where: and(
      eq(documents.id, id),
      eq(documents.tenantId, tenantId)
    ),
  });
}
```

### Pillar 3: Strict Input Whitelisting (No Object Spreading)
```typescript
// ❌ VULNERABLE: Spreading inputs allows attackers to overwrite any column
export async function updateAccount(id: string, input: AccountInput, tx: DBTransaction) {
  return tx.update(accounts).set({ ...input }).where(eq(accounts.id, id));
}

// ✅ SECURE: Explicit field mapping
export async function updateAccount(id: string, input: AccountInput, tx: DBTransaction) {
  return tx.update(accounts)
    .set({
      displayName: input.displayName,
      phoneNumber: input.phoneNumber,
      updatedAt: new Date(),
    })
    .where(eq(accounts.id, id));
}
```

### Pillar 4: Centralized Policy-Based Access Guards
```typescript
// ✅ SECURE: Declarative access control assertions
export class AccessControlService {
  static assertCanAccessTenant(ctx: RequestContext, targetTenantId: string): void {
    if (ctx.user.isSuperAdmin) return;
    if (ctx.user.tenantId !== targetTenantId) {
      throw new ForbiddenError("Access denied to target tenant partition");
    }
  }

  static assertCanManageResource(ctx: RequestContext, resourceOwnerId: string): void {
    if (ctx.user.isSuperAdmin) return;
    if (ctx.user.id !== resourceOwnerId) {
      throw new ForbiddenError("Access denied to resource");
    }
  }
}
```

---

## 9. Pre-Commit & Security Review Checklist

Use this checklist during code reviews, PR audits, or security evaluations:

- [ ] **Context Ownership**: Are all actor identifiers derived from `ctx.user` or session tokens rather than client arguments?
- [ ] **Database Query Scoping**: Does every `SELECT`, `UPDATE`, and `DELETE` query on tenant data include a tenant/owner predicate in the `WHERE` clause?
- [ ] **DataLoader Tenancy**: Do DataLoaders filter batch-loaded entities against the caller's tenancy or use per-request isolated cache instances?
- [ ] **DTO Whitelisting**: Are all update mutations explicitly mapping allowed properties, without using `{ ...input }` spread into database calls?
- [ ] **Composite Relations**: When operating on child resources, does the query verify that `child.parentId === callerParentId`?
- [ ] **Asynchronous Pipelines**: Are stored identifiers in background jobs and drafts validated for tenant ownership before persistence and before execution?
- [ ] **File Storage Security**: Are file downloads protected by authorization middleware and short-lived signed URLs?
- [ ] **Automated Regression Tests**: Does the feature include dual-account A-B tests (`bun:test`) proving that unauthorized tenants receive errors or null responses?
