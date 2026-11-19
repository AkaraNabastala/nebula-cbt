
import "dotenv/config";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL belum dikonfigurasi.");
}

const pool = new Pool({ connectionString });

const roles = [
  {
    code: "ADMIN",
    name: "Administrator",
    description: "Akses penuh untuk mengelola sistem AkaraNabastala CBT.",
  },
  {
    code: "TEACHER",
    name: "Guru",
    description: "Akses pengelolaan akademik, soal, ujian, dan penilaian.",
  },
  {
    code: "STUDENT",
    name: "Siswa",
    description: "Akses peserta untuk mengikuti ujian dan melihat hasil sendiri.",
  },
];

const permissions = [
  ["dashboard.read", "Melihat dashboard", "Melihat ringkasan dashboard."],
  ["users.read", "Melihat pengguna", "Melihat data pengguna."],
  ["users.create", "Membuat pengguna", "Membuat akun pengguna."],
  ["users.update", "Mengubah pengguna", "Mengubah data pengguna."],
  ["users.status.manage", "Mengelola status pengguna", "Mengaktifkan atau menonaktifkan pengguna."],
  ["roles.read", "Melihat role", "Melihat daftar role."],
  ["roles.manage", "Mengelola role", "Membuat dan mengubah role."],
  ["permissions.read", "Melihat permission", "Melihat daftar permission."],
  ["settings.read", "Melihat pengaturan", "Melihat pengaturan sistem dan sekolah."],
  ["settings.manage", "Mengelola pengaturan", "Mengubah pengaturan sistem dan sekolah."],
  ["academic_years.read", "Melihat tahun ajaran", "Melihat tahun ajaran."],
  ["academic_years.manage", "Mengelola tahun ajaran", "Mengelola tahun ajaran."],
  ["classes.read", "Melihat kelas", "Melihat data kelas."],
  ["classes.manage", "Mengelola kelas", "Mengelola data kelas."],
  ["subjects.read", "Melihat mata pelajaran", "Melihat data mata pelajaran."],
  ["subjects.manage", "Mengelola mata pelajaran", "Mengelola data mata pelajaran."],
  ["students.read", "Melihat siswa", "Melihat data siswa."],
  ["students.manage", "Mengelola siswa", "Mengelola data siswa."],
  ["teachers.read", "Melihat guru", "Melihat data guru."],
  ["teachers.manage", "Mengelola guru", "Mengelola data guru."],
  ["teacher_assignments.manage", "Mengelola penugasan guru", "Mengelola penugasan guru dan mata pelajaran."],
  ["question_banks.read", "Melihat bank soal", "Melihat bank soal."],
  ["question_banks.manage", "Mengelola bank soal", "Membuat, mengubah, dan menghapus bank soal."],
  ["questions.read", "Melihat soal", "Melihat soal."],
  ["questions.manage", "Mengelola soal", "Membuat, mengubah, dan menghapus soal."],
  ["exam_papers.read", "Melihat paket ujian", "Melihat paket ujian."],
  ["exam_papers.manage", "Mengelola paket ujian", "Membuat dan mengubah paket ujian."],
  ["assessment_events.read", "Melihat kegiatan asesmen", "Melihat kegiatan asesmen."],
  ["assessment_events.manage", "Mengelola kegiatan asesmen", "Membuat dan mengubah kegiatan asesmen."],
  ["exams.read", "Melihat ujian", "Melihat data ujian."],
  ["exams.manage", "Mengelola ujian", "Membuat dan mengubah ujian."],
  ["exam_schedules.read", "Melihat jadwal ujian", "Melihat jadwal ujian."],
  ["exam_schedules.manage", "Mengelola jadwal ujian", "Membuat dan mengubah jadwal ujian."],
  ["exam_participants.read", "Melihat peserta ujian", "Melihat peserta ujian."],
  ["exam_participants.manage", "Mengelola peserta ujian", "Mengelola daftar peserta ujian."],
  ["exam_attempts.start", "Memulai ujian", "Memulai percobaan ujian."],
  ["exam_attempts.read_own", "Melihat percobaan sendiri", "Melihat percobaan ujian milik sendiri."],
  ["exam_attempts.submit", "Mengirim jawaban ujian", "Mengirim jawaban dan menyelesaikan ujian."],
  ["exam_results.read", "Melihat hasil ujian", "Melihat hasil ujian."],
  ["exam_results.read_own", "Melihat hasil sendiri", "Melihat hasil ujian milik sendiri."],
  ["exam_results.manage", "Mengelola hasil ujian", "Mengelola dan mempublikasikan hasil ujian."],
  ["score_adjustments.manage", "Mengelola penyesuaian nilai", "Mengelola penyesuaian nilai."],
  ["rankings.read", "Melihat peringkat", "Melihat peringkat peserta."],
  ["rankings.read_own", "Melihat peringkat sendiri", "Melihat informasi peringkat sendiri."],
  ["rankings.manage", "Mengelola peringkat", "Mengelola konfigurasi dan snapshot peringkat."],
  ["proctoring.read", "Melihat pengawasan ujian", "Melihat data pengawasan ujian."],
  ["proctoring.manage", "Mengelola pengawasan ujian", "Mengelola penugasan proktor."],
  ["documents.read", "Melihat dokumen", "Melihat dokumen dan template."],
  ["documents.manage", "Mengelola dokumen", "Mengelola template dan pengaturan dokumen."],
  ["audit_logs.read", "Melihat audit log", "Melihat catatan aktivitas sistem."],
  ["grading_scales.manage", "Mengelola skala penilaian", "Mengelola skala dan tingkat penilaian."],
];

const teacherPermissions = [
  "dashboard.read",
  "academic_years.read",
  "classes.read",
  "subjects.read",
  "students.read",
  "teachers.read",
  "teacher_assignments.manage",
  "question_banks.read",
  "question_banks.manage",
  "questions.read",
  "questions.manage",
  "exam_papers.read",
  "exam_papers.manage",
  "assessment_events.read",
  "assessment_events.manage",
  "exams.read",
  "exams.manage",
  "exam_schedules.read",
  "exam_schedules.manage",
  "exam_participants.read",
  "exam_results.read",
  "exam_results.manage",
  "score_adjustments.manage",
  "rankings.read",
  "proctoring.read",
  "proctoring.manage",
  "documents.read",
  "grading_scales.manage",
];

const studentPermissions = [
  "dashboard.read",
  "exam_schedules.read",
  "exam_attempts.start",
  "exam_attempts.read_own",
  "exam_attempts.submit",
  "exam_results.read_own",
  "rankings.read_own",
];

async function seed() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const role of roles) {
      await client.query(
        `INSERT INTO roles (id, code, name, description)
         VALUES (gen_random_uuid(), $1, $2, $3)
         ON CONFLICT (code) DO NOTHING`,
        [role.code, role.name, role.description],
      );
    }

    for (const [code, name, description] of permissions) {
      await client.query(
        `INSERT INTO permissions (id, code, name, description)
         VALUES (gen_random_uuid(), $1, $2, $3)
         ON CONFLICT (code) DO NOTHING`,
        [code, name, description],
      );
    }


    const assessmentTypes = [
      ["EXAM", "Ujian", "Asesmen terjadwal dengan paket soal."],
      ["QUIZ", "Kuis", "Asesmen singkat untuk evaluasi pembelajaran."],
      ["PRACTICE", "Latihan", "Latihan mandiri atau terbimbing."],
    ];

    for (const [code, name, description] of assessmentTypes) {
      await client.query(
        `INSERT INTO assessment_types (id, code, name, description)
         VALUES (gen_random_uuid(), $1, $2, $3)
         ON CONFLICT (code) DO NOTHING`,
        [code, name, description],
      );
    }

    const roleResult = await client.query(
      `SELECT id, code FROM roles WHERE code = ANY($1::varchar[])`,
      [roles.map((role) => role.code)],
    );

    const permissionResult = await client.query(
      `SELECT id, code FROM permissions WHERE code = ANY($1::text[])`,
      [permissions.map(([code]) => code)],
    );

    const roleIds = new Map(
      roleResult.rows.map((row) => [row.code, row.id]),
    );

    const permissionIds = new Map(
      permissionResult.rows.map((row) => [row.code, row.id]),
    );

    const assignments = {
      ADMIN: permissions.map(([code]) => code),
      TEACHER: teacherPermissions,
      STUDENT: studentPermissions,
    };

    for (const [roleCode, permissionCodes] of Object.entries(assignments)) {
      const roleId = roleIds.get(roleCode);

      if (!roleId) {
        throw new Error(`Role ${roleCode} tidak ditemukan setelah insert.`);
      }

      for (const permissionCode of permissionCodes) {
        const permissionId = permissionIds.get(permissionCode);

        if (!permissionId) {
          throw new Error(
            `Permission ${permissionCode} tidak ditemukan setelah insert.`,
          );
        }

        await client.query(
          `INSERT INTO role_permissions ("roleId", "permissionId")
           VALUES ($1, $2)
           ON CONFLICT ("roleId", "permissionId") DO NOTHING`,
          [roleId, permissionId],
        );
      }
    }

    const loginPolicies = [
      ["ADMIN", "EMAIL"],
      ["ADMIN", "USERNAME"],
      ["TEACHER", "EMAIL"],
      ["TEACHER", "USERNAME"],
      ["STUDENT", "EMAIL"],
      ["STUDENT", "USERNAME"],
    ];

    for (const [category, identifierType] of loginPolicies) {
      await client.query(
        `INSERT INTO login_policies
          (id, category, identifier_type, is_enabled, created_at, updated_at)
         VALUES
          (gen_random_uuid(), $1::"UserCategory", $2, true, NOW(), NOW())
         ON CONFLICT (category, identifier_type) DO NOTHING`,
        [category, identifierType],
      );
    }

    await client.query("COMMIT");

    console.log("Seed autentikasi berhasil.");
    console.log(`Role tersedia: ${roleResult.rowCount}`);
    console.log(`Permission katalog: ${permissionResult.rowCount}`);
    console.log("Kebijakan login: EMAIL dan USERNAME untuk 3 kategori.");
    console.log("Jenis asesmen dasar tersedia: EXAM, QUIZ, PRACTICE.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

try {
  await seed();
} catch (error) {
  console.error("Seed autentikasi gagal:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
