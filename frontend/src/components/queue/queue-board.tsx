"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, MonitorUp, Megaphone, RotateCcw, SkipForward, Volume2, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QueueCreateForm } from "@/components/forms/queue-create-form";
import { FormActionModal } from "@/components/shared/form-action-modal";
import { useQueueSocket } from "@/hooks/use-queue-socket";
import { callQueue, cancelQueue, completeQueue, getQueues, recallQueue, skipQueue } from "@/services/queue-service";
import type { QueueItem, QueueStatus } from "@/types/api";

const statusVariant: Record<QueueStatus, "secondary" | "success" | "warning" | "destructive" | "default"> = {
  waiting: "secondary",
  called: "warning",
  in_progress: "default",
  skipped: "destructive",
  completed: "success",
  cancelled: "destructive"
};

export function QueueBoard() {
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState("");
  const [voiceRate, setVoiceRate] = useState(0.85);

  const fetchQueues = useCallback(() => {
    setLoading(true);
    getQueues({ page: 1 })
      .then((data) => setQueues(data.items))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => fetchQueues(), [fetchQueues]);
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const voiceOptions = useMemo(() => ({ voiceURI, rate: voiceRate, pitch: 1 }), [voiceURI, voiceRate]);
  useQueueSocket({ onUpdated: fetchQueues, voice: true, voiceOptions });

  async function action(fn: (id: string) => Promise<QueueItem>, id: string) {
    await fn(id);
    fetchQueues();
  }

  const waitingCount = queues.filter((item) => item.status === "waiting").length;
  const calledQueue = queues.find((item) => item.status === "called");
  const activeCount = queues.filter((item) => item.status === "waiting" || item.status === "called" || item.status === "in_progress").length;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#5f7974] via-[#86a197] to-[#9aa9a2] p-6 text-white shadow-lg">
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
              <MonitorUp className="h-3.5 w-3.5" />
              Realtime queue control
            </div>
            <h1 className="text-2xl font-bold md:text-3xl">Antrian Klinik</h1>
            <p className="mt-2 text-sm leading-6 text-white/80">Panggil, ulangi, lewati, dan selesaikan antrian per poli. TV display dan voice call mengikuti status antrian aktif.</p>
          </div>
        <FormActionModal title="Buat Antrian" description="Pilih pasien, kunjungan, dan poli untuk membuat nomor antrian." triggerLabel="Tambah Antrian">
          <QueueCreateForm onCreated={fetchQueues} />
        </FormActionModal>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <QueueMetric icon={UsersRound} label="Antrian Aktif" value={String(activeCount)} />
        <QueueMetric icon={Megaphone} label="Menunggu" value={String(waitingCount)} />
        <QueueMetric icon={MonitorUp} label="Dipanggil" value={calledQueue?.queueNumber ?? "-"} />
      </section>

      <section className="min-w-0 overflow-hidden rounded-xl border border-[#c7c1b5] bg-white p-4 shadow-sm">
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,520px)] xl:items-center">
          <div className="flex min-w-0 items-start gap-3 sm:items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e6efe5] text-[#5f7974]">
              <Volume2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[#2a3234]">Suara pemanggil antrian</p>
              <p className="text-sm text-[#6a746f]">Pilih voice browser untuk kalimat panggilan di TV display.</p>
            </div>
          </div>
          <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(130px,160px)]">
            <select value={voiceURI} onChange={(event) => setVoiceURI(event.target.value)} className="h-10 min-w-0 w-full rounded-md border border-[#c7c1b5] bg-white px-3 text-sm">
              <option value="">Otomatis Bahasa Indonesia</option>
              {voices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
            <select value={voiceRate} onChange={(event) => setVoiceRate(Number(event.target.value))} className="h-10 min-w-0 w-full rounded-md border border-[#c7c1b5] bg-white px-3 text-sm">
              <option value={0.75}>Lebih lambat</option>
              <option value={0.85}>Normal</option>
              <option value={1}>Lebih cepat</option>
            </select>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
      <Card>
        <CardHeader>
          <CardTitle>Daftar Antrian Hari Ini</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat antrian...</p>
          ) : queues.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada antrian hari ini.</p>
          ) : (
            queues.map((queue) => (
              <div key={queue.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-mono text-2xl font-semibold text-primary">{queue.queueNumber}</p>
                    <Badge variant={statusVariant[queue.status]}>{queue.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{queue.polyclinic.name} • {queue.patient?.name ?? "Pasien walk-in"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => action(callQueue, queue.id)}><Megaphone className="h-4 w-4" />Panggil</Button>
                  <Button size="sm" variant="outline" onClick={() => action(recallQueue, queue.id)}><RotateCcw className="h-4 w-4" />Ulang</Button>
                  <Button size="sm" variant="outline" onClick={() => action(skipQueue, queue.id)}><SkipForward className="h-4 w-4" />Lewati</Button>
                  <Button size="sm" variant="outline" onClick={() => action(completeQueue, queue.id)}><Check className="h-4 w-4" />Selesai</Button>
                  <Button size="sm" variant="destructive" onClick={() => action(cancelQueue, queue.id)}>Hapus</Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>TV Display</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-primary p-6 text-primary-foreground">
            <p className="text-sm opacity-80">Sedang dipanggil</p>
            <p className="mt-2 font-mono text-5xl font-bold">{queues.find((item) => item.status === "called")?.queueNumber ?? "-"}</p>
            <p className="mt-3 text-sm">{queues.find((item) => item.status === "called")?.polyclinic.name ?? "Menunggu panggilan"}</p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

function QueueMetric({ icon: Icon, label, value }: { icon: typeof UsersRound; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-[#c7c1b5] bg-white p-5 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#e6efe5] text-[#5f7974]">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.05em] text-[#6a746f]">{label}</p>
        <p className="mt-1 text-2xl font-bold text-[#2a3234]">{value}</p>
      </div>
    </div>
  );
}



