import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Plus, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "../../lib/api";

type AcademicYear = { id: string; name: string; startDate: string; endDate: string; isActive: boolean; _count?: { classes: number } };
type Subject = { id: string; code: string | null; name: string; category: string; isActive: boolean; _count?: { teacherAssignments: number; questionBanks: number } };
type EducationSettings = { departmentsEnabled: boolean; departments: string[] };
type SchoolClass = { id: string; name: string; gradeLevel: number; departmentName: string | null; academicYearId: string; academicYear: { id: string; name: string; isActive: boolean }; _count?: { enrollments: number; teacherAssignments: number } };

export type AcademicSection = "years" | "subjects" | "classes";

const sectionCopy: Record<AcademicSection, { title: string; description: string; addLabel: string; empty: string }> = {
  years: {
    title: "Tahun ajaran",
    description: "Atur periode akademik sekolah dan tentukan tahun ajaran yang sedang berjalan.",
    addLabel: "Tambah tahun ajaran",
    empty: "Belum ada tahun ajaran. Tambahkan periode akademik pertama untuk mulai mengelola kelas.",
  },
  subjects: {
    title: "Mata pelajaran / mata kuliah",
    description: "Kelola mata pelajaran atau mata kuliah untuk penugasan pengajar, bank soal, dan ujian.",
    addLabel: "Tambah mata pelajaran",
    empty: "Belum ada mata pelajaran. Tambahkan mata pelajaran untuk mulai menyiapkan pembelajaran.",
  },
  classes: {
    title: "Kelas",
    description: "Kelola rombongan belajar dan hubungkan setiap kelas dengan tahun ajaran.",
    addLabel: "Tambah kelas",
    empty: "Belum ada kelas. Buat tahun ajaran terlebih dahulu, lalu tambahkan rombongan belajar.",
  },
};

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}

export function AcademicPage({ token, section }: { token: string | null; section: AcademicSection }) {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [educationSettings, setEducationSettings] = useState<EducationSettings>({ departmentsEnabled: false, departments: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState("");
  const copy = sectionCopy[section];

  const load = useCallback(async () => {
    if (!token) {
      setError("Sesi login tidak ditemukan. Silakan masuk kembali.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [yearData, subjectData, classData, educationData] = await Promise.all([
        apiRequest<AcademicYear[]>("/academic/years", { token }),
        apiRequest<Subject[]>("/academic/subjects", { token }),
        apiRequest<SchoolClass[]>("/academic/classes", { token }),
        apiRequest<EducationSettings>("/academic/education-settings", { token }),
      ]);
      setYears(yearData);
      setSubjects(subjectData);
      setClasses(classData);
      setEducationSettings({ departmentsEnabled: educationData.departmentsEnabled === true, departments: Array.isArray(educationData.departments) ? educationData.departments : [] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Data akademik gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  useEffect(() => {
    if (isCreating && dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
  }, [isCreating]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    let endpoint: string;
    let payload: Record<string, string | number>;
    if (section === "years") {
      endpoint = "/academic/years";
      payload = { name: String(form.get("name") || ""), startDate: String(form.get("startDate") || ""), endDate: String(form.get("endDate") || "") };
    } else if (section === "subjects") {
      endpoint = "/academic/subjects";
      payload = { code: String(form.get("code") || ""), name: String(form.get("name") || ""), category: String(form.get("category") || "Umum") };
    } else {
      endpoint = "/academic/classes";
      payload = { name: String(form.get("name") || ""), gradeLevel: Number(form.get("gradeLevel")), academicYearId: String(form.get("academicYearId") || ""), departmentName: String(form.get("departmentName") || "") };
    }
    setSaving(true);
    setError("");
    try {
      await apiRequest(endpoint, { method: "POST", token, body: JSON.stringify(payload) });
      formElement.reset();
      setIsCreating(false);
      toast.success(`${copy.title} berhasil ditambahkan.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `${copy.title} gagal disimpan.`);
    } finally {
      setSaving(false);
    }
  }

  async function activateYear(year: AcademicYear) {
    if (!token || year.isActive) return;
    setSaving(true);
    setError("");
    try {
      await apiRequest(`/academic/years/${year.id}/activate`, { method: "PATCH", token });
      toast.success(`Tahun ajaran ${year.name} sekarang aktif.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Tahun ajaran gagal diaktifkan.");
    } finally {
      setSaving(false);
    }
  }

  const count = section === "years" ? years.length : section === "subjects" ? subjects.length : classes.length;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-app-border bg-app-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.12em] text-[#318BCB]">DATA CBT / AKADEMIK</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-app-text">{copy.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-app-muted">{copy.description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => void load()} disabled={loading} aria-label="Muat ulang data" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-app-border px-3 text-sm font-medium text-app-text hover:bg-app-bg disabled:opacity-50">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /><span className="hidden sm:inline">Muat ulang</span>
          </button>
          <button type="button" onClick={() => { setError(""); setIsCreating(true); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-app-primary px-4 text-sm font-semibold text-app-primary-contrast hover:bg-app-primary-hover">
            <Plus size={16} aria-hidden="true" /> {copy.addLabel}
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
        <div className="rounded-xl border border-app-border bg-app-surface px-4 py-3">
          <p className="text-xs text-app-muted">Jumlah {copy.title.toLowerCase()}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-app-text">{count}</p>
        </div>
        <div className="rounded-xl border border-app-border bg-app-surface px-4 py-3">
          <p className="text-xs text-app-muted">Tahun ajaran aktif</p>
          <p className="mt-1 truncate text-sm font-semibold text-app-text">{years.find((year) => year.isActive)?.name ?? "Belum ditentukan"}</p>
        </div>
      </div>

      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-app-text"><span>{error}</span><button type="button" onClick={() => void load()} className="font-semibold underline underline-offset-2">Coba lagi</button></div>}

      <div className="overflow-hidden rounded-xl border border-app-border bg-app-surface">
        <div className="flex items-center justify-between border-b border-app-border px-4 py-3.5">
          <h2 className="text-sm font-semibold text-app-text">Daftar {copy.title.toLowerCase()}</h2>
          <span className="text-xs tabular-nums text-app-muted">{count} data</span>
        </div>
        {loading ? <div role="status" className="px-4 py-12 text-center text-sm text-app-muted">Memuat data...</div> : section === "years" ? (
          years.length ? <div className="divide-y divide-app-border">{years.map((year) => <div key={year.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"><div className="min-w-0"><p className="text-sm font-semibold text-app-text">{year.name}</p><p className="mt-1 text-xs text-app-muted">{dateLabel(year.startDate)} - {dateLabel(year.endDate)} · {year._count?.classes ?? 0} kelas</p></div><div className="flex items-center gap-2">{year.isActive ? <span className="rounded-md bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">Aktif</span> : <button type="button" disabled={saving} onClick={() => void activateYear(year)} className="min-h-9 rounded-md border border-app-border px-3 text-xs font-medium text-app-text hover:bg-app-bg disabled:opacity-50">Jadikan aktif</button>}</div></div>)}</div> : <p className="px-4 py-12 text-center text-sm text-app-muted">{copy.empty}</p>
        ) : section === "subjects" ? (
          subjects.length ? <div className="divide-y divide-app-border">{subjects.map((subject) => <div key={subject.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"><div><p className="text-sm font-semibold text-app-text">{subject.name}</p><p className="mt-1 text-xs text-app-muted">{subject.code || "Tanpa kode"} · {subject.category || "Umum"}</p></div><p className="text-xs text-app-muted">{subject._count?.teacherAssignments ?? 0} penugasan · {subject._count?.questionBanks ?? 0} bank soal</p></div>)}</div> : <p className="px-4 py-12 text-center text-sm text-app-muted">{copy.empty}</p>
        ) : (
          classes.length ? <div className="divide-y divide-app-border">{classes.map((schoolClass) => <div key={schoolClass.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"><div><p className="text-sm font-semibold text-app-text">{schoolClass.name}</p><p className="mt-1 text-xs text-app-muted">Kelas {schoolClass.gradeLevel} · {schoolClass.academicYear.name}{educationSettings.departmentsEnabled && schoolClass.departmentName ? ` · ${schoolClass.departmentName}` : ""}</p></div><p className="text-xs text-app-muted">{schoolClass._count?.enrollments ?? 0} siswa</p></div>)}</div> : <p className="px-4 py-12 text-center text-sm text-app-muted">{copy.empty}</p>
        )}
      </div>

      {isCreating && <dialog ref={dialogRef} aria-labelledby="academic-dialog-title" onClose={() => setIsCreating(false)} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }} className="max-h-[min(90dvh,680px)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl border border-app-border bg-app-surface p-0 text-app-text shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-app-border px-5 py-4">
          <div><h2 id="academic-dialog-title" className="text-base font-semibold text-app-text">{copy.addLabel}</h2><p className="mt-1 text-xs text-app-muted">Lengkapi informasi yang diperlukan.</p></div>
          <button type="button" onClick={() => setIsCreating(false)} aria-label="Tutup formulir" className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-app-muted hover:bg-app-bg hover:text-app-text"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-5">
          {section === "years" ? <>
            <label className="block text-sm font-medium text-app-text">Nama tahun ajaran<input name="name" required maxLength={30} placeholder="2026/2027" className="mt-1.5 min-h-10 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text" /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-app-text">Tanggal mulai<input name="startDate" required type="date" className="mt-1.5 min-h-10 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text" /></label>
              <label className="block text-sm font-medium text-app-text">Tanggal akhir<input name="endDate" required type="date" className="mt-1.5 min-h-10 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text" /></label>
            </div>
          </> : section === "subjects" ? <>
            <label className="block text-sm font-medium text-app-text">Nama mata pelajaran / mata kuliah<input name="name" required maxLength={120} placeholder="Matematika" className="mt-1.5 min-h-10 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text" /></label>
            <label className="block text-sm font-medium text-app-text">Kode (opsional)<input name="code" maxLength={30} placeholder="MTK" className="mt-1.5 min-h-10 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text" /></label>
            <label className="block text-sm font-medium text-app-text">Kategori mata pelajaran<input name="category" maxLength={80} placeholder="Umum, Kejuruan, Produktif, Peminatan..." className="mt-1.5 min-h-10 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text" /><span className="mt-1 block text-xs text-app-muted">Kategori bebas ditentukan admin dan tidak bergantung pada jurusan.</span></label>
          </> : <>
            <label className="block text-sm font-medium text-app-text">Nama kelas<input name="name" required maxLength={80} placeholder="VII A" className="mt-1.5 min-h-10 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text" /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-app-text">Tingkat / semester<select name="gradeLevel" required defaultValue="7" className="mt-1.5 min-h-10 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text">{Array.from({ length: 20 }, (_, index) => index + 1).map((grade) => <option key={grade} value={grade}>{grade}</option>)}</select></label>
              {educationSettings.departmentsEnabled && <label className="block text-sm font-medium text-app-text">Jurusan / program (opsional)<select name="departmentName" defaultValue="" className="mt-1.5 min-h-10 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text"><option value="">Tanpa jurusan</option>{educationSettings.departments.map((department) => <option key={department} value={department}>{department}</option>)}</select></label>}
              <label className="block text-sm font-medium text-app-text">Tahun ajaran<select name="academicYearId" required defaultValue="" className="mt-1.5 min-h-10 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text"><option value="" disabled>Pilih tahun ajaran</option>{years.map((year) => <option key={year.id} value={year.id}>{year.name}{year.isActive ? " (Aktif)" : ""}</option>)}</select></label>
            </div>
            {years.length === 0 && <p className="text-xs text-app-muted">Buat tahun ajaran terlebih dahulu sebelum menambah kelas.</p>}
          </>}
          <div className="flex justify-end gap-2 border-t border-app-border pt-4">
            <button type="button" onClick={() => setIsCreating(false)} className="min-h-10 rounded-lg border border-app-border px-4 text-sm font-medium text-app-text hover:bg-app-bg">Batal</button>
            <button type="submit" disabled={saving || (section === "classes" && years.length === 0)} className="min-h-10 rounded-lg bg-app-primary px-4 text-sm font-semibold text-app-primary-contrast hover:bg-app-primary-hover disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan"}</button>
          </div>
        </form>
      </dialog>}
    </section>
  );
}
