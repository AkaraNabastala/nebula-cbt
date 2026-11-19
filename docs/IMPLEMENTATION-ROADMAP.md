# Nebula CBT — Audit dan Rencana Implementasi

Tanggal audit: 2026-11-19  
Repository yang diperiksa: `AkaraNabastala/nebula-cbt`  
Basis audit: branch `main`, commit `cca633f`

## 1. Ringkasan kondisi aktual

### Sudah tersedia
- Frontend React 19 + TypeScript + Vite + Tailwind CSS.
- Tema terang/gelap, font Poppins, dan komponen workspace awal.
- Login, pemeriksaan sesi, logout, dan ganti password.
- Backend NestJS 12 dengan Prisma 7 dan PostgreSQL.
- Skema data CBT yang luas beserta dua migrasi awal.
- Role dan permission untuk ADMIN, TEACHER, STUDENT pada seed.
- Audit log untuk login, logout, dan pergantian password.
- Guard JWT, pemeriksaan status akun, token version, dan permission guard.

### Belum tersedia di backend
Pada `AppModule`, modul yang terdaftar baru `PrismaModule` dan `AuthModule`. Controller aplikasi hanya health/root dan controller autentikasi. Belum ada controller/service/module CRUD atau workflow untuk pengguna, akademik, soal, ujian, pengerjaan, penilaian, maupun laporan.

Endpoint autentikasi yang ada:
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/change-password`
- `POST /auth/logout`

Karena itu, model Prisma tidak boleh dianggap sebagai API yang sudah dapat dipakai UI. Halaman operasional harus menampilkan status belum aktif sampai endpoint dan otorisasi backend selesai.

## 2. Peta domain berdasarkan Prisma

### Identitas dan administrasi
- `User`, `UserIdentifier`, `Role`, `UserRole`, `Permission`, `RolePermission`, `LoginPolicy`
- `StudentProfile`, `TeacherProfile`
- `SchoolSettings`, `SystemSetting`, `InstallationState`, `AuditLog`

### Akademik
- `AcademicYear`
- `SchoolClass`
- `Subject`
- `StudentClass`
- `TeacherAssignment`

### Bank soal dan naskah
- `QuestionBank`, `Question`, `QuestionOption`, `QuestionAnswerKey`
- `ExamPaper`, `ExamPaperQuestion`
- Jenis soal yang didefinisikan: `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`, `SHORT_ANSWER`, `ESSAY`.
- Status soal: `DRAFT`, `REVIEWED`, `PUBLISHED`, `ARCHIVED`.

### Asesmen dan pelaksanaan
- `AssessmentType`, `AssessmentEvent`, `Exam`
- `ExamSchedule`, `ExamScheduleClass`, `SchoolRoom`, `ExamScheduleRoom`
- `ExamParticipant`, `ProctorAssignment`
- `AssessmentCardSetting`, `AssessmentParticipantToken`

### Pengerjaan, sinkronisasi, dan hasil
- `Attempt`, `AttemptAnswer`, `AttemptDeviceSession`, `AttemptSyncLog`
- `AttemptRecoveryEvent`, `AttemptSubmissionReceipt`
- `ExamResult`, `AssessmentThreshold`
- `ScoreAdjustmentPolicy`, `ScoreAdjustmentRun`, `ScoreAdjustmentItem`
- `GradingScale`, `GradingScaleLevel`
- `RankingConfiguration`, `RankingConfigurationSubject`, `RankingSnapshot`, `RankingSnapshotItem`

### Kolaborasi, dokumen, dan audit
- `ExamCollaborator`, `ExamCollaboratorPermission`
- `AssessmentEventCollaborator`, `AssessmentEventCollaboratorPermission`
- `DocumentTemplate`, `SchoolDocumentSetting`, `AuditLog`

## 3. Peta halaman yang perlu disiapkan

Halaman berikut adalah target navigasi/UX. Masing-masing tetap berstatus nonaktif sampai API terkait selesai.

### ADMIN
1. Dashboard dan ringkasan sistem.
2. Pengguna: daftar, detail, buat/edit akun, status, identifier, profil siswa/guru, role.
3. Role dan permission: katalog permission, pemetaan role, kebijakan login.
4. Akademik: tahun ajaran, kelas, mata pelajaran, siswa, guru, penempatan siswa, penugasan guru.
5. Operasional asesmen: tipe asesmen, kegiatan, ujian, jadwal, ruang, peserta, pengawas.
6. Pengaturan sekolah dan sistem.
7. Hasil, skala nilai, ambang batas, penyesuaian nilai, peringkat.
8. Dokumen dan template.
9. Audit log.

### GURU
1. Dashboard guru.
2. Kelas dan penugasan mengajar.
3. Bank soal dan editor soal.
4. Review/publikasi soal sesuai kewenangan.
5. Penyusunan naskah ujian dan snapshot versi.
6. Kegiatan asesmen, ujian, jadwal, peserta.
7. Pengawasan/proktor bila ditugaskan.
8. Penilaian jawaban dan publikasi hasil.
9. Analisis hasil, ambang batas, dan dokumen yang diizinkan.

### SISWA
1. Dashboard siswa.
2. Jadwal dan ujian tersedia.
3. Detail instruksi dan kesiapan ujian.
4. Ruang pengerjaan ujian.
5. Status simpan/sinkronisasi dan pemulihan sesi.
6. Riwayat pengerjaan.
7. Hasil dan peringkat yang sudah dipublikasikan.

## 4. Prinsip implementasi penting

- Otorisasi wajib ditegakkan backend melalui JWT dan permission, bukan hanya menyembunyikan menu frontend.
- Jangan pernah mengirim `QuestionAnswerKey` atau `answerKeySnapshot` kepada peserta sebelum penilaian selesai.
- Naskah yang sudah dipublikasikan harus menjadi snapshot immutable; perubahan soal sumber tidak mengubah ujian yang berjalan.
- Waktu mulai, deadline, dan status attempt ditentukan server.
- Penyimpanan jawaban harus memiliki acknowledgement server, versi jawaban, idempotensi submit, serta strategi retry dan pemulihan.
- Sumber kebenaran attempt dan jawaban adalah server; penyimpanan lokal hanya antrean pemulihan sementara.
- Semua operasi sensitif dan perubahan status penting dicatat di audit log.
- Setiap list API perlu pagination, filter, validasi DTO, batas ukuran payload, dan aturan akses per role/ownership.
- Jangan menampilkan data contoh seolah-olah data produksi. Empty/loading/error state harus eksplisit.
- Hindari dependency runtime baru kecuali ada kebutuhan teknis yang terbukti.

## 5. Urutan pekerjaan yang direkomendasikan

### Fase 0 — Fondasi dan kontrak
- Tetapkan pola route/layout per role.
- Tetapkan pola API client, error handling, pagination, form, dan permission-aware UI.
- Definisikan DTO dan kontrak endpoint sebelum halaman dihubungkan.
- Tambahkan test unit dan e2e untuk setiap modul backend.

### Fase 1 — Administrasi dasar
- Users, profiles, identifiers, role assignments, status akun.
- Academic years, classes, subjects, student enrollments, teacher assignments.
- UI Admin untuk pengelolaan tersebut.

### Fase 2 — Bank soal dan naskah
- Question banks, questions, options, answer keys, review workflow.
- Exam papers, versioning, publish snapshots.
- UI Guru dan administrasi terkait.

### Fase 3 — Asesmen dan jadwal
- Assessment types/events, exams, schedules, rooms, participants, proctor assignments.
- Eligibility checks dan publish workflow.

### Fase 4 — Runtime CBT
- Start/resume attempt, question package tanpa kunci jawaban, autosave, offline queue, recovery, deadline, idempotent submit, receipt.
- UI ruang ujian mobile-first dan aksesibel.

### Fase 5 — Penilaian dan pelaporan
- Auto-grading untuk jenis soal yang aman dinilai otomatis.
- Penilaian manual essay, result publication, grading scales, thresholds, score adjustment, rankings.
- Dashboard, laporan, dokumen, audit log.

### Fase 6 — Hardening dan rilis
- Uji beban yang realistis, keamanan, backup/restore, observability, accessibility, browser/device matrix.
- Verifikasi migrasi dan prosedur pemulihan sebelum produksi.

## 6. Catatan audit yang harus ditindaklanjuti

- Workspace frontend saat ini masih memakai satu shell bersama; menu Admin/Guru/Siswa belum menjadi navigasi domain yang lengkap.
- Route guard frontend mengarahkan berdasarkan role, tetapi semua endpoint domain tetap harus memiliki guard permission dan validasi ownership di backend.
- Token akses berdurasi 15 menit disimpan di sessionStorage atau localStorage sesuai pilihan remember-device. Evaluasi risiko XSS dan strategi sesi sebelum produksi; jangan menambah refresh token tanpa desain rotasi/revokasi yang jelas.
- Konfigurasi Vite mem-proxy `/api` ke backend lokal port 3000; konfigurasi deployment produksi belum tampak dalam file yang diperiksa.
- Skema database sudah jauh lebih luas daripada implementasi controller saat ini. Prioritaskan kontrak API dan transaksi domain daripada membuat UI CRUD yang tidak punya backend.

## 7. Definition of done per modul

Sebuah modul baru dianggap aktif jika:
1. Prisma schema dan migrasi konsisten.
2. Endpoint backend memiliki DTO, validasi, permission, ownership checks, transaksi, dan audit log yang sesuai.
3. Test service/controller/e2e mencakup sukses, validasi, forbidden, not found, konflik, dan kondisi batas.
4. Frontend memiliki loading, empty, error, success, dan state konfirmasi.
5. Build dan lint lulus.
6. Alur diuji terhadap backend lokal dengan data uji, bukan hanya tampilan statis.
7. Dokumentasi endpoint dan keputusan domain diperbarui.
