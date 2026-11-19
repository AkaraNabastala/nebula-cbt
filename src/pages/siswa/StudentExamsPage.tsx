import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "../../lib/api";

type StudentExam = {
  id: string;
  status: string;
  exam: { id: string; name: string; status: string; subject: { name: string }; assessmentEvent: { name: string } };
  schedule: { id: string; sessionName: string; startsAt: string; endsAt: string; durationMinutes: number; status: string };
  attempt: { id: string; status: string; startedAt: string; deadlineAt: string; submittedAt: string | null } | null;
};
type ExamQuestion = {
  id: string;
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY";
  content: { text?: string };
  options: { id: string; label: string; content: { text?: string } }[];
  points: number;
  sortOrder: number;
};
type Answer = { answerData: Record<string, unknown>; answerVersion: number };
type PendingAnswer = { questionId: string; answerData: Record<string, unknown>; answerVersion: number };
type AttemptState = { id: string; deadlineAt: string; questions: ExamQuestion[] };
type StartResponse = {
  attemptId?: string;
  sessionToken?: string;
  status: string;
  alreadyClosed?: boolean;
  deadlineAt?: string;
  serverTime: string;
  questions?: ExamQuestion[];
  answers?: { questionId: string; answerData: Record<string, unknown>; answerVersion: number }[];
  receipt?: { receiptCode: string; submittedAt: string; answerCount: number } | null;
};
type SyncResponse = { status: string; acceptedCount: number; rejectedCount: number; serverTime: string; duplicate: boolean };
type Receipt = { receiptCode: string; submittedAt: string; answerCount: number };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function timeLabel(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return [hours, minutes, rest].map((part) => String(part).padStart(2, "0")).join(":");
}

const inputClass = "mt-2 min-h-11 w-full rounded-lg border border-app-border bg-app-input px-3 py-2 text-sm text-app-text";

export function StudentExamsPage({ token }: { token: string | null }) {
  const [exams, setExams] = useState<StudentExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState("");
  const [attempt, setAttempt] = useState<AttemptState | null>(null);
  const [sessionToken, setSessionToken] = useState("");
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [pendingAnswers, setPendingAnswers] = useState<Record<string, PendingAnswer>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [initialRemainingSeconds, setInitialRemainingSeconds] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const flushRef = useRef<() => Promise<boolean>>(async () => true);
  const submitRef = useRef<() => Promise<void>>(async () => {});
  const batchIdRef = useRef("");

  const loadExams = useCallback(async () => {
    if (!token) {
      setError("Sesi login tidak ditemukan. Silakan masuk kembali.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setExams(await apiRequest<StudentExam[]>("/student/exams", { token }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Daftar ujian gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void Promise.resolve().then(loadExams); }, [loadExams]);

  const flush = useCallback(async () => {
    if (!attempt || !sessionToken || !token) return false;
    const batch = Object.values(pendingAnswers);
    if (!batch.length) { batchIdRef.current = ""; return true; }
    if (!navigator.onLine) {
      setOnline(false);
      return false;
    }
    setSyncing(true);
    try {
      const result = await apiRequest<SyncResponse>(`/student/attempts/${attempt.id}/sync`, {
        method: "POST",
        token,
        headers: { "x-attempt-session": sessionToken },
        body: JSON.stringify({ clientBatchId: batchIdRef.current || (batchIdRef.current = crypto.randomUUID()), answers: batch }),
      });
      if (attempt) setRemainingSeconds(Math.max(0, Math.ceil((Date.parse(attempt.deadlineAt) - Date.parse(result.serverTime)) / 1000)));
      batchIdRef.current = "";
      if (result.acceptedCount === 0 && result.rejectedCount > 0) {
        setError("Server menolak jawaban yang dikirim. Sambungkan ulang sesi untuk memuat status terakhir.");
        return false;
      }
      setPendingAnswers((current) => {
        const next = { ...current };
        for (const sent of batch) {
          if (next[sent.questionId]?.answerVersion === sent.answerVersion) delete next[sent.questionId];
        }
        return next;
      });
      setError("");
      setNotice(result.rejectedCount ? "Sebagian jawaban tersimpan. Periksa jawaban yang belum tersinkron." : "Jawaban tersimpan di server.");
      return result.rejectedCount === 0;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sinkronisasi jawaban gagal.");
      return false;
    } finally {
      setSyncing(false);
    }
  }, [attempt, pendingAnswers, sessionToken, token]);

  useEffect(() => { flushRef.current = flush; }, [flush]);

  useEffect(() => {
    if (!attempt) return;
    const key = `nebula-cbt-pending:${attempt.id}`;
    if (Object.keys(pendingAnswers).length) {
      window.localStorage.setItem(key, JSON.stringify(Object.values(pendingAnswers)));
    } else {
      window.localStorage.removeItem(key);
    }
  }, [attempt, pendingAnswers]);

  useEffect(() => {
    if (!attempt || !Object.keys(pendingAnswers).length) return;
    const timeout = window.setTimeout(() => { void flushRef.current(); }, 900);
    return () => window.clearTimeout(timeout);
  }, [attempt, pendingAnswers]);

  useEffect(() => {
    if (!attempt?.id) return;
    const interval = window.setInterval(() => { void flushRef.current(); }, 10000);
    const onOnline = () => { setOnline(true); void flushRef.current(); };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [attempt?.id]);

  useEffect(() => {
    if (!attempt?.id) return;
    const interval = window.setInterval(() => setRemainingSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [attempt?.id]);


  async function startExam(exam: StudentExam) {
    if (!token) return;
    setStartingId(exam.id);
    setError("");
    setNotice("");
    setReceipt(null);
    try {
      const result = await apiRequest<StartResponse>(`/student/exams/${exam.id}/start`, {
        method: "POST",
        token,
        body: JSON.stringify({ deviceFingerprint: `${navigator.userAgent}:${navigator.language}` }),
      });
      if (result.alreadyClosed || !result.attemptId || !result.sessionToken || !result.deadlineAt || !result.questions) {
        if (result.receipt) setReceipt(result.receipt);
        setNotice(result.status === "EXPIRED" ? "Waktu ujian telah berakhir." : "Ujian ini sudah diselesaikan.");
        await loadExams();
        return;
      }
      const attemptState = { id: result.attemptId, deadlineAt: result.deadlineAt, questions: result.questions };
      setAttempt(attemptState);
      setSessionToken(result.sessionToken);
      window.sessionStorage.setItem(`nebula-cbt-session:${result.attemptId}`, result.sessionToken);
      const initialSeconds = Math.max(0, Math.ceil((Date.parse(result.deadlineAt) - Date.parse(result.serverTime)) / 1000));
      setInitialRemainingSeconds(initialSeconds);
      setRemainingSeconds(initialSeconds);
      const serverAnswers: Record<string, Answer> = {};
      for (const answer of result.answers ?? []) serverAnswers[answer.questionId] = { answerData: answer.answerData, answerVersion: answer.answerVersion };
      let localPending: PendingAnswer[] = [];
      try {
        localPending = JSON.parse(window.localStorage.getItem(`nebula-cbt-pending:${result.attemptId}`) || "[]") as PendingAnswer[];
      } catch { localPending = []; }
      const merged = { ...serverAnswers };
      const pending: Record<string, PendingAnswer> = {};
      for (const item of localPending) {
        if ((merged[item.questionId]?.answerVersion ?? 0) < item.answerVersion) {
          merged[item.questionId] = { answerData: item.answerData, answerVersion: item.answerVersion };
          pending[item.questionId] = item;
        }
      }
      setAnswers(merged);
      setPendingAnswers(pending);
      setCurrentIndex(0);
      setNotice("Sesi ujian aktif. Jawaban akan disinkronkan otomatis.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ujian gagal dimulai.");
    } finally {
      setStartingId("");
    }
  }

  function changeAnswer(questionId: string, answerData: Record<string, unknown>) {
    const nextVersion = (answers[questionId]?.answerVersion ?? 0) + 1;
    const next = { questionId, answerData, answerVersion: nextVersion };
    setAnswers((current) => ({ ...current, [questionId]: { answerData, answerVersion: nextVersion } }));
    setPendingAnswers((current) => ({ ...current, [questionId]: next }));
  }

  async function submitAttempt() {
    if (!attempt || !token || !sessionToken || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const synced = await flush();
      if (!synced && Object.keys(pendingAnswers).length) {
        setError("Jawaban belum tersinkron. Sambungkan internet sebelum mengirim ujian.");
        return;
      }
      const result = await apiRequest<{ status: string; receipt: Receipt }>(`/student/attempts/${attempt.id}/submit`, {
        method: "POST",
        token,
        headers: { "x-attempt-session": sessionToken },
      });
      setReceipt(result.receipt);
      window.localStorage.removeItem(`nebula-cbt-pending:${attempt.id}`);
      window.sessionStorage.removeItem(`nebula-cbt-session:${attempt.id}`);
      setAttempt(null);
      setSessionToken("");
      setAnswers({});
      setPendingAnswers({});
      setNotice(result.status === "EXPIRED" ? "Waktu habis. Jawaban terakhir yang tersimpan telah ditutup." : "Ujian berhasil dikirim.");
      await loadExams();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ujian gagal dikirim.");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => { submitRef.current = submitAttempt; }, [submitAttempt]);

  useEffect(() => {
    if (!attempt?.id) return;
    const timeout = window.setTimeout(() => { void submitRef.current(); }, initialRemainingSeconds * 1000);
    return () => window.clearTimeout(timeout);
  }, [attempt?.id, initialRemainingSeconds]);

  const currentQuestion = attempt?.questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id]?.answerData ?? {} : {};

  if (attempt && currentQuestion) {
    const selectedSingle = typeof currentAnswer.selectedOptionId === "string" ? currentAnswer.selectedOptionId : "";
    const selectedMultiple = Array.isArray(currentAnswer.selectedOptionIds) ? currentAnswer.selectedOptionIds as string[] : [];
    const answerText = typeof currentAnswer.text === "string" ? currentAnswer.text : "";
    const answeredCount = attempt.questions.filter((question) => answers[question.id]).length;
    return (
      <section className="space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-xl font-bold text-app-text">Ruang ujian</h1><p className="mt-1 text-xs text-app-muted">{answeredCount} dari {attempt.questions.length} soal terjawab</p></div>
          <div className="text-right"><p className="text-[11px] text-app-muted">Sisa waktu</p><p role="timer" aria-live="off" className={`text-xl font-bold tabular-nums ${remainingSeconds < 300 ? "text-red-600 dark:text-red-300" : "text-app-text"}`}>{timeLabel(remainingSeconds)}</p></div>
        </header>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-app-border bg-app-surface px-4 py-3 text-xs">
          <span className="text-app-muted">{!online ? "Offline · jawaban menunggu koneksi" : syncing ? "Menyinkronkan jawaban…" : Object.keys(pendingAnswers).length ? "Ada jawaban yang belum tersimpan di server" : "Semua jawaban tersimpan di server"}</span>
          <button type="button" onClick={() => void flush()} disabled={!online || syncing || !Object.keys(pendingAnswers).length} className="min-h-10 rounded-lg border border-app-border px-3 font-medium text-app-text disabled:opacity-50">Simpan sekarang</button>
        </div>
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <article className="min-w-0 rounded-2xl border border-app-border bg-app-surface p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold text-app-muted">Soal {currentIndex + 1} dari {attempt.questions.length}</p><p className="text-xs text-app-muted">{currentQuestion.points} poin</p></div>
            <h2 className="mt-4 whitespace-pre-wrap text-base font-semibold leading-7 text-app-text">{currentQuestion.content.text}</h2>
            {currentQuestion.type === "SINGLE_CHOICE" || currentQuestion.type === "TRUE_FALSE" ? (
              <fieldset className="mt-5 space-y-2"><legend className="text-xs font-medium text-app-muted">Pilih satu jawaban</legend>{currentQuestion.options.map((option) => <label key={option.id} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm ${selectedSingle === option.id ? "border-app-primary bg-app-soft text-app-text" : "border-app-border text-app-text"}`}><input type="radio" name={currentQuestion.id} checked={selectedSingle === option.id} onChange={() => changeAnswer(currentQuestion.id, { selectedOptionId: option.id })} className="size-4 accent-app-primary" /><span className="font-semibold">{option.label}.</span><span>{option.content.text}</span></label>)}</fieldset>
            ) : currentQuestion.type === "MULTIPLE_CHOICE" ? (
              <fieldset className="mt-5 space-y-2"><legend className="text-xs font-medium text-app-muted">Pilih semua jawaban yang benar</legend>{currentQuestion.options.map((option) => <label key={option.id} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm ${selectedMultiple.includes(option.id) ? "border-app-primary bg-app-soft text-app-text" : "border-app-border text-app-text"}`}><input type="checkbox" checked={selectedMultiple.includes(option.id)} onChange={(event) => changeAnswer(currentQuestion.id, { selectedOptionIds: event.target.checked ? [...selectedMultiple, option.id] : selectedMultiple.filter((id) => id !== option.id) })} className="size-4 accent-app-primary" /><span className="font-semibold">{option.label}.</span><span>{option.content.text}</span></label>)}</fieldset>
            ) : (
              <label className="mt-5 block text-xs font-medium text-app-text">{currentQuestion.type === "ESSAY" ? "Jawaban esai" : "Jawaban singkat"}<textarea value={answerText} onChange={(event) => changeAnswer(currentQuestion.id, { text: event.target.value })} rows={currentQuestion.type === "ESSAY" ? 8 : 3} className={inputClass} placeholder="Tulis jawaban…" /></label>
            )}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-app-border pt-4">
              <button type="button" onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))} disabled={currentIndex === 0} className="min-h-11 rounded-lg border border-app-border px-4 text-xs font-medium text-app-text disabled:opacity-40">Sebelumnya</button>
              {currentIndex < attempt.questions.length - 1 ? <button type="button" onClick={() => setCurrentIndex((index) => Math.min(attempt.questions.length - 1, index + 1))} className="min-h-11 rounded-lg bg-app-primary px-4 text-xs font-semibold text-app-primary-contrast">Soal berikutnya</button> : <button type="button" onClick={() => void submitAttempt()} disabled={submitting} className="min-h-11 rounded-lg bg-app-primary px-4 text-xs font-semibold text-app-primary-contrast disabled:opacity-50">{submitting ? "Mengirim…" : "Kirim ujian"}</button>}
            </div>
          </article>
          <aside className="rounded-2xl border border-app-border bg-app-surface p-4">
            <h2 className="text-xs font-semibold text-app-text">Navigasi soal</h2>
            <div className="mt-3 grid grid-cols-5 gap-2 lg:grid-cols-4">{attempt.questions.map((question, index) => <button key={question.id} type="button" onClick={() => setCurrentIndex(index)} aria-label={`Buka soal ${index + 1}`} aria-current={currentIndex === index ? "step" : undefined} className={`min-h-11 rounded-lg border text-xs font-semibold ${currentIndex === index ? "border-app-primary bg-app-soft text-app-primary" : answers[question.id] ? "border-emerald-600/50 text-app-text" : "border-app-border text-app-muted"}`}>{index + 1}</button>)}</div>
            <p className="mt-3 text-[11px] leading-5 text-app-muted">Tombol berwarna menandai soal yang sudah dijawab. Pilih nomor untuk berpindah soal.</p>
            <button type="button" onClick={() => void submitAttempt()} disabled={submitting} className="mt-5 min-h-11 w-full rounded-lg border border-app-border px-3 text-xs font-semibold text-app-text disabled:opacity-50">{submitting ? "Mengirim…" : "Selesaikan ujian"}</button>
          </aside>
        </div>
        {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-app-text">{error}</div>}
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <header><h1 className="text-2xl font-bold tracking-tight text-app-text">Ujian saya</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-app-muted">Daftar ujian yang ditugaskan kepada Anda. Waktu mulai dan batas pengiriman ditentukan oleh server.</p></header>
      {notice && <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-app-text">{notice}</div>}
      {receipt && <div className="rounded-xl border border-app-border bg-app-surface p-4"><p className="text-xs font-semibold text-app-text">Bukti pengiriman</p><p className="mt-1 font-mono text-lg font-bold text-app-text">{receipt.receiptCode}</p><p className="mt-1 text-xs text-app-muted">{formatDate(receipt.submittedAt)} · {receipt.answerCount} jawaban diterima</p></div>}
      {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-app-text">{error}</div>}
      <div className="flex justify-end"><button type="button" onClick={() => void loadExams()} disabled={loading} className="min-h-11 rounded-lg border border-app-border px-3 text-xs font-medium text-app-text disabled:opacity-50">Muat ulang</button></div>
      {loading ? <p className="rounded-2xl border border-app-border bg-app-surface px-5 py-12 text-center text-sm text-app-muted">Memuat jadwal ujian…</p> : exams.length === 0 ? <p className="rounded-2xl border border-app-border bg-app-surface px-5 py-12 text-center text-sm text-app-muted">Belum ada ujian yang ditugaskan.</p> : (
        <div className="divide-y divide-app-border rounded-2xl border border-app-border bg-app-surface">
          {exams.map((exam) => {
            const started = exam.attempt?.status === "IN_PROGRESS";
            const closed = exam.attempt?.status === "SUBMITTED" || exam.attempt?.status === "EXPIRED";
            return <article key={exam.id} className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
              <div className="min-w-0"><h2 className="font-semibold text-app-text">{exam.exam.name}</h2><p className="mt-1 text-xs text-app-muted">{exam.exam.subject.name} · {exam.exam.assessmentEvent.name}</p><p className="mt-2 text-xs text-app-muted">{exam.schedule.sessionName} · {formatDate(exam.schedule.startsAt)} – {formatDate(exam.schedule.endsAt)}</p><p className="mt-1 text-[11px] text-app-muted">Durasi {exam.schedule.durationMinutes} menit</p></div>
              {closed ? <span className="text-xs font-medium text-app-muted">{exam.attempt?.status === "EXPIRED" ? "Waktu habis" : "Selesai"}</span> : <button type="button" onClick={() => void startExam(exam)} disabled={startingId === exam.id || exam.schedule.status !== "PUBLISHED"} className="min-h-11 rounded-lg bg-app-primary px-4 text-xs font-semibold text-app-primary-contrast disabled:opacity-50">{startingId === exam.id ? "Membuka…" : started ? "Lanjutkan ujian" : "Mulai ujian"}</button>}
            </article>;
          })}
        </div>
      )}
    </section>
  );
}
