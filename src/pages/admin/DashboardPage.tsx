import { ClipboardList, GraduationCap, Users } from "lucide-react";
import type { AuthUser } from "../../contexts/AuthContext";
import { DashboardHome, type DashboardDetail } from "../../components/shared/DashboardHome";

export function AdminDashboardPage({ user, detail }: { user: AuthUser; detail: DashboardDetail }) {
  return (
    <DashboardHome user={user} detail={detail} modules={[
      { icon: <Users size={19} />, title: "Pengguna dan hak akses", description: "Pengelolaan akun, role, permission, dan identitas pengguna." },
      { icon: <GraduationCap size={19} />, title: "Akademik dan kelas", description: "Pengelolaan tahun akademik, kelas, dan data pembelajaran." },
      { icon: <ClipboardList size={19} />, title: "Operasional ujian", description: "Pengaturan jadwal, pelaksanaan, hasil, dan laporan ujian." },
    ]} />
  );
}
