/**
 * LMS Data Models & Type Definitions
 * Derived from Tiba Alarabya Student & Parent Portal Analysis
 */

export type SessionStatus = 
  | 'DONE_AND_PAST'
  | 'UPCOMING'
  | 'RESCHEDULE_REQUESTED'
  | 'ABSENT_TEACHER'
  | 'ABSENT_STUDENT';

export type TicketCategory = 'TEACHER_PM' | 'ADMIN_COMPLAINT_SUGGESTION';

export type TicketStatus = 'OPEN' | 'PENDING_REPLY' | 'RESOLVED' | 'CLOSED';

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  timezone: string;
  assignedTeacherIds: string[];
  creditHoursBalance: number;
  currency: string;
}

export interface LiveSession {
  id: string;
  sessionNumber: number;
  studentId: string;
  teacherId: string;
  teacherName: string;
  scheduledStartTime: string; // ISO String
  durationMinutes: number;
  meetingUrl: string;
  status: SessionStatus;
  isMeetingActive: boolean;
  canSelfServiceModify: boolean;
}

export interface HomeworkAssignment {
  id: string;
  reportName: string;
  studentId: string;
  teacherId: string;
  teacherName: string;
  assignedDate: string;
  grade?: 'Excellent' | 'Very Good' | 'Good' | 'Needs Improvement';
  instructions: string;
  mediaEmbedUrl?: string; // SoundCloud / YouTube / Audio stream
  publicLessonSummary: string;
  studentSubmissionUrl?: string;
  submissionTimestamp?: string;
  status: 'PENDING' | 'SUBMITTED' | 'GRADED';
  createdAt?: string;
  updatedAt?: string;
}

export interface MonthlyAppraisal {
  id: string;
  studentId: string;
  teacherId: string;
  monthIdentifier: string; // e.g. "2021-12-01"
  behaviorGrade?: number; // 1-5 scale
  behaviorComment?: string;
  attendanceGrade?: number; // 1-5 scale
  attendanceComment?: string;
  punctualityGrade?: number; // 1-5 scale
  punctualityComment?: string;
  overallAppraisalGrade?: number; // 1-5 scale
  overallAppraisalComment?: string;
  learningTargetsText: string;
  studentParentFeedback?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: number;
  category: TicketCategory;
  createdByUserId: string;
  createdByName: string;
  targetTeacherId?: string;
  subject?: string;
  initialMessage: string;
  status: TicketStatus;
  createdAt: string;
  replies: Array<{
    senderId: string;
    senderName: string;
    messageText: string;
    timestamp: string;
  }>;
}

export interface PaymentLedgerEntry {
  id: string;
  studentId: string;
  studentName: string;
  creditHoursPurchased: number;
  amountPaid: number;
  currency: string;
  packageName?: string;
  paymentGateway?: string;
  paymentDate: string;
  createdAt: string;
}


/**
 * Raw Markdown Documentation Constant
 * Contains the exhaustive feature specification and integration blueprint.
 */
export const LMS_STUDENT_PORTAL_SPECIFICATION = `
# Comprehensive Feature Analysis & System Specification
## Student & Parent Portal Architecture in Tiba Alarabya LMS

---

## 1. Executive Summary & Platform Philosophy

The system demonstrated in the video (**Tiba Alarabya LMS**) is an educational management platform optimized for synchronous **1-on-1 and small group live instruction** (primarily targeted at online Quranic, Arabic, and Islamic studies academies).

### Core Product Design Philosophy
* **Student-Centric Simplicity:** The interface strips away unnecessary administrative clutter, exposing only high-priority widgets (today's classes, latest assignments, quick support links).
* **Parental Transparency:** Built with young learners and their parents in mind, providing visibility into financial ledgers, lesson reports, and monthly standardized appraisals.
* **Frictionless Live Class Access:** Replaces manual meeting link distribution (e.g., via WhatsApp or email) with a centralized, dynamic link hub that handles session reconnects smoothly.
* **Structured Self-Service:** Allows students to request schedule changes (delay/cancel) directly through an interactive calendar without requiring direct staff intervention.

---

## 2. Granular Module Breakdown & Technical Architecture

### Module 1: Student Dashboard (The Command Center)

The dashboard serves as the initial landing screen post-authentication, aggregating essential daily tasks and critical updates into distinct, modular card widgets.

\`\`\`
+-----------------------------------------------------------------------+
|  Welcome [Student Name]                                               |
+------------------------------------+----------------------------------+
|  [SESSIONS TODAY]                  |  [LATEST ASSIGNMENTS]            |
|  - Teacher Name                    |  - Teacher Name & Date           |
|  - Date, Time & Duration           |  - Student Name                  |
|  - [Meeting Link] (Dynamic Button) |  - [View] Button                 |
|  - [Display All Sessions] Button   |                                  |
+------------------------------------+----------------------------------+
|  [QUICK ICONS]                                                        |
|  [Teacher PM]  [Complaint/Suggestion to Admin]  [History of Payments]  |
+-----------------------------------------------------------------------+
|  [REQUESTS]                                                           |
|  - Table: Event | Type | Created By | Status                          |
+-----------------------------------------------------------------------+
|  [TICKETS]                                                            |
|  - Active Open Ticket Banner / Badge Notifications                    |
+-----------------------------------------------------------------------+
\`\`\`

#### Key Dashboard Features & Business Logic:
1. **Dynamic "Sessions Today" Widget:**
   * **Real-Time Filter:** Automatically extracts sessions scheduled for the current calendar date matching the student's local timezone.
   * **Metadata Display:** Shows assigned teacher name, exact start time (e.g., \`2021-12-12 07:00 PM\`), and scheduled duration (e.g., \`00:30:00\`).
   * **Launchpad Button (\`Meeting Link\`):**
     * Direct link trigger launching third-party conferencing tools (Zoom, Google Meet, or proprietary web conferencing).
     * **Persistent Session Logic:** The join link remains active and accessible on the dashboard for the entire scheduled duration. If a student loses internet connection or accidentally closes their browser, they can re-click the link to rejoin the live room seamlessly until the teacher explicitly executes an \`End Session\` command.
2. **"Latest Assignments" Widget:**
   * Highlights the most recently published homework task.
   * Displays target date, teacher, and a direct \`View\` trigger to bypass menu navigation.
3. **Quick Action Icon Strip:**
   * **Teacher PM:** Instant shortcut to compose a private message to assigned tutors.
   * **Admin Escalation:** Direct shortcut to send feedback/complaints directly to operations.
   * **History of Payments:** Quick ledger access for parents to review financial records.
4. **Requests & Support Tickets Summary:**
   * Displays status tags (\`Pending\`, \`Approved\`, \`Rejected\`) for open rescheduling requests and open administrative tickets.

---


### Module 2: Interactive Scheduling & Calendar Subsystem

A calendar engine built for multi-view session management, time-zone mapping, and controlled self-service rescheduling.

\`\`\`
+-----------------------------------------------------------------------+
|  Calendar Filter Controls                                             |
|  [Teacher: Select Dropdown]  [From Date]  [To Date]  [Submit] [Reset] |
+-----------------------------------------------------------------------+
|  Legend: [Done & Past] [Upcoming] [Reschedule] [Absent T] [Absent S]  |
+-----------------------------------------------------------------------+
|  Views: [Month] [Week] [Day]                                          |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  | Sun 12         | Mon 13         | Tue 14         | ...          |  |
|  | +------------+ | +------------+ | +------------+ |              |  |
|  | | #59-Sarah  | | | #43-Sarah  | | | #44-Sarah  | |              |  |
|  | | Teacher Z. | | | Teacher Z. | | | Teacher Z. | |              |  |
|  | | (Past/Locked)| | [Delay]    | | [Delay]    | |              |  |
|  | |            | | [Cancel]   | | [Cancel]   | |              |  |
|  | +------------+ | +------------+ | +------------+ |              |  |
|  +-----------------------------------------------------------------+  |
+-----------------------------------------------------------------------+
\`\`\`

#### Detailed Features:
1. **Multi-Grid Views (Month, Week, Day):**
   * **Month View:** Displays macro-level class density with color-coded status badges.
   * **Week View (Hourly Grid):** Displays detailed time slots mapped along a vertical timeline (e.g., 7:00 AM to 9:00 PM), allowing students to visualize their weekly study routine.
2. **Color-Coded Status Management:**
   * **Done & Past (Blue/Grey):** Completed classes. Cards are locked from student edits.
   * **Upcoming (Green):** Scheduled active classes.
   * **Reschedule (Orange/Brown):** Sessions currently flagged for rebooking.
   * **Absent Teacher (Red):** Classes missed due to teacher absence (triggers system credit refund).
   * **Absent Student (Dark Red):** Classes missed by the student without prior cancellation.
3. **Student Self-Service Controls (Card Level):**
   * **\`Delay\` (Reschedule Request):** Opens a request modal allowing the student to ask for a time shift.
   * **\`Cancel\` Button:** Submits an automated cancellation.
   * **Time-Lock Business Rules:** Self-service modification buttons (\`Delay\`/\`Cancel\`) are automatically disabled for today's active sessions or past sessions to prevent last-minute automated cancellations.

---


### Module 3: Assignments & Daily Lesson Reports

This module combines session delivery tracking with rich-media assignment submissions.

\`\`\`
+-----------------------------------------------------------------------+
|  Viewing Report / Assignment                                          |
+-----------------------------------------------------------------------+
|  Report Name: #59 - Sarah 2021-12-12        Teacher: Teacher Zeinab   |
|  Student Name: Sarah                        Grade: Excellent          |
+-----------------------------------------------------------------------+
|  Assignment: Listen and recite Surat Al-Najm                          |
|  +-----------------------------------------------------------------+  |
|  | [Embedded Media Player - SoundCloud / Audio Player Widget]       |  |
|  +-----------------------------------------------------------------+  |
+-----------------------------------------------------------------------+
|  Report (Lesson Summary): "We studied Surat Al-Najm verses 1 to 15"   |
+-----------------------------------------------------------------------+
|  Assignment Answer (Submission Section)                               |
|  [ Choose File ] No file chosen                                       |
|  [ UPLOAD ]                                                           |
+-----------------------------------------------------------------------+
\`\`\`

#### Detailed Features:
1. **Embedded Audio/Visual Media Support:**
   * Homework instructions support rich HTML embedding, such as **SoundCloud audio players**, YouTube videos, or downloadable PDF worksheets. This is ideal for listening exercises, pronunciation guides, and recitation practice.
2. **Lesson Summary vs. Admin Reports (Privacy Masking):**
   * **Student View (\`Report\`):** Shows concise, public lesson summaries written by the teacher (e.g., "We studied verses 1–15").
   * **Administrative Isolation:** Internal administrative logs, teacher notes to management, and internal behavioral tracking are hidden from the student screen.
3. **Homework Submission Workflow:**
   * Allows students to upload files directly under the specific assignment card (\`Choose File\` -> \`Upload\`).
   * Supports audio recordings (MP3, WAV), images of written work (JPEG, PNG), or documents (PDF).
   * Generates creation/update timestamps (\`Created At\`, \`Updated At\`) upon successful upload.
4. **Historical Search & Filtering:**
   * Dedicated \`Reports & Assignments\` archive page equipped with filters: **Teacher Selector**, **Custom Label Tagging**, and **Date Range (From/To)**.

---


### Module 4: Monthly Academic Progress & Appraisal Framework

A structured, recurring evaluation system designed to provide quantitative and qualitative feedback to students and parents every month.

\`\`\`
+-----------------------------------------------------------------------+
|  Viewing Monthly Report                                               |
|  Student: Sarah         Teacher: Teacher Zeinab     Month: 2021-12-01 |
+-----------------------------------------------------------------------+
|  EVALUATION CRITERIA (5-Point Scale & Qualitative Feedback)           |
|                                                                       |
|  Behavior:               Grade: 5 / 5     Comment: [               ]  |
|  Attendance:             Grade: 4 / 5     Comment: [               ]  |
|  Punctuality:            Grade: 5 / 5     Comment: [               ]  |
|  Overall Appraisal:      Grade: 5 / 5     Comment: She was great      |
+-----------------------------------------------------------------------+
|  Learning Targets:                                                    |
|  "We have studied Surat Al-Najm and revised Juz Amma."                |
+-----------------------------------------------------------------------+
|  Student / Parent Feedback:                                           |
|  "Thanks for the update, teacher!"                                    |
+-----------------------------------------------------------------------+
\`\`\`

#### Detailed Features:
1. **Standardized Rubric Metrics:**
   * Quantitative scoring (e.g., Grade 1 to 5) alongside qualitative text comments across key indicators:
     * **Behavior:** Student engagement and conduct during live sessions.
     * **Attendance:** Consistency in showing up to class.
     * **Punctuality:** On-time attendance.
     * **Overall Appraisal:** High-level teacher assessment.
     * **Learning Targets:** Explicit list of curriculum targets covered over the monthly billing cycle.
2. **Dynamic Sparse-Field Display Logic:**
   * Only evaluation fields populated by the teacher are rendered on the student's report card. Unfilled fields are automatically omitted from the layout.
3. **Bi-Directional Parent/Student Feedback Loop:**
   * The list page features an **\`Add Feedback\`** action button.
   * Clicking it opens a modal dialog allowing parents/students to write notes or ask follow-up questions.
   * Submitted feedback is saved and permanently appended to the monthly report document under \`Student Feedback\`.

---


### Module 5: Two-Tier Support & Ticketing Architecture

To keep academic discussions separate from operational and billing issues, the LMS implements a dual messaging workflow.

\`\`\`
                           +------------------------+
                           |  Student / Parent      |
                           +-----------+------------+
                                       |
                   +-------------------+-------------------+
                   |                                       |
                   v                                       v
        [Teacher PM Channel]                    [Admin Escalation]
                   |                                       |
                   v                                       v
    - Direct communication with teacher     - Bypasses teacher entirely
    - Academic queries & lesson Q&A         - Complaints, billing issues,
    - Uses Rich Text Editor (TinyMCE)         or teacher replacement requests
\`\`\`

#### Detailed Features:
1. **\`Teacher PM\` (Private Messaging):**
   * Targeted academic communication.
   * Allows selecting specific teachers from a dropdown if the student is enrolled with multiple instructors.
   * Features a full **WYSIWYG Rich Text Editor (TinyMCE)** supporting bold text, italics, bullet lists, hyperlinking, and custom formatting.
2. **\`Complaint or Suggestion to Administration\`:**
   * Operational messaging channel that bypasses the teacher and routes directly to academy management.
   * Used for sensitive issues such as requesting a teacher change, reporting technical difficulties, or resolving billing disputes.
3. **Asynchronous Thread Management:**
   * Shows message metadata (\`Ticket No\`, \`Created By\`, \`Created At\`).
   * Thread detail view (\`Viewing Ticket\`) displays structured conversation logs (\`Ticket Message\` vs. \`Student Reply\`).
   * Includes thread management state (\`View & Reply\`, \`Close Ticket\`).

---

### Module 6: Financial Ledger & Credit Balance Tracking

Transparency in accounting is crucial for prepaid, hourly-based tutoring platforms.

\`\`\`
+---------------------------------------------------------------------------------------------+
|  Payments Ledger                                                                            |
+--------------+--------+------+----------+-----------------+-----------------+---------------+
| Student Name | Credit | Paid | Currency | Package         | Payment Gateway | Payment Date  |
+--------------+--------+------+----------+-----------------+-----------------+---------------+
| Sarah        | 8 Hrs  | 40   | GBP      | No results      | No results      | 2021-11-30    |
+--------------+--------+------+----------+-----------------+-----------------+---------------+
\`\`\`

#### Detailed Features:
1. **Hour / Credit Tracking:**
   * Explicitly tracks purchased credit hours (e.g., \`Credit: 8\` hours) against total monetary amount paid (e.g., \`Paid: 40\`).
2. **Multi-Currency Support:**
   * Supports local and international currencies (e.g., \`GBP - Pound Sterling\`, \`USD\`, \`EUR\`, \`EGP\`, \`SAR\`, \`AED\`).
3. **Transaction Transparency:**
   * Logs transaction metadata: Payment Date, Payment Gateway utilized, Package Name, and System Timestamp (\`Created At\`).
   * Gives parents self-service access to verify paid invoices without contacting accounting staff.

---


## 3. LMS Feature Gap Matrix & Upgrade Roadmap

Use this matrix to compare the features observed in the video against your current LMS implementation to identify missing functionality.

| Module | Observed Feature in Video | Functional Purpose | Implementation Strategy for Your LMS | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard** | Persistent Live Meeting Link | Keeps class room access link active throughout the session window for easy reconnects. | Implement a dynamic session status watcher that serves active meeting URLs based on class schedule times. | **High** |
| **Dashboard** | Quick Action Strip | Fast shortcuts for Teacher PM, Complaints, and Payment History. | Add a modular quick-links widget to the top of the main student dashboard. | **High** |
| **Calendar** | Self-Service Delay & Cancel | Allows students to request schedule changes directly from the calendar UI. | Add action buttons to calendar card modals with automated time-based lock rules. | **High** |
| **Calendar** | Color-Coded Status System | Visual distinction between Completed, Upcoming, Rescheduled, and Missed sessions. | Expand your calendar event data schema to support explicit attendance status flags. | **High** |
| **Assignments**| Embedded SoundCloud / Audio | Allows inline playback of recitation audio clips and language exercises. | Integrate an HTML5 audio player / oEmbed parser within assignment instruction rich text fields. | **High** |
| **Assignments**| Privacy Masked Lesson Summary | Shows public lesson summaries to students while hiding administrative notes. | Separate lesson reports into \`Public Summary\` and \`Internal Admin Notes\` database fields. | **Medium** |
| **Monthly Appraisal**| Standardized Evaluation Rubric | 5-point rating scale across Behavior, Attendance, Punctuality, and Overall Appraisal. | Build a monthly report generator module with configurable grading criteria and comment fields. | **High** |
| **Monthly Appraisal**| Parent Feedback Loop | Allows parents/students to append written replies to monthly appraisal reports. | Add an \`Add Feedback\` modal to report views that updates the report object with parent comments. | **Medium** |
| **Messaging** | Two-Tier Support Channels | Separates private teacher messages (\`Teacher PM\`) from administrative escalation routes. | Implement routing tags on ticket creation (Route to: \`Instructor\` vs. \`Support/Admin\`). | **High** |
| **Accounting**| Hourly Credit Ledger | Displays total purchased hours/credits alongside payment receipts. | Add a balance ledger tracking remaining prepaid class hours/credits per student account. | **High** |

---

## 4. Key Takeaways for Platform Integration

1. **Prioritize Real-Time Live Class Launching:** Transitioning from manual links to an automated dynamic dashboard widget eliminates joining friction and reduces support tickets.
2. **Implement Structured Monthly Appraisals:** Beyond simple assignment grades, adding monthly performance rubrics significantly boosts student retention and parent satisfaction in recurring tutoring programs.
3. **Empower Self-Service Rescheduling:** Introducing \`Delay\` and \`Cancel\` triggers on the calendar screen automates scheduling adjustments, reducing manual administrative overhead.
4. **Separate Academic & Operational Communication:** Splitting messaging into direct teacher PMs and administrative escalation channels keeps instructors focused on teaching while management addresses service and billing issues.
`;


/**
 * Helper utility to extract high priority missing features from the specification matrix.
 */
export function getHighPriorityFeatures(): Array<{ module: string; feature: string; strategy: string }> {
  return [
    {
      module: 'Dashboard',
      feature: 'Persistent Live Meeting Link',
      strategy: 'Implement a dynamic session status watcher that serves active meeting URLs based on class schedule times.'
    },
    {
      module: 'Calendar',
      feature: 'Self-Service Delay & Cancel',
      strategy: 'Add action buttons to calendar card modals with automated time-based lock rules.'
    },
    {
      module: 'Assignments',
      feature: 'Embedded SoundCloud / Audio',
      strategy: 'Integrate an HTML5 audio player / oEmbed parser within assignment instruction rich text fields.'
    },
    {
      module: 'Monthly Appraisal',
      feature: 'Standardized Evaluation Rubric',
      strategy: 'Build a monthly report generator module with configurable grading criteria and comment fields.'
    },
    {
      module: 'Messaging',
      feature: 'Two-Tier Support Channels',
      strategy: 'Implement routing tags on ticket creation (Route to: Instructor vs. Support/Admin).'
    },
    {
      module: 'Accounting',
      feature: 'Hourly Credit Ledger',
      strategy: 'Add a balance ledger tracking remaining prepaid class hours/credits per student account.'
    }
  ];
}