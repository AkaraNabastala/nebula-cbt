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

export type DashboardSection = "dashboard" | "account" | "users" | "academicYears" | "academicSubjects" | "academicClasses" | "questions" | "exams" | "results" | "enrollments" | "teacherAssignments" | "audit";

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

  const pageLabels: Record<DashboardSection, string> = {
    dashboard: "Ringkasan",
    account: "Akun saya",
    users: "Akun pengguna",
    academicYears: "Tahun ajaran",
    academicSubjects: "Mata pelajaran",
    academicClasses: "Kelas",
    questions: "Bank soal",
    exams: role === "STUDENT" ? "Ujian saya" : "Operasional ujian",
    results: "Penilaian dan hasil",
    enrollments: "Penempatan siswa",
    teacherAssignments: "Penugasan guru",
    audit: "Audit log",
  };

  const navClass = (active: boolean) =>
    `flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-primary ${active ? "bg-app-soft text-app-primary" : "text-app-muted hover:bg-app-bg hover:text-app-text"}`;

  return (
    <div className="min-h-dvh bg-app-bg lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-[252px] shrink-0 flex-col overflow-y-auto border-r-2 border-r-[#318BCB]/30 bg-app-surface px-4 py-5 lg:flex">
        <Brand />
        <div className="mt-10">
          <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.15em] text-app-muted">WORKSPACE</p>
          <nav aria-label="Navigasi utama" className="space-y-2">
            <button type="button" onClick={() => setPage("dashboard")} aria-current={page === "dashboard" ? "page" : undefined} className={navClass(page === "dashboard")}>
              <LayoutDashboard size={17} /> Ringkasan
            </button>
            {(role === "ADMIN" || role === "TEACHER") && <details className="group rounded-lg" open={["questions", "exams", "results"].includes(page)}>
              <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between rounded-lg px-3 text-xs font-semibold text-app-muted hover:bg-app-bg hover:text-app-text">
                <span>Asesmen</span><span aria-hidden="true" className="text-app-muted transition-transform group-open:rotate-90">›</span>
              </summary>
              <div className="mt-1 space-y-1 pl-2">
                <button type="button" onClick={() => setPage("questions")} aria-current={page === "questions" ? "page" : undefined} className={navClass(page === "questions")}><BookOpen size={16} /> Bank soal</button>
                <button type="button" onClick={() => setPage("exams")} aria-current={page === "exams" ? "page" : undefined} className={navClass(page === "exams")}><ClipboardList size={16} /> Operasional ujian</button>
                <button type="button" onClick={() => setPage("results")} aria-current={page === "results" ? "page" : undefined} className={navClass(page === "results")}><GraduationCap size={16} /> Penilaian dan hasil</button>
              </div>
            </details>}
            {role === "STUDENT" && <button type="button" onClick={() => setPage("exams")} aria-current={page === "exams" ? "page" : undefined} className={navClass(page === "exams")}><ClipboardList size={17} /> Ujian saya</button>}
            {role === "ADMIN" && <details className="group rounded-lg" open={["academicYears", "academicSubjects", "academicClasses", "users", "enrollments", "teacherAssignments", "audit"].includes(page)}>
              <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between rounded-lg px-3 text-xs font-semibold text-app-muted hover:bg-app-bg hover:text-app-text">
                <span>Administrasi sekolah</span><span aria-hidden="true" className="text-app-muted transition-transform group-open:rotate-90">›</span>
              </summary>
              <div className="mt-1 space-y-1 pl-2">
                <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-app-muted">Akademik</div>
                <button type="button" onClick={() => setPage("academicYears")} aria-current={page === "academicYears" ? "page" : undefined} className={navClass(page === "academicYears")}><GraduationCap size={16} /> Tahun ajaran</button>
                <button type="button" onClick={() => setPage("academicSubjects")} aria-current={page === "academicSubjects" ? "page" : undefined} className={navClass(page === "academicSubjects")}><BookOpen size={16} /> Mata pelajaran</button>
                <button type="button" onClick={() => setPage("academicClasses")} aria-current={page === "academicClasses" ? "page" : undefined} className={navClass(page === "academicClasses")}><Users size={16} /> Kelas</button>
                <button type="button" onClick={() => setPage("users")} aria-current={page === "users" ? "page" : undefined} className={navClass(page === "users")}><Users size={16} /> Pengguna dan hak akses</button>
                <button type="button" onClick={() => setPage("enrollments")} aria-current={page === "enrollments" ? "page" : undefined} className={navClass(page === "enrollments")}><Users size={16} /> Penempatan siswa</button>
                <button type="button" onClick={() => setPage("teacherAssignments")} aria-current={page === "teacherAssignments" ? "page" : undefined} className={navClass(page === "teacherAssignments")}><GraduationCap size={16} /> Penugasan guru</button>
                <button type="button" onClick={() => setPage("audit")} aria-current={page === "audit" ? "page" : undefined} className={navClass(page === "audit")}><ShieldCheck size={16} /> Audit log</button>
              </div>
            </details>}
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
        <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-4 border-b border-app-border bg-app-surface px-5 shadow-sm sm:px-7">
          <div className="flex items-center gap-3 lg:hidden"><Brand compact /><span className="text-sm font-bold text-app-text">Nebula CBT</span></div>
          <div className="hidden text-xs text-app-muted lg:block">
            Workspace <span className="mx-2">/</span>
            <span className="font-medium text-app-text">
              {pageLabels[page]}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block"><p className="text-xs font-semibold text-app-text">{user.fullName}</p><p className="mt-1 text-[11px] text-app-muted">{detail.label}</p></div>
            <button type="button" onClick={() => void onLogout()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-app-border px-3 text-xs font-semibold text-app-text hover:bg-app-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-primary">
              <LogOut size={15} /><span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </header>

        <details className="border-b border-app-border bg-app-surface lg:hidden">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 text-xs font-semibold text-app-text hover:bg-app-bg active:bg-app-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-app-primary">
            <span>Menu workspace</span>
            <span className="font-normal text-app-muted">{pageLabels[page]}</span>
          </summary>
          <nav aria-label="Navigasi utama seluler" onClick={(event) => { if ((event.target as HTMLElement).closest("button")) { const menu = event.currentTarget.closest("details") as HTMLDetailsElement | null; if (menu) menu.open = false; } }} className="space-y-1 px-4 pb-3">
            <button type="button" onClick={() => setPage("dashboard")} aria-current={page === "dashboard" ? "page" : undefined} className={navClass(page === "dashboard")}><LayoutDashboard size={16} /> Ringkasan</button>
            {(role === "ADMIN" || role === "TEACHER") && <details className="group rounded-lg">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg px-3 text-sm font-semibold text-app-muted hover:bg-app-bg hover:text-app-text"><span>Asesmen</span><span aria-hidden="true">›</span></summary>
              <div className="space-y-1 pl-3">
                <button type="button" onClick={() => setPage("questions")} aria-current={page === "questions" ? "page" : undefined} className={navClass(page === "questions")}><BookOpen size={16} /> Bank soal</button>
                <button type="button" onClick={() => setPage("exams")} aria-current={page === "exams" ? "page" : undefined} className={navClass(page === "exams")}><ClipboardList size={16} /> Operasional ujian</button>
                <button type="button" onClick={() => setPage("results")} aria-current={page === "results" ? "page" : undefined} className={navClass(page === "results")}><GraduationCap size={16} /> Penilaian dan hasil</button>
              </div>
            </details>}
            {role === "STUDENT" && <button type="button" onClick={() => setPage("exams")} aria-current={page === "exams" ? "page" : undefined} className={navClass(page === "exams")}><ClipboardList size={16} /> Ujian saya</button>}
            {role === "ADMIN" && <details className="group rounded-lg">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg px-3 text-sm font-semibold text-app-muted hover:bg-app-bg hover:text-app-text"><span>Administrasi sekolah</span><span aria-hidden="true">›</span></summary>
              <div className="space-y-1 pl-3">
                <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-app-muted">Akademik</p>
                <button type="button" onClick={() => setPage("academicYears")} aria-current={page === "academicYears" ? "page" : undefined} className={navClass(page === "academicYears")}>Tahun ajaran</button>
                <button type="button" onClick={() => setPage("academicSubjects")} aria-current={page === "academicSubjects" ? "page" : undefined} className={navClass(page === "academicSubjects")}>Mata pelajaran</button>
                <button type="button" onClick={() => setPage("academicClasses")} aria-current={page === "academicClasses" ? "page" : undefined} className={navClass(page === "academicClasses")}>Kelas</button>
                <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-app-muted">Pengelolaan</p>
                <button type="button" onClick={() => setPage("users")} aria-current={page === "users" ? "page" : undefined} className={navClass(page === "users")}><Users size={16} /> Akun pengguna</button>
                <button type="button" onClick={() => setPage("enrollments")} aria-current={page === "enrollments" ? "page" : undefined} className={navClass(page === "enrollments")}><Users size={16} /> Penempatan siswa</button>
                <button type="button" onClick={() => setPage("teacherAssignments")} aria-current={page === "teacherAssignments" ? "page" : undefined} className={navClass(page === "teacherAssignments")}><GraduationCap size={16} /> Penugasan guru</button>
                <button type="button" onClick={() => setPage("audit")} aria-current={page === "audit" ? "page" : undefined} className={navClass(page === "audit")}><ShieldCheck size={16} /> Audit log</button>
              </div>
            </details>}
            <button type="button" onClick={() => setPage("account")} aria-current={page === "account" ? "page" : undefined} className={navClass(page === "account")}><UserRound size={16} /> Akun saya</button>
          </nav>
        </details>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-7 sm:py-7">
          {page === "account" ? <AccountPage user={user} onChangePassword={onChangePassword} />
            : page === "users" && role === "ADMIN" ? <UsersPage token={token} />
              : page === "academicYears" && role === "ADMIN" ? <AcademicPage token={token} section="years" />
                : page === "academicSubjects" && role === "ADMIN" ? <AcademicPage token={token} section="subjects" />
                  : page === "academicClasses" && role === "ADMIN" ? <AcademicPage token={token} section="classes" />
                : page === "questions" && (role === "ADMIN" || role === "TEACHER") ? <QuestionsPage token={token} />
                  : page === "exams" && (role === "ADMIN" || role === "TEACHER") ? <ExamOperationsPage token={token} />
                    : page === "exams" && role === "STUDENT" ? <StudentExamsPage token={token} />
                      : page === "results" && (role === "ADMIN" || role === "TEACHER") ? <ResultsPage token={token} />
                    : page === "enrollments" && role === "ADMIN" ? <PeopleManagementPage token={token} section="enrollments" />
                      : page === "teacherAssignments" && role === "ADMIN" ? <PeopleManagementPage token={token} section="teacherAssignments" />
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
