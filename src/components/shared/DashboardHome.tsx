import { CheckCircle2, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import type { AuthUser } from "../../contexts/AuthContext";
import { ModuleCard } from "./ModuleCard";

export type DashboardDetail = {
  label: string;
  title: string;
  description: string;
};

type Module = {
  icon: ReactNode;
  title: string;
  description: string;
};

export function DashboardHome({
  user,
  detail,
  modules,
}: {
  user: AuthUser;
  detail: DashboardDetail;
  modules: Module[];
}) {
  return (
    <>
      <section className="mb-9">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.12em] text-[#318BCB]">
              {detail.label.toUpperCase()}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-app-text sm:text-3xl">
              {detail.title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-app-muted">
              {detail.description}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-app-border bg-app-surface px-3 py-2.5">
            <CheckCircle2 size={16} className="text-[#318BCB]" />
            <span className="text-xs font-medium text-app-text">
              Sesi terautentikasi
            </span>
          </div>
        </div>
      </section>

      <section className="mb-8 rounded-2xl bg-[#183B5B] p-6 text-white sm:p-8">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-[#B9D9EF]">
            NEBULA CBT · AKARANABASTALA
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
            Selamat datang, {user.fullName}.
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#D5E5F1]">
            Anda masuk sebagai {detail.label}. Ruang kerja dan hak akses
            ditampilkan berdasarkan role akun Anda.
          </p>
        </div>
      </section>

      <section>
        <div className="mb-5">
          <h2 className="text-base font-semibold text-app-text">Area kerja</h2>
          <p className="mt-1 text-xs text-app-muted">
            Modul sesuai tanggung jawab akun Anda.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => (
            <ModuleCard key={module.title} {...module} />
          ))}
        </div>
      </section>

      <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-app-border bg-app-surface p-5">
        <div>
          <p className="text-sm font-semibold text-app-text">Informasi akses</p>
          <p className="mt-1 text-xs text-app-muted">
            {user.permissions.length} permission aktif pada sesi ini.
          </p>
        </div>
        <span className="inline-flex h-10 items-center gap-2 px-3 text-xs font-semibold text-app-primary">
          Hak akses akun <ChevronRight size={15} />
        </span>
      </section>
    </>
  );
}
