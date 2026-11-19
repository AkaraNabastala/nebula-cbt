import { KeyRound, UserRound } from "lucide-react";
import type { AuthUser } from "../../contexts/AuthContext";

export function AccountPage({
  user,
  onChangePassword,
}: {
  user: AuthUser;
  onChangePassword: () => void;
}) {
  return (
    <section className="max-w-3xl">
      <div className="mb-7">
        <p className="text-xs font-semibold tracking-[0.12em] text-[#318BCB]">
          PENGATURAN AKUN
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-app-text">
          Akun saya
        </h1>
        <p className="mt-2 text-sm text-app-muted">
          Informasi akun dan hak akses yang diberikan kepada Anda.
        </p>
      </div>

      <div className="rounded-2xl border border-app-border bg-app-surface p-6">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-app-soft text-app-primary">
            <UserRound size={25} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-app-text">
              {user.fullName}
            </h2>
            <p className="mt-1 text-xs text-app-muted">ID: {user.id}</p>
          </div>
        </div>

        <div className="my-6 border-t border-app-border" />

        <dl className="grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-app-muted">Nama lengkap</dt>
            <dd className="mt-1 text-sm font-medium text-app-text">
              {user.fullName}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-app-muted">Jumlah permission</dt>
            <dd className="mt-1 text-sm font-medium text-app-text">
              {user.permissions.length} hak akses
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-app-muted">Role akun</dt>
            <dd className="mt-2 flex flex-wrap gap-2">
              {user.roles.map((role) => (
                <span
                  key={role}
                  className="rounded-lg bg-app-soft px-3 py-1.5 text-xs font-semibold text-app-text"
                >
                  {role}
                </span>
              ))}
            </dd>
          </div>
        </dl>

        <div className="my-6 border-t border-app-border" />

        <button
          type="button"
          onClick={onChangePassword}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-app-border px-4 text-sm font-semibold text-app-text hover:bg-app-bg"
        >
          <KeyRound size={16} />
          Ganti kata sandi
        </button>
      </div>
    </section>
  );
}
