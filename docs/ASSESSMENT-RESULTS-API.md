# Assessment Results API

All endpoints require JWT authentication. Teacher access is restricted to the teacher's active class/subject assignments; administrators can access all results. Students can only read their own published results.

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/assessment-results` | `exam_results.read` | List accessible results |
| GET | `/assessment-results/:id` | `exam_results.read` | View result summary and essay answers |
| PATCH | `/assessment-results/:id/essays/:answerId` | `exam_results.manage` | Grade one essay answer |
| PATCH | `/assessment-results/:id/publish` | `exam_results.manage` | Publish a fully graded result |
| GET | `/student/results` | `exam_results.read_own` | List the student's published results |

Essay grading stores score and feedback in `manual_question_grades`, separate from the student's submitted answer. The API rejects grades above the question's maximum points. Result totals combine the objective score with all saved essay grades. A result remains `DRAFT` until every essay question has a grade; it becomes `GRADED` when complete and `PUBLISHED` only after a teacher or administrator publishes it.

Auto-graded attempts with no essay questions are created as `GRADED` and can be published immediately. Student endpoints expose only published results. Published results cannot be edited through the essay grading endpoint.
