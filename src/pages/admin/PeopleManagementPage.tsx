import { useCallback, useEffect, useState, useRef, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { apiRequest } from "../../lib/api";
import { toast } from "sonner";

type Person = { id: string; user: { fullName: string } };
type SchoolClass = { id: string; name: string; gradeLevel: number; academicYear: { name: string } };
type Subject = { id: string; name: string; code: string | null };
type Enrollment = { id: string; joinedAt: string; leftAt: string | null; student: Person; class: SchoolClass };
type TeacherAssignment = { id: string; isActive: boolean; teacher: Person; subject: { name: string }; class: { name: string; academicYear: { name: string } } };

const fieldClass = "mt-1.5 min-h-11 w-full rounded-lg border border-app-border bg-app-input px-3 py-2 text-sm text-app-text";
const labelClass = "block text-xs font-medium text-app-text";

export type PeopleSection = "enrollments" | "teacherAssignments";

export function PeopleManagementPage({ token, section }: { token: string | null; section: PeopleSection }) {
  const [students, setStudents] = useState<Person[]>([]);
  const [teachers, setTeachers] = useState<Person[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const actionDialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [options, enrollmentData, assignmentData] = await Promise.all([
        apiRequest<{ students: Person[]; teachers: Person[]; classes: SchoolClass[]; subjects: Subject[] }>("/people-management/options", { token }),
        apiRequest<Enrollment[]>("/people-management/enrollments", { token }),
        apiRequest<TeacherAssignment[]>("/people-management/teacher-assignments", { token }),
      ]);
      setStudents(options.students);
      setTeachers(options.teachers);
      setClasses(options.classes);
      setSubjects(options.subjects);
      setEnrollments(enrollmentData);
      setAssignments(assignmentData);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Data penempatan gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (showActionDialog && actionDialogRef.current && !actionDialogRef.current.open) actionDialogRef.current.showModal();
  }, [showActionDialog]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  async function submitEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSaving(true);
    setError("");
    try {
      await apiRequest("/people-management/enrollments", {
        method: "POST",
        token,
        body: JSON.stringify({ studentProfileId: String(form.get("studentProfileId") || ""), classId: String(form.get("classId") || "") }),
      });
      formElement.reset();
      setShowActionDialog(false);
      toast.success("Siswa berhasil ditempatkan pada kelas.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Penempatan siswa gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function submitAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSaving(true);
    setError("");
    try {
      await apiRequest("/people-management/teacher-assignments", {
        method: "POST",
        token,
        body: JSON.stringify({
          teacherProfileId: String(form.get("teacherProfileId") || ""),
          subjectId: String(form.get("subjectId") || ""),
          classId: String(form.get("classId") || ""),
        }),
      });
      formElement.reset();
      setShowActionDialog(false);
      toast.success("Penugasan guru berhasil disimpan.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Penugasan guru gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function leaveClass(id: string) {
    if (!token) return;
    setError("");
    try {
      await apiRequest(`/people-management/enrollments/${id}/leave`, { method: "PATCH", token });
      toast.success("Penempatan siswa ditutup.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Penempatan siswa gagal diperbarui.");
    }
  }

  async function toggleAssignment(item: TeacherAssignment) {
    if (!token) return;
    setError("");
    try {
      await apiRequest(`/people-management/teacher-assignments/${item.id}/status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      toast.success(item.isActive ? "Penugasan guru dinonaktifkan." : "Penugasan guru diaktifkan.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Status penugasan gagal diperbarui.");
    }
  }

  const activeEnrollments = enrollments.filter((item) => !item.leftAt);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold tracking-[0.12em] text-[#318BCB]">ADMINISTRASI SEKOLAH / PENGELOLAAN</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-app-text">{section === "enrollments" ? "Penempatan siswa" : "Penugasan guru"}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-app-muted">{section === "enrollments" ? "Tempatkan siswa ke rombongan belajar dan kelola riwayat kelasnya." : "Atur guru pengampu berdasarkan mata pelajaran dan kelas."}</p></div>
        <button type="button" onClick={() => { setError(""); setShowActionDialog(true); }} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-app-primary px-4 text-sm font-semibold text-app-primary-contrast hover:bg-app-primary-hover"><Plus size={16} /> {section === "enrollments" ? "Tempatkan siswa" : "Tugaskan guru"}</button>
      </header>
      {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-app-text">{error}</div>}
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
        <div className="rounded-xl border border-app-border bg-app-surface px-4 py-3">
          <p className="text-xs text-app-muted">{section === "enrollments" ? "Penempatan aktif" : "Penugasan aktif"}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-app-text">{section === "enrollments" ? activeEnrollments.length : assignments.filter((item) => item.isActive).length}</p>
        </div>
        <div className="rounded-xl border border-app-border bg-app-surface px-4 py-3">
          <p className="text-xs text-app-muted">Total riwayat</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-app-text">{section === "enrollments" ? enrollments.length : assignments.length}</p>
        </div>
      </div>
      {section === "enrollments" ? (
        <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface">
          <div className="border-b border-app-border px-4 py-4"><h2 className="text-sm font-semibold text-app-text">Riwayat penempatan siswa</h2><p className="mt-1 text-xs text-app-muted">{enrollments.length} penempatan tercatat</p></div>
          {loading ? <p className="px-4 py-10 text-center text-sm text-app-muted">Memuat penempatan…</p> : enrollments.length === 0 ? <p className="px-4 py-10 text-center text-sm text-app-muted">Belum ada siswa ditempatkan.</p> : <ul className="divide-y divide-app-border">{enrollments.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"><div><p className="text-sm font-semibold text-app-text">{item.student.user.fullName}</p><p className="mt-1 text-xs text-app-muted">{item.class.name} · {item.class.academicYear.name}</p><p className="mt-1 text-[11px] text-app-muted">{item.leftAt ? "Selesai" : "Aktif"}</p></div>{!item.leftAt && <button type="button" onClick={() => void leaveClass(item.id)} className="min-h-10 rounded-lg border border-app-border px-3 text-xs font-medium text-app-text">Akhiri penempatan</button>}</li>)}</ul>}
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface">
          <div className="border-b border-app-border px-4 py-4"><h2 className="text-sm font-semibold text-app-text">Daftar penugasan guru</h2><p className="mt-1 text-xs text-app-muted">{assignments.length} penugasan tercatat</p></div>
          {loading ? <p className="px-4 py-10 text-center text-sm text-app-muted">Memuat penugasan…</p> : assignments.length === 0 ? <p className="px-4 py-10 text-center text-sm text-app-muted">Belum ada penugasan guru.</p> : <ul className="divide-y divide-app-border">{assignments.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"><div><p className="text-sm font-semibold text-app-text">{item.teacher.user.fullName}</p><p className="mt-1 text-xs text-app-muted">{item.subject.name} · {item.class.name} · {item.class.academicYear.name}</p><p className="mt-1 text-[11px] text-app-muted">{item.isActive ? "Aktif" : "Nonaktif"}</p></div><button type="button" onClick={() => void toggleAssignment(item)} className="min-h-10 rounded-lg border border-app-border px-3 text-xs font-medium text-app-text">{item.isActive ? "Nonaktifkan" : "Aktifkan"}</button></li>)}</ul>}
        </section>
      )}
      {showActionDialog && <dialog ref={actionDialogRef} onClose={() => setShowActionDialog(false)} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }} className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl border border-app-border bg-app-surface p-0 text-app-text shadow-2xl">
        <div className="flex justify-end px-4 pt-3"><button type="button" onClick={() => setShowActionDialog(false)} aria-label="Tutup formulir" className="inline-flex size-9 items-center justify-center rounded-md text-app-muted hover:bg-app-bg"><X size={18} /></button></div>
        {section === "enrollments" ? <form onSubmit={submitEnrollment} className="space-y-3 px-5 pb-5">
          <div><h2 className="text-sm font-semibold text-app-text">Tempatkan siswa</h2><p className="mt-1 text-xs leading-5 text-app-muted">Satu siswa hanya dapat memiliki satu kelas aktif dalam satu tahun ajaran.</p></div>
          <label className={labelClass}>Siswa<select name="studentProfileId" required defaultValue="" className={fieldClass}><option value="" disabled>Pilih siswa</option>{students.map((item) => <option key={item.id} value={item.id}>{item.user.fullName}</option>)}</select></label>
          <label className={labelClass}>Kelas<select name="classId" required defaultValue="" className={fieldClass}><option value="" disabled>Pilih kelas</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.academicYear.name}</option>)}</select></label>
          <button type="submit" disabled={saving || !students.length || !classes.length} className="min-h-11 w-full rounded-lg bg-app-primary px-4 text-sm font-semibold text-app-primary-contrast disabled:opacity-50">{saving ? "Menyimpan…" : "Tempatkan siswa"}</button>
          {!students.length && <p className="text-xs text-app-muted">Belum ada akun siswa aktif dengan profil.</p>}
        </form> : <form onSubmit={submitAssignment} className="space-y-3 px-5 pb-5">
          <div><h2 className="text-sm font-semibold text-app-text">Tugaskan guru</h2><p className="mt-1 text-xs leading-5 text-app-muted">Penugasan menentukan akses guru ke bank soal, kelas, dan ujian.</p></div>
          <label className={labelClass}>Guru<select name="teacherProfileId" required defaultValue="" className={fieldClass}><option value="" disabled>Pilih guru</option>{teachers.map((item) => <option key={item.id} value={item.id}>{item.user.fullName}</option>)}</select></label>
          <label className={labelClass}>Mata pelajaran<select name="subjectId" required defaultValue="" className={fieldClass}><option value="" disabled>Pilih mata pelajaran</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}{item.code ? ` · ${item.code}` : ""}</option>)}</select></label>
          <label className={labelClass}>Kelas<select name="classId" required defaultValue="" className={fieldClass}><option value="" disabled>Pilih kelas</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.academicYear.name}</option>)}</select></label>
          <button type="submit" disabled={saving || !teachers.length || !subjects.length || !classes.length} className="min-h-11 w-full rounded-lg bg-app-primary px-4 text-sm font-semibold text-app-primary-contrast disabled:opacity-50">{saving ? "Menyimpan…" : "Simpan penugasan"}</button>
        </form>}
      </dialog>}
    </section>
  );
}
