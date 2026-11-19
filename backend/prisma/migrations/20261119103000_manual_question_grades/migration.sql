-- CreateTable
CREATE TABLE "manual_question_grades" (
    "id" UUID NOT NULL,
    "examResultId" UUID NOT NULL,
    "attemptAnswerId" UUID NOT NULL,
    "gradedById" UUID NOT NULL,
    "score" DECIMAL(8,2) NOT NULL,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manual_question_grades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "manual_question_grades_attemptAnswerId_key" ON "manual_question_grades"("attemptAnswerId");

-- CreateIndex
CREATE INDEX "manual_question_grades_examResultId_idx" ON "manual_question_grades"("examResultId");

-- CreateIndex
CREATE INDEX "manual_question_grades_gradedById_idx" ON "manual_question_grades"("gradedById");

-- AddForeignKey
ALTER TABLE "manual_question_grades" ADD CONSTRAINT "manual_question_grades_examResultId_fkey" FOREIGN KEY ("examResultId") REFERENCES "exam_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manual_question_grades" ADD CONSTRAINT "manual_question_grades_attemptAnswerId_fkey" FOREIGN KEY ("attemptAnswerId") REFERENCES "attempt_answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manual_question_grades" ADD CONSTRAINT "manual_question_grades_gradedById_fkey" FOREIGN KEY ("gradedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
