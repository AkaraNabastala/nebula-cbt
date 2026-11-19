# Question Bank API

All routes require a valid JWT and the listed permission. Teacher access is additionally restricted to subjects assigned to the teacher in an active academic year. Administrators can manage all active subjects.

## Routes

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/question-banks/subjects` | `subjects.read` | Active subjects available to the signed-in user |
| GET | `/question-banks` | `question_banks.read` | List accessible banks and question counts |
| POST | `/question-banks` | `question_banks.manage` | Create a bank for an accessible subject |
| GET | `/question-banks/:id/questions` | `questions.read` | List questions, options, answer keys, and grading guides for teacher/admin workspace |
| POST | `/question-banks/:id/questions` | `questions.manage` | Create a question and its answer key |

## Create a bank

```json
{
  "name": "Persamaan Linear",
  "description": "Latihan aljabar kelas VII",
  "subjectId": "00000000-0000-4000-8000-000000000000"
}
```

## Create a question

Every question has `type`, `difficulty`, `content`, and `points`. New questions are saved with status `DRAFT`; they are not automatically added to an exam paper.

### Single choice / multiple choice

```json
{
  "type": "SINGLE_CHOICE",
  "difficulty": "MEDIUM",
  "content": "Berapakah hasil 2 + 2?",
  "points": 1,
  "options": [
    { "label": "A", "text": "3" },
    { "label": "B", "text": "4" }
  ],
  "correctLabels": ["B"],
  "explanation": "Dua ditambah dua sama dengan empat."
}
```

Use `MULTIPLE_CHOICE` when more than one option may be correct. `SINGLE_CHOICE` accepts exactly one correct label.

### True / false

Use `type: "TRUE_FALSE"` and `correctLabels: ["A"]` for Benar or `["B"]` for Salah. The API creates the two options.

### Short answer

Use `type: "SHORT_ANSWER"` and `acceptedAnswers` as a non-empty array of accepted strings.

### Essay

Use `type: "ESSAY"` and provide `gradingGuide`. Essay answers are intended for manual grading; the guide is stored with the answer key.

## Security notes

- Teacher subject scope is checked by the API, not only by the UI.
- Answer keys and grading guides are returned only by these teacher/admin protected routes; student exam delivery must use a separate projection that omits them.
- Question content and options are stored separately from answer keys to support publishing an immutable exam snapshot later.
- Matching, ordering, and file-upload question types are not part of this API.
