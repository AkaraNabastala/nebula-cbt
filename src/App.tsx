import { useEffect, useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { LoadingScreen } from "./components/shared/Brand";
import { LoginPage } from "./pages/auth/LoginPage";
import { ChangePasswordPage } from "./pages/auth/ChangePasswordPage";
import {
  getDashboardPath,
  getPrimaryRole,
  navigate,
  usePathname,
} from "./app/routes";
import { DashboardPage } from "./pages/dashboard/DashboardPage";

function App() {
  const pathname = usePathname();
  const [mustChangeNotice, setMustChangeNotice] = useState("");
  const { user, token, isLoading, login, logout, changePassword } = useAuth();

  const role = user ? getPrimaryRole(user.roles) : "";
  const dashboardPath = user ? getDashboardPath(role) : null;

  let expectedPath = "/login";

  if (user?.mustChangePassword) {
    expectedPath = "/change-password";
  } else if (user) {
    const allowedPaths = role === "ADMIN"
      ? new Set([
          "/account",
          "/admin/users",
          "/admin/academic/years",
          "/admin/academic/subjects",
          "/admin/academic/classes",
          "/admin/academic",
          "/admin/questions",
          "/admin/exams",
          "/admin/results",
          "/admin/enrollments",
          "/admin/teacher-assignments",
          "/admin/people",
          "/admin/audit-logs",
          "/admin/education-settings",
        ])
      : role === "TEACHER"
        ? new Set(["/account", "/guru/questions", "/guru/exams", "/guru/results"])
        : new Set(["/account", "/siswa/exams"]);

    if (role === "ADMIN" && pathname === "/admin/academic") {
      expectedPath = "/admin/academic/years";
    } else {
      expectedPath = allowedPaths.has(pathname) ? pathname : dashboardPath || "/unsupported";
    }
  }

  useEffect(() => {
    if (!isLoading && pathname !== expectedPath) {
      navigate(expectedPath, true);
    }
  }, [isLoading, pathname, expectedPath]);

  async function handlePasswordChange(current: string, next: string) {
    await changePassword(current, next);
    setMustChangeNotice("Password berhasil diganti. Silakan masuk kembali menggunakan password baru.");
  }

  if (isLoading || pathname !== expectedPath) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginPage onLogin={login} notice={mustChangeNotice} />;
  }

  if (user.mustChangePassword) {
    return (
      <ChangePasswordPage
        onSubmit={handlePasswordChange}
        onLogout={logout}
      />
    );
  }

  if (!dashboardPath) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app-bg p-6">
        <section className="max-w-md rounded-2xl border border-app-border bg-app-surface p-6">
          <h1 className="text-lg font-semibold text-app-text">
            Role belum didukung
          </h1>
          <p className="mt-2 text-sm text-app-muted">
            Akun Anda belum memiliki role yang dapat mengakses dashboard.
            Hubungi administrator sekolah.
          </p>
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-5 rounded-xl bg-app-primary px-4 py-2 text-sm font-medium text-white"
          >
            Keluar
          </button>
        </section>
      </main>
    );
  }

  const page = pathname === "/account"
    ? "account"
    : pathname === "/admin/users"
      ? "users"
      : pathname === "/admin/academic/years" || pathname === "/admin/academic"
        ? "academicYears"
        : pathname === "/admin/academic/subjects"
          ? "academicSubjects"
          : pathname === "/admin/academic/classes"
            ? "academicClasses"
        : pathname === "/admin/questions" || pathname === "/guru/questions"
          ? "questions"
          : pathname === "/admin/exams" || pathname === "/guru/exams"
            ? "exams"
            : pathname === "/siswa/exams"
              ? "exams"
              : pathname === "/admin/results" || pathname === "/guru/results"
                ? "results"
                : pathname === "/admin/enrollments" || pathname === "/admin/people"
                  ? "enrollments"
                  : pathname === "/admin/teacher-assignments"
                    ? "teacherAssignments"
                  : pathname === "/admin/audit-logs"
                    ? "audit"
                    : pathname === "/admin/education-settings"
                      ? "educationSettings"
                    : "dashboard";

  return (
    <DashboardPage
      user={user}
      token={token}
      page={page}
      setPage={(nextPage) => {
        const paths = {
          account: "/account",
          users: "/admin/users",
          academicYears: "/admin/academic/years",
          academicSubjects: "/admin/academic/subjects",
          academicClasses: "/admin/academic/classes",
          questions: role === "ADMIN" ? "/admin/questions" : "/guru/questions",
          exams: role === "ADMIN" ? "/admin/exams" : role === "TEACHER" ? "/guru/exams" : "/siswa/exams",
          results: role === "ADMIN" ? "/admin/results" : "/guru/results",
          enrollments: "/admin/enrollments",
          teacherAssignments: "/admin/teacher-assignments",
          audit: "/admin/audit-logs",
          educationSettings: "/admin/education-settings",
          dashboard: dashboardPath,
        } as const;
        navigate(paths[nextPage] ?? dashboardPath ?? "/login");
      }}
      onLogout={logout}
      onChangePassword={() => navigate("/account")}
    />
  );
}

export default App;
