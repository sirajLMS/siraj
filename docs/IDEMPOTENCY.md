# Idempotency Requirements for Mobile Developers

To ensure reliability and prevent duplicate operations (such as multiple billings or double bookings) during network retries, the Siraj LMS API implements mandatory idempotency protection.

## Core Principle

Every mutating request (POST) that creates a new entity (Student, Invoice, Class Instance, Payment) **MUST** include a unique idempotency key.

## Implementation Details

### 1. HTTP Header

Clients must provide a unique key in the `X-Idempotency-Key` HTTP header.

```http
X-Idempotency-Key: <UUID-v4>
```

### 2. Behavior

- **First Request:** The server processes the request normally and records the key.
- **Subsequent Requests (within 24 hours):** If a request with the same key is received, the server will block it and return a `409 Conflict` error with the code `DUPLICATE_REQUEST`.
- **Expiration:** Idempotency keys expire after **24 hours**. After this period, the same key could theoretically be reused (though this is strongly discouraged).

### 3. Error Handling

If you receive a `409 Conflict` with `DUPLICATE_REQUEST`, it means the operation was already successfully received by the server. You should treat this as a success or check the state of the entity to confirm.

If the server returns a `5xx` error, the idempotency key is released, allowing you to retry the same operation with the same key.

## Affected Operations

Idempotency is enforced at the database level for the following entities:

- **Students:** All student creation mutations.
- **Invoices:** All invoice generation mutations.
- **Class Instances:** All booking and rescheduling mutations.
- **Payments:** All payment recording mutations.

## Best Practices

1. **Use UUID v4:** Always generate a fresh UUID v4 for each _new_ operation.
2. **Persistent Retries:** If a request fails due to a network error, retry with the **SAME** idempotency key.
3. **Storage:** Store the idempotency key locally on the device until the request succeeds, to ensure it can be reused across app restarts if a retry is needed.

## Content-Derived vs Client-Token Keys; Raw-Input Hashing (global invariants)

1. **Hash the RAW user input, persist the SANITIZED value.** When an idempotency
   key is derived from user-supplied free text (notes, descriptions), compute the
   hash over the raw input exactly as received, while storing only the sanitized
   form. Hashing the sanitized text breaks duplicate suppression whenever
   sanitization alters the payload (entity escaping, truncation), letting the
   same logical retry land twice.
2. **Content-derived keys and client-token keys must live under distinct scheme
   prefixes** (e.g. `"feature-op:"` vs `"feature-op-token:"`). When a caller
   supplies a request token, key on `(entityId, token)`; when absent/blank, fall
   back to the deterministic content key — never mix the two namespaces or a
   token can collide with a content digest.
3. **Deduplicate at write time, not only at key time.** If the sink is an
   append-only event table, carry the key on the row (`toState.idempotencyKey`)
   and collapse duplicates with a bounded window read (e.g. 30s) before insert —
   content-hash equality alone does not protect against concurrent in-flight
   duplicates.
