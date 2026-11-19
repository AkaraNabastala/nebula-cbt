import { useEffect, useState } from "react";
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import type { AuthUser } from "../../contexts/AuthContext";
import { apiRequest } from "../../lib/api";
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

type InstitutionBrand = { institutionName?: string; logoDataUrl?: string };

const roleDetails: Record<string, { label: string }> = {
  ADMIN: { label: "Admin" },
  TEACHER: { label: "Guru" },
  STUDENT: { label: "Siswa" },
};

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
  const role = user.roles.includes("ADMIN") ? "ADMIN" : user.roles.includes("TEACHER") ? "TEACHER" : "STUDENT";
  const detail = roleDetails[role] ?? { label: "User" };
  const [mobileOpen, setMobileOpen] = useState(false);
  const [institution, setInstitution] = useState<InstitutionBrand>({});

  useEffect(() => {
    if (!token) return;
    let active = true;
    void apiRequest<InstitutionBrand>("/academic/education-settings", { token })
      .then((value) => { if (active) setInstitution(value); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    if (!mobileOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);

  const pageLabels: Record<DashboardSection, string> = {
    dashboard: "Overview",
    account: "Account",
    users: "User accounts",
    academicYears: "Academic years",
    academicSubjects: "Subjects",
    academicClasses: "Classes",
    questions: "Question bank",
    exams: role === "STUDENT" ? "My exams" : "Exams",
    results: "Results",
    enrollments: "Student groups",
    teacherAssignments: "Teacher assignments",
    audit: "Audit log",
  };

  const navClass = (active: boolean) =>
    `flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-primary ${active ? "bg-app-soft text-app-primary" : "text-app-muted hover:bg-app-bg hover:text-app-text"}`;

  const go = (next: DashboardSection) => {
    setPage(next);
    setMobileOpen(false);
  };

  const navigation = (
    <nav aria-label="Main navigation" className="space-y-5">
      <button type="button" onClick={() => go("dashboard")} aria-current={page === "dashboard" ? "page" : undefined} className={navClass(page === "dashboard")}>
        <LayoutDashboard size={17} /> Overview
      </button>

      {(role === "ADMIN" || role === "TEACHER") && (
        <section>
          <p className="mb-2 px-3 text-[11px] font-semibold text-app-muted">CBT</p>
          <div className="space-y-1">
            <button type="button" onClick={() => go("questions")} aria-current={page === "questions" ? "page" : undefined} className={navClass(page === "questions")}><BookOpen size={17} /> Question bank</button>
            <button type="button" onClick={() => go("exams")} aria-current={page === "exams" ? "page" : undefined} className={navClass(page === "exams")}><ClipboardList size={17} /> Exams</button>
            <button type="button" onClick={() => go("results")} aria-current={page === "results" ? "page" : undefined} className={navClass(page === "results")}><GraduationCap size={17} /> Results</button>
          </div>
        </section>
      )}

      {role === "STUDENT" && <button type="button" onClick={() => go("exams")} aria-current={page === "exams" ? "page" : undefined} className={navClass(page === "exams")}><ClipboardList size={17} /> My exams</button>}

      {role === "ADMIN" && (
        <>
          <section>
            <p className="mb-2 px-3 text-[11px] font-semibold text-app-muted">Users</p>
            <div className="space-y-1">
              <button type="button" onClick={() => go("users")} aria-current={page === "users" ? "page" : undefined} className={navClass(page === "users")}><Users size={17} /> User accounts</button>
              <button type="button" onClick={() => go("enrollments")} aria-current={page === "enrollments" ? "page" : undefined} className={navClass(page === "enrollments")}><Users size={17} /> Student groups</button>
              <button type="button" onClick={() => go("teacherAssignments")} aria-current={page === "teacherAssignments" ? "page" : undefined} className={navClass(page === "teacherAssignments")}><GraduationCap size={17} /> Teacher assignments</button>
            </div>
          </section>
          <section>
            <p className="mb-2 px-3 text-[11px] font-semibold text-app-muted">Academic</p>
            <div className="space-y-1">
              <button type="button" onClick={() => go("academicYears")} aria-current={page === "academicYears" ? "page" : undefined} className={navClass(page === "academicYears")}><GraduationCap size={17} /> Academic years</button>
              <button type="button" onClick={() => go("academicClasses")} aria-current={page === "academicClasses" ? "page" : undefined} className={navClass(page === "academicClasses")}><Users size={17} /> Classes</button>
              <button type="button" onClick={() => go("academicSubjects")} aria-current={page === "academicSubjects" ? "page" : undefined} className={navClass(page === "academicSubjects")}><BookOpen size={17} /> Subjects</button>
            </div>
          </section>
          <section>
            <p className="mb-2 px-3 text-[11px] font-semibold text-app-muted">System</p>
            <button type="button" onClick={() => go("audit")} aria-current={page === "audit" ? "page" : undefined} className={navClass(page === "audit")}><ShieldCheck size={17} /> Audit log</button>
          </section>
        </>
      )}
      <section className="border-t border-app-border pt-3">
        <button type="button" onClick={() => go("account")} aria-current={page === "account" ? "page" : undefined} className={navClass(page === "account")}><UserRound size={17} /> Account</button>
      </section>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-app-bg lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-[256px] shrink-0 flex-col border-r border-app-border bg-app-surface px-4 py-5 lg:flex">
        <Brand institutionName={institution.institutionName} logoDataUrl={institution.logoDataUrl} />
        <div className="mt-9 flex-1 overflow-y-auto">{navigation}</div>
        <div className="mt-4 border-t border-app-border px-3 pt-4">
          <p className="truncate text-sm font-semibold text-app-text">{user.fullName}</p>
          <p className="mt-1 text-xs text-app-muted">{detail.label}</p>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-app-border bg-app-surface px-4 sm:px-7">
          <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation" aria-expanded={mobileOpen} aria-controls="mobile-workspace-navigation" className="inline-flex size-11 items-center justify-center rounded-lg text-app-text hover:bg-app-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-primary lg:hidden">
            <Menu size={21} />
          </button>
          <div className="lg:hidden"><Brand compact institutionName={institution.institutionName} logoDataUrl={institution.logoDataUrl} /></div>
          <div className="hidden text-xs text-app-muted lg:block">Workspace <span className="mx-2">/</span><span className="font-medium text-app-text">{pageLabels[page]}</span></div>
          <div className="ml-auto flex min-w-0 items-center gap-3">
            <div className="hidden min-w-0 text-right sm:block"><p className="max-w-52 truncate text-xs font-semibold text-app-text">{user.fullName}</p><p className="mt-1 text-[11px] text-app-muted">{detail.label}</p></div>
            <button type="button" onClick={() => void onLogout()} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-app-border px-3 text-xs font-semibold text-app-text hover:bg-app-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-primary">
              <LogOut size={15} /><span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-[2px]" />
            <aside id="mobile-workspace-navigation" className="absolute inset-y-0 left-0 flex w-[min(86vw,320px)] flex-col border-r border-app-border bg-app-surface px-4 py-5 shadow-2xl transition-transform duration-200">
              <div className="mb-8 flex items-center justify-between gap-3">
                <Brand institutionName={institution.institutionName} logoDataUrl={institution.logoDataUrl} />
                <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation" className="inline-flex size-10 items-center justify-center rounded-lg text-app-muted hover:bg-app-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-primary"><X size={20} /></button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">{navigation}</div>
              <div className="mt-4 border-t border-app-border px-3 pt-4">
                <p className="truncate text-sm font-semibold text-app-text">{user.fullName}</p>
                <p className="mt-1 text-xs text-app-muted">{detail.label}</p>
              </div>
            </aside>
          </div>
        )}

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
                                  : role === "ADMIN" ? <AdminDashboardPage user={user} detail={{ label: detail.label, title: "Overview", description: "CBT workspace" }} />
                                    : role === "TEACHER" ? <GuruDashboardPage user={user} detail={{ label: detail.label, title: "Teaching workspace", description: "Your CBT workspace" }} />
                                      : <SiswaDashboardPage user={user} detail={{ label: detail.label, title: "Student workspace", description: "Your exams and results" }} />}
        </main>

        <footer className="border-t border-app-border px-5 py-5 text-center text-[11px] text-app-muted sm:px-8">Nebula CBT <span className="mx-1">·</span> AkaraNabastala</footer>
      </div>
    </div>
  );
}
