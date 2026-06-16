import dynamic from "next/dynamic";

const PatientPortalView = dynamic(() => import("@/components/patient-portal/patient-portal-view").then((mod) => mod.PatientPortalView), {
  loading: () => <div className="theme-surface min-h-screen p-6 text-sm text-[#4a5657]">Memuat portal pasien...</div>
});

export default function PatientPortalPage() {
  return <PatientPortalView />;
}



