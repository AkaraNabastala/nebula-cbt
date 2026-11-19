import { useCallback, useEffect, useState, useRef, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { apiRequest } from "../../lib/api";
import { toast } from "sonner";

type AssessmentType = { id: string; code: string; name: string };
type AcademicYear = { id: string; name: string; isActive: boolean };
type Subject = { id: string; name: string; code: string | null };
type SchoolClass = { id: string; name: string; gradeLevel: number; academicYearId: string; academicYear: { name: string; isActive: boolean } };
type ClassAssignment = { subjectId: string; classId: string };
type Bank = { id: string; name: string; subjectId: string; subject: Subject };
type QuestionOption = { id: string; type: string; difficulty: string; content: { text?: string }; defaultPoints: string | number; status: string };
type Exam = {
  id: string;
  name: string;
  status: string;
  subject: Subject;
  assessmentEvent: { name: string; status: string; academicYear: { name: string } };
  schedules: {
    id: string;
    sessionName: string;
    startsAt: string;
    endsAt: string;
    durationMinutes: number;
    status: string;
    defaultExamPaper: { name: string; status: string; totalQuestions: number; maxScore: string | number } | null;
    _count: { participants: number };
  }[];
};

const inputClass = "mt-1.5 min-h-11 w-full rounded-lg border border-app-border bg-app-input px-3 py-2 text-sm text-app-text";
const labelClass = "block text-xs font-medium text-app-text";

function dateTimeLabel(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function ExamOperationsPage({ token }: { token: string | null }) {
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classAssignments, setClassAssignments] = useState<ClassAssignment[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [questionOptions, setQuestionOptions] = useState<QuestionOption[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishingId, setPublishingId] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const createDialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) {
      setError("Sesi login tidak ditemukan. Silakan masuk kembali.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [options, bankData, examData] = await Promise.all([
        apiRequest<{ assessmentTypes: AssessmentType[]; academicYears: AcademicYear[]; subjects: Subject[]; classes: SchoolClass[]; classAssignments: ClassAssignment[] }>("/exam-operations/options", { token }),
        apiRequest<Bank[]>("/question-banks", { token }),
        apiRequest<Exam[]>("/exam-operations", { token }),
      ]);
      setAssessmentTypes(options.assessmentTypes);
      setYears(options.academicYears);
      setSelectedYearId((current) => options.academicYears.some((year) => year.id === current) ? current : options.academicYears.find((year) => year.isActive)?.id ?? options.academicYears[0]?.id ?? "");
      setSubjects(options.subjects);
      setClasses(options.classes);
      setClassAssignments(options.classAssignments);
      setBanks(bankData);
      setExams(examData);
      setSelectedSubjectId((current) => options.subjects.some((subject) => subject.id === current) ? current : options.subjects[0]?.id ?? "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Data ujian gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadQuestionOptions = useCallback(async (subjectId: string) => {
    if (!token || !subjectId) {
      setQuestionOptions([]);
      setSelectedQuestionIds([]);
      return;
    }
    setQuestionOptions([]);
    setSelectedQuestionIds([]);
    try {
      const subjectBanks = banks.filter((bank) => bank.subjectId === subjectId);
      const lists = await Promise.all(subjectBanks.map((bank) =>
        apiRequest<QuestionOption[]>(`/question-banks/${bank.id}/questions`, { token }),
      ));
      const published = lists.flat().filter((question) => question.status === "PUBLISHED");
      setQuestionOptions(published);
      setSelectedQuestionIds([]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Daftar soal terbit gagal dimuat.");
    }
  }, [banks, token]);

  useEffect(() => {
    if (showCreateDialog && createDialogRef.current && !createDialogRef.current.open) createDialogRef.current.showModal();
  }, [showCreateDialog]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  useEffect(() => {
    if (selectedSubjectId && banks.length) void Promise.resolve().then(() => loadQuestionOptions(selectedSubjectId));
    else if (!selectedSubjectId) void Promise.resolve().then(() => setQuestionOptions([]));
  }, [selectedSubjectId, banks, loadQuestionOptions]);

  function toggleQuestion(questionId: string, checked: boolean) {
    setSelectedQuestionIds((current) => checked
      ? [...current, questionId]
      : current.filter((id) => id !== questionId));
  }

  async function createExam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const startsAt = new Date(String(form.get("startsAt") || ""));
    const endsAt = new Date(String(form.get("endsAt") || ""));
    const classIds = form.getAll("classIds").map(String);
    if (!selectedQuestionIds.length) {
      setError("Pilih minimal satu soal yang sudah diterbitkan.");
      return;
    }
    if (!classIds.length) {
      setError("Pilih minimal satu kelas peserta.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const result = await apiRequest<{ name: string }>("/exam-operations", {
        method: "POST",
        token,
        body: JSON.stringify({
          name: String(form.get("name") || ""),
          description: String(form.get("description") || ""),
          assessmentTypeId: String(form.get("assessmentTypeId") || ""),
          academicYearId: String(form.get("academicYearId") || ""),
          subjectId: selectedSubjectId,
          sessionName: String(form.get("sessionName") || "Sesi 1"),
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          durationMinutes: Number(form.get("durationMinutes") || 0),
          classIds,
          questionIds: selectedQuestionIds,
          shuffleQuestions: form.get("shuffleQuestions") === "on",
          shuffleOptions: form.get("shuffleOptions") === "on",
        }),
      });
      setShowCreateDialog(false);
      toast.success(`Draf ujian "${result.name}" berhasil dibuat. Periksa jadwal dan peserta sebelum menerbitkan.`);
      formElement.reset();
      setSelectedQuestionIds([]);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Draf ujian gagal dibuat.");
    } finally {
      setSaving(false);
    }
  }

  async function publishExam(exam: Exam) {
    if (!token) return;
    setPublishingId(exam.id);
    setError("");
    try {
      const result = await apiRequest<{ participantCount: number }>(`/exam-operations/${exam.id}/publish`, { method: "PATCH", token });
      toast.success(`Ujian diterbitkan. ${result.participantCount} peserta terdaftar dari kelas yang dipilih.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ujian gagal diterbitkan.");
    } finally {
      setPublishingId("");
    }
  }

  const eligibleClasses = classes.filter((schoolClass) =>
    (!selectedYearId || schoolClass.academicYearId === selectedYearId) &&
    (classAssignments.length === 0 || classAssignments.some((assignment) => assignment.subjectId === selectedSubjectId && assignment.classId === schoolClass.id)),
  );

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-xl font-semibold tracking-tight text-app-text">Operasional ujian</h1><p className="mt-1 max-w-2xl text-sm text-app-muted">Susun paket, tentukan peserta dan jadwal, lalu terbitkan ujian.</p></div>
        <button type="button" onClick={() => { setError(""); setShowCreateDialog(true); }} disabled={!subjects.length || !assessmentTypes.length || !years.length} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-app-primary px-4 text-sm font-semibold text-app-primary-contrast hover:bg-app-primary-hover disabled:opacity-50"><Plus size={16} /> Buat draf ujian</button>
      </header>
      {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-app-text">{error}</div>}

      <div className="grid items-start gap-4">
        <div className="min-w-0 rounded-2xl border border-app-border bg-app-surface">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-app-border px-4 py-4 sm:px-5">
            <div><h2 className="text-sm font-semibold text-app-text">Daftar ujian</h2><p className="mt-1 text-xs text-app-muted">{exams.length} ujian tercatat</p></div>
            <button type="button" onClick={() => void load()} disabled={loading} className="min-h-11 rounded-lg border border-app-border px-3 text-xs font-medium text-app-text disabled:opacity-50">Muat ulang</button>
          </div>
          {loading ? <p className="px-5 py-12 text-center text-sm text-app-muted">Memuat ujian…</p> : exams.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-app-muted">Belum ada ujian. Buat draf melalui formulir di samping.</p>
          ) : (
            <ol className="divide-y divide-app-border">
              {exams.map((exam) => {
                const schedule = exam.schedules[0];
                const paper = schedule?.defaultExamPaper;
                return <li key={exam.id} className="space-y-3 px-4 py-4 sm:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0"><h3 className="font-semibold text-app-text">{exam.name}</h3><p className="mt-1 text-xs text-app-muted">{exam.subject.name} · {exam.assessmentEvent.academicYear.name}</p></div>
                    <span className="rounded-md bg-app-soft px-2 py-1 text-[11px] font-medium text-app-text">{exam.status === "DRAFT" ? "Draf" : exam.status === "PUBLISHED" ? "Terbit" : exam.status}</span>
                  </div>
                  {schedule && <div className="grid gap-2 text-xs text-app-muted sm:grid-cols-2">
                    <p>{dateTimeLabel(schedule.startsAt)} – {dateTimeLabel(schedule.endsAt)}</p>
                    <p>{schedule.durationMinutes} menit · {schedule._count.participants} peserta</p>
                    <p>{paper?.totalQuestions ?? 0} soal · Maks. {paper?.maxScore ?? 0} poin</p>
                    <p>{schedule.sessionName}</p>
                  </div>}
                  {exam.status === "DRAFT" && <button type="button" onClick={() => void publishExam(exam)} disabled={publishingId === exam.id} className="min-h-11 rounded-lg bg-app-primary px-4 text-xs font-semibold text-app-primary-contrast disabled:opacity-50">{publishingId === exam.id ? "Menerbitkan…" : "Terbitkan ujian"}</button>}
                </li>;
              })}
            </ol>
          )}
        </div>

        <dialog ref={createDialogRef} onClose={() => setShowCreateDialog(false)} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }} className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-xl border border-app-border bg-app-surface p-0 text-app-text shadow-xl backdrop:bg-slate-950/45">
          <div className="flex justify-end px-4 pt-3"><button type="button" onClick={() => setShowCreateDialog(false)} aria-label="Tutup formulir ujian" className="inline-flex size-9 items-center justify-center rounded-md text-app-muted hover:bg-app-bg"><X size={18} /></button></div>
          <form onSubmit={createExam} className="space-y-4 px-5 pb-5">
          <div><h2 className="text-sm font-semibold text-app-text">Buat draf ujian</h2><p className="mt-1 text-xs leading-5 text-app-muted">Saat draf dibuat, isi soal disalin menjadi snapshot. Penerbitan akan mengunci paket dan mendaftarkan siswa aktif.</p></div>
          <label className={labelClass}>Nama ujian<input name="name" required maxLength={150} placeholder="Penilaian Akhir Semester" className={inputClass} /></label>
          <label className={labelClass}>Jenis asesmen<select name="assessmentTypeId" required defaultValue="" className={inputClass}><option value="" disabled>Pilih jenis asesmen</option>{assessmentTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className={labelClass}>Tahun ajaran<select id="exam-academic-year" name="academicYearId" required value={selectedYearId} onChange={(event) => setSelectedYearId(event.target.value)} className={inputClass}><option value="" disabled>Pilih tahun ajaran</option>{years.map((year) => <option key={year.id} value={year.id}>{year.name}{year.isActive ? " (Aktif)" : ""}</option>)}</select></label>
          <label className={labelClass}>Mata pelajaran<select name="subjectId" required value={selectedSubjectId} onChange={(event) => setSelectedSubjectId(event.target.value)} className={inputClass}><option value="" disabled>Pilih mata pelajaran</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
          <label className={labelClass}>Nama sesi<input name="sessionName" required maxLength={100} defaultValue="Sesi 1" className={inputClass} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>Mulai<input name="startsAt" required type="datetime-local" className={inputClass} /></label>
            <label className={labelClass}>Selesai<input name="endsAt" required type="datetime-local" className={inputClass} /></label>
          </div>
          <label className={labelClass}>Durasi (menit)<input name="durationMinutes" required type="number" min="1" max="600" defaultValue="90" className={inputClass} /></label>
          <fieldset className="space-y-2">
            <legend className={labelClass}>Kelas peserta</legend>
            <div className="max-h-36 space-y-2 overflow-y-auto rounded-lg border border-app-border p-3">
              {eligibleClasses.map((schoolClass) => <label key={schoolClass.id} className="flex min-h-9 items-center gap-2 text-xs text-app-text"><input type="checkbox" name="classIds" value={schoolClass.id} className="size-4 accent-app-primary" /><span>{schoolClass.name} · Kelas {schoolClass.gradeLevel} · {schoolClass.academicYear.name}</span></label>)}
              {eligibleClasses.length === 0 && <p className="text-xs text-app-muted">Belum ada kelas pada tahun ajaran yang dipilih.</p>}
            </div>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className={labelClass}>Soal terbit · {selectedQuestionIds.length} dipilih</legend>
            <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-app-border p-3">
              {questionOptions.map((question) => <label key={question.id} className="flex gap-2 text-xs text-app-text"><input type="checkbox" checked={selectedQuestionIds.includes(question.id)} onChange={(event) => toggleQuestion(question.id, event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-app-primary" /><span className="min-w-0"><span className="block leading-5">{question.content.text}</span><span className="mt-0.5 block text-[10px] text-app-muted">{question.type} · {question.defaultPoints} poin</span></span></label>)}
              {questionOptions.length === 0 && <p className="text-xs text-app-muted">Belum ada soal terbit untuk mata pelajaran ini.</p>}
            </div>
          </fieldset>
          <div className="space-y-2">
            <label className="flex min-h-9 items-center gap-2 text-xs text-app-text"><input type="checkbox" name="shuffleQuestions" className="size-4 accent-app-primary" />Acak urutan soal</label>
            <label className="flex min-h-9 items-center gap-2 text-xs text-app-text"><input type="checkbox" name="shuffleOptions" className="size-4 accent-app-primary" />Acak pilihan jawaban</label>
          </div>
          <label className={labelClass}>Keterangan (opsional)<textarea name="description" rows={2} maxLength={1000} className={inputClass} /></label>
          <button type="submit" disabled={saving || !subjects.length || !assessmentTypes.length || !years.length} className="min-h-11 w-full rounded-lg bg-app-primary px-4 text-sm font-semibold text-app-primary-contrast disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Menyimpan…" : "Simpan draf ujian"}</button>
        </form>
        </dialog>
      </div>
    </section>
  );
}
