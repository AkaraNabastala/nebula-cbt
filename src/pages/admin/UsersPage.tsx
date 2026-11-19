import { useCallback, useEffect, useState, type FormEvent } from "react";
import { LockKeyhole, Plus, RefreshCw, Search, UserRound, Users, X } from "lucide-react";
import { apiRequest } from "../../lib/api";

type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
type UserRole = { code: string; name: string };
type UserIdentifier = { identifierType: string; identifierValue: string; isPrimary: boolean };
type UserRecord = {
  id: string; fullName: string; status: UserStatus; mustChangePassword: boolean;
  lastLoginAt: string | null; createdAt: string; identifiers: UserIdentifier[]; roles: UserRole[];
};
type UsersResponse = { data: UserRecord[]; pagination: { page: number; limit: number; total: number; totalPages: number } };

const statusLabels: Record<UserStatus, string> = { ACTIVE: "Aktif", INACTIVE: "Nonaktif", SUSPENDED: "Ditangguhkan" };

function formatDate(value: string | null) {
  if (!value) return "Belum pernah";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
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

  useEffect(() => { void Promise.resolve().then(loadUsers); }, [loadUsers]);

  useEffect(() => {
    if (!isCreating) return;
    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setIsCreating(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isCreating]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
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
      await apiRequest<UserRecord>("/users", { method: "POST", token, body: JSON.stringify(payload) });
      formElement.reset();
      setIsCreating(false);
      setPage(1);
      setSearch("");
      setSearchInput("");
      setStatusFilter("");
      setNotice("Akun berhasil dibuat. Pengguna wajib mengganti password saat login pertama.");
      try {
        const refreshed = await apiRequest<UsersResponse>("/users?page=1&limit=20", { token });
        setUsers(refreshed.data);
        setTotal(refreshed.pagination.total);
        setTotalPages(Math.max(1, refreshed.pagination.totalPages));
      } catch {
        setError("Akun berhasil dibuat, tetapi daftar pengguna gagal diperbarui. Muat ulang daftar.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Akun gagal dibuat.");
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusChange(user: UserRecord) {
    if (!token) return;
    const nextStatus: UserStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (!window.confirm(`${nextStatus === "ACTIVE" ? "Aktifkan" : "Nonaktifkan"} akun ${user.fullName}?`)) return;
    setChangingId(user.id);
    setError("");
    setNotice("");
    try {
      await apiRequest(`/users/${user.id}/status`, { method: "PATCH", token, body: JSON.stringify({ status: nextStatus }) });
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
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-app-text">Pengguna</h1>
          <p className="mt-1 text-sm text-app-muted">Kelola akun administrator, guru, dan siswa.</p>
        </div>
        <button type="button" onClick={() => { setError(""); setIsCreating(true); }} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-app-primary px-4 text-sm font-semibold text-app-primary-contrast hover:bg-app-primary-hover">
          <Plus size={16} aria-hidden="true" /> Tambah pengguna
        </button>
      </div>

      {notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-app-text">{notice}</p>}
      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-app-text"><span>{error}</span><button type="button" onClick={() => void loadUsers()} className="font-semibold underline underline-offset-2">Muat ulang</button></div>}

      <section className="overflow-hidden rounded-xl border border-app-border bg-app-surface">
        <div className="flex flex-col gap-3 border-b border-app-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div><div className="flex items-center gap-2 text-app-text"><Users size={17} aria-hidden="true" /><h2 className="text-sm font-semibold">Daftar pengguna</h2></div><p className="mt-1 text-xs text-app-muted">{total} akun tercatat</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <form onSubmit={handleSearch} className="flex min-w-0 gap-2">
              <label htmlFor="users-search" className="sr-only">Cari nama atau identitas</label>
              <div className="flex min-w-0 items-center gap-2 rounded-lg border border-app-border bg-app-input px-3"><Search size={15} className="shrink-0 text-app-muted" aria-hidden="true" /><input id="users-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Nama, NIPD, NIS, atau email" className="min-h-10 min-w-0 w-full bg-transparent text-sm text-app-text outline-none" /></div>
              <button type="submit" className="min-h-10 rounded-lg border border-app-border px-3 text-xs font-medium text-app-text hover:bg-app-bg">Cari</button>
            </form>
            <label className="flex min-h-10 items-center gap-2 rounded-lg border border-app-border px-3 text-xs text-app-muted"><span>Status</span><select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="min-w-0 bg-transparent text-sm text-app-text"><option value="">Semua</option><option value="ACTIVE">Aktif</option><option value="INACTIVE">Nonaktif</option><option value="SUSPENDED">Ditangguhkan</option></select></label>
            <button type="button" onClick={() => void loadUsers()} disabled={isLoading} aria-label="Muat ulang daftar pengguna" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-app-border px-3 text-app-muted hover:bg-app-bg disabled:opacity-50"><RefreshCw size={15} className={isLoading ? "animate-spin" : ""} /></button>
          </div>
        </div>

        {isLoading ? <div role="status" className="flex min-h-32 items-center justify-center gap-2 text-sm text-app-muted"><RefreshCw size={16} className="animate-spin" /> Memuat daftar pengguna...</div> : users.length === 0 ? (
          <div className="flex min-h-36 flex-col items-center justify-center px-4 text-center"><LockKeyhole size={20} className="text-app-muted" aria-hidden="true" /><p className="mt-2 text-sm font-semibold text-app-text">Belum ada pengguna yang cocok</p><p className="mt-1 text-xs text-app-muted">Ubah pencarian atau filter, atau buat akun baru.</p></div>
        ) : <div className="divide-y divide-app-border">{users.map((user) => <article key={user.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><h3 className="text-sm font-semibold text-app-text">{user.fullName}</h3><span className="rounded-md bg-app-soft px-2 py-0.5 text-[11px] text-app-text">{user.roles.map((role) => role.name).join(", ")}</span><span className="text-[11px] text-app-muted">{statusLabels[user.status]}</span>{user.mustChangePassword && <span className="text-[11px] text-app-muted">Wajib ganti password</span>}</div><p className="mt-1 break-all text-xs text-app-muted">{user.identifiers.map((item) => item.identifierValue).join(" · ") || "Identitas belum tersedia"}<span className="mx-2">·</span>Login terakhir: {formatDate(user.lastLoginAt)}</p></div>
          <button type="button" disabled={changingId === user.id} onClick={() => void handleStatusChange(user)} className="min-h-9 shrink-0 rounded-md border border-app-border px-3 text-xs font-semibold text-app-text hover:bg-app-bg disabled:cursor-not-allowed disabled:opacity-50">{changingId === user.id ? "Memproses..." : user.status === "ACTIVE" ? "Nonaktifkan" : user.status === "SUSPENDED" ? "Ditangguhkan" : "Aktifkan"}</button>
        </article>)}</div>}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-app-border px-4 py-3"><p className="text-xs text-app-muted">Halaman {page} dari {totalPages}</p><div className="flex gap-2"><button type="button" disabled={page <= 1 || isLoading} onClick={() => setPage((value) => value - 1)} className="min-h-9 rounded-md border border-app-border px-3 text-xs font-medium text-app-text hover:bg-app-bg disabled:opacity-40">Sebelumnya</button><button type="button" disabled={page >= totalPages || isLoading} onClick={() => setPage((value) => value + 1)} className="min-h-9 rounded-md border border-app-border px-3 text-xs font-medium text-app-text hover:bg-app-bg disabled:opacity-40">Berikutnya</button></div></div>
      </section>

      {isCreating && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsCreating(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="user-dialog-title" className="max-h-[min(90dvh,700px)] w-full max-w-xl overflow-y-auto rounded-xl border border-app-border bg-app-surface shadow-xl">
          <div className="flex items-start justify-between gap-4 border-b border-app-border px-5 py-4"><div className="flex items-start gap-3"><span className="rounded-lg bg-app-soft p-2 text-app-primary"><UserRound size={18} /></span><div><h2 id="user-dialog-title" className="text-base font-semibold text-app-text">Buat akun pengguna</h2><p className="mt-1 text-xs text-app-muted">Password awal hanya digunakan untuk login pertama.</p></div></div><button type="button" onClick={() => setIsCreating(false)} aria-label="Tutup formulir" className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-app-muted hover:bg-app-bg"><X size={18} /></button></div>
          <form onSubmit={handleCreate} className="grid gap-3 p-5 sm:grid-cols-2">
            <label htmlFor="user-full-name" className="text-sm font-medium text-app-text sm:col-span-2">Nama lengkap<input id="user-full-name" name="fullName" required minLength={2} maxLength={150} autoComplete="name" className="mt-1.5 min-h-10 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text" /></label>
            <label htmlFor="user-identifier-type" className="text-sm font-medium text-app-text">Jenis identitas<select id="user-identifier-type" name="identifierType" className="mt-1.5 min-h-10 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text"><option value="USERNAME">NIPD / NIS / Username</option><option value="EMAIL">Email</option></select></label>
            <label htmlFor="user-identifier" className="text-sm font-medium text-app-text">NIPD / NIS / Username<input id="user-identifier" name="identifier" required minLength={3} maxLength={191} autoComplete="username" placeholder="Contoh: 202600123" className="mt-1.5 min-h-10 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text" /></label>
            <label htmlFor="user-initial-password" className="text-sm font-medium text-app-text">Password sementara<input id="user-initial-password" name="password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="mt-1.5 min-h-10 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text" /><span className="mt-1 block text-xs font-normal text-app-muted">Minimal 8 karakter. Pengguna wajib menggantinya saat login pertama.</span></label>
            <label htmlFor="user-role" className="text-sm font-medium text-app-text">Role<select id="user-role" name="roleCode" className="mt-1.5 min-h-10 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text"><option value="STUDENT">Siswa</option><option value="TEACHER">Guru</option><option value="ADMIN">Administrator</option></select></label>
            <div className="flex justify-end gap-2 border-t border-app-border pt-4 sm:col-span-2"><button type="button" onClick={() => setIsCreating(false)} className="min-h-10 rounded-lg border border-app-border px-4 text-sm font-medium text-app-text hover:bg-app-bg">Batal</button><button type="submit" disabled={creating} className="min-h-10 rounded-lg bg-app-primary px-4 text-sm font-semibold text-app-primary-contrast hover:bg-app-primary-hover disabled:opacity-50">{creating ? "Menyimpan..." : "Simpan akun"}</button></div>
          </form>
        </section>
      </div>}
    </section>
  );
}
