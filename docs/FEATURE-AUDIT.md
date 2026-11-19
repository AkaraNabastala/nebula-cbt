# Audit cakupan fitur Nebula CBT

Tanggal pemeriksaan: 19 November 2026  
Branch dasar yang diperiksa: `feature/admin-user-management`  
Tujuan: membedakan fitur yang sudah memiliki alur kode dari fitur yang belum lengkap dan pengujian yang belum dilakukan.

## Cara membaca status

- **Ada di kode** berarti modul, halaman/API, dan alur dasarnya ditemukan di repository. Ini bukan klaim bahwa seluruh kebutuhan operasional sudah lengkap.
- **Parsial** berarti alur dasar ada, tetapi operasi pengelolaan tertentu belum tersedia.
- **Perlu uji manual** berarti CI tidak membuktikan interaksi browser, integrasi database lokal, atau perilaku perangkat nyata.
- Tidak ada fitur yang dinyatakan selesai hanya karena tombol atau halaman sudah tampil.

## Inventaris fitur

| Area | Yang sudah ditemukan di kode | Status dan batas yang terlihat |
|---|---|---|
| Autentikasi | Login, logout, profil sesi, ganti password, hash Argon2id, token version, kewajiban ganti password | **Ada di kode.** Belum ada alur pemulihan password mandiri melalui email. Reset admin melalui terminal ditambahkan pada branch UX ini. |
| Akun pengguna | Daftar, pencarian, filter status, pembuatan akun, pengaturan status aktif/nonaktif/ditangguhkan | **Parsial.** Endpoint saat ini hanya GET, POST, dan PATCH status. Belum ditemukan alur edit data akun, hapus akun, ubah role setelah pembuatan, atau reset password per pengguna melalui UI. |
| Tahun ajaran | Daftar, buat, aktifkan | **Parsial.** Belum ditemukan endpoint edit, hapus, arsip, atau penutupan periode. |
| Mata pelajaran | Daftar dan buat | **Parsial.** Belum ditemukan endpoint edit, hapus, atau arsip. |
| Kelas | Daftar dan buat, terkait tahun ajaran | **Parsial.** Belum ditemukan endpoint edit, hapus, atau arsip kelas. |
| Penempatan siswa | Daftar riwayat, tempatkan siswa, akhiri penempatan | **Ada di kode untuk alur dasar.** Perlu uji aturan perpindahan dan tahun ajaran dengan data sekolah nyata. |
| Penugasan guru | Daftar, buat penugasan, aktif/nonaktifkan penugasan | **Ada di kode untuk alur dasar.** Perlu uji hak akses guru terhadap kelas dan mata pelajaran yang ditugaskan. |
| Bank soal | Daftar bank, buat bank, daftar soal, buat soal, perubahan status soal | **Parsial.** Lima tipe soal tersedia: pilihan tunggal, pilihan kompleks, benar/salah, jawaban singkat, dan esai. Endpoint edit/hapus isi soal belum ditemukan pada controller yang diperiksa. |
| Operasional ujian | Daftar ujian, opsi data, buat ujian, terbitkan ujian dan snapshot | **Parsial.** Endpoint edit, batalkan, tarik publikasi, atau hapus ujian belum ditemukan pada controller yang diperiksa. |
| Ruang ujian siswa | Daftar ujian, mulai percobaan, ambil sesi, sinkronisasi jawaban, kirim jawaban | **Ada di kode untuk alur inti.** Perilaku online/offline, pemulihan sesi, deadline, dan pengiriman ulang tetap wajib diuji manual. |
| Penilaian dan hasil | Daftar/detail hasil, koreksi esai, terbitkan hasil, daftar hasil siswa | **Ada di kode untuk alur inti.** Perlu uji skenario campuran soal objektif dan esai, serta pemeriksaan hasil oleh siswa. |
| Audit log | Endpoint daftar log aktivitas | **Ada di kode.** Cakupan pencatatan perlu dibandingkan dengan seluruh aksi bisnis yang nantinya diwajibkan sekolah. |

## Hal yang belum boleh dianggap selesai

1. **CRUD administrasi belum lengkap.** Tahun ajaran, mata pelajaran, kelas, akun, bank soal, dan ujian belum semuanya memiliki operasi edit/hapus/arsip.
2. **Manajemen hak akses belum menjadi layar pengelolaan mandiri.** Role dan permission digunakan oleh backend, tetapi UI untuk mengubah matriks hak akses belum ditemukan.
3. **Reset password belum tersedia sebagai tombol di halaman pengguna.** Branch ini menambahkan reset admin melalui terminal yang lebih aman; reset password akun siswa/guru dari UI masih perlu dirancang.
4. **Pengujian alur menyeluruh belum dilakukan.** Lint/build/test otomatis tidak menggantikan click-through desktop/mobile dan uji dengan database lokal.
5. **Kelengkapan produk perlu disepakati terhadap kebutuhan sekolah.** Fitur seperti impor massal, ekspor laporan, kalender akademik, presensi, notifikasi, dan pengaturan sekolah tidak dinyatakan tersedia oleh audit ini karena tidak ditemukan sebagai alur lengkap pada modul yang diperiksa.

## Rencana verifikasi sebelum menyebut aplikasi siap

- [ ] Admin: login, ganti password awal, reset password, sesi lama tidak berlaku.
- [ ] Admin: buat tahun ajaran, mapel, kelas, akun siswa/guru.
- [ ] Admin: tempatkan siswa dan tugaskan guru; uji aktivasi/nonaktif.
- [ ] Guru: buat bank soal dan uji semua tipe soal yang didukung.
- [ ] Guru: buat ujian, pilih kelas/peserta, terbitkan.
- [ ] Siswa: mulai ujian, simpan jawaban, refresh, putus koneksi, sambungkan kembali, dan kirim pada deadline.
- [ ] Guru/Admin: koreksi esai, hitung nilai, terbitkan hasil.
- [ ] Siswa: periksa hasil yang sudah diterbitkan.
- [ ] Admin: periksa audit log.
- [ ] Browser: periksa semua halaman pada desktop, tablet, dan ponsel; uji modal, keyboard, Escape, backdrop, tema terang/gelap.

## Perubahan UX pada branch ini

- Tahun ajaran, mata pelajaran, dan kelas dipisahkan menjadi halaman/rute berbeda.
- Penempatan siswa dan penugasan guru dipisahkan menjadi halaman/rute berbeda.
- Dialog distandarkan agar berada di tengah viewport dengan backdrop gelap dan blur.
- Skrip reset password admin meminta password secara tersembunyi, memverifikasi role ADMIN, menggunakan Argon2id, menaikkan token version, mewajibkan ganti password, dan menulis audit log.
- CI ditambah pemeriksaan sintaks skrip reset password.

**Catatan verifikasi:** status CI untuk perubahan pada branch ini harus dilihat pada workflow run terbaru setelah commit terakhir. Pengujian browser langsung belum dilakukan oleh CI.


## Prioritas pengembangan setelah penataan UX

1. **Fondasi administrasi:** lengkapi operasi edit/nonaktif/arsip untuk tahun ajaran, mata pelajaran, dan kelas dengan validasi relasi.
2. **Siklus akun:** tambah edit profil, perubahan role yang diaudit, dan reset password pengguna oleh admin dengan kewajiban ganti password.
3. **Bank soal:** tambah edit isi soal dengan versioning yang aman agar soal yang sudah dipakai snapshot ujian tidak berubah diam-diam.
4. **Siklus ujian:** definisikan aturan perubahan jadwal, pembatalan, dan koreksi setelah ujian diterbitkan tanpa merusak snapshot.
5. **Pelaporan:** tentukan kebutuhan laporan, filter, dan ekspor bersama format sekolah sebelum menambahkan tombol yang belum punya proses backend.
6. **Hak akses:** buat layar matriks role-permission hanya setelah kebijakan tiap role disepakati, lalu uji akses di backend dan UI.

Urutan ini sengaja menempatkan integritas data dan aturan bisnis sebelum menambah banyak kontrol visual.
