import { useState, type FormEvent } from "react";
import { ChevronRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Brand } from "../../components/shared/Brand";
import { toast } from "sonner";

export function LoginPage({
  onLogin,
  notice,
}: {
  onLogin: (
    identifier: string,
    password: string,
    remember: boolean,
  ) => Promise<void>;
  notice: string;
}) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);

    try {
      await onLogin(identifier.trim(), password, remember);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login tidak berhasil.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-dvh bg-app-bg">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-app-border bg-app-surface px-5 shadow-sm sm:px-8">
        <Brand />
        <span className="text-[11px] font-semibold tracking-wide text-app-muted sm:text-xs">
          PLATFORM UJIAN DIGITAL
        </span>
      </header>

      <section className="mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-6xl items-center gap-8 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-14">
        <aside className="relative hidden min-h-[470px] flex-col justify-between overflow-hidden rounded-2xl bg-[#183B5B] p-9 text-white lg:flex xl:p-11">
          <div>
            <div className="flex size-14 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-2xl font-bold text-white">N</div>
            <p className="mt-8 text-xs font-semibold tracking-[0.12em] text-[#B9D9EF]">NEBULA CBT</p>
            <h1 className="mt-4 max-w-lg text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
              Satu ruang untuk kegiatan asesmen sekolah.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-[#D5E5F1]">
              Masuk ke ruang kerja sesuai peran administrator, guru, atau peserta didik.
            </p>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-white/20 pt-5 text-xs text-[#D5E5F1]">
            <span>AkaraNabastala</span>
            <span>Computer Based Test</span>
          </div>
        </aside>

        <div className="mx-auto w-full max-w-[440px]">
          <div className="mb-5">
            <p className="mb-2 text-xs font-semibold tracking-[0.12em] text-[#318BCB]">
              AKSES AKUN
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-app-text sm:text-[30px]">
              Selamat datang.
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-5 text-app-muted">
              Masuk menggunakan akun yang telah terdaftar untuk melanjutkan ke ruang kerja Anda.
            </p>
          </div>

          <form
            onSubmit={submit}
            className="rounded-2xl border border-app-border bg-app-surface p-5 shadow-sm sm:p-6"
          >
            {notice && (
              <div role="status" className="mb-5 rounded-lg border border-app-border bg-app-soft p-3 text-sm text-app-text">
                {notice}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="identifier" className="mb-2 block text-sm font-medium text-app-text">
                  Username, NIPD, NIS, atau email
                </label>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  maxLength={191}
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="Masukkan username, NIPD, NIS, atau email"
                  className="h-12 w-full rounded-lg border border-app-border bg-app-input px-4 text-sm text-app-text placeholder:text-app-muted focus:border-[#318BCB] focus:outline-none focus:ring-2 focus:ring-[#318BCB]/20"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-app-text">
                  Kata sandi
                </label>
                <div className="relative">
                  <LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" aria-hidden="true" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    maxLength={128}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="h-12 w-full rounded-lg border border-app-border bg-app-input pl-10 pr-12 text-sm text-app-text placeholder:text-app-muted focus:border-[#318BCB] focus:outline-none focus:ring-2 focus:ring-[#318BCB]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-app-muted hover:bg-app-bg"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
            </div>

            <label className="mt-4 flex w-fit cursor-pointer items-center gap-2 text-sm text-app-muted">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="size-4 accent-[#183B5B]"
              />
              Ingat perangkat ini
            </label>



            <button
              type="submit"
              disabled={busy}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#183B5B] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#245477] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Memeriksa akun..." : "Masuk ke Nebula CBT"}
              {!busy && <ChevronRight size={17} />}
            </button>
          </form>

          <p className="mt-4 text-center text-xs leading-5 text-app-muted">
            Nebula CBT <span className="mx-2">·</span> AkaraNabastala
          </p>
        </div>
      </section>
    </main>
  );
}
