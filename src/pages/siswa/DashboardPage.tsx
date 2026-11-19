import { Activity, ClipboardList, GraduationCap } from "lucide-react";
import type { AuthUser } from "../../contexts/AuthContext";
import { DashboardHome, type DashboardDetail } from "../../components/shared/DashboardHome";

export function SiswaDashboardPage({ user, detail }: { user: AuthUser; detail: DashboardDetail }) {
  return (
    <DashboardHome user={user} detail={detail} modules={[
      { icon: <ClipboardList size={19} />, title: "Ujian tersedia", description: "Daftar ujian yang ditugaskan kepada akun peserta." },
      { icon: <Activity size={19} />, title: "Riwayat pengerjaan", description: "Informasi sesi dan status pengerjaan ujian." },
      { icon: <GraduationCap size={19} />, title: "Hasil ujian", description: "Informasi nilai dan hasil asesmen yang telah diterbitkan." },
    ]} />
  );
}
