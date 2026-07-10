# Decision 6: Fate of `staff_profiles` after the move

**Question:** Once phone/status/person fields leave `staff_profiles`, what is that table for?

---

## Today

`staff_profiles` columns: `id`, `userId` (unique), `phone`, `status`, timestamps.

Admin/super-admin users are detected as “staff audience” because a **row exists** in `staff_profiles` (see `ProfileService.resolveRoleIdsForUser`: teacher → parent → staff).

Permissions (academy_admin, etc.) live in permission group tables, not in `staff_profiles`.

---

## Option A — Keep thin `staff_profiles` as staff identity marker

**Idea:** After move, table is basically:

```
staff_profiles: id, userId, createdAt, updatedAt
(+ status only if status is NOT on users)
```

Presence of the row means “this user is staff for profile routing / directory.”

### Example

- Super Admin Ahmed: `users` row + `staff_profiles` row + permission group `super_admin`  
- Profile audience = `staff` because staff row exists  

### Pros

- Minimal change to profile resolution and onboarding  
- Clear “staff directory” membership  
- Can attach staff-only fields later without touching `users`  

### Cons

- “Empty” table feels pointless  
- Staff-ness duplicated with permission groups (two sources of truth)  

---

## Option B — Drop `staff_profiles`; staff = permission groups only

**Idea:** No staff table. Profile audience `staff` if user has admin/staff permission groups and is not teacher/parent (or even if they are — product rule).

### Example

- Ahmed has group `academy_admin` → profile audience staff  
- Onboarding “create manager” only creates `users` + assigns group  

### Pros

- One source of truth for “is admin”  
- Less schema  

### Cons

- Must rewrite `resolveRoleIdsForUser`, manager onboarding, staff directory queries  
- Harder to list “all staff” without permission joins  
- Super-admin demo users without groups become edge cases  
- Bigger blast radius  

---

## Option C — Undecided; plan should recommend

**Idea:** You want a recommendation in the implementation plan rather than choosing now.

**Likely recommendation:** **A for v1** (thin marker), revisit **B** when permissions/directory are unified — lower risk during an already large user-entity migration.

---

## How to choose

| Priority | Pick |
|----------|------|
| Ship user-field move with less risk | **A** |
| Clean architecture, accept rewrite | **B** |
| Want a written recommendation | **C** |

**Reply with:** `6A`, `6B`, or `6C`
