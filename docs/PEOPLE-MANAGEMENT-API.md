# People Management API

These routes are administrator-only in the service layer, in addition to JWT permission checks.

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/people-management/options` | `students.read`, `teachers.read`, `classes.read`, `subjects.read` | Active student/teacher profiles, active-year classes, and active subjects |
| GET | `/people-management/enrollments` | `students.read` | Student class placement history |
| POST | `/people-management/enrollments` | `students.manage` | Place an active student in an active-year class |
| PATCH | `/people-management/enrollments/:id/leave` | `students.manage` | Close an enrollment by setting `leftAt` |
| GET | `/people-management/teacher-assignments` | `teachers.read` | List teacher subject/class assignments |
| POST | `/people-management/teacher-assignments` | `teacher_assignments.manage` | Create or reactivate a teacher assignment |
| PATCH | `/people-management/teacher-assignments/:id/status` | `teacher_assignments.manage` | Activate or deactivate an assignment |

An active student can only have one active class placement in the same academic year. Teacher assignments require an active teacher profile, active subject, and class in an active academic year. Changes are written to the audit log.
