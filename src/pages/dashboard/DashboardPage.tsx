import {
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  UserRound,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
} from "lucide-react";
import type { AuthUser } from "../../contexts/AuthContext";
import { Brand } from "../../components/shared/Brand";
import { AccountPage } from "../account/AccountPage";
import { AdminDashboardPage } from "../admin/DashboardPage";
import { GuruDashboardPage } from "../guru/DashboardPage";
import { SiswaDashboardPage } from "../siswa/DashboardPage";
import { UsersPage } from "../admin/UsersPage";
import { AcademicPage } from "../admin/AcademicPage";
import { QuestionsPage } from "../guru/QuestionsPage";
import { ExamOperationsPage } from "../guru/ExamOperationsPage";
import { StudentExamsPage } from "../siswa/StudentExamsPage";
import { ResultsPage } from "../guru/ResultsPage";
import { PeopleManagementPage } from "../admin/PeopleManagementPage";
import { AuditLogsPage } from "../admin/AuditLogsPage";

export type DashboardSection = "dashboard" | "account" | "users" | "academic" | "questions" | "exams" | "results" | "people" | "audit";

const roleDetails: Record<string, {
  label: string;
  title: string;
  description: string;
}> = {
  ADMIN: {
    label: "Administrator",
    title: "Ruang kendali sistem",
    description: "Area pengelolaan Nebula CBT untuk administrasi dan operasional platform.",
  },
  TEACHER: {
    label: "Guru",
    title: "Ruang kerja pengajar",
    description: "Area kerja untuk persiapan pembelajaran dan pengelolaan asesmen.",
  },
  STUDENT: {
    label: "Peserta didik",
    title: "Ruang ujian peserta",
    description: "Area peserta untuk mengakses aktivitas ujian dan informasi akademik.",
  },
};

function getPrimaryRole(roles: string[]): string {
  for (const role of ["ADMIN", "TEACHER", "STUDENT"]) {
    if (roles.includes(role)) return role;
  }
  return roles[0] || "USER";
}

export function DashboardPage({
  user,
  token,
  page,
  setPage,
  onLogout,
  onChangePassword,
}: {
  user: AuthUser;
  token: string | null;
  page: DashboardSection;
  setPage: (page: DashboardSection) => void;
  onLogout: () => Promise<void>;
  onChangePassword: () => void;
}) {
  const role = getPrimaryRole(user.roles);
  const detail = roleDetails[role] || {
    label: role,
    title: "Ruang kerja pengguna",
    description: "Selamat datang di Nebula CBT.",
  };

  const navClass = (active: boolean) =>
    `flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-primary ${active ? "bg-app-soft text-app-primary" : "text-app-muted hover:bg-app-bg hover:text-app-text"}`;

  return (
    <div className="min-h-screen bg-app-bg lg:flex">
      <aside className="hidden w-[252px] shrink-0 flex-col border-r border-app-border bg-app-surface px-5 py-6 lg:flex">
        <Brand />
        <div className="mt-10">
          <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.15em] text-app-muted">WORKSPACE</p>
          <nav aria-label="Navigasi utama" className="space-y-1">
            <button type="button" onClick={() => setPage("dashboard")} aria-current={page === "dashboard" ? "page" : undefined} className={navClass(page === "dashboard")}>
              <LayoutDashboard size={17} /> Ringkasan
            </button>
            {(role === "ADMIN" || role === "TEACHER") && (
              <button type="button" onClick={() => setPage("questions")} aria-current={page === "questions" ? "page" : undefined} className={navClass(page === "questions")}>
                <BookOpen size={17} /> Bank soal
              </button>
            )}
            {(role === "ADMIN" || role === "TEACHER") && (
              <button type="button" onClick={() => setPage("exams")} aria-current={page === "exams" ? "page" : undefined} className={navClass(page === "exams")}>
                <ClipboardList size={17} /> Operasional ujian
              </button>
            )}
            {role === "ADMIN" && (
              <button type="button" onClick={() => setPage("academic")} aria-current={page === "academic" ? "page" : undefined} className={navClass(page === "academic")}>
                <GraduationCap size={17} /> Akademik dan Kelas
              </button>
            )}
            {role === "ADMIN" && (
              <button type="button" onClick={() => setPage("users")} aria-current={page === "users" ? "page" : undefined} className={navClass(page === "users")}>
                <Users size={17} /> Pengguna dan Hak Akses
              </button>
            )}
            {(role === "ADMIN" || role === "TEACHER") && <button type="button" onClick={() => setPage("results")} aria-current={page === "results" ? "page" : undefined} className={navClass(page === "results")}><GraduationCap size={17} /> Penilaian dan hasil</button>}
            {role === "ADMIN" && <button type="button" onClick={() => setPage("people")} aria-current={page === "people" ? "page" : undefined} className={navClass(page === "people")}><Users size={17} /> Siswa dan penugasan</button>}
            {role === "ADMIN" && <button type="button" onClick={() => setPage("audit")} aria-current={page === "audit" ? "page" : undefined} className={navClass(page === "audit")}><ShieldCheck size={17} /> Audit log</button>}
            {role === "STUDENT" && <button type="button" onClick={() => setPage("exams")} aria-current={page === "exams" ? "page" : undefined} className={navClass(page === "exams")}><ClipboardList size={17} /> Ujian saya</button>}
            <button type="button" onClick={() => setPage("account")} aria-current={page === "account" ? "page" : undefined} className={navClass(page === "account")}>
              <UserRound size={17} /> Akun saya
            </button>
          </nav>
        </div>
        <div className="mt-auto rounded-xl border border-app-border bg-app-bg p-4">
          <div className="flex items-center gap-2 text-app-text"><ShieldCheck size={16} /><span className="text-xs font-semibold">{detail.label}</span></div>
          <p className="mt-2 break-all text-[11px] leading-5 text-app-muted">{user.fullName}</p>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex min-h-[76px] items-center justify-between gap-4 border-b border-app-border bg-app-surface px-5 sm:px-8">
          <div className="flex items-center gap-3 lg:hidden"><Brand compact /><span className="text-sm font-bold text-app-text">Nebula CBT</span></div>
          <div className="hidden text-xs text-app-muted lg:block">
            Workspace <span className="mx-2">/</span>
            <span className="font-medium text-app-text">
              {page === "dashboard" ? "Ringkasan" : page === "users" ? "Pengguna dan Hak Akses" : page === "academic" ? "Akademik dan Kelas" : page === "questions" ? "Bank soal" : page === "exams" ? (role === "STUDENT" ? "Ujian saya" : "Operasional ujian") : page === "results" ? "Penilaian dan hasil" : page === "people" ? "Siswa dan penugasan" : page === "audit" ? "Audit log" : "Akun saya"}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block"><p className="text-xs font-semibold text-app-text">{user.fullName}</p><p className="mt-1 text-[11px] text-app-muted">{detail.label}</p></div>
            <button type="button" onClick={() => void onLogout()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-app-border px-3 text-xs font-semibold text-app-text hover:bg-app-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-primary">
              <LogOut size={15} /><span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </header>

        <nav aria-label="Navigasi ringkas" className="flex flex-wrap gap-1.5 border-b border-app-border bg-app-surface px-4 py-2 lg:hidden">
          <button type="button" onClick={() => setPage("dashboard")} aria-current={page === "dashboard" ? "page" : undefined} className={`min-h-11 rounded-lg px-3 text-xs font-medium ${page === "dashboard" ? "bg-app-soft text-app-primary" : "text-app-muted"}`}>Ringkasan</button>
          {(role === "ADMIN" || role === "TEACHER") && <button type="button" onClick={() => setPage("questions")} aria-current={page === "questions" ? "page" : undefined} className={`min-h-11 rounded-lg px-3 text-xs font-medium ${page === "questions" ? "bg-app-soft text-app-primary" : "text-app-muted"}`}>Bank soal</button>}
          {(role === "ADMIN" || role === "TEACHER") && <button type="button" onClick={() => setPage("exams")} aria-current={page === "exams" ? "page" : undefined} className={`min-h-11 rounded-lg px-3 text-xs font-medium ${page === "exams" ? "bg-app-soft text-app-primary" : "text-app-muted"}`}>Ujian</button>}
          {role === "ADMIN" && <button type="button" onClick={() => setPage("academic")} aria-current={page === "academic" ? "page" : undefined} className={`min-h-11 rounded-lg px-3 text-xs font-medium ${page === "academic" ? "bg-app-soft text-app-primary" : "text-app-muted"}`}>Akademik</button>}
          {role === "ADMIN" && <button type="button" onClick={() => setPage("users")} aria-current={page === "users" ? "page" : undefined} className={`min-h-11 rounded-lg px-3 text-xs font-medium ${page === "users" ? "bg-app-soft text-app-primary" : "text-app-muted"}`}>Pengguna</button>}
          {(role === "ADMIN" || role === "TEACHER") && <button type="button" onClick={() => setPage("results")} aria-current={page === "results" ? "page" : undefined} className="min-h-11 rounded-lg px-3 text-xs font-medium text-app-muted">Hasil</button>}
          {role === "ADMIN" && <button type="button" onClick={() => setPage("people")} aria-current={page === "people" ? "page" : undefined} className="min-h-11 rounded-lg px-3 text-xs font-medium text-app-muted">Siswa dan penugasan</button>}
          {role === "ADMIN" && <button type="button" onClick={() => setPage("audit")} aria-current={page === "audit" ? "page" : undefined} className="min-h-11 rounded-lg px-3 text-xs font-medium text-app-muted">Audit log</button>}
          {role === "STUDENT" && <button type="button" onClick={() => setPage("exams")} aria-current={page === "exams" ? "page" : undefined} className="min-h-11 rounded-lg px-3 text-xs font-medium text-app-muted">Ujian saya</button>}
          <button type="button" onClick={() => setPage("account")} aria-current={page === "account" ? "page" : undefined} className={`min-h-11 rounded-lg px-3 text-xs font-medium ${page === "account" ? "bg-app-soft text-app-primary" : "text-app-muted"}`}>Akun saya</button>
        </nav>

        <main className="mx-auto w-full max-w-[1440px] px-5 py-8 sm:px-8 sm:py-10">
          {page === "account" ? <AccountPage user={user} onChangePassword={onChangePassword} />
            : page === "users" && role === "ADMIN" ? <UsersPage token={token} />
              : page === "academic" && role === "ADMIN" ? <AcademicPage token={token} />
                : page === "questions" && (role === "ADMIN" || role === "TEACHER") ? <QuestionsPage token={token} />
                  : page === "exams" && (role === "ADMIN" || role === "TEACHER") ? <ExamOperationsPage token={token} />
                    : page === "exams" && role === "STUDENT" ? <StudentExamsPage token={token} />
                      : page === "results" && (role === "ADMIN" || role === "TEACHER") ? <ResultsPage token={token} />
                    : page === "people" && role === "ADMIN" ? <PeopleManagementPage token={token} />
                      : page === "audit" && role === "ADMIN" ? <AuditLogsPage token={token} />
                    : role === "ADMIN" ? <AdminDashboardPage user={user} detail={detail} />
                    : role === "TEACHER" ? <GuruDashboardPage user={user} detail={detail} />
                      : <SiswaDashboardPage user={user} detail={detail} />}
        </main>

        <footer className="border-t border-app-border px-5 py-5 text-center text-[11px] text-app-muted sm:px-8">
          Nebula CBT <span className="mx-1">·</span> AkaraNabastala
        </footer>
      </div>
    </div>
  );
}
