import { useCallback, useEffect, useState, type FormEvent } from "react";
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

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-app-text">Akademik dan kelas</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-app-muted">Kelola periode akademik, mata pelajaran, dan rombongan belajar. Data ini menjadi dasar penugasan guru dan pelaksanaan asesmen.</p>
      </div>
      {notice && <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-app-text">{notice}</div>}
      {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-app-text">{error}</div>}
      <div className="flex flex-wrap gap-2 border-b border-app-border" role="tablist" aria-label="Data akademik">
        {tabs.map((item) => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={`min-h-11 rounded-t-lg border-b-2 px-3 text-sm font-medium ${tab === item.id ? "border-app-primary text-app-primary" : "border-transparent text-app-muted hover:text-app-text"}`}>{item.label} <span className="ml-1 text-xs opacity-70">{item.count}</span></button>)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 rounded-2xl border border-app-border bg-app-surface">
          <div className="flex items-center justify-between gap-3 border-b border-app-border px-4 py-4 sm:px-5">
            <h2 className="text-sm font-semibold text-app-text">{tabs.find((item) => item.id === tab)?.label}</h2>
            <button type="button" onClick={() => void load()} disabled={loading} className="min-h-11 rounded-lg border border-app-border px-3 text-xs font-medium text-app-text disabled:opacity-50">Muat ulang</button>
          </div>
          {loading ? <p className="px-5 py-12 text-center text-sm text-app-muted">Memuat data akademik…</p> : tab === "years" ? (
            years.length ? <div className="divide-y divide-app-border">{years.map((year) => <div key={year.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5"><div className="min-w-0"><p className="font-semibold text-app-text">{year.name}</p><p className="mt-1 text-xs text-app-muted">{dateLabel(year.startDate)} – {dateLabel(year.endDate)} · {year._count?.classes ?? 0} kelas</p></div><div className="flex items-center gap-2">{year.isActive ? <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">Aktif</span> : <button type="button" disabled={saving} onClick={() => void activateYear(year)} className="min-h-11 rounded-lg border border-app-border px-3 text-xs font-medium text-app-text disabled:opacity-50">Jadikan aktif</button>}</div></div>)}</div> : <p className="px-5 py-12 text-center text-sm text-app-muted">Belum ada tahun ajaran.</p>
          ) : tab === "subjects" ? (
            subjects.length ? <div className="divide-y divide-app-border">{subjects.map((subject) => <div key={subject.id} className="px-4 py-4 sm:px-5"><p className="font-semibold text-app-text">{subject.name}</p><p className="mt-1 text-xs text-app-muted">{subject.code || "Tanpa kode"} · {subject._count?.teacherAssignments ?? 0} penugasan guru · {subject._count?.questionBanks ?? 0} bank soal</p></div>)}</div> : <p className="px-5 py-12 text-center text-sm text-app-muted">Belum ada mata pelajaran.</p>
          ) : classes.length ? <div className="divide-y divide-app-border">{classes.map((schoolClass) => <div key={schoolClass.id} className="px-4 py-4 sm:px-5"><p className="font-semibold text-app-text">{schoolClass.name}</p><p className="mt-1 text-xs text-app-muted">Kelas {schoolClass.gradeLevel} · {schoolClass.academicYear.name} · {schoolClass._count?.enrollments ?? 0} siswa</p></div>)}</div> : <p className="px-5 py-12 text-center text-sm text-app-muted">Belum ada kelas.</p>}
        </div>
        <form onSubmit={submit} className="h-fit space-y-4 rounded-2xl border border-app-border bg-app-surface p-4 sm:p-5">
          <div><h2 className="text-sm font-semibold text-app-text">{tab === "years" ? "Tambah tahun ajaran" : tab === "subjects" ? "Tambah mata pelajaran" : "Tambah kelas"}</h2><p className="mt-1 text-xs leading-5 text-app-muted">Isi data dasar berikut. Perubahan dicatat pada audit log.</p></div>
          {tab === "years" ? <>
            <label className="block text-xs font-medium text-app-text">Nama tahun ajaran<input name="name" required maxLength={30} placeholder="2026/2027" className="mt-1.5 min-h-11 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text" /></label>
            <label className="block text-xs font-medium text-app-text">Tanggal mulai<input name="startDate" required type="date" className="mt-1.5 min-h-11 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text" /></label>
            <label className="block text-xs font-medium text-app-text">Tanggal akhir<input name="endDate" required type="date" className="mt-1.5 min-h-11 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text" /></label>
          </> : tab === "subjects" ? <>
            <label className="block text-xs font-medium text-app-text">Nama mata pelajaran<input name="name" required maxLength={120} placeholder="Matematika" className="mt-1.5 min-h-11 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text" /></label>
            <label className="block text-xs font-medium text-app-text">Kode (opsional)<input name="code" maxLength={30} placeholder="MTK" className="mt-1.5 min-h-11 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text" /></label>
          </> : <>
            <label className="block text-xs font-medium text-app-text">Nama kelas<input name="name" required maxLength={80} placeholder="VII A" className="mt-1.5 min-h-11 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text" /></label>
            <label className="block text-xs font-medium text-app-text">Tingkat kelas<select name="gradeLevel" required defaultValue="7" className="mt-1.5 min-h-11 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text">{Array.from({ length: 12 }, (_, index) => index + 1).map((grade) => <option key={grade} value={grade}>{grade}</option>)}</select></label>
            <label className="block text-xs font-medium text-app-text">Tahun ajaran<select name="academicYearId" required defaultValue="" className="mt-1.5 min-h-11 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text"><option value="" disabled>Pilih tahun ajaran</option>{years.map((year) => <option key={year.id} value={year.id}>{year.name}{year.isActive ? " (Aktif)" : ""}</option>)}</select></label>
          </>}
          <button type="submit" disabled={saving || (tab === "classes" && years.length === 0)} className="min-h-11 w-full rounded-lg bg-app-primary px-4 text-sm font-semibold text-app-primary-contrast disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Menyimpan…" : "Simpan data"}</button>
          {tab === "classes" && years.length === 0 && <p className="text-xs text-app-muted">Buat tahun ajaran terlebih dahulu sebelum menambah kelas.</p>}
        </form>
      </div>
    </section>
  );
}
