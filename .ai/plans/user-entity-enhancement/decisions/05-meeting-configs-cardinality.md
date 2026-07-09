# Decision 5: Meeting configs cardinality

**Question:** After replacing Zoom columns with `user_meeting_configs`, how many meeting links can one user have?

---

## Today

| Role | What they have |
|------|----------------|
| Teacher | One Zoom link + username + password on the teacher row |
| Parent | One `defaultZoomLink` |
| Class instance | Separate `zoomMeetingUrl` per session |

No Google Meet / Teams today.

---

## Option A — At most one config per provider

**Idea:** Unique `(userId, provider)`. Providers: `ZOOM`, `GOOGLE_MEET`, `MICROSOFT_TEAMS`.

### Example

| User | Rows |
|------|------|
| Teacher Omar | Zoom config, Google Meet config |
| Parent Sara | Zoom config only |

Cannot have two Zoom links.

### Pros

- Simple UI and GraphQL  
- Easy “get Zoom for this teacher”  
- Matches today’s mental model (one Zoom)  

### Cons

- No Personal vs Work Zoom  
- Switching link = overwrite  

---

## Option B — Multiple labeled configs per provider

**Idea:** Many rows; each has `label` (“Personal”, “Work”). Unique `(userId, provider, label)`.

### Example

| User | Rows |
|------|------|
| Teacher Omar | Zoom/Personal, Zoom/Work, Meet/Default |

### Pros

- Flexible for power users  
- Can attach different links to different class types later  

### Cons

- Heavier UI (pick which link when booking)  
- Need rules: which label is default per provider?  
- More edge cases in scheduling  

---

## Option C — Multiple allowed, exactly one global `isDefault`

**Idea:** Many configs across providers; **one** row has `isDefault = true` for the user (used when booking doesn’t specify).

### Example

| User | Rows | Default? |
|------|------|----------|
| Omar | Zoom Work | ✓ default |
| Omar | Zoom Personal | |
| Omar | Google Meet | |

### Pros

- Flexible + clear fallback for class creation  
- Supports multi-provider without forcing “one Zoom only”  

### Cons

- Constraint: only one default (partial unique index)  
- UI must manage default switching  
- Still need “which config for this class?” when not using default  

---

## How to choose

| Need | Pick |
|------|------|
| Replace Zoom 1:1, add Meet/Teams later | **A** |
| Teachers juggle multiple Zoom accounts | **B** or **C** |
| Multiple links but simple booking default | **C** |

**Reply with:** `5A`, `5B`, or `5C`
