import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string | null;
  createdAt: string;
  actorUser: { id: string; fullName: string } | null;
};
type AuditResponse = { items: AuditLog[]; total: number; page: number; limit: number; pageCount: number };

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function AuditLogsPage({ token }: { token: string | null }) {
  const [data, setData] = useState<AuditResponse>({ items: [], total: 0, page: 1, limit: 50, pageCount: 0 });
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ page: String(page), limit: "50" });
      if (action.trim()) query.set("action", action.trim());
      if (entityType.trim()) query.set("entityType", entityType.trim());
      setData(await apiRequest<AuditResponse>(`/audit-logs?${query.toString()}`, { token }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Audit log gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, [token, page, action, entityType]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  return (
    <section className="space-y-6">
      <header><h1 className="text-2xl font-bold tracking-tight text-app-text">Audit log</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-app-muted">Riwayat perubahan penting pada akun, akademik, bank soal, ujian, dan hasil penilaian.</p></header>
      {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-app-text">{error}</div>}
      <div className="grid gap-3 rounded-2xl border border-app-border bg-app-surface p-4 sm:grid-cols-[1fr_1fr_auto]">
        <label className="block text-xs font-medium text-app-text">Aksi<input value={action} onChange={(event) => { setAction(event.target.value); setPage(1); }} placeholder="Contoh: EXAM_PUBLISHED" className="mt-1.5 min-h-11 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text" /></label>
        <label className="block text-xs font-medium text-app-text">Jenis entitas<input value={entityType} onChange={(event) => { setEntityType(event.target.value); setPage(1); }} placeholder="Contoh: EXAM_RESULT" className="mt-1.5 min-h-11 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text" /></label>
        <button type="button" onClick={() => void load()} disabled={loading} className="min-h-11 self-end rounded-lg border border-app-border px-4 text-xs font-semibold text-app-text disabled:opacity-50">Terapkan filter</button>
      </div>
      <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-app-border px-4 py-4"><div><h2 className="text-sm font-semibold text-app-text">Catatan aktivitas</h2><p className="mt-1 text-xs text-app-muted">{data.total} catatan</p></div><span className="text-xs text-app-muted">Halaman {data.page} dari {Math.max(data.pageCount, 1)}</span></div>
        {loading ? <p className="px-4 py-12 text-center text-sm text-app-muted">Memuat audit log…</p> : data.items.length === 0 ? <p className="px-4 py-12 text-center text-sm text-app-muted">Tidak ada catatan yang cocok dengan filter.</p> : <ul className="divide-y divide-app-border">{data.items.map((item) => <li key={item.id} className="space-y-2 px-4 py-4 sm:px-5"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold text-app-text">{item.action}</span><time className="text-[11px] text-app-muted">{dateLabel(item.createdAt)}</time></div><p className="text-sm leading-6 text-app-text">{item.description || "Perubahan tercatat."}</p><div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-app-muted"><span>{item.actorUser?.fullName ?? "Sistem"}</span><span>{item.entityType}</span>{item.entityId && <span className="font-mono">{item.entityId}</span>}</div></li>)}</ul>}
        <div className="flex items-center justify-between gap-3 border-t border-app-border px-4 py-3"><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || loading} className="min-h-10 rounded-lg border border-app-border px-3 text-xs font-medium text-app-text disabled:opacity-40">Sebelumnya</button><button type="button" onClick={() => setPage((value) => Math.min(data.pageCount, value + 1))} disabled={page >= data.pageCount || loading} className="min-h-10 rounded-lg border border-app-border px-3 text-xs font-medium text-app-text disabled:opacity-40">Berikutnya</button></div>
      </section>
    </section>
  );
}
