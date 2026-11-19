import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { apiRequest } from "../../lib/api";

type EducationSettings = {
  institutionType: string;
  institutionName: string;
  logoDataUrl: string;
  educationLevel: string;
  departmentsEnabled: boolean;
  departments: string[];
};

const defaults: EducationSettings = {
  institutionType: "Sekolah / lembaga pendidikan",
  institutionName: "",
  logoDataUrl: "",
  educationLevel: "Belum ditentukan",
  departmentsEnabled: false,
  departments: [],
};

const inputClass = "mt-1.5 min-h-11 w-full rounded-lg border border-app-border bg-app-input px-3 text-sm text-app-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-primary";

export function EducationSettingsPage({ token, onComplete }: { token: string | null; onComplete: () => void }) {
  const [settings, setSettings] = useState<EducationSettings>(defaults);
  const [draftDepartment, setDraftDepartment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      if (!token) {
        setError("Sesi login berakhir. Silakan masuk kembali.");
        setLoading(false);
        return;
      }
      try {
        const value = await apiRequest<Partial<EducationSettings>>("/academic/education-settings", { token });
        if (!active) return;
        const loaded = { ...defaults, ...value, departments: Array.isArray(value.departments) ? value.departments : [] };
        if (loaded.educationLevel && loaded.educationLevel !== "Belum ditentukan" && loaded.institutionName) {
          onComplete();
          return;
        }
        setSettings(loaded);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Setup gagal dimuat.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [token, onComplete]);

  function addDepartment() {
    const name = draftDepartment.trim();
    if (!name) return;
    if (settings.departments.some((item) => item.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setError("Nama jurusan sudah ada.");
      return;
    }
    setSettings((current) => ({ ...current, departments: [...current.departments, name] }));
    setDraftDepartment("");
    setError("");
  }

  function removeDepartment(name: string) {
    setSettings((current) => ({ ...current, departments: current.departments.filter((item) => item !== name) }));
  }

  function selectLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Gunakan file PNG, JPG, atau WebP.");
      event.target.value = "";
      return;
    }
    if (file.size > 250 * 1024) {
      setError("Ukuran logo maksimal 250 KB.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSettings((current) => ({ ...current, logoDataUrl: reader.result as string }));
        setError("");
      }
    };
    reader.onerror = () => setError("File logo tidak dapat dibaca.");
    reader.readAsDataURL(file);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      await apiRequest<EducationSettings>("/academic/education-settings", {
        method: "PATCH",
        token,
        body: JSON.stringify(settings),
      });
      toast.success("Setup lembaga selesai.");
      onComplete();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Setup gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="flex min-h-dvh items-center justify-center bg-app-bg p-6" role="status"><p className="text-sm text-app-muted">Menyiapkan workspace...</p></main>;

  return (
    <main className="min-h-dvh bg-app-bg px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {settings.logoDataUrl ? <img src={settings.logoDataUrl} alt="Logo lembaga" className="size-12 rounded-xl border border-app-border bg-white object-contain p-1" /> : <div className="flex size-12 items-center justify-center rounded-xl bg-[#183B5B] text-lg font-bold text-white">N</div>}
            <div>
              <p className="text-sm font-semibold text-app-text">Nebula CBT</p>
              <p className="text-xs text-app-muted">Setup workspace</p>
            </div>
          </div>
          <span className="text-xs text-app-muted">Setup awal · 1 dari 1</span>
        </header>

        <form onSubmit={submit} className="overflow-hidden rounded-2xl border border-app-border bg-app-surface">
          <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
            <section className="bg-[#183B5B] p-6 text-white sm:p-8 lg:p-9">
              <p className="text-xs font-medium text-white/70">Selamat datang</p>
              <h1 className="mt-3 max-w-sm text-3xl font-semibold leading-tight tracking-tight">Siapkan workspace lembaga Anda.</h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-white/75">Isi identitas dan jenjang satu kali. Setelah disimpan, Anda langsung masuk ke workspace CBT.</p>
              <div className="mt-9 border-t border-white/15 pt-5">
                <p className="text-xs font-semibold text-white/90">Yang disiapkan</p>
                <p className="mt-2 text-sm text-white/70">Identitas lembaga, logo, jenjang, dan opsi jurusan.</p>
              </div>
            </section>

            <section className="space-y-6 p-5 sm:p-8 lg:p-9">
              <div>
                <h2 className="text-lg font-semibold text-app-text">Identitas lembaga</h2>
                <p className="mt-1 text-sm text-app-muted">Nama dan logo akan tampil di workspace.</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_132px]">
                  <label className="block text-sm font-medium text-app-text">Nama lembaga
                    <input value={settings.institutionName} onChange={(event) => setSettings((current) => ({ ...current, institutionName: event.target.value }))} required maxLength={160} placeholder="Nama sekolah atau kampus" className={inputClass} />
                  </label>
                  <div>
                    <span className="block text-sm font-medium text-app-text">Logo</span>
                    <label className="mt-1.5 flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-dashed border-app-border px-3 text-center text-xs font-semibold text-app-text hover:bg-app-bg">
                      Pilih file
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={selectLogo} className="sr-only" />
                    </label>
                    {settings.logoDataUrl && <button type="button" onClick={() => setSettings((current) => ({ ...current, logoDataUrl: "" }))} className="mt-2 min-h-9 w-full text-xs font-medium text-red-600 hover:underline">Hapus logo</button>}
                  </div>
                </div>
                <label className="mt-4 block text-sm font-medium text-app-text">Jenis lembaga
                  <input value={settings.institutionType} onChange={(event) => setSettings((current) => ({ ...current, institutionType: event.target.value }))} required maxLength={80} placeholder="Sekolah, madrasah, universitas..." className={inputClass} />
                </label>
                <label className="mt-4 block text-sm font-medium text-app-text">Jenjang
                  <select value={settings.educationLevel} onChange={(event) => setSettings((current) => ({ ...current, educationLevel: event.target.value }))} required className={inputClass}>
                    <option value="Belum ditentukan" disabled>Pilih jenjang</option>
                    <option value="SD/MI">SD/MI</option>
                    <option value="SMP/MTs">SMP/MTs</option>
                    <option value="SMA/MA">SMA/MA</option>
                    <option value="SMK">SMK</option>
                    <option value="Perguruan Tinggi">Perguruan Tinggi</option>
                    <option value="Pendidikan Kesetaraan">Pendidikan Kesetaraan</option>
                    <option value="Pascasarjana / Profesi">Pascasarjana / Profesi</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </label>
              </div>

              <div className="border-t border-app-border pt-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-app-text">Jurusan</h2>
                    <p className="mt-1 text-sm text-app-muted">Opsional. Bisa dilewati.</p>
                  </div>
                  <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-app-text">
                    <input type="checkbox" checked={settings.departmentsEnabled} onChange={(event) => setSettings((current) => ({ ...current, departmentsEnabled: event.target.checked }))} className="size-4 accent-[#318BCB]" />
                    Gunakan jurusan
                  </label>
                </div>
                {settings.departmentsEnabled && <div className="mt-4">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input value={draftDepartment} onChange={(event) => setDraftDepartment(event.target.value)} maxLength={120} placeholder="Nama jurusan / program" aria-label="Nama jurusan" className={inputClass + " mt-0 min-w-0 flex-1"} />
                    <button type="button" onClick={addDepartment} className="min-h-11 rounded-lg border border-app-border px-4 text-sm font-semibold text-app-text hover:bg-app-bg">Tambah</button>
                  </div>
                  {settings.departments.length > 0 && <ul className="mt-3 divide-y divide-app-border rounded-lg border border-app-border">
                    {settings.departments.map((name) => <li key={name} className="flex min-h-11 items-center justify-between gap-3 px-3 py-2 text-sm text-app-text">
                      <span className="break-words">{name}</span>
                      <button type="button" onClick={() => removeDepartment(name)} aria-label={"Hapus " + name} className="min-h-9 px-2 text-xs font-medium text-red-600 hover:underline">Hapus</button>
                    </li>)}
                  </ul>}
                </div>}
              </div>

              {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-app-text">{error}</p>}
              <div className="flex flex-col-reverse gap-3 border-t border-app-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-app-muted">Jenjang dikunci setelah setup selesai.</p>
                <button type="submit" disabled={saving || !settings.institutionName.trim() || !settings.institutionType.trim() || settings.educationLevel === "Belum ditentukan"} className="min-h-11 rounded-lg bg-app-primary px-5 text-sm font-semibold text-app-primary-contrast hover:bg-app-primary-hover disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan & masuk"}</button>
              </div>
            </section>
          </div>
        </form>
      </div>
    </main>
  );
}
