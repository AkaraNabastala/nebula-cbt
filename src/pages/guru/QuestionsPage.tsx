import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiRequest } from "../../lib/api";

type Subject = { id: string; code: string | null; name: string };
type Bank = {
  id: string;
  name: string;
  description: string | null;
  subject: Subject;
  _count?: { questions: number };
};
type Question = {
  id: string;
  type: string;
  difficulty: string;
  content: { text?: string };
  explanation: string | null;
  defaultPoints: string | number;
  status: string;
  options: { id: string; label: string; content: { text?: string } }[];
  answerKey: { answerData: { correctLabels?: string[]; acceptedAnswers?: string[]; manualGrading?: boolean }; gradingGuide: string | null } | null;
};
type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY";

const typeLabels: Record<QuestionType, string> = {
  SINGLE_CHOICE: "Pilihan ganda",
  MULTIPLE_CHOICE: "Pilihan kompleks",
  TRUE_FALSE: "Benar atau salah",
  SHORT_ANSWER: "Jawaban singkat",
  ESSAY: "Esai",
};

const fieldClass = "mt-1.5 min-h-11 w-full rounded-lg border border-app-border bg-app-input px-3 py-2 text-sm text-app-text";
const labelClass = "block text-xs font-medium text-app-text";

function lines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

export function QuestionsPage({ token }: { token: string | null }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [questionType, setQuestionType] = useState<QuestionType>("SINGLE_CHOICE");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadBanks = useCallback(async () => {
    if (!token) {
      setError("Sesi login tidak ditemukan. Silakan masuk kembali.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [subjectData, bankData] = await Promise.all([
        apiRequest<Subject[]>("/question-banks/subjects", { token }),
        apiRequest<Bank[]>("/question-banks", { token }),
      ]);
      setSubjects(subjectData);
      setBanks(bankData);
      setSelectedBankId((current) => bankData.some((bank) => bank.id === current) ? current : bankData[0]?.id ?? "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Bank soal gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadQuestions = useCallback(async (bankId: string) => {
    if (!token || !bankId) {
      setQuestions([]);
      return;
    }
    try {
      const data = await apiRequest<Question[]>(`/question-banks/${bankId}/questions`, { token });
      setQuestions(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Daftar soal gagal dimuat.");
    }
  }, [token]);

  useEffect(() => { void Promise.resolve().then(loadBanks); }, [loadBanks]);
  useEffect(() => {
    if (selectedBankId) void Promise.resolve().then(() => loadQuestions(selectedBankId));
    else void Promise.resolve().then(() => setQuestions([]));
  }, [selectedBankId, loadQuestions]);

  async function createBank(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const bank = await apiRequest<Bank>("/question-banks", {
        method: "POST",
        token,
        body: JSON.stringify({
          name: String(form.get("name") || ""),
          description: String(form.get("description") || ""),
          subjectId: String(form.get("subjectId") || ""),
        }),
      });
      formElement.reset();
      setNotice(`Bank soal "${bank.name}" berhasil dibuat.`);
      await loadBanks();
      setSelectedBankId(bank.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Bank soal gagal dibuat.");
    } finally {
      setSaving(false);
    }
  }

  async function createQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !selectedBankId) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const optionLines = lines(String(form.get("options") || ""));
    const payload: Record<string, unknown> = {
      type: questionType,
      difficulty: String(form.get("difficulty") || "MEDIUM"),
      content: String(form.get("content") || ""),
      explanation: String(form.get("explanation") || ""),
      points: Number(form.get("points") || 1),
    };
    if (questionType === "SINGLE_CHOICE" || questionType === "MULTIPLE_CHOICE") {
      payload.options = optionLines.map((text, index) => ({
        label: String.fromCharCode(65 + index),
        text,
      }));
      payload.correctLabels = String(form.get("correctLabels") || "")
        .split(",").map((item) => item.trim().toUpperCase()).filter(Boolean);
    } else if (questionType === "TRUE_FALSE") {
      payload.correctLabels = [String(form.get("correctLabels") || "")].filter(Boolean);
    } else if (questionType === "SHORT_ANSWER") {
      payload.acceptedAnswers = lines(String(form.get("acceptedAnswers") || ""));
    } else if (questionType === "ESSAY") {
      payload.gradingGuide = String(form.get("gradingGuide") || "");
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      await apiRequest(`/question-banks/${selectedBankId}/questions`, {
        method: "POST",
        token,
        body: JSON.stringify(payload),
      });
      formElement.reset();
      setQuestionType("SINGLE_CHOICE");
      setNotice("Soal berhasil disimpan sebagai draf.");
      await loadQuestions(selectedBankId);
      await loadBanks();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Soal gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  const selectedBank = banks.find((bank) => bank.id === selectedBankId);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-app-text">Bank soal</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-app-muted">
          Susun soal per mata pelajaran. Kunci jawaban dan pedoman penilaian hanya tampil di ruang kerja pengajar.
        </p>
      </header>

      {notice && <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-app-text">{notice}</div>}
      {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-app-text">{error}</div>}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <label className={`${labelClass} min-w-0 flex-1 sm:max-w-md`}>
              Pilih bank soal
              <select value={selectedBankId} onChange={(event) => setSelectedBankId(event.target.value)} className={fieldClass}>
                <option value="">Pilih bank soal</option>
                {banks.map((bank) => <option key={bank.id} value={bank.id}>{bank.subject.name} · {bank.name}</option>)}
              </select>
            </label>
            <button type="button" onClick={() => void loadBanks()} disabled={loading} className="min-h-11 rounded-lg border border-app-border px-3 text-xs font-medium text-app-text disabled:opacity-50">Muat ulang</button>
          </div>

          <div className="rounded-2xl border border-app-border bg-app-surface">
            <div className="border-b border-app-border px-4 py-4 sm:px-5">
              <h2 className="text-sm font-semibold text-app-text">{selectedBank ? selectedBank.name : "Daftar soal"}</h2>
              <p className="mt-1 text-xs text-app-muted">{selectedBank ? `${selectedBank.subject.name} · ${questions.length} soal` : "Pilih bank soal untuk melihat isinya."}</p>
            </div>
            {loading ? <p className="px-5 py-12 text-center text-sm text-app-muted">Memuat bank soal…</p> : !selectedBank ? (
              <p className="px-5 py-12 text-center text-sm text-app-muted">Belum ada bank soal. Buat bank soal terlebih dahulu.</p>
            ) : questions.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-app-muted">Belum ada soal di bank ini.</p>
            ) : (
              <ol className="divide-y divide-app-border">
                {questions.map((question, index) => (
                  <li key={question.id} className="px-4 py-4 sm:px-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-app-muted">Soal {index + 1} · {typeLabels[question.type as QuestionType] ?? question.type}</p>
                      <span className="rounded-md bg-app-soft px-2 py-1 text-[11px] font-medium text-app-text">{question.status === "DRAFT" ? "Draf" : question.status}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-app-text">{question.content.text}</p>
                    {question.options.length > 0 && <ul className="mt-3 space-y-1.5">{question.options.map((option) => (
                      <li key={option.id} className="flex gap-2 text-sm text-app-muted">
                        <span className="w-5 shrink-0 font-semibold text-app-text">{option.label}.</span>
                        <span>{option.content.text}</span>
                      </li>
                    ))}</ul>}
                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-app-muted">
                      <span>Kesulitan: {question.difficulty === "EASY" ? "Mudah" : question.difficulty === "HARD" ? "Sulit" : "Sedang"}</span>
                      <span>Bobot: {question.defaultPoints} poin</span>
                    </div>
                    {question.answerKey?.answerData.correctLabels && <p className="mt-2 text-xs text-app-text">Kunci: {question.answerKey.answerData.correctLabels.join(", ")}</p>}
                    {question.answerKey?.answerData.acceptedAnswers && <p className="mt-2 text-xs text-app-text">Jawaban diterima: {question.answerKey.answerData.acceptedAnswers.join(" · ")}</p>}
                    {question.answerKey?.gradingGuide && <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-app-muted">Pedoman: {question.answerKey.gradingGuide}</p>}
                    {question.explanation && <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-app-muted">Pembahasan: {question.explanation}</p>}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <form onSubmit={createBank} className="space-y-3 rounded-2xl border border-app-border bg-app-surface p-4 sm:p-5">
            <div>
              <h2 className="text-sm font-semibold text-app-text">Buat bank soal</h2>
              <p className="mt-1 text-xs leading-5 text-app-muted">Guru hanya dapat memilih mata pelajaran yang ditugaskan pada tahun ajaran aktif.</p>
            </div>
            <label className={labelClass}>Mata pelajaran
              <select name="subjectId" required defaultValue="" className={fieldClass}>
                <option value="" disabled>Pilih mata pelajaran</option>
                {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}{subject.code ? ` · ${subject.code}` : ""}</option>)}
              </select>
            </label>
            <label className={labelClass}>Nama bank soal
              <input name="name" required maxLength={150} placeholder="Contoh: Persamaan Linear" className={fieldClass} />
            </label>
            <label className={labelClass}>Keterangan (opsional)
              <textarea name="description" rows={2} maxLength={1000} className={fieldClass} />
            </label>
            <button type="submit" disabled={saving || subjects.length === 0} className="min-h-11 w-full rounded-lg bg-app-primary px-4 text-sm font-semibold text-app-primary-contrast disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? "Menyimpan…" : "Buat bank soal"}
            </button>
            {subjects.length === 0 && <p className="text-xs text-app-muted">Belum ada mata pelajaran yang dapat digunakan. Periksa penugasan guru atau data akademik.</p>}
          </form>

          <form onSubmit={createQuestion} className="space-y-3 rounded-2xl border border-app-border bg-app-surface p-4 sm:p-5">
            <div>
              <h2 className="text-sm font-semibold text-app-text">Tambah soal</h2>
              <p className="mt-1 text-xs leading-5 text-app-muted">Soal baru tersimpan sebagai draf dan belum masuk ke paket ujian.</p>
            </div>
            <label className={labelClass}>Jenis soal
              <select value={questionType} onChange={(event) => setQuestionType(event.target.value as QuestionType)} className={fieldClass}>
                {Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className={labelClass}>Pertanyaan
              <textarea name="content" required rows={4} maxLength={10000} placeholder="Tulis pertanyaan dengan jelas…" className={fieldClass} />
            </label>
            {(questionType === "SINGLE_CHOICE" || questionType === "MULTIPLE_CHOICE") && <>
              <label className={labelClass}>Pilihan jawaban
                <textarea name="options" required rows={4} placeholder={"Satu pilihan per baris\nPilihan kedua\nPilihan ketiga"} className={fieldClass} />
              </label>
              <label className={labelClass}>Label jawaban benar
                <input name="correctLabels" required placeholder={questionType === "SINGLE_CHOICE" ? "A" : "A, C"} className={fieldClass} />
              </label>
              <p className="text-[11px] leading-5 text-app-muted">Label opsi dibuat berurutan: A, B, C, dan seterusnya.</p>
            </>}
            {questionType === "TRUE_FALSE" && <label className={labelClass}>Jawaban benar
              <select name="correctLabels" required defaultValue="" className={fieldClass}>
                <option value="" disabled>Pilih jawaban</option>
                <option value="A">Benar</option>
                <option value="B">Salah</option>
              </select>
            </label>}
            {questionType === "SHORT_ANSWER" && <label className={labelClass}>Jawaban yang diterima
              <textarea name="acceptedAnswers" required rows={3} placeholder={"Satu jawaban per baris"} className={fieldClass} />
            </label>}
            {questionType === "ESSAY" && <label className={labelClass}>Pedoman penilaian
              <textarea name="gradingGuide" required rows={4} placeholder="Jelaskan unsur jawaban dan pembagian bobot nilai." className={fieldClass} />
            </label>}
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>Kesulitan
                <select name="difficulty" defaultValue="MEDIUM" className={fieldClass}>
                  <option value="EASY">Mudah</option><option value="MEDIUM">Sedang</option><option value="HARD">Sulit</option>
                </select>
              </label>
              <label className={labelClass}>Poin
                <input name="points" type="number" min="0.01" max="1000" step="0.01" defaultValue="1" required className={fieldClass} />
              </label>
            </div>
            <label className={labelClass}>Pembahasan (opsional)
              <textarea name="explanation" rows={2} maxLength={5000} className={fieldClass} />
            </label>
            <button type="submit" disabled={saving || !selectedBankId} className="min-h-11 w-full rounded-lg bg-app-primary px-4 text-sm font-semibold text-app-primary-contrast disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? "Menyimpan…" : "Simpan sebagai draf"}
            </button>
            {!selectedBankId && <p className="text-xs text-app-muted">Pilih atau buat bank soal sebelum menambahkan soal.</p>}
          </form>
        </aside>
      </div>
    </section>
  );
}
