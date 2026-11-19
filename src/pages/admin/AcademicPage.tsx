import { useCallback, useEffect, useState, useRef, type FormEvent } from "react";
import { Plus, RefreshCw, X } from "lucide-react";
import { apiRequest } from "../../lib/api";

type AcademicYear = { id: string; name: string; startDate: string; endDate: string; isActive: boolean; _count?: { classes: number } };
type Subject = { id: string; code: string | null; name: string; isActive: boolean; _count?: { teacherAssignments: number; questionBanks: number } };
type SchoolClass = { id: string; name: string; gradeLevel: number; academicYearId: string; academicYear: { id: string; name: string; isActive: boolean }; _count?: { enrollments: number; teacherAssignments: number } };
type Tab = "years" | "subjects" | "classes";

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}

export function AcademicPage({ token }: { token: string | null }) {
  const [tab, setTab] = useState<Tab>("years");
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    if (!token) {
      setError("Sesi login tidak ditemukan. Silakan masuk kembali.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [yearData, subjectData, classData] = await Promise.all([
        apiRequest<AcademicYear[]>("/academic/years", { token }),
        apiRequest<Subject[]>("/academic/subjects", { token }),
        apiRequest<SchoolClass[]>("/academic/classes", { token }),
      ]);
      setYears(yearData);
      setSubjects(subjectData);
      setClasses(classData);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Data akademik gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  useEffect(() => {
    if (isCreating && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [isCreating]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    let endpoint: string;
    let payload: Record<string, string | number>;
    if (tab === "years") {
      endpoint = "/academic/years";
      payload = { name: String(form.get("name") || ""), startDate: String(form.get("startDate") || ""), endDate: String(form.get("endDate") || "") };
    } else if (tab === "subjects") {
      endpoint = "/academic/subjects";
      payload = { code: String(form.get("code") || ""), name: String(form.get("name") || "") };
    } else {
      endpoint = "/academic/classes";
      payload = { name: String(form.get("name") || ""), gradeLevel: Number(form.get("gradeLevel")), academicYearId: String(form.get("academicYearId") || "") };
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await apiRequest(endpoint, { method: "POST", token, body: JSON.stringify(payload) });
      formElement.reset();
      setIsCreating(false);
      setNotice("Data akademik berhasil disimpan.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Data akademik gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function activateYear(year: AcademicYear) {
    if (!token || year.isActive) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await apiRequest(`/academic/years/${year.id}/activate`, { method: "PATCH", token });
      setNotice(`Tahun ajaran ${year.name} sekarang aktif.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Tahun ajaran gagal diaktifkan.");
    } finally {
      setSaving(false);
    }
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "years", label: "Tahun ajaran", count: years.length },
    { id: "subjects", label: "Mata pelajaran", count: subjects.length },
    { id: "classes", label: "Kelas", count: classes.length },
  ];
  const activeLabel = tabs.find((item) => item.id === tab)?.label ?? "Data akademik";
  const title = tab === "years" ? "Tambah tahun ajaran" : tab === "subjects" ? "Tambah mata pelajaran" : "Tambah kelas";

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-app-text">Akademik</h1>
          <p className="mt-1 text-sm text-app-muted">Tahun ajaran, mata pelajaran, dan rombongan belajar.</p>
        </div>
        <button type="button" onClick={() => { setError(""); setIsCreating(true); }} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-app-primary px-4 text-sm font-semibold text-app-primary-contrast hover:bg-app-primary-hover">
          <Plus size={16} aria-hidden="true" /> Tambah {tab === "years" ? "tahun ajaran" : tab === "subjects" ? "mata pelajaran" : "kelas"}
        </button>
      </div>

      {notice && <div role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-app-text">{notice}</div>}
      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-app-text"><span>{error}</span><button type="button" onClick={() => void load()} className="font-semibold underline underline-offset-2">Coba lagi</button></div>}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-app-border">
        <div className="flex min-w-0 gap-1 overflow-x-auto" role="tablist" aria-label="Jenis data akademik">
          {tabs.map((item) => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={`min-h-11 shrink-0 border-b-2 px-3 text-sm font-medium ${tab === item.id ? "border-app-primary text-app-primary" : "border-transparent text-app-muted hover:text-app-text"}`}>{item.label}<span className="ml-2 text-xs tabular-nums opacity-70">{item.count}</span></button>)}
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} aria-label="Muat ulang data akademik" className="mb-1 inline-flex min-h-9 items-center gap-2 rounded-md px-2 text-xs font-medium text-app-muted hover:bg-app-bg hover:text-app-text disabled:opacity-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Muat ulang</button>
      </div>

      <div className="overflow-hidden rounded-xl border border-app-border bg-app-surface">
        <div className="flex items-center justify-between border-b border-app-border px-4 py-3">
          <h2 className="text-sm font-semibold text-app-text">{activeLabel}</h2>
          <span className="text-xs text-app-muted">{tabs.find((item) => item.id === tab)?.count ?? 0} data</span>
        </div>
        {loading ? <div role="status" className="px-4 py-12 text-center text-sm text-app-muted">Memuat data akademik...</div> : tab === "years" ? (
          years.length ? <div className="divide-y divide-app-border">{years.map((year) => <div key={year.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><div className="min-w-0"><p className="text-sm font-semibold text-app-text">{year.name}</p><p className="mt-1 text-xs text-app-muted">{dateLabel(year.startDate)} - {dateLabel(year.endDate)} · {year._count?.classes ?? 0} kelas</p></div><div className="flex items-center gap-2">{year.isActive ? <span className="rounded-md bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">Aktif</span> : <button type="button" disabled={saving} onClick={() => void activateYear(year)} className="min-h-9 rounded-md border border-app-border px-3 text-xs font-medium text-app-text hover:bg-app-bg disabled:opacity-50">Jadikan aktif</button>}</div></div>)}</div> : <p className="px-4 py-12 text-center text-sm text-app-muted">Belum ada tahun ajaran.</p>
        ) : tab === "subjects" ? (
          subjects.length ? <div className="divide-y divide-app-border">{subjects.map((subject) => <div key={subject.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><div><p className="text-sm font-semibold text-app-text">{subject.name}</p><p className="mt-1 text-xs text-app-muted">{subject.code || "Tanpa kode"}</p></div><p className="text-xs text-app-muted">{subject._count?.teacherAssignments ?? 0} penugasan · {subject._count?.questionBanks ?? 0} bank soal</p></div>)}</div> : <p className="px-4 py-12 text-center text-sm text-app-muted">Belum ada mata pelajaran.</p>
        ) : classes.length ? <div className="divide-y divide-app-border">{classes.map((schoolClass) => <div key={schoolClass.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><div><p className="text-sm font-semibold text-app-text">{schoolClass.name}</p><p className="mt-1 text-xs text-app-muted">Kelas {schoolClass.gradeLevel} · {schoolClass.academicYear.name}</p></div><p className="text-xs text-app-muted">{schoolClass._count?.enrollments ?? 0} siswa</p></div>)}</div> : <p className="px-4 py-12 text-center text-sm text-app-muted">Belum ada kelas.</p>}
      </div>

      {isCreating && <dialog ref={dialogRef} onClose={() => setIsCreating(false)} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }} className="max-h-[min(90dvh,680px)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl border border-app-border bg-app-surface p-0 text-app-text shadow-xl backdrop:bg-slate-950/45">
        <div>
          <div className="flex items-start justify-between gap-4 border-b border-app-border px-5 py-4">
            <div><h2 id="academic-dialog-title" className="text-base font-semibold text-app-text">{title}</h2><p className="mt-1 text-xs text-app-muted">Lengkapi informasi yang diperlukan.</p></div>
            <button type="button" onClick={() => setIsCreating(false)} aria-label="Tutup formulir" className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-app-muted hover:bg-app-bg hover:text-app-text"><X size={18} /></button>
          </div>
          <form onSubmit={submit} className="space-y-4 p-5">
            {tab === "years" ? <>
              <label className="block text-sm font-medium text-app-text">Nama tahun ajaran<input name="name" required maxLength={30} placeholder="2026/2027" className="mt-1.5 min-h-10 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text" /></label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium text-app-text">Tanggal mulai<input name="startDate" required type="date" className="mt-1.5 min-h-10 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text" /></label>
                <label className="block text-sm font-medium text-app-text">Tanggal akhir<input name="endDate" required type="date" className="mt-1.5 min-h-10 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text" /></label>
              </div>
            </> : tab === "subjects" ? <>
              <label className="block text-sm font-medium text-app-text">Nama mata pelajaran<input name="name" required maxLength={120} placeholder="Matematika" className="mt-1.5 min-h-10 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text" /></label>
              <label className="block text-sm font-medium text-app-text">Kode (opsional)<input name="code" maxLength={30} placeholder="MTK" className="mt-1.5 min-h-10 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text" /></label>
            </> : <>
              <label className="block text-sm font-medium text-app-text">Nama kelas<input name="name" required maxLength={80} placeholder="VII A" className="mt-1.5 min-h-10 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text" /></label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium text-app-text">Tingkat kelas<select name="gradeLevel" required defaultValue="7" className="mt-1.5 min-h-10 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text">{Array.from({ length: 12 }, (_, index) => index + 1).map((grade) => <option key={grade} value={grade}>{grade}</option>)}</select></label>
                <label className="block text-sm font-medium text-app-text">Tahun ajaran<select name="academicYearId" required defaultValue="" className="mt-1.5 min-h-10 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text"><option value="" disabled>Pilih tahun ajaran</option>{years.map((year) => <option key={year.id} value={year.id}>{year.name}{year.isActive ? " (Aktif)" : ""}</option>)}</select></label>
              </div>
              {years.length === 0 && <p className="text-xs text-app-muted">Buat tahun ajaran terlebih dahulu sebelum menambah kelas.</p>}
            </>}
            <div className="flex justify-end gap-2 border-t border-app-border pt-4">
              <button type="button" onClick={() => setIsCreating(false)} className="min-h-10 rounded-lg border border-app-border px-4 text-sm font-medium text-app-text hover:bg-app-bg">Batal</button>
              <button type="submit" disabled={saving || (tab === "classes" && years.length === 0)} className="min-h-10 rounded-lg bg-app-primary px-4 text-sm font-semibold text-app-primary-contrast hover:bg-app-primary-hover disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        </div>
      </dialog>}
    </section>
  );
}
