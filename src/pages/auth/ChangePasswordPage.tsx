import { useState, type FormEvent } from "react";
import { Eye, EyeOff, KeyRound, LogOut } from "lucide-react";
import { Brand } from "../../components/shared/Brand";

export function ChangePasswordPage({
  onSubmit,
  onLogout,
}: {
  onSubmit: (current: string, next: string) => Promise<void>;
  onLogout: () => Promise<void>;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (newPassword.length < 12) {
      setError("Password baru minimal 12 karakter.");
      return;
    }

    if (newPassword !== confirmation) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("Password baru harus berbeda dari password saat ini.");
      return;
    }

    setBusy(true);
    try {
      await onSubmit(currentPassword, newPassword);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Password gagal diperbarui.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-app-bg px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-7">
          <Brand />
        </div>
        <section className="rounded-2xl border border-app-border bg-app-surface p-6 sm:p-8">
          <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-app-soft text-app-primary">
            <KeyRound size={22} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-app-text">
            Ganti kata sandi
          </h1>
          <p className="mt-3 text-sm leading-6 text-app-muted">
            Demi keamanan akun, Anda harus mengganti password sebelum
            menggunakan Nebula CBT. Minimal 12 karakter.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="current-password"
                className="mb-2 block text-sm font-medium text-app-text"
              >
                Password saat ini
              </label>
              <div className="relative">
                <input
                  id="current-password"
                  type={showCurrent ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="h-12 w-full rounded-xl border border-app-border bg-app-input px-4 pr-12 text-sm text-app-text focus:border-[#318BCB] focus:outline-none focus:ring-2 focus:ring-[#318BCB]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((value) => !value)}
                  aria-label={showCurrent ? "Sembunyikan" : "Tampilkan"}
                  className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-app-muted hover:bg-app-bg"
                >
                  {showCurrent ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="new-password"
                className="mb-2 block text-sm font-medium text-app-text"
              >
                Password baru
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNew ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={128}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="h-12 w-full rounded-xl border border-app-border bg-app-input px-4 pr-12 text-sm text-app-text focus:border-[#318BCB] focus:outline-none focus:ring-2 focus:ring-[#318BCB]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((value) => !value)}
                  aria-label={showNew ? "Sembunyikan" : "Tampilkan"}
                  className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-app-muted hover:bg-app-bg"
                >
                  {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm font-medium text-app-text"
              >
                Konfirmasi password baru
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={128}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                className="h-12 w-full rounded-xl border border-app-border bg-app-input px-4 text-sm text-app-text focus:border-[#318BCB] focus:outline-none focus:ring-2 focus:ring-[#318BCB]/20"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#183B5B] px-4 text-sm font-semibold text-white hover:bg-[#245477] disabled:opacity-60"
            >
              {busy ? "Menyimpan..." : "Simpan password baru"}
            </button>
          </form>
        </section>
        <button
          type="button"
          onClick={() => void onLogout()}
          className="mt-5 flex w-full items-center justify-center gap-2 py-2 text-xs font-medium text-app-muted hover:text-app-text"
        >
          <LogOut size={14} />
          Keluar dari akun
        </button>
      </div>
    </main>
  );
}