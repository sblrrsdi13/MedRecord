"use client";

import { useEffect, useState } from "react";
import { Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnnouncementCard } from "@/components/ui/announcement-card";
import { createAnnouncement, deleteAnnouncement, getAnnouncements, updateAnnouncement, type AnnouncementItem } from "@/features/announcements/services/announcement-service";
import { FormModalShell } from "@/components/shared/form-action-modal";

const categories: Array<{ value: AnnouncementItem["category"]; label: string }> = [
  { value: "info", label: "Informasi" },
  { value: "education", label: "Edukasi" },
  { value: "warning", label: "Peringatan" },
  { value: "promo", label: "Promo" }
];

function formatAnnouncementDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export default function AnnouncementsPage() {
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AnnouncementItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      setItems(await getAnnouncements());
    } catch {
      setError("Konten portal pasien belum dapat dimuat.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(formData: FormData) {
    setError(null);
    const payload = {
      title: String(formData.get("title") ?? "").trim(),
      content: String(formData.get("content") ?? "").trim(),
      category: String(formData.get("category")) as AnnouncementItem["category"],
      isActive: formData.get("isActive") === "true"
    };

    if (payload.title.length < 3) {
      setError("Judul minimal 3 karakter.");
      return;
    }

    if (payload.content.length < 5) {
      setError("Isi konten minimal 5 karakter.");
      return;
    }

    try {
      if (editing) await updateAnnouncement(editing.id, payload);
      else await createAnnouncement(payload);

      setOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      setError(getAnnouncementErrorMessage(err));
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Hapus konten portal pasien ini?")) return;
    await deleteAnnouncement(id);
    await load();
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#5f7974] via-[#86a197] to-[#9bb8a5] p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
              <Megaphone className="h-3.5 w-3.5" />
              Konten portal pasien
            </div>
            <h1 className="text-2xl font-bold md:text-3xl">Pengumuman & Edukasi Pasien</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">Kelola informasi, pengumuman, dan edukasi yang tampil di tab Beranda portal pasien.</p>
          </div>
          <Button type="button" onClick={() => { setEditing(null); setOpen(true); }} className="w-fit bg-white text-[#5f7974] hover:bg-[#e6efe5]">
            <Plus className="h-4 w-4" />
            Tambah Konten
          </Button>
        </div>
      </section>

      {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <section className="grid gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <AnnouncementCard
            key={item.id}
            item={item}
            dateLabel={formatAnnouncementDate(item.createdAt)}
            authorLabel={item.author?.name ?? item.author?.email ?? "Klinik"}
            showStatus
            actions={
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => { setEditing(item); setOpen(true); }}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button type="button" variant="destructive" size="sm" onClick={() => remove(item.id)}>
                  <Trash2 className="h-4 w-4" />
                  Hapus
                </Button>
              </>
            }
          />
        ))}
        {items.length === 0 && <div className="rounded-2xl border border-dashed border-[#c7c1b5] bg-white p-8 text-center text-sm text-[#6a746f]">Belum ada konten portal pasien.</div>}
      </section>

      <FormModalShell
        title={editing ? "Edit Konten" : "Tambah Konten"}
        description="Konten aktif akan tampil di Beranda portal pasien."
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        className="max-w-3xl"
      >
        <form action={submit} className="space-y-4">
          <label className="space-y-1.5 block">
            <span className="text-xs font-semibold text-[#4a5657]">Judul</span>
            <input name="title" defaultValue={editing?.title ?? ""} className="h-10 w-full rounded-md border border-[#c7c1b5] px-3 text-sm" required />
          </label>
          <label className="space-y-1.5 block">
            <span className="text-xs font-semibold text-[#4a5657]">Kategori</span>
            <select name="category" defaultValue={editing?.category ?? "info"} className="h-10 w-full rounded-md border border-[#c7c1b5] px-3 text-sm">
              {categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 block">
            <span className="text-xs font-semibold text-[#4a5657]">Isi Konten</span>
            <textarea name="content" defaultValue={editing?.content ?? ""} className="min-h-36 w-full rounded-md border border-[#c7c1b5] px-3 py-2 text-sm" required />
          </label>
          <label className="space-y-1.5 block">
            <span className="text-xs font-semibold text-[#4a5657]">Status</span>
            <select name="isActive" defaultValue={String(editing?.isActive ?? true)} className="h-10 w-full rounded-md border border-[#c7c1b5] px-3 text-sm">
              <option value="true">Aktif</option>
              <option value="false">Draft</option>
            </select>
          </label>
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => { setOpen(false); setEditing(null); }}>Batal</Button>
            <Button type="submit">Simpan Konten</Button>
          </div>
        </form>
      </FormModalShell>
    </div>
  );
}

function getAnnouncementErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === "string"
  ) {
    return (error as { response: { data: { message: string } } }).response.data.message;
  }

  return "Gagal menyimpan konten. Pastikan judul minimal 3 karakter dan isi konten minimal 5 karakter.";
}



