## Section 3: State Machine & Workflow Alignment

Story 12 does not introduce a classic entity-state transition graph (like the Student Status machine from Story 9/10), but it does introduce two deeply critical, multi-step backend workflows that must be modeled to guarantee atomicity and security.

---

### 3.1 Hard Deletion Lifecycle (Learning Resources)

When an Academy Admin executes a deletion, the system must navigate a distributed deletion workflow. Since physical files live outside the transactional boundaries of PostgreSQL (e.g. AWS S3 or Local FS), the order of operations dictates the risk of data corruption.

```mermaid
stateDiagram-v2
    [*] --> VerifyPermission : deleteLearningResource(id) called
    
    VerifyPermission --> FetchDBRecord : resources.delete granted
    VerifyPermission --> UnauthorizedError : Permission denied

    FetchDBRecord --> RecordNotFound : Record doesn't exist
    FetchDBRecord --> DeletePhysicalFile : Record exists

    DeletePhysicalFile --> StorageFailure : S3/FS deletion fails
    DeletePhysicalFile --> DeleteDBRecord : S3/FS deletion succeeds

    DeleteDBRecord --> TransactionFailure : DB DELETE constraint fails
    DeleteDBRecord --> Success : DB DELETE succeeds

    Success --> [*]
    
    StorageFailure --> [*] : Throws error, DB intact (Safe)
    TransactionFailure --> [*] : Throws error, S3 file gone (Orphaned, Edge Case)
    UnauthorizedError --> [*]
    RecordNotFound --> [*]

    note right of DeletePhysicalFile
        CRITICAL RULE: The physical file MUST be 
        deleted BEFORE the database record. 
        If the DB is deleted first and S3 fails, 
        an un-trackable orphaned file remains.
    end note
```

**Workflow Guards:**
- The `LearningResourceService` orchestrates this explicitly. It does not rely on a DB trigger.
- The GraphQL resolver does not interact with the DB directly; it purely waits for the Service to complete the workflow.

---

### 3.2 Reporting Aggregation Workflow

Generating the attendance report is a complex pipeline of data aggregation followed by permission-based data redaction.

```mermaid
stateDiagram-v2
    [*] --> VerifyGenerationPermission : generateAttendanceReport()
    
    VerifyGenerationPermission --> UnauthorizedError : report.generate_custom denied
    VerifyGenerationPermission --> DrizzleAggregation : Permission granted

    state DrizzleAggregation {
        [*] --> FilterDateBounds
        FilterDateBounds --> FilterTeacherID
        FilterTeacherID --> GroupBySelection
        GroupBySelection --> SummationMetrics : Sum(duration), Count(instances)
        SummationMetrics --> [*]
    }

    DrizzleAggregation --> VerifyFinancialPermission : Raw DB rows generated

    VerifyFinancialPermission --> RedactionEngine : report.view_financials denied
    VerifyFinancialPermission --> PassThrough : report.view_financials granted

    state RedactionEngine {
        [*] --> IterateRows
        IterateRows --> MaskValues : Set paidEGP = 0, paidUSD = 0, hours = 0
        MaskValues --> [*]
    }

    RedactionEngine --> GraphQLResolver
    PassThrough --> GraphQLResolver

    GraphQLResolver --> [*] : Return sanitized payload
```

**Aggregation Rules:**
1. Only `executionState IN ["COMPLETED", "ACTIVATED", "RUNNING"]` classes are historically aggregated.
2. The Drizzle ORM aggregation groups by the requested enum (e.g., `TEACHER`, `DATE`).
3. The fallback redaction (setting to `0`) is strictly enforced at the node layer, meaning the GraphQL client cannot circumvent it by tweaking the GQL AST.

---

### 3.3 UI Component State & Feedback Loop

The frontend must provide absolute clarity when dealing with destructive or long-running queries.

```mermaid
stateDiagram-v2
    state "Resource List View" as ListView {
        IDLE : User viewing resources
        CONFIRM_PROMPT : Delete dialog modal open
        MUTATION_PENDING : Apollo useMutation() loading state
    }

    IDLE --> CONFIRM_PROMPT : Click Delete Icon
    CONFIRM_PROMPT --> IDLE : Click Cancel
    CONFIRM_PROMPT --> MUTATION_PENDING : Click Confirm

    MUTATION_PENDING --> IDLE : Mutation Success (refetchQueries / cache update)
    MUTATION_PENDING --> ERROR_STATE : Mutation Failure

    state ERROR_STATE {
        SNACKBAR : Display translated error string
    }

    ERROR_STATE --> IDLE : Auto-dismiss after 5s

    note right of MUTATION_PENDING
        During MUTATION_PENDING, the 
        confirm button is hard-disabled 
        to prevent double-submissions.
    end note
```

**State Transition Guards (UI):**
- The user is completely physically prevented from triggering the `deleteLearningResource` mutation twice rapidly. The button relies on Apollo's `loading` boolean returned by `useMutation`.
- The reporting form strictly requires a valid Date Range. If `fromDate > toDate`, the state machine prevents the GraphQL Query execution outright.
