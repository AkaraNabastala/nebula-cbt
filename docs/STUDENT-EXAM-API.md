# Student Exam API

All routes require JWT authentication and the matching student permission. Student data is always scoped through the authenticated `StudentProfile`; a participant ID or attempt ID alone never grants access.

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/student/exams` | `exam_schedules.read` | List the student's assigned sessions and own attempt status/receipt |
| POST | `/student/exams/:participantId/start` | `exam_attempts.start` | Start or resume an assigned attempt and issue a device session token |
| GET | `/student/attempts/:id` | `exam_attempts.read_own` | Resume an owned attempt using `x-attempt-session` |
| POST | `/student/attempts/:id/sync` | `exam_attempts.submit` | Idempotent answer batch sync using `x-attempt-session` |
| POST | `/student/attempts/:id/submit` | `exam_attempts.submit` | Close the attempt and create a submission receipt |

## Start and resume

The server checks the published schedule, student assignment, start/end window, and existing attempt. The server determines `startedAt` and `deadlineAt`; the deadline is the earlier of the session end and the configured duration. Reconnecting rotates the active device session. Only a SHA-256 hash of the session token and device fingerprint are stored.

The response contains question snapshots and options only. Answer-key snapshots and grading guides are never included in student responses. Question and option shuffling is deterministic per attempt, so reconnecting preserves the same presentation order.

## Answer payloads

Each batch contains a unique `clientBatchId` and up to 100 answers. `answerVersion` must increase for each edit to the same question.

- `SINGLE_CHOICE` / `TRUE_FALSE`: `{ "selectedOptionId": "<option-id>" }`
- `MULTIPLE_CHOICE`: `{ "selectedOptionIds": ["<option-id>"] }`
- `SHORT_ANSWER` / `ESSAY`: `{ "text": "..." }`

The API verifies that selected option IDs belong to the question snapshot, enforces answer size limits, ignores stale versions, and records each batch in `AttemptSyncLog`. The response includes accepted and rejected question IDs so clients only clear locally queued answers that the server acknowledged. Repeating the same batch ID returns the previous acknowledgement.

## Submission and scoring

Submission is idempotent and returns a unique receipt code. The server closes the attempt, revokes active device sessions, and creates an initial result. Single-choice, multiple-choice, true/false, and exact case-insensitive short answers are auto-graded. Essay questions remain in draft grading status for teacher review. Multiple-choice scoring is all-or-nothing in this first release.

The browser's countdown is anchored to server time, but the server deadline is authoritative. Offline answers are queued locally and retried when connectivity returns; local storage is not the source of truth.
