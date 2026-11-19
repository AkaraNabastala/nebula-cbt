import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { apiRequest } from "../../lib/api";

type EducationSettings = {
  institutionType: string;
  educationLevel: string;
  departmentsEnabled: boolean;
  departments: string[];
};

const defaults: EducationSettings = {
  institutionType: "SMA",
  educationLevel: "SMA",
  departmentsEnabled: false,
  departments: [],
};

const inputClass = "mt-1.5 min-h-11 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text";

export function EducationSettingsPage({ token }: { token: string | null }) {
  const [settings, setSettings] = useState<EducationSettings>(defaults);
  const [draftDepartment, setDraftDepartment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      if (!token) {
        setError("Sesi login tidak ditemukan. Silakan masuk kembali.");
        setLoading(false);
        return;
      }
      try {
        const value = await apiRequest<EducationSettings>("/academic/education-settings", { token });
        if (active) setSettings({ ...defaults, ...value, departments: Array.isArray(value.departments) ? value.departments : [] });
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Pengaturan lembaga gagal dimuat.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [token]);

  function addDepartment() {
    const name = draftDepartment.trim();
    if (!name) return;
    if (settings.departments.some((item) => item.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setError("Nama jurusan tersebut sudah ada.");
      return;
    }
    setSettings((current) => ({ ...current, departments: [...current.departments, name] }));
    setDraftDepartment("");
    setError("");
  }

  function removeDepartment(name: string) {
    setSettings((current) => ({ ...current, departments: current.departments.filter((item) => item !== name) }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      const saved = await apiRequest<EducationSettings>("/academic/education-settings", {
        method: "PATCH",
        token,
        body: JSON.stringify(settings),
      });
      setSettings({ ...defaults, ...saved, departments: Array.isArray(saved.departments) ? saved.departments : [] });
      toast.success("Konfigurasi lembaga berhasil disimpan.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Konfigurasi lembaga gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <section className="rounded-xl border border-app-border bg-app-surface p-8 text-center text-sm text-app-muted" role="status">Memuat konfigurasi lembaga...</section>;

  return (
    <section className="mx-auto max-w-4xl space-y-5">
      <header className="rounded-2xl border border-app-border bg-app-surface p-5 sm:p-6">
        <p className="text-xs font-semibold tracking-[0.12em] text-[#318BCB]">KONFIGURASI CBT</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-app-text">{settings.educationLevel === "Belum ditentukan" ? "Setup awal lembaga" : "Struktur pendidikan"}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-app-muted">Atur jenjang lembaga dan pengelompokan jurusan sesuai kebutuhan. Pengaturan ini tidak membatasi pembuatan mata pelajaran atau ujian.</p>
      </header>

      {error && <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-app-text">{error}</div>}

      <form onSubmit={submit} className="space-y-5">
        <section className="rounded-xl border border-app-border bg-app-surface p-5">
          <h2 className="text-base font-semibold text-app-text">Identitas pendidikan</h2>
          <p className="mt-1 text-sm text-app-muted">Pilih nilai yang paling sesuai. Keduanya dapat diubah admin.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-app-text">Jenis lembaga
              <input value={settings.institutionType} onChange={(event) => setSettings((current) => ({ ...current, institutionType: event.target.value }))} required maxLength={80} placeholder="Contoh: Sekolah, Madrasah, Universitas" className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-app-text">Jenjang pendidikan
              <select value={settings.educationLevel} onChange={(event) => setSettings((current) => ({ ...current, educationLevel: event.target.value }))} className={inputClass}>
                <option value="Belum ditentukan" disabled>Pilih jenjang pendidikan</option>\n                <option value="SD/MI">SD/MI</option>
                <option value="SMP/MTs">SMP/MTs</option>
                <option value="SMA/MA">SMA/MA</option>
                <option value="SMK">SMK</option>
                <option value="Perguruan Tinggi">Perguruan Tinggi</option>
                <option value="Pendidikan Kesetaraan">Pendidikan Kesetaraan</option>\n                <option value="Pascasarjana / Profesi">Pascasarjana / Profesi</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-app-border bg-app-surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-xl">
              <h2 className="text-base font-semibold text-app-text">Jurusan / program keahlian</h2>
              <p className="mt-1 text-sm leading-6 text-app-muted">Opsional. Aktifkan hanya jika lembaga memerlukan pengelompokan peserta berdasarkan jurusan. Nama jurusan sepenuhnya ditentukan admin.</p>
            </div>
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-app-border px-3 text-sm font-medium text-app-text">
              <input type="checkbox" checked={settings.departmentsEnabled} onChange={(event) => setSettings((current) => ({ ...current, departmentsEnabled: event.target.checked }))} className="size-4 accent-[#318BCB]" />
              Aktifkan jurusan
            </label>
          </div>
          {settings.departmentsEnabled && <div className="mt-5 border-t border-app-border pt-4">
            <label htmlFor="new-department" className="block text-sm font-medium text-app-text">Tambah jurusan atau program</label>
            <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
              <input id="new-department" value={draftDepartment} onChange={(event) => setDraftDepartment(event.target.value)} maxLength={120} placeholder="Tulis nama jurusan sesuai kebutuhan" className="min-h-11 min-w-0 flex-1 rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text" />
              <button type="button" onClick={addDepartment} className="min-h-11 rounded-lg border border-app-border px-4 text-sm font-semibold text-app-text hover:bg-app-bg">Tambahkan</button>
            </div>
            <ul className="mt-4 divide-y divide-app-border rounded-lg border border-app-border">
              {settings.departments.length ? settings.departments.map((name) => <li key={name} className="flex min-h-12 items-center justify-between gap-3 px-3 py-2">
                <span className="break-words text-sm text-app-text">{name}</span>
                <button type="button" onClick={() => removeDepartment(name)} className="min-h-9 shrink-0 rounded-md px-3 text-xs font-semibold text-red-600 hover:bg-red-500/10 dark:text-red-300">Hapus</button>
              </li>) : <li className="px-3 py-5 text-center text-sm text-app-muted">Belum ada jurusan. Tambahkan jika diperlukan.</li>}
            </ul>
          </div>}
        </section>

        <div className="flex justify-end">
          <button type="submit" disabled={saving || !settings.institutionType.trim()} className="min-h-11 rounded-lg bg-app-primary px-5 text-sm font-semibold text-app-primary-contrast hover:bg-app-primary-hover disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan konfigurasi"}</button>
        </div>
      </form>
    </section>
  );
}
