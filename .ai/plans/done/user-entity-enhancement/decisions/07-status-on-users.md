# Decision 7: Status on `users`

**Question:** You asked for `status` on the user entity. How does that relate to today’s multiple status concepts?

---

## Today (four related ideas)

| Location | Values | Meaning |
|----------|--------|---------|
| `users.isActive` (bool) | true/false | Can log in? Mapped to AccountStatus in session |
| `teachers.status` | ACTIVATED / DEACTIVATED | Teacher directory / ops |
| `staff_profiles.status` | ACTIVATED / DEACTIVATED | Staff directory / ops |
| `parents.status` | ACTIVATED, DEACTIVATED, REGULAR, ON_LEAVE, SUSPENDED, ON_TRIAL | Parent **lifecycle** (richer) |

Deactivating a parent today often sets `parents.status`, not necessarily `users.isActive`.

---

## Option A — Hybrid (recommended): `users` AccountStatus + keep ParentStatus on parents

**Idea:**

- Replace `users.isActive` with `users.status: AccountStatus` (ACTIVATED / DEACTIVATED) — login gate  
- Teachers/staff: drop role `status` **or** mirror from users (prefer single login status on users)  
- Parents: keep `parents.status` as business lifecycle (ON_TRIAL, etc.)  
- Rule: if `users.status = DEACTIVATED`, login blocked regardless of parent lifecycle  

### Example

| User | users.status | parents.status | Effect |
|------|--------------|----------------|--------|
| Parent on trial | ACTIVATED | ON_TRIAL | Can log in; billing treats as trial |
| Suspended parent | ACTIVATED | SUSPENDED | Can log in (or product may restrict features); marked suspended |
| Fired teacher | DEACTIVATED | — | Cannot log in |

### Pros

- Doesn’t destroy parent lifecycle  
- Clear login flag on users  
- Matches “status on users” request without a messy mega-enum  

### Cons

- Two status fields for parents (must document)  
- UI must show the right one in the right place  

---

## Option B — Single merged `users.status` enum

**Idea:** One enum on users including parent lifecycle values:

`ACTIVATED | DEACTIVATED | REGULAR | ON_LEAVE | SUSPENDED | ON_TRIAL | …`

Drop role status columns.

### Example

- Parent: `users.status = ON_TRIAL`  
- Teacher: `users.status = ACTIVATED` (lifecycle values unused)  

### Pros

- One field everywhere  
- Staff profile edit can show status for all roles  

### Cons

- Nonsense values for teachers/staff (ON_TRIAL teacher?)  
- Mixes **login** with **business lifecycle**  
- Harder permissions (“DEACTIVATED means no login” vs “SUSPENDED means no classes”)  

---

## Option C — Keep `users.isActive`; no new `users.status`

**Idea:** Don’t add status to users. Role tables keep their status. `isActive` remains the login bool.

### Example

- Same as today; person-field move doesn’t include status  

### Pros

- Smallest change  
- No parent-status redesign  

### Cons

- Conflicts with your request to put status on users  
- Staff own-edit still won’t own a user-level status field  
- `isActive` vs role status confusion remains  

---

## How to choose

| Goal | Pick |
|------|------|
| Status on users + keep parent lifecycle | **A** |
| One status field to rule them all | **B** (accept awkward enum) |
| Defer status redesign | **C** |

**Reply with:** `7A`, `7B`, or `7C`
