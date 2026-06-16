import { HeartPulse } from "lucide-react";

export function PageLoading({ label = "Memuat halaman..." }: { label?: string }) {
  return (
    <main className="grid min-h-[60dvh] place-items-center px-4 py-10">
      <section className="soft-panel w-full max-w-md rounded-3xl p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e6efe5] text-[#5f7974] shadow-inner">
          <HeartPulse className="h-7 w-7 animate-pulse" />
        </div>
        <p className="mt-4 text-sm font-bold text-[#2a3234]">{label}</p>
        <div className="mt-5 grid gap-2">
          <div className="mx-auto h-3 w-4/5 animate-pulse rounded-full bg-[#dfe9df]" />
          <div className="mx-auto h-3 w-2/3 animate-pulse rounded-full bg-[#eef1e8]" />
        </div>
      </section>
    </main>
  );
}
