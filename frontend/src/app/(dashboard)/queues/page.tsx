import { QueueBoard } from "@/components/queue/queue-board";

export default function QueuesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Queue System</h1>
        <p className="text-sm text-muted-foreground">Antrian realtime per poli, panggil ulang, lewati, selesai, dan voice calling.</p>
      </div>
      <QueueBoard />
    </div>
  );
}



