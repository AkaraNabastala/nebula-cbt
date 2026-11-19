# API Administrasi Pengguna

Semua endpoint menggunakan prefix konfigurasi API dan membutuhkan token Bearer yang valid. Akses ditentukan oleh permission backend, bukan hanya menu frontend.

## Daftar pengguna

`GET /users?page=1&limit=20&search=nama&status=ACTIVE&role=STUDENT`

Permission: `users.read`

- `page`: mulai dari 1.
- `limit`: 1 sampai 100, default 20.
- `search`: pencarian nama lengkap atau identitas login.
- `status`: `ACTIVE`, `INACTIVE`, atau `SUSPENDED`.
- `role`: `ADMIN`, `TEACHER`, atau `STUDENT`.

Respons berisi `data` dan metadata `pagination`. Password hash tidak pernah disertakan.

## Membuat pengguna

`POST /users`

Permission: `users.create`

```json
{
  "fullName": "Nama Pengguna",
  "identifierType": "USERNAME",
  "identifier": "nama.pengguna",
  "password": "password-awal-minimal-12",
  "roleCode": "STUDENT"
}
```

Jenis identitas yang didukung: `USERNAME` atau `EMAIL`. Role: `ADMIN`, `TEACHER`, atau `STUDENT`.

Password disimpan menggunakan Argon2id. Akun baru berstatus aktif dan `mustChangePassword=true`. Profil siswa atau guru dibuat saat role yang sesuai dipilih. Identitas login harus unik setelah normalisasi huruf kecil.

## Mengubah status akun

`PATCH /users/:id/status`

Permission: `users.status.manage`

```json
{ "status": "INACTIVE" }
```

Status yang diterima: `ACTIVE`, `INACTIVE`, atau `SUSPENDED`. Penonaktifan atau penangguhan menaikkan `tokenVersion` sehingga token sesi lama tidak lagi berlaku. Administrator tidak dapat menonaktifkan akunnya sendiri.

## Audit

Pembuatan akun dan perubahan status dicatat ke `audit_logs` di dalam transaksi yang sama dengan perubahan data.
