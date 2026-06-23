## Section 3: Suggestion State Machine & Threat Alignment

### 3.1 Suggestion Status State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING : communication.submit_suggestion
    PENDING --> REVIEWED : suggestions.review (markReviewed)
    PENDING --> DUPLICATE : suggestions.review (markDuplicate)
    REVIEWED --> DUPLICATE : suggestions.review (markDuplicate)
    PENDING --> [*] : suggestions.delete (soft-delete)
    REVIEWED --> [*] : suggestions.delete (soft-delete)
    DUPLICATE --> [*] : suggestions.delete (soft-delete)
```

**State Transition Guards:**
- `PENDING → REVIEWED`: Requires `suggestions.review` permission. Sets `reviewedByUserId`, `reviewedAt`.
- `PENDING → DUPLICATE`: Requires `suggestions.review` permission. Sets `duplicateOfId` (must reference a non-duplicate suggestion), `reviewedByUserId`, `reviewedAt`.
- `REVIEWED → DUPLICATE`: Allowed — admin can reclassify a reviewed suggestion as duplicate if a matching original is found later.
- `DUPLICATE → REVIEWED`: **NOT allowed** — once marked duplicate, the suggestion stays duplicate. Admin should instead respond to the original.
- `Any → soft-deleted`: Requires `suggestions.delete` permission (Super Admin only). Sets `deletedAt`.

### 3.2 Duplicate Linking Rules

```mermaid
stateDiagram-v2
    [*] --> ValidOriginal : Target is PENDING or REVIEWED
    [*] --> InvalidSelf : Target is self (same ID)
    [*] --> InvalidDuplicate : Target is already DUPLICATE
    [*] --> InvalidDeleted : Target is soft-deleted
```

**Application-level validation (in `SuggestionService.markAsDuplicate()`):**
1. `duplicateOfId !== suggestionId` — cannot mark self as duplicate
2. Target suggestion must exist and NOT be soft-deleted
3. Target suggestion must NOT have `status = DUPLICATE` — cannot chain duplicates
4. Circular reference check: target must not have `duplicateOfId` pointing back to the current suggestion (prevents A→B→A cycles)

### 3.3 Notification Dispatch State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING : Channel creates delivery record
    PENDING --> SENT : Provider API success
    PENDING --> FAILED : Provider API error
    SENT --> DELIVERED : Webhook callback (async)
    DELIVERED --> OPENED : Webhook callback (async)
    SENT --> FAILED : Webhook callback (delivery failure)
```

**Status transition rules (from `NotificationRepository.assertValidStatusTransition()`):**
- Forward transitions only: `PENDING → SENT → DELIVERED → OPENED`
- `FAILED` is terminal — cannot transition out
- Same-state transitions allowed (idempotent)
- Backward transitions rejected

### 3.4 SMS Rate Limiting State Machine

```mermaid
stateDiagram-v2
    [*] --> CheckRateLimit : SMS dispatch requested
    CheckRateLimit --> UnderLimit : Count < sms_rate_limit_per_hour
    CheckRateLimit --> OverLimit : Count >= sms_rate_limit_per_hour
    UnderLimit --> SendSMS : Twilio API call
    OverLimit --> SkipSMS : Log warning, skip delivery
    SendSMS --> [*]
    SkipSMS --> [*]
```

**Rate limit check:**
- Query: `SELECT COUNT(*) FROM notification_deliveries WHERE user_id = $1 AND channel = 'SMS' AND created_at > NOW() - INTERVAL '1 hour'`
- Limit: `sms_rate_limit_per_hour` system setting (default: 3)
- If over limit: log warning, skip SMS delivery, do NOT fail the overall operation
