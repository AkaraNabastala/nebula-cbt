-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "UserCategory" AS ENUM ('ADMIN', 'TEACHER', 'STUDENT');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY');

-- CreateEnum
CREATE TYPE "QuestionDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('DRAFT', 'REVIEWED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ExamPaperStatus" AS ENUM ('DRAFT', 'REVIEWED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AssessmentEventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExamStatus" AS ENUM ('DRAFT', 'READY', 'PUBLISHED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExamScheduleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExamParticipantStatus" AS ENUM ('REGISTERED', 'CHECKED_IN', 'IN_PROGRESS', 'SUBMITTED', 'ABSENT');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED', 'INVALIDATED');

-- CreateEnum
CREATE TYPE "DeviceSessionStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AttemptSyncStatus" AS ENUM ('RECEIVED', 'PARTIALLY_ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AttemptRecoveryType" AS ENUM ('DEVICE_REPLACED', 'SESSION_RESTORED', 'MANUAL_RECOVERY');

-- CreateEnum
CREATE TYPE "ExamResultStatus" AS ENUM ('DRAFT', 'GRADED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "ScoreAdjustmentMethod" AS ENUM ('FLOOR_TO_KKM', 'PROPORTIONAL', 'MANUAL');

-- CreateEnum
CREATE TYPE "RankingType" AS ENUM ('SUBJECT_WITHIN_CLASS', 'SUBJECT_ACROSS_CLASSES', 'OVERALL_WITHIN_CLASS', 'OVERALL_ACROSS_CLASSES');

-- CreateEnum
CREATE TYPE "RankingScoreSource" AS ENUM ('RAW_SCORE', 'ADJUSTED_SCORE', 'FINAL_SCORE');

-- CreateEnum
CREATE TYPE "RankingTieMethod" AS ENUM ('COMPETITION', 'DENSE');

-- CreateEnum
CREATE TYPE "RankingSnapshotStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "school_settings" (
    "id" VARCHAR(20) NOT NULL DEFAULT 'main',
    "name" VARCHAR(150) NOT NULL,
    "npsn" VARCHAR(20),
    "address" TEXT,
    "phone" VARCHAR(30),
    "email" VARCHAR(150),
    "logo_path" VARCHAR(255),
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'Asia/Jakarta',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "school_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "must_change_password" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_identifiers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "identifier_type" VARCHAR(40) NOT NULL,
    "identifier_value" VARCHAR(191) NOT NULL,
    "normalized_value" VARCHAR(191) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_identifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "login_policies" (
    "id" UUID NOT NULL,
    "category" "UserCategory" NOT NULL,
    "identifier_type" VARCHAR(40) NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "login_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "gender" "Gender",
    "birth_place" VARCHAR(100),
    "birth_date" DATE,
    "address" TEXT,
    "guardian_name" VARCHAR(150),
    "guardian_phone" VARCHAR(30),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "gender" "Gender",
    "birth_place" VARCHAR(100),
    "birth_date" DATE,
    "address" TEXT,
    "phone" VARCHAR(30),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "teacher_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" UUID NOT NULL,
    "name" VARCHAR(30) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "grade_level" INTEGER NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "homeroom_teacher_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" UUID NOT NULL,
    "code" VARCHAR(30),
    "name" VARCHAR(120) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_classes" (
    "id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "joined_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMPTZ(3),

    CONSTRAINT "student_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_assignments" (
    "id" UUID NOT NULL,
    "teacher_profile_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "assigned_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_banks" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subjectId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "questionBankId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "type" "QuestionType" NOT NULL,
    "difficulty" "QuestionDifficulty" NOT NULL DEFAULT 'MEDIUM',
    "content" JSONB NOT NULL,
    "explanation" TEXT,
    "defaultPoints" DECIMAL(8,2) NOT NULL DEFAULT 1.00,
    "status" "QuestionStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_answer_keys" (
    "id" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "answerData" JSONB NOT NULL,
    "gradingGuide" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_answer_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_papers" (
    "id" UUID NOT NULL,
    "versionGroupId" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subjectId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "status" "ExamPaperStatus" NOT NULL DEFAULT 'DRAFT',
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "maxScore" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
    "shuffleOptions" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_papers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_paper_questions" (
    "id" UUID NOT NULL,
    "examPaperId" UUID NOT NULL,
    "sourceQuestionId" UUID,
    "questionSnapshot" JSONB NOT NULL,
    "answerKeySnapshot" JSONB NOT NULL,
    "points" DECIMAL(8,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_paper_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_types" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_events" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "assessmentTypeId" UUID NOT NULL,
    "academicYearId" UUID NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "AssessmentEventStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exams" (
    "id" UUID NOT NULL,
    "assessmentEventId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ExamStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_rooms" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "capacity" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_schedules" (
    "id" UUID NOT NULL,
    "examId" UUID NOT NULL,
    "defaultExamPaperId" UUID,
    "sessionName" TEXT NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "status" "ExamScheduleStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_schedule_classes" (
    "id" UUID NOT NULL,
    "examScheduleId" UUID NOT NULL,
    "schoolClassId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_schedule_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_schedule_rooms" (
    "id" UUID NOT NULL,
    "examScheduleId" UUID NOT NULL,
    "schoolRoomId" UUID NOT NULL,
    "capacity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_schedule_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_participants" (
    "id" UUID NOT NULL,
    "examScheduleId" UUID NOT NULL,
    "studentProfileId" UUID NOT NULL,
    "scheduleRoomId" UUID,
    "examPaperId" UUID NOT NULL,
    "status" "ExamParticipantStatus" NOT NULL DEFAULT 'REGISTERED',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolClassId" UUID NOT NULL,

    CONSTRAINT "exam_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempts" (
    "id" UUID NOT NULL,
    "participantId" UUID NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL,
    "deadlineAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "serverVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_answers" (
    "id" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "examPaperQuestionId" UUID NOT NULL,
    "answerData" JSONB NOT NULL,
    "answerVersion" INTEGER NOT NULL DEFAULT 1,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attempt_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_device_sessions" (
    "id" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "deviceFingerprintHash" TEXT NOT NULL,
    "sessionTokenHash" TEXT NOT NULL,
    "status" "DeviceSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attempt_device_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_sync_logs" (
    "id" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "clientBatchId" TEXT NOT NULL,
    "status" "AttemptSyncStatus" NOT NULL,
    "receivedCount" INTEGER NOT NULL DEFAULT 0,
    "acceptedCount" INTEGER NOT NULL DEFAULT 0,
    "rejectedCount" INTEGER NOT NULL DEFAULT 0,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" JSONB,

    CONSTRAINT "attempt_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_recovery_events" (
    "id" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "actorUserId" UUID NOT NULL,
    "eventType" "AttemptRecoveryType" NOT NULL,
    "reason" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attempt_recovery_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_submission_receipts" (
    "id" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "receiptCode" TEXT NOT NULL,
    "answerCount" INTEGER NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attempt_submission_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_results" (
    "id" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "academicYearId" UUID NOT NULL,
    "schoolClassId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "rawScore" DECIMAL(10,2) NOT NULL,
    "adjustedScore" DECIMAL(10,2),
    "finalScore" DECIMAL(10,2) NOT NULL,
    "maxScore" DECIMAL(10,2) NOT NULL,
    "status" "ExamResultStatus" NOT NULL DEFAULT 'DRAFT',
    "gradedById" UUID,
    "gradedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gradingScaleLevelId" UUID,

    CONSTRAINT "exam_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_thresholds" (
    "id" UUID NOT NULL,
    "academicYearId" UUID NOT NULL,
    "schoolClassId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "minimumScore" DECIMAL(5,2) NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveUntil" DATE,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_thresholds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "score_adjustment_policies" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "method" "ScoreAdjustmentMethod" NOT NULL,
    "parameters" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "score_adjustment_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "score_adjustment_runs" (
    "id" UUID NOT NULL,
    "policyId" UUID NOT NULL,
    "academicYearId" UUID NOT NULL,
    "schoolClassId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "score_adjustment_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "score_adjustment_items" (
    "id" UUID NOT NULL,
    "runId" UUID NOT NULL,
    "examResultId" UUID NOT NULL,
    "sourceScore" DECIMAL(10,2) NOT NULL,
    "adjustedScore" DECIMAL(10,2) NOT NULL,
    "delta" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "score_adjustment_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_configurations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "rankingType" "RankingType" NOT NULL,
    "scoreSource" "RankingScoreSource" NOT NULL DEFAULT 'FINAL_SCORE',
    "tieMethod" "RankingTieMethod" NOT NULL DEFAULT 'COMPETITION',
    "academicYearId" UUID NOT NULL,
    "targetClassId" UUID,
    "subjectId" UUID,
    "periodKey" TEXT,
    "periodLabel" TEXT,
    "minimumCoveragePercent" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ranking_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_configuration_subjects" (
    "id" UUID NOT NULL,
    "configurationId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "weight" DECIMAL(8,3) NOT NULL DEFAULT 1,

    CONSTRAINT "ranking_configuration_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_snapshots" (
    "id" UUID NOT NULL,
    "configurationId" UUID NOT NULL,
    "generatedById" UUID NOT NULL,
    "status" "RankingSnapshotStatus" NOT NULL DEFAULT 'DRAFT',
    "periodLabel" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_snapshot_items" (
    "id" UUID NOT NULL,
    "snapshotId" UUID NOT NULL,
    "studentProfileId" UUID NOT NULL,
    "schoolClassId" UUID,
    "rank" INTEGER NOT NULL,
    "score" DECIMAL(10,2) NOT NULL,
    "subjectCount" INTEGER NOT NULL DEFAULT 0,
    "availableSubjectCount" INTEGER NOT NULL DEFAULT 0,
    "coveragePercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_snapshot_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "exam_collaborators" (
    "id" UUID NOT NULL,
    "examId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_collaborator_permissions" (
    "collaboratorId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,

    CONSTRAINT "exam_collaborator_permissions_pkey" PRIMARY KEY ("collaboratorId","permissionId")
);

-- CreateTable
CREATE TABLE "assessment_event_collaborators" (
    "id" UUID NOT NULL,
    "assessmentEventId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_event_collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_event_collaborator_permissions" (
    "collaboratorId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,

    CONSTRAINT "assessment_event_collaborator_permissions_pkey" PRIMARY KEY ("collaboratorId","permissionId")
);

-- CreateTable
CREATE TABLE "proctor_assignments" (
    "id" UUID NOT NULL,
    "teacherProfileId" UUID NOT NULL,
    "examScheduleId" UUID NOT NULL,
    "scheduleRoomId" UUID,
    "assignedById" UUID NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proctor_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_card_settings" (
    "id" UUID NOT NULL,
    "assessmentEventId" UUID NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "cardWidthMm" INTEGER NOT NULL DEFAULT 90,
    "cardHeightMm" INTEGER NOT NULL DEFAULT 55,
    "showStudentPhoto" BOOLEAN NOT NULL DEFAULT false,
    "showQrCode" BOOLEAN NOT NULL DEFAULT true,
    "showScheduleOnBack" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_card_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_participant_tokens" (
    "id" UUID NOT NULL,
    "assessmentEventId" UUID NOT NULL,
    "studentProfileId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_participant_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_templates" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "templateData" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "schoolSettingsId" TEXT NOT NULL DEFAULT 'main',
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_document_settings" (
    "id" UUID NOT NULL,
    "schoolSettingsId" TEXT NOT NULL DEFAULT 'main',
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_document_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actorUserId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT,
    "oldData" JSONB,
    "newData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installation_state" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "installationCompleted" BOOLEAN NOT NULL DEFAULT false,
    "installerLocked" BOOLEAN NOT NULL DEFAULT false,
    "environment" TEXT,
    "installedAt" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installation_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grading_scales" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "academicYearId" UUID,
    "subjectId" UUID,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grading_scales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grading_scale_levels" (
    "id" UUID NOT NULL,
    "gradingScaleId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "minimumScore" DECIMAL(5,2) NOT NULL,
    "maximumScore" DECIMAL(5,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "grading_scale_levels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_identifiers_normalized_value_key" ON "user_identifiers"("normalized_value");

-- CreateIndex
CREATE INDEX "user_identifiers_user_id_idx" ON "user_identifiers"("user_id");

-- CreateIndex
CREATE INDEX "user_identifiers_identifier_type_idx" ON "user_identifiers"("identifier_type");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "login_policies_category_identifier_type_key" ON "login_policies"("category", "identifier_type");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_user_id_key" ON "student_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_profiles_user_id_key" ON "teacher_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_name_key" ON "academic_years"("name");

-- CreateIndex
CREATE INDEX "classes_academic_year_id_idx" ON "classes"("academic_year_id");

-- CreateIndex
CREATE INDEX "classes_homeroom_teacher_id_idx" ON "classes"("homeroom_teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "classes_name_academic_year_id_key" ON "classes"("name", "academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");

-- CreateIndex
CREATE INDEX "student_classes_class_id_idx" ON "student_classes"("class_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_classes_student_profile_id_class_id_key" ON "student_classes"("student_profile_id", "class_id");

-- CreateIndex
CREATE INDEX "teacher_assignments_teacher_profile_id_idx" ON "teacher_assignments"("teacher_profile_id");

-- CreateIndex
CREATE INDEX "teacher_assignments_subject_id_class_id_idx" ON "teacher_assignments"("subject_id", "class_id");

-- CreateIndex
CREATE INDEX "teacher_assignments_class_id_idx" ON "teacher_assignments"("class_id");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_assignments_teacher_profile_id_subject_id_class_id_key" ON "teacher_assignments"("teacher_profile_id", "subject_id", "class_id");

-- CreateIndex
CREATE INDEX "question_banks_subjectId_idx" ON "question_banks"("subjectId");

-- CreateIndex
CREATE INDEX "question_banks_createdById_idx" ON "question_banks"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "question_banks_subjectId_name_key" ON "question_banks"("subjectId", "name");

-- CreateIndex
CREATE INDEX "questions_questionBankId_status_idx" ON "questions"("questionBankId", "status");

-- CreateIndex
CREATE INDEX "questions_createdById_idx" ON "questions"("createdById");

-- CreateIndex
CREATE INDEX "questions_type_idx" ON "questions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "question_options_questionId_label_key" ON "question_options"("questionId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "question_options_questionId_sortOrder_key" ON "question_options"("questionId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "question_answer_keys_questionId_key" ON "question_answer_keys"("questionId");

-- CreateIndex
CREATE INDEX "exam_papers_subjectId_status_idx" ON "exam_papers"("subjectId", "status");

-- CreateIndex
CREATE INDEX "exam_papers_createdById_idx" ON "exam_papers"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "exam_papers_versionGroupId_version_key" ON "exam_papers"("versionGroupId", "version");

-- CreateIndex
CREATE INDEX "exam_paper_questions_sourceQuestionId_idx" ON "exam_paper_questions"("sourceQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_paper_questions_examPaperId_sortOrder_key" ON "exam_paper_questions"("examPaperId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_types_code_key" ON "assessment_types"("code");

-- CreateIndex
CREATE INDEX "assessment_events_academicYearId_status_idx" ON "assessment_events"("academicYearId", "status");

-- CreateIndex
CREATE INDEX "assessment_events_assessmentTypeId_idx" ON "assessment_events"("assessmentTypeId");

-- CreateIndex
CREATE INDEX "assessment_events_startDate_endDate_idx" ON "assessment_events"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "exams_assessmentEventId_idx" ON "exams"("assessmentEventId");

-- CreateIndex
CREATE INDEX "exams_subjectId_idx" ON "exams"("subjectId");

-- CreateIndex
CREATE INDEX "exams_status_idx" ON "exams"("status");

-- CreateIndex
CREATE UNIQUE INDEX "school_rooms_name_key" ON "school_rooms"("name");

-- CreateIndex
CREATE INDEX "exam_schedules_examId_startsAt_idx" ON "exam_schedules"("examId", "startsAt");

-- CreateIndex
CREATE INDEX "exam_schedules_status_idx" ON "exam_schedules"("status");

-- CreateIndex
CREATE INDEX "exam_schedule_classes_schoolClassId_idx" ON "exam_schedule_classes"("schoolClassId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_schedule_classes_examScheduleId_schoolClassId_key" ON "exam_schedule_classes"("examScheduleId", "schoolClassId");

-- CreateIndex
CREATE INDEX "exam_schedule_rooms_schoolRoomId_idx" ON "exam_schedule_rooms"("schoolRoomId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_schedule_rooms_examScheduleId_schoolRoomId_key" ON "exam_schedule_rooms"("examScheduleId", "schoolRoomId");

-- CreateIndex
CREATE INDEX "exam_participants_studentProfileId_idx" ON "exam_participants"("studentProfileId");

-- CreateIndex
CREATE INDEX "exam_participants_scheduleRoomId_idx" ON "exam_participants"("scheduleRoomId");

-- CreateIndex
CREATE INDEX "exam_participants_examPaperId_idx" ON "exam_participants"("examPaperId");

-- CreateIndex
CREATE INDEX "exam_participants_status_idx" ON "exam_participants"("status");

-- CreateIndex
CREATE UNIQUE INDEX "exam_participants_examScheduleId_studentProfileId_key" ON "exam_participants"("examScheduleId", "studentProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "attempts_participantId_key" ON "attempts"("participantId");

-- CreateIndex
CREATE INDEX "attempts_status_deadlineAt_idx" ON "attempts"("status", "deadlineAt");

-- CreateIndex
CREATE INDEX "attempt_answers_attemptId_receivedAt_idx" ON "attempt_answers"("attemptId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_answers_attemptId_examPaperQuestionId_key" ON "attempt_answers"("attemptId", "examPaperQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_device_sessions_sessionTokenHash_key" ON "attempt_device_sessions"("sessionTokenHash");

-- CreateIndex
CREATE INDEX "attempt_device_sessions_attemptId_status_idx" ON "attempt_device_sessions"("attemptId", "status");

-- CreateIndex
CREATE INDEX "attempt_sync_logs_attemptId_receivedAt_idx" ON "attempt_sync_logs"("attemptId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_sync_logs_attemptId_clientBatchId_key" ON "attempt_sync_logs"("attemptId", "clientBatchId");

-- CreateIndex
CREATE INDEX "attempt_recovery_events_attemptId_createdAt_idx" ON "attempt_recovery_events"("attemptId", "createdAt");

-- CreateIndex
CREATE INDEX "attempt_recovery_events_actorUserId_idx" ON "attempt_recovery_events"("actorUserId");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_submission_receipts_attemptId_key" ON "attempt_submission_receipts"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_submission_receipts_receiptCode_key" ON "attempt_submission_receipts"("receiptCode");

-- CreateIndex
CREATE UNIQUE INDEX "exam_results_attemptId_key" ON "exam_results"("attemptId");

-- CreateIndex
CREATE INDEX "exam_results_academicYearId_schoolClassId_subjectId_idx" ON "exam_results"("academicYearId", "schoolClassId", "subjectId");

-- CreateIndex
CREATE INDEX "exam_results_status_publishedAt_idx" ON "exam_results"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "assessment_thresholds_academicYearId_schoolClassId_subjectI_idx" ON "assessment_thresholds"("academicYearId", "schoolClassId", "subjectId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "score_adjustment_runs_academicYearId_schoolClassId_subjectI_idx" ON "score_adjustment_runs"("academicYearId", "schoolClassId", "subjectId");

-- CreateIndex
CREATE INDEX "score_adjustment_runs_createdById_idx" ON "score_adjustment_runs"("createdById");

-- CreateIndex
CREATE INDEX "score_adjustment_items_examResultId_idx" ON "score_adjustment_items"("examResultId");

-- CreateIndex
CREATE UNIQUE INDEX "score_adjustment_items_runId_examResultId_key" ON "score_adjustment_items"("runId", "examResultId");

-- CreateIndex
CREATE INDEX "ranking_configurations_academicYearId_rankingType_isActive_idx" ON "ranking_configurations"("academicYearId", "rankingType", "isActive");

-- CreateIndex
CREATE INDEX "ranking_configurations_targetClassId_idx" ON "ranking_configurations"("targetClassId");

-- CreateIndex
CREATE INDEX "ranking_configurations_subjectId_idx" ON "ranking_configurations"("subjectId");

-- CreateIndex
CREATE INDEX "ranking_configuration_subjects_subjectId_idx" ON "ranking_configuration_subjects"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "ranking_configuration_subjects_configurationId_subjectId_key" ON "ranking_configuration_subjects"("configurationId", "subjectId");

-- CreateIndex
CREATE INDEX "ranking_snapshots_configurationId_generatedAt_idx" ON "ranking_snapshots"("configurationId", "generatedAt");

-- CreateIndex
CREATE INDEX "ranking_snapshots_status_publishedAt_idx" ON "ranking_snapshots"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "ranking_snapshot_items_snapshotId_rank_idx" ON "ranking_snapshot_items"("snapshotId", "rank");

-- CreateIndex
CREATE INDEX "ranking_snapshot_items_studentProfileId_idx" ON "ranking_snapshot_items"("studentProfileId");

-- CreateIndex
CREATE INDEX "ranking_snapshot_items_schoolClassId_idx" ON "ranking_snapshot_items"("schoolClassId");

-- CreateIndex
CREATE UNIQUE INDEX "ranking_snapshot_items_snapshotId_studentProfileId_key" ON "ranking_snapshot_items"("snapshotId", "studentProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "exam_collaborators_examId_userId_key" ON "exam_collaborators"("examId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_event_collaborators_assessmentEventId_userId_key" ON "assessment_event_collaborators"("assessmentEventId", "userId");

-- CreateIndex
CREATE INDEX "proctor_assignments_examScheduleId_scheduleRoomId_idx" ON "proctor_assignments"("examScheduleId", "scheduleRoomId");

-- CreateIndex
CREATE INDEX "proctor_assignments_teacherProfileId_startsAt_endsAt_idx" ON "proctor_assignments"("teacherProfileId", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_card_settings_assessmentEventId_key" ON "assessment_card_settings"("assessmentEventId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_participant_tokens_tokenHash_key" ON "assessment_participant_tokens"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "document_templates_code_key" ON "document_templates"("code");

-- CreateIndex
CREATE INDEX "document_templates_isActive_idx" ON "document_templates"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "school_document_settings_schoolSettingsId_key_key" ON "school_document_settings"("schoolSettingsId", "key");

-- CreateIndex
CREATE INDEX "audit_logs_actorUserId_createdAt_idx" ON "audit_logs"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "grading_scales_academicYearId_subjectId_isActive_idx" ON "grading_scales"("academicYearId", "subjectId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "grading_scale_levels_gradingScaleId_label_key" ON "grading_scale_levels"("gradingScaleId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "grading_scale_levels_gradingScaleId_sortOrder_key" ON "grading_scale_levels"("gradingScaleId", "sortOrder");

-- AddForeignKey
ALTER TABLE "user_identifiers" ADD CONSTRAINT "user_identifiers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_homeroom_teacher_id_fkey" FOREIGN KEY ("homeroom_teacher_id") REFERENCES "teacher_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_classes" ADD CONSTRAINT "student_classes_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_classes" ADD CONSTRAINT "student_classes_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_teacher_profile_id_fkey" FOREIGN KEY ("teacher_profile_id") REFERENCES "teacher_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_banks" ADD CONSTRAINT "question_banks_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_banks" ADD CONSTRAINT "question_banks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_questionBankId_fkey" FOREIGN KEY ("questionBankId") REFERENCES "question_banks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_answer_keys" ADD CONSTRAINT "question_answer_keys_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_papers" ADD CONSTRAINT "exam_papers_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_papers" ADD CONSTRAINT "exam_papers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_paper_questions" ADD CONSTRAINT "exam_paper_questions_examPaperId_fkey" FOREIGN KEY ("examPaperId") REFERENCES "exam_papers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_paper_questions" ADD CONSTRAINT "exam_paper_questions_sourceQuestionId_fkey" FOREIGN KEY ("sourceQuestionId") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_events" ADD CONSTRAINT "assessment_events_assessmentTypeId_fkey" FOREIGN KEY ("assessmentTypeId") REFERENCES "assessment_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_events" ADD CONSTRAINT "assessment_events_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_events" ADD CONSTRAINT "assessment_events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_assessmentEventId_fkey" FOREIGN KEY ("assessmentEventId") REFERENCES "assessment_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_defaultExamPaperId_fkey" FOREIGN KEY ("defaultExamPaperId") REFERENCES "exam_papers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_schedule_classes" ADD CONSTRAINT "exam_schedule_classes_examScheduleId_fkey" FOREIGN KEY ("examScheduleId") REFERENCES "exam_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_schedule_classes" ADD CONSTRAINT "exam_schedule_classes_schoolClassId_fkey" FOREIGN KEY ("schoolClassId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_schedule_rooms" ADD CONSTRAINT "exam_schedule_rooms_examScheduleId_fkey" FOREIGN KEY ("examScheduleId") REFERENCES "exam_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_schedule_rooms" ADD CONSTRAINT "exam_schedule_rooms_schoolRoomId_fkey" FOREIGN KEY ("schoolRoomId") REFERENCES "school_rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_participants" ADD CONSTRAINT "exam_participants_examScheduleId_fkey" FOREIGN KEY ("examScheduleId") REFERENCES "exam_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_participants" ADD CONSTRAINT "exam_participants_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_participants" ADD CONSTRAINT "exam_participants_scheduleRoomId_fkey" FOREIGN KEY ("scheduleRoomId") REFERENCES "exam_schedule_rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_participants" ADD CONSTRAINT "exam_participants_examPaperId_fkey" FOREIGN KEY ("examPaperId") REFERENCES "exam_papers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_participants" ADD CONSTRAINT "exam_participants_schoolClassId_fkey" FOREIGN KEY ("schoolClassId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "exam_participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_examPaperQuestionId_fkey" FOREIGN KEY ("examPaperQuestionId") REFERENCES "exam_paper_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_device_sessions" ADD CONSTRAINT "attempt_device_sessions_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_sync_logs" ADD CONSTRAINT "attempt_sync_logs_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_recovery_events" ADD CONSTRAINT "attempt_recovery_events_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_recovery_events" ADD CONSTRAINT "attempt_recovery_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_submission_receipts" ADD CONSTRAINT "attempt_submission_receipts_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_schoolClassId_fkey" FOREIGN KEY ("schoolClassId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_gradedById_fkey" FOREIGN KEY ("gradedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_gradingScaleLevelId_fkey" FOREIGN KEY ("gradingScaleLevelId") REFERENCES "grading_scale_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_thresholds" ADD CONSTRAINT "assessment_thresholds_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_thresholds" ADD CONSTRAINT "assessment_thresholds_schoolClassId_fkey" FOREIGN KEY ("schoolClassId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_thresholds" ADD CONSTRAINT "assessment_thresholds_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_thresholds" ADD CONSTRAINT "assessment_thresholds_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_adjustment_runs" ADD CONSTRAINT "score_adjustment_runs_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "score_adjustment_policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_adjustment_runs" ADD CONSTRAINT "score_adjustment_runs_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_adjustment_runs" ADD CONSTRAINT "score_adjustment_runs_schoolClassId_fkey" FOREIGN KEY ("schoolClassId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_adjustment_runs" ADD CONSTRAINT "score_adjustment_runs_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_adjustment_runs" ADD CONSTRAINT "score_adjustment_runs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_adjustment_items" ADD CONSTRAINT "score_adjustment_items_runId_fkey" FOREIGN KEY ("runId") REFERENCES "score_adjustment_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_adjustment_items" ADD CONSTRAINT "score_adjustment_items_examResultId_fkey" FOREIGN KEY ("examResultId") REFERENCES "exam_results"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_configurations" ADD CONSTRAINT "ranking_configurations_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_configurations" ADD CONSTRAINT "ranking_configurations_targetClassId_fkey" FOREIGN KEY ("targetClassId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_configurations" ADD CONSTRAINT "ranking_configurations_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_configurations" ADD CONSTRAINT "ranking_configurations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_configuration_subjects" ADD CONSTRAINT "ranking_configuration_subjects_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "ranking_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_configuration_subjects" ADD CONSTRAINT "ranking_configuration_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_snapshots" ADD CONSTRAINT "ranking_snapshots_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "ranking_configurations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_snapshots" ADD CONSTRAINT "ranking_snapshots_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_snapshot_items" ADD CONSTRAINT "ranking_snapshot_items_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "ranking_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_snapshot_items" ADD CONSTRAINT "ranking_snapshot_items_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_snapshot_items" ADD CONSTRAINT "ranking_snapshot_items_schoolClassId_fkey" FOREIGN KEY ("schoolClassId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_collaborators" ADD CONSTRAINT "exam_collaborators_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_collaborators" ADD CONSTRAINT "exam_collaborators_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_collaborator_permissions" ADD CONSTRAINT "exam_collaborator_permissions_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "exam_collaborators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_collaborator_permissions" ADD CONSTRAINT "exam_collaborator_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_event_collaborators" ADD CONSTRAINT "assessment_event_collaborators_assessmentEventId_fkey" FOREIGN KEY ("assessmentEventId") REFERENCES "assessment_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_event_collaborators" ADD CONSTRAINT "assessment_event_collaborators_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_event_collaborator_permissions" ADD CONSTRAINT "assessment_event_collaborator_permissions_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "assessment_event_collaborators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_event_collaborator_permissions" ADD CONSTRAINT "assessment_event_collaborator_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proctor_assignments" ADD CONSTRAINT "proctor_assignments_teacherProfileId_fkey" FOREIGN KEY ("teacherProfileId") REFERENCES "teacher_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proctor_assignments" ADD CONSTRAINT "proctor_assignments_examScheduleId_fkey" FOREIGN KEY ("examScheduleId") REFERENCES "exam_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proctor_assignments" ADD CONSTRAINT "proctor_assignments_scheduleRoomId_fkey" FOREIGN KEY ("scheduleRoomId") REFERENCES "exam_schedule_rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proctor_assignments" ADD CONSTRAINT "proctor_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_card_settings" ADD CONSTRAINT "assessment_card_settings_assessmentEventId_fkey" FOREIGN KEY ("assessmentEventId") REFERENCES "assessment_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_participant_tokens" ADD CONSTRAINT "assessment_participant_tokens_assessmentEventId_fkey" FOREIGN KEY ("assessmentEventId") REFERENCES "assessment_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_participant_tokens" ADD CONSTRAINT "assessment_participant_tokens_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_schoolSettingsId_fkey" FOREIGN KEY ("schoolSettingsId") REFERENCES "school_settings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_document_settings" ADD CONSTRAINT "school_document_settings_schoolSettingsId_fkey" FOREIGN KEY ("schoolSettingsId") REFERENCES "school_settings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_document_settings" ADD CONSTRAINT "school_document_settings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grading_scales" ADD CONSTRAINT "grading_scales_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grading_scales" ADD CONSTRAINT "grading_scales_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grading_scales" ADD CONSTRAINT "grading_scales_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grading_scale_levels" ADD CONSTRAINT "grading_scale_levels_gradingScaleId_fkey" FOREIGN KEY ("gradingScaleId") REFERENCES "grading_scales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Maksimal satu tahun ajaran aktif
CREATE UNIQUE INDEX "academic_years_one_active_idx"
ON "academic_years" ("is_active")
WHERE "is_active" = true;

-- Maksimal satu sesi perangkat aktif per attempt
CREATE UNIQUE INDEX "attempt_device_sessions_one_active_idx"
ON "attempt_device_sessions" ("attemptId")
WHERE "status" = 'ACTIVE';

-- Maksimal satu token QR yang belum dicabut per siswa per event
CREATE UNIQUE INDEX "assessment_participant_tokens_one_active_idx"
ON "assessment_participant_tokens" ("assessmentEventId", "studentProfileId")
WHERE "revokedAt" IS NULL;
