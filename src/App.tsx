import { useEffect, useState } from "react";
import { useTheme } from "./hooks/useTheme";
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
  useTheme();

  const pathname = usePathname();
  const [mustChangeNotice, setMustChangeNotice] = useState("");
  const { user, token, isLoading, login, logout, changePassword } = useAuth();

  const role = user ? getPrimaryRole(user.roles) : "";
  const dashboardPath = user ? getDashboardPath(role) : null;

  let expectedPath = "/login";

  if (user?.mustChangePassword) {
    expectedPath = "/change-password";
  } else if (user) {
    expectedPath =
      pathname === "/account"
        ? "/account"
        : role === "ADMIN" && pathname === "/admin/users"
          ? "/admin/users"
          : role === "ADMIN" && pathname === "/admin/academic"
            ? "/admin/academic"
            : role === "ADMIN" && pathname === "/admin/questions"
              ? "/admin/questions"
              : role === "ADMIN" && pathname === "/admin/exams"
                ? "/admin/exams"
                : role === "TEACHER" && pathname === "/guru/questions"
                  ? "/guru/questions"
                  : role === "TEACHER" && pathname === "/guru/exams"
                    ? "/guru/exams"
                    : dashboardPath || "/unsupported";
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
      : pathname === "/admin/academic"
        ? "academic"
        : pathname === "/admin/questions" || pathname === "/guru/questions"
          ? "questions"
          : pathname === "/admin/exams" || pathname === "/guru/exams"
            ? "exams"
            : pathname === "/siswa/exams"
              ? "exams"
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
          academic: "/admin/academic",
          questions: role === "ADMIN" ? "/admin/questions" : "/guru/questions",
          exams: role === "ADMIN" ? "/admin/exams" : role === "TEACHER" ? "/guru/exams" : "/siswa/exams",
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
