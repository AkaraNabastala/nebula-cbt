import { Activity, BookOpen, ClipboardList } from "lucide-react";
import type { AuthUser } from "../../contexts/AuthContext";
import { DashboardHome, type DashboardDetail } from "../../components/shared/DashboardHome";

export function GuruDashboardPage({ user, detail }: { user: AuthUser; detail: DashboardDetail }) {
  return (
    <DashboardHome user={user} detail={detail} modules={[
      { icon: <BookOpen size={19} />, title: "Bank soal", description: "Penyusunan dan pengelolaan kumpulan soal pembelajaran." },
      { icon: <ClipboardList size={19} />, title: "Penyusunan ujian", description: "Pengaturan naskah, jadwal, dan peserta asesmen." },
      { icon: <Activity size={19} />, title: "Penilaian dan hasil", description: "Pemeriksaan jawaban dan pemantauan hasil asesmen." },
    ]} />
  );
}
