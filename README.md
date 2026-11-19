# Nebula CBT

Nebula CBT adalah aplikasi *computer-based test* untuk administrator sekolah, guru, dan siswa. Repositori ini berisi frontend React/Vite dan API NestJS dengan PostgreSQL serta Prisma.

## Modul yang tersedia

- **Autentikasi dan akun:** login, logout, ganti password, kontrol status akun, role, permission, dan pencatatan login.
- **Administrasi sekolah:** pengguna, tahun ajaran, mata pelajaran, kelas, penempatan siswa, dan penugasan guru.
- **Bank soal:** bank soal per mata pelajaran, lima tipe soal (pilihan tunggal, pilihan kompleks, benar/salah, jawaban singkat, esai), kunci jawaban, pedoman penilaian, dan alur draf → ditinjau → terbit.
- **Operasi ujian:** penyusunan ujian dan paket snapshot soal, pemilihan kelas/peserta, jadwal, pengacakan soal/opsi yang konsisten per percobaan, dan penerbitan.
- **Ruang ujian siswa:** validasi peserta di server, batas waktu dari server, sinkronisasi jawaban berkala, antrean jawaban lokal saat offline, pemulihan sesi, dan bukti pengiriman idempoten.
- **Penilaian:** koreksi otomatis untuk tipe objektif/jawaban singkat, penilaian manual esai, dan penerbitan hasil.
- **Audit log:** riwayat perubahan penting dan autentikasi.

## Persyaratan lokal

- Node.js 24 dan npm.
- PostgreSQL 16 atau versi PostgreSQL yang kompatibel.
- Dua terminal untuk menjalankan API dan frontend secara bersamaan.

## Menyiapkan database dan API

Jalankan dari root repositori:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` dan isi `DATABASE_URL` sesuai database lokal. Ganti `JWT_ACCESS_SECRET` dengan nilai acak yang panjang (minimal 32 karakter). Jangan commit file `.env` atau membagikan nilainya.

Kemudian jalankan:

```bash
npm ci
npx prisma migrate deploy --config prisma7.config.ts
npm run db:seed
npm run db:bootstrap-admin
npm run start:dev
```

Perintah bootstrap akan meminta nama, email, dan password awal administrator di terminal. Password minimal 12 karakter. Perintah ini hanya dapat membuat administrator awal jika belum ada akun ADMIN; akun awal diwajibkan mengganti password saat login pertama.

API berjalan pada `http://localhost:3000`. Endpoint root `/` digunakan untuk pemeriksaan kesehatan API.

## Menjalankan frontend

Buka terminal kedua dari root repositori:

```bash
cp .env.example .env
npm ci
npm run dev
```

Frontend berjalan pada `http://localhost:5173`. Vite meneruskan permintaan `/api` ke API lokal di `http://127.0.0.1:3000`, sehingga konfigurasi lokal bawaan tidak membutuhkan URL API publik.

## Pemeriksaan otomatis

Frontend, dari root repositori:

```bash
npm run lint
npm run build
```

Backend, dari folder `backend`:

```bash
npx prisma generate --config prisma7.config.ts
npm run lint
npm test
npm run test:e2e
npm run build
```

GitHub Actions menjalankan lint, unit test, e2e test, dan build untuk kedua bagian pada pull request ke `main`.

## Alur uji fungsi utama

1. Login sebagai administrator awal dan ganti password.
2. Buat tahun ajaran, mata pelajaran, kelas, akun guru, dan akun siswa.
3. Tempatkan siswa ke kelas dan tugaskan guru ke mata pelajaran/kelas.
4. Login sebagai guru, buat bank soal dan soal. Ubah status soal dari Draf menjadi Ditinjau, lalu Terbit.
5. Buat ujian, pilih kelas dan soal terbit, tentukan waktu/durasi, lalu terbitkan.
6. Login sebagai siswa yang terdaftar pada kelas tersebut. Mulai ujian, isi jawaban, periksa status sinkronisasi, lalu kirim.
7. Login sebagai guru atau administrator untuk memeriksa jawaban esai, menyimpan nilai, dan menerbitkan hasil.
8. Login sebagai administrator untuk memeriksa audit log.

## Catatan pengujian

CI hijau membuktikan lint, test otomatis yang tersedia, dan proses build berhasil. Pengujian browser desktop/mobile serta integrasi terhadap database lokal tetap perlu dilakukan pada lingkungan pengembangan Anda. Fitur yang bergantung pada data sekolah harus diuji menggunakan akun dan data uji sendiri.
