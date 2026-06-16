import dynamic from "next/dynamic";

const DashboardView = dynamic(() => import("@/components/dashboard/dashboard-view").then((mod) => mod.DashboardView), {
  loading: () => <div className="soft-panel rounded-2xl p-6 text-sm text-[#4a5657]">Memuat dashboard...</div>
});

export default function DashboardPage() {
  return <DashboardView />;
}



