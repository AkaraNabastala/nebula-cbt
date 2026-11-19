import { useCallback, useEffect, useState, type FormEvent } from "react";
import { LockKeyhole, Plus, RefreshCw, Search, UserRound, Users } from "lucide-react";
import { apiRequest } from "../../lib/api";

type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
type UserRole = { code: string; name: string };
type UserIdentifier = {
  identifierType: string;
  identifierValue: string;
  isPrimary: boolean;
};
type UserRecord = {
  id: string;
  fullName: string;
  status: UserStatus;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  identifiers: UserIdentifier[];
  roles: UserRole[];
};
type UsersResponse = {
  data: UserRecord[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

const statusLabels: Record<UserStatus, string> = {
  ACTIVE: "Aktif",
  INACTIVE: "Nonaktif",
  SUSPENDED: "Ditangguhkan",
};

function formatDate(value: string | null) {
  if (!value) return "Belum pernah";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function UsersPage({ token }: { token: string | null }) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [changingId, setChangingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadUsers = useCallback(async () => {
    if (!token) {
      setError("Sesi login tidak ditemukan. Silakan masuk kembali.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);

    try {
      const result = await apiRequest<UsersResponse>(`/users?${params.toString()}`, { token });
      setUsers(result.data);
      setTotal(result.pagination.total);
      setTotalPages(Math.max(1, result.pagination.totalPages));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Daftar pengguna gagal dimuat.");
    } finally {
      setIsLoading(false);
    }
  }, [token, page, search, statusFilter]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    const form = new FormData(event.currentTarget);
    const payload = {
      fullName: String(form.get("fullName") || ""),
      identifierType: String(form.get("identifierType") || "USERNAME"),
      identifier: String(form.get("identifier") || ""),
      password: String(form.get("password") || ""),
      roleCode: String(form.get("roleCode") || "STUDENT"),
    };

    setCreating(true);
    setError("");
    setNotice("");
    try {
      await apiRequest<UserRecord>("/users", {
        method: "POST",
        token,
        body: JSON.stringify(payload),
      });
      event.currentTarget.reset();
      setIsCreating(false);
      setPage(1);
      setSearch("");
      setSearchInput("");
      setStatusFilter("");
      setNotice("Akun berhasil dibuat. Pengguna wajib mengganti password saat login pertama.");
      await loadUsers();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Akun gagal dibuat.");
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusChange(user: UserRecord) {
    if (!token) return;
    const nextStatus: UserStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const confirmed = window.confirm(
      `${nextStatus === "ACTIVE" ? "Aktifkan" : "Nonaktifkan"} akun ${user.fullName}?`,
    );
    if (!confirmed) return;

    setChangingId(user.id);
    setError("");
    setNotice("");
    try {
      await apiRequest(`/users/${user.id}/status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: nextStatus }),
      });
      setNotice(`Status akun ${user.fullName} sekarang ${statusLabels[nextStatus].toLowerCase()}.`);
      await loadUsers();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Status akun gagal diubah.");
    } finally {
      setChangingId(null);
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest text-[#318BCB]">ADMINISTRASI</p>
          <h1 className="mt-2 text-2xl font-bold text-app-text">Pengguna dan Hak Akses</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-app-muted">
            Buat akun, telusuri pengguna, dan kelola status akses administrator, guru, serta siswa.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setIsCreating((value) => !value); setError(""); }}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-app-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-app-primary-hover active:scale-[0.99]"
          aria-expanded={isCreating}
        >
          <Plus size={17} aria-hidden="true" />
          {isCreating ? "Tutup formulir" : "Tambah pengguna"}
        </button>
      </section>

      {notice && (
        <p role="status" className="rounded-xl border border-emerald-700/30 bg-emerald-500/10 px-4 py-3 text-sm text-app-text">
          {notice}
        </p>
      )}
      {error && (
        <div role="alert" className="rounded-xl border border-red-700/40 bg-red-500/10 px-4 py-3 text-sm text-app-text">
          <p>{error}</p>
          <button type="button" onClick={() => void loadUsers()} className="mt-2 min-h-11 font-semibold underline underline-offset-4">
            Coba muat ulang
          </button>
        </div>
      )}

      {isCreating && (
        <section className="rounded-2xl border border-app-border bg-app-surface p-5 sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <span className="rounded-xl bg-app-soft p-2.5 text-app-primary"><UserRound size={19} /></span>
            <div>
              <h2 className="text-base font-semibold text-app-text">Buat akun pengguna</h2>
              <p className="mt-1 text-sm text-app-muted">Password awal hanya untuk login pertama. Pengguna diwajibkan menggantinya.</p>
            </div>
          </div>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="user-full-name" className="mb-1.5 block text-sm font-medium text-app-text">Nama lengkap</label>
              <input id="user-full-name" name="fullName" required minLength={2} maxLength={150} autoComplete="name"
                className="min-h-11 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text" />
            </div>
            <div>
              <label htmlFor="user-identifier-type" className="mb-1.5 block text-sm font-medium text-app-text">Jenis identitas login</label>
              <select id="user-identifier-type" name="identifierType" className="min-h-11 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text">
                <option value="USERNAME">Username</option>
                <option value="EMAIL">Email</option>
              </select>
            </div>
            <div>
              <label htmlFor="user-identifier" className="mb-1.5 block text-sm font-medium text-app-text">Username atau email</label>
              <input id="user-identifier" name="identifier" required minLength={3} maxLength={191}
                autoComplete="username" className="min-h-11 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text" />
            </div>
            <div>
              <label htmlFor="user-initial-password" className="mb-1.5 block text-sm font-medium text-app-text">Password awal</label>
              <input id="user-initial-password" name="password" type="password" required minLength={12} maxLength={128}
                autoComplete="new-password" className="min-h-11 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text" />
              <p className="mt-1 text-xs text-app-muted">Minimal 12 karakter.</p>
            </div>
            <div>
              <label htmlFor="user-role" className="mb-1.5 block text-sm font-medium text-app-text">Role</label>
              <select id="user-role" name="roleCode" className="min-h-11 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text">
                <option value="STUDENT">Siswa</option>
                <option value="TEACHER">Guru</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2 sm:col-span-2">
              <button type="submit" disabled={creating} className="min-h-11 rounded-xl bg-app-primary px-5 py-2 text-sm font-semibold text-white hover:bg-app-primary-hover disabled:opacity-60">
                {creating ? "Menyimpan..." : "Simpan akun"}
              </button>
              <button type="button" onClick={() => setIsCreating(false)} className="min-h-11 rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-text hover:bg-app-bg">
                Batal
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-2xl border border-app-border bg-app-surface p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-app-text">
              <Users size={18} aria-hidden="true" />
              <h2 className="text-base font-semibold">Daftar pengguna</h2>
            </div>
            <p className="mt-1 text-sm text-app-muted">{total} akun tercatat</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <form onSubmit={handleSearch} className="flex min-w-0 gap-2">
              <label htmlFor="users-search" className="sr-only">Cari nama atau identitas</label>
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-app-border bg-app-input px-3">
                <Search size={16} className="shrink-0 text-app-muted" aria-hidden="true" />
                <input id="users-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Cari nama atau identitas" className="min-h-11 min-w-0 w-full bg-transparent text-sm text-app-text outline-none" />
              </div>
              <button type="submit" className="min-h-11 rounded-lg border border-app-border px-3 text-sm font-medium text-app-text hover:bg-app-bg">Cari</button>
            </form>
            <label className="flex min-h-11 items-center gap-2 rounded-lg border border-app-border px-3 text-sm text-app-muted">
              <span>Status</span>
              <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}
                className="min-w-0 bg-transparent text-sm text-app-text">
                <option value="">Semua</option>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
                <option value="SUSPENDED">Ditangguhkan</option>
              </select>
            </label>
          </div>
        </div>

        {isLoading ? (
          <div role="status" className="flex min-h-36 items-center justify-center gap-3 text-sm text-app-muted">
            <RefreshCw size={17} className="animate-spin" aria-hidden="true" /> Memuat daftar pengguna...
          </div>
        ) : users.length === 0 ? (
          <div className="flex min-h-36 flex-col items-center justify-center text-center">
            <LockKeyhole size={22} className="text-app-muted" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-app-text">Belum ada pengguna yang cocok</p>
            <p className="mt-1 text-sm text-app-muted">Ubah kata pencarian atau filter, atau buat akun baru.</p>
          </div>
        ) : (
          <div className="divide-y divide-app-border">
            {users.map((user) => (
              <article key={user.id} className="flex flex-col gap-3 py-4 first:pt-1 last:pb-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="break-words text-sm font-semibold text-app-text">{user.fullName}</h3>
                  <p className="mt-1 break-all text-xs text-app-muted">
                    {user.identifiers.map((item) => item.identifierValue).join(" · ") || "Identitas belum tersedia"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-app-muted">
                    {user.roles.map((role) => <span key={role.code} className="rounded-md bg-app-soft px-2 py-1">{role.name}</span>)}
                    <span className="rounded-md border border-app-border px-2 py-1">{statusLabels[user.status]}</span>
                    {user.mustChangePassword && <span className="rounded-md border border-app-border px-2 py-1">Wajib ganti password</span>}
                  </div>
                  <p className="mt-2 text-xs text-app-muted">Login terakhir: {formatDate(user.lastLoginAt)}</p>
                </div>
                <button type="button" disabled={changingId === user.id || user.status === "SUSPENDED"}
                  onClick={() => void handleStatusChange(user)}
                  className="min-h-11 shrink-0 rounded-lg border border-app-border px-3 text-xs font-semibold text-app-text hover:bg-app-bg disabled:cursor-not-allowed disabled:opacity-50">
                  {changingId === user.id ? "Memproses..." : user.status === "ACTIVE" ? "Nonaktifkan" : user.status === "SUSPENDED" ? "Ditangguhkan" : "Aktifkan"}
                </button>
              </article>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-app-border pt-4">
          <p className="text-xs text-app-muted">Halaman {page} dari {totalPages}</p>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1 || isLoading} onClick={() => setPage((value) => value - 1)}
              className="min-h-11 rounded-lg border border-app-border px-3 text-xs font-medium text-app-text hover:bg-app-bg disabled:opacity-40">Sebelumnya</button>
            <button type="button" disabled={page >= totalPages || isLoading} onClick={() => setPage((value) => value + 1)}
              className="min-h-11 rounded-lg border border-app-border px-3 text-xs font-medium text-app-text hover:bg-app-bg disabled:opacity-40">Berikutnya</button>
          </div>
        </div>
      </section>
    </div>
  );
}
