import { ShieldCheck, Users, UserPlus, LockKeyhole } from "lucide-react";

const unavailableModules = [
  {
    icon: Users,
    title: "Daftar pengguna",
    description: "Melihat, mencari, dan mengelola akun administrator, guru, serta siswa.",
  },
  {
    icon: UserPlus,
    title: "Tambah pengguna",
    description: "Membuat akun baru dan mengatur identitas pengguna.",
  },
  {
    icon: ShieldCheck,
    title: "Role dan permission",
    description: "Mengatur peran dan hak akses setiap pengguna.",
  },
  {
    icon: LockKeyhole,
    title: "Keamanan akun",
    description: "Mengelola status akun dan kebijakan akses.",
  },
];

export function UsersPage() {
  return (
    <div className="space-y-7">
      <section>
        <p className="text-xs font-semibold tracking-widest text-[#318BCB]">
          ADMINISTRASI
        </p>
        <h1 className="mt-2 text-2xl font-bold text-app-text">
          Pengguna dan Hak Akses
        </h1>
        <p className="mt-2 text-sm text-app-muted">
          Pengelolaan akun dan kewenangan pengguna Nebula CBT.
        </p>
      </section>

      <section className="rounded-2xl border border-app-border bg-app-surface p-5">
        <div className="flex items-start gap-3">
          <LockKeyhole className="mt-1 text-app-muted" size={20} />
          <div>
            <h2 className="text-sm font-semibold text-app-text">
              Modul belum tersedia
            </h2>
            <p className="mt-1 text-sm leading-6 text-app-muted">
              API manajemen pengguna belum tersedia pada backend.
              Data dan tindakan pengelolaan belum dapat digunakan.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {unavailableModules.map(({ icon: Icon, title, description }) => (
          <article
            key={title}
            className="rounded-2xl border border-app-border bg-app-surface p-5"
          >
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-app-bg p-2.5 text-app-primary">
                <Icon size={19} />
              </span>
              <h2 className="text-sm font-semibold text-app-text">{title}</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-app-muted">
              {description}
            </p>
            <span className="mt-4 inline-flex rounded-full border border-app-border px-3 py-1 text-xs text-app-muted">
              API belum tersedia
            </span>
          </article>
        ))}
      </section>
    </div>
  );
}
