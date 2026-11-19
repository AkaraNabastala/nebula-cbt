# Exam Operations API

All endpoints require JWT authentication. Teacher requests are scoped to active teacher assignments; administrators can manage all classes and subjects.

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/exam-operations/options` | `exams.read` | Assessment types, academic years, subjects, classes, and teacher class-subject assignments |
| GET | `/exam-operations` | `exams.read` | List accessible exams, schedules, papers, and participant counts |
| POST | `/exam-operations` | `exams.manage`, `exam_papers.manage`, `exam_schedules.manage` | Create an exam, event, schedule, and draft paper snapshot |
| PATCH | `/exam-operations/:id/publish` | `exams.manage`, `exam_papers.manage`, `exam_schedules.manage`, `exam_participants.manage` | Publish the paper and schedule, then register active students from selected classes |

## Draft creation

A request supplies an assessment type, academic year, subject, session window, duration, class IDs, and published question IDs. The API verifies that the selected classes and questions belong to the selected academic context. Teacher access is checked against active subject/class assignments.

The API copies the selected question content and options into `ExamPaperQuestion.questionSnapshot`, while answer keys and essay grading guides go into the separate `answerKeySnapshot`. The selected question order is preserved. Student-facing delivery must read only `questionSnapshot`, never `answerKeySnapshot`.

The paper is created as a draft. The snapshot is taken at draft creation so later edits to source questions do not alter the paper. The first release does not provide in-place draft editing; create a replacement draft when the question set or schedule must change.

## Publishing

Publishing is transactional and idempotent. It changes the exam, event, schedule, and paper to published status and creates one participant record per active student enrollment in the selected classes. Duplicate participant records are skipped. The API returns the number of registered participants.

Assessment types `EXAM`, `QUIZ`, and `PRACTICE` are inserted by `npm run db:seed`.
