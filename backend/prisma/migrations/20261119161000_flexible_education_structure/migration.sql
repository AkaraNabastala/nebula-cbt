-- Optional education grouping for multi-level CBT institutions.
ALTER TABLE "classes" ADD COLUMN "department_name" VARCHAR(120);
ALTER TABLE "subjects" ADD COLUMN "category" VARCHAR(80) NOT NULL DEFAULT 'Umum';
