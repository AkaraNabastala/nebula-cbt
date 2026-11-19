import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

type ResultRow = {
  id: string;
  status: string;
  rawScore: string | number;
  finalScore: string | number;
  maxScore: string | number;
  subject: { name: string };
  schoolClass: { name: string };
  academicYear: { name: string };
  attempt: { participant: { studentProfile: { user: { fullName: string } }; examSchedule: { exam: { name: string } } } };
  _count: { manualGrades: number };
};
type EssayAnswer = {
  answerId: string;
  questionId: string;
  prompt: string;
  answerText: string;
  points: number;
  gradingGuide: string;
  manualGrade: { score: number; feedback: string | null; gradedAt: string } | null;
};
type ResultDetail = {
  id: string;
  status: string;
  studentName: string;
  examName: string;
  className: string;
  subjectName: string;
  academicYearName: string;
  rawScore: number;
  finalScore: number;
  maxScore: number;
  essayAnswers: EssayAnswer[];
};

const fieldClass = "mt-1.5 min-h-11 w-full rounded-lg border border-app-border bg-app-input px-3 py-2 text-sm text-app-text";

export function ResultsPage({ token }: { token: string | null }) {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<ResultDetail | null>(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest<ResultRow[]>("/assessment-results", { token });
      setResults(data);
      setSelectedId((current) => data.some((item) => item.id === current) ? current : data[0]?.id ?? "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Hasil ujian gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadDetail = useCallback(async (id: string) => {
    if (!token || !id) { setDetail(null); return; }
    try {
      const data = await apiRequest<ResultDetail>(`/assessment-results/${id}`, { token });
      setDetail(data);
      setScores(Object.fromEntries(data.essayAnswers.map((item) => [item.answerId, item.manualGrade ? String(item.manualGrade.score) : ""])));
      setFeedback(Object.fromEntries(data.essayAnswers.map((item) => [item.answerId, item.manualGrade?.feedback ?? ""])));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Rincian penilaian gagal dimuat.");
    }
  }, [token]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  useEffect(() => { if (selectedId) void Promise.resolve().then(() => loadDetail(selectedId)); }, [selectedId, loadDetail]);

  async function saveGrade(answer: EssayAnswer) {
    if (!token || !detail) return;
    setSavingId(answer.answerId);
    setError("");
    setNotice("");
    try {
      await apiRequest(`/assessment-results/${detail.id}/essays/${answer.answerId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ score: Number(scores[answer.answerId]), feedback: feedback[answer.answerId] || "" }),
      });
      setNotice("Nilai esai berhasil disimpan.");
      await loadDetail(detail.id);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nilai esai gagal disimpan.");
    } finally {
      setSavingId("");
    }
  }

  async function publishResult() {
    if (!token || !detail) return;
    setPublishing(true);
    setError("");
    setNotice("");
    try {
      await apiRequest(`/assessment-results/${detail.id}/publish`, { method: "PATCH", token });
      setNotice("Hasil ujian berhasil diterbitkan kepada siswa.");
      await load();
      await loadDetail(detail.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Hasil ujian gagal diterbitkan.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <section className="space-y-6">
      <header><h1 className="text-2xl font-bold tracking-tight text-app-text">Penilaian dan hasil</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-app-muted">Periksa hasil otomatis, nilai jawaban esai, lalu terbitkan hasil yang sudah lengkap.</p></header>
      {notice && <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-app-text">{notice}</div>}
      {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-app-text">{error}</div>}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
        <section className="min-w-0 rounded-2xl border border-app-border bg-app-surface">
          <div className="flex items-center justify-between gap-3 border-b border-app-border px-4 py-4"><div><h2 className="text-sm font-semibold text-app-text">Daftar hasil</h2><p className="mt-1 text-xs text-app-muted">{results.length} hasil</p></div><button type="button" onClick={() => void load()} className="min-h-10 rounded-lg border border-app-border px-3 text-xs font-medium text-app-text">Muat ulang</button></div>
          {loading ? <p className="px-4 py-10 text-center text-sm text-app-muted">Memuat hasil…</p> : results.length === 0 ? <p className="px-4 py-10 text-center text-sm text-app-muted">Belum ada hasil ujian.</p> : <ul className="divide-y divide-app-border">
            {results.map((item) => <li key={item.id}><button type="button" onClick={() => setSelectedId(item.id)} aria-current={selectedId === item.id ? "true" : undefined} className={`min-h-11 w-full px-4 py-4 text-left ${selectedId === item.id ? "bg-app-soft" : "hover:bg-app-bg"}`}><span className="block text-sm font-semibold text-app-text">{item.attempt.participant.studentProfile.user.fullName}</span><span className="mt-1 block text-xs text-app-muted">{item.attempt.participant.examSchedule.exam.name} · {item.subject.name}</span><span className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-app-muted"><span>{item.schoolClass.name} · {item.academicYear.name}</span><span>{item.finalScore}/{item.maxScore} · {item.status === "PUBLISHED" ? "Terbit" : item.status === "GRADED" ? "Dinilai" : "Perlu dinilai"}</span></span></button></li>)}
          </ul>}
        </section>

        <section className="min-w-0 space-y-4">
          {!detail ? <div className="rounded-2xl border border-app-border bg-app-surface px-5 py-12 text-center text-sm text-app-muted">Pilih hasil untuk melihat rincian penilaian.</div> : <>
            <div className="rounded-2xl border border-app-border bg-app-surface p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-semibold text-app-text">{detail.studentName}</h2><p className="mt-1 text-xs text-app-muted">{detail.examName} · {detail.subjectName} · {detail.className}</p></div><span className="rounded-md bg-app-soft px-2 py-1 text-[11px] font-medium text-app-text">{detail.status}</span></div>
              <div className="mt-4 grid grid-cols-3 gap-3"><div><p className="text-[11px] text-app-muted">Nilai mentah</p><p className="mt-1 text-lg font-bold tabular-nums text-app-text">{detail.rawScore}</p></div><div><p className="text-[11px] text-app-muted">Nilai akhir</p><p className="mt-1 text-lg font-bold tabular-nums text-app-text">{detail.finalScore}</p></div><div><p className="text-[11px] text-app-muted">Maksimum</p><p className="mt-1 text-lg font-bold tabular-nums text-app-text">{detail.maxScore}</p></div></div>
            </div>
            {detail.essayAnswers.length > 0 ? <div className="space-y-3">
              <h3 className="text-sm font-semibold text-app-text">Pemeriksaan jawaban esai</h3>
              {detail.essayAnswers.map((answer, index) => <article key={answer.answerId} className="space-y-3 rounded-2xl border border-app-border bg-app-surface p-4 sm:p-5">
                <div><p className="text-xs font-semibold text-app-muted">Esai {index + 1} · Maksimum {answer.points} poin</p><h4 className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-app-text">{answer.prompt}</h4></div>
                <div className="rounded-xl bg-app-bg p-3"><p className="text-[11px] font-semibold text-app-muted">Jawaban siswa</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-app-text">{answer.answerText || "Tidak ada jawaban."}</p></div>
                {answer.gradingGuide && <div className="rounded-xl border border-app-border p-3"><p className="text-[11px] font-semibold text-app-muted">Pedoman penilaian</p><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-app-text">{answer.gradingGuide}</p></div>}
                {detail.status !== "PUBLISHED" && <div className="grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
                  <label className="block text-xs font-medium text-app-text">Nilai<input type="number" min="0" max={answer.points} step="0.01" value={scores[answer.answerId] ?? ""} onChange={(event) => setScores((current) => ({ ...current, [answer.answerId]: event.target.value }))} className={fieldClass} /></label>
                  <label className="block text-xs font-medium text-app-text">Umpan balik<textarea rows={2} maxLength={5000} value={feedback[answer.answerId] ?? ""} onChange={(event) => setFeedback((current) => ({ ...current, [answer.answerId]: event.target.value }))} className={fieldClass} /></label>
                </div>}
                {answer.manualGrade && <p className="text-[11px] text-app-muted">Tersimpan: {answer.manualGrade.score}/{answer.points} poin</p>}
                {detail.status !== "PUBLISHED" && <button type="button" onClick={() => void saveGrade(answer)} disabled={savingId === answer.answerId || scores[answer.answerId] === "" || scores[answer.answerId] === undefined} className="min-h-11 rounded-lg bg-app-primary px-4 text-xs font-semibold text-app-primary-contrast disabled:opacity-50">{savingId === answer.answerId ? "Menyimpan…" : "Simpan nilai esai"}</button>}
              </article>)}
            </div> : <p className="rounded-xl border border-app-border bg-app-surface p-4 text-sm text-app-muted">Tidak ada soal esai. Nilai otomatis siap diterbitkan.</p>}
            {detail.status === "GRADED" && <button type="button" onClick={() => void publishResult()} disabled={publishing} className="min-h-11 rounded-lg bg-app-primary px-4 text-sm font-semibold text-app-primary-contrast disabled:opacity-50">{publishing ? "Menerbitkan…" : "Terbitkan hasil kepada siswa"}</button>}
          </>}
        </section>
      </div>
    </section>
  );
}
