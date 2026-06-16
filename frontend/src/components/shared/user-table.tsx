"use client";

import { memo, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteUserPermanent, getUsers, type UserRow } from "@/services/user-service";
import { deleteResource, updateResource } from "@/services/resource-service";
import { FormModalShell } from "@/components/shared/form-action-modal";
import type { PaginatedResponse } from "@/types/api";

const PAGE_SIZE = 20;

export const UserTable = memo(function UserTable({ reloadKey = 0 }: { reloadKey?: number }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const deferredSearch = useDeferredValue(search);
  const queryClient = useQueryClient();

  const { data, error: queryError, isLoading } = useQuery({
    queryKey: ["users", page, PAGE_SIZE, deferredSearch, reloadKey],
    queryFn: () => getUsers({ page, limit: PAGE_SIZE, search: deferredSearch }),
    placeholderData: (previous) => previous
  });

  const usersData = Array.isArray(data) ? data : data?.items ?? [];
  const meta = Array.isArray(data) ? null : data?.meta ?? null;
  const loading = isLoading && !data;
  const loadError = error ?? (queryError ? "Tidak bisa memuat data user. Pastikan Anda login sebagai ADMIN." : null);

  useEffect(() => setPage(1), [deferredSearch]);

  const pageLabel = useMemo(() => {
    if (!meta) return `${usersData.length} user`;
    const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
    const to = Math.min(meta.page * meta.limit, meta.total);
    return `${from}-${to} dari ${meta.total} user`;
  }, [meta, usersData.length]);

  async function handleDeactivate(id: string) {
    if (!window.confirm("Nonaktifkan user ini?")) return;
    try {
      await deleteResource(`/users/${id}`);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch {
      setError("Gagal menonaktifkan user. Pastikan backend sudah direstart dan Anda login sebagai ADMIN.");
    }
  }

  async function handleDeletePermanent(id: string) {
    const confirmed = window.confirm("Hapus permanen user ini? Gunakan hanya untuk akun test yang belum punya data transaksi.");
    if (!confirmed) return;
    try {
      await deleteUserPermanent(id);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch {
      setError("Gagal menghapus permanen user. User mungkin masih punya relasi dokter/perawat/staff/pasien/audit log, atau akun yang sedang digunakan.");
    }
  }

  async function handleEdit(formData: FormData) {
    if (!editingUser) return;
    try {
      await updateResource(`/users/${editingUser.id}`, {
        name: String(formData.get("name")),
        email: String(formData.get("email")),
        phone: String(formData.get("phone") ?? ""),
        isActive: formData.get("isActive") === "true"
      });
      setEditingUser(null);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch {
      setError("Gagal memperbarui user. Pastikan email belum dipakai akun lain.");
    }
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a827e]" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama, email, telepon..." className="pl-9" />
          </div>
          <p className="text-sm text-[#6a746f]">{pageLabel}</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5}>Memuat user...</TableCell></TableRow>
            ) : loadError ? (
              <TableRow><TableCell colSpan={5} className="text-destructive">{loadError}</TableCell></TableRow>
            ) : usersData.length === 0 ? (
              <TableRow><TableCell colSpan={5}>Belum ada user.</TableCell></TableRow>
            ) : (
              usersData.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell><Badge variant="secondary">{user.role.name}</Badge></TableCell>
                  <TableCell><Badge variant={user.isActive ? "success" : "destructive"}>{user.isActive ? "Aktif" : "Nonaktif"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => setEditingUser(user)}>
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <button className="text-sm font-medium text-amber-700" onClick={() => handleDeactivate(user.id)}>Nonaktifkan</button>
                      <button className="text-sm font-medium text-red-600" onClick={() => handleDeletePermanent(user.id)}>Hapus Permanen</button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 border-t p-4">
            <Button type="button" variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>
              Sebelumnya
            </Button>
            <span className="text-sm text-[#6a746f]">Halaman {meta.page} / {meta.totalPages}</span>
            <Button type="button" variant="outline" disabled={page >= meta.totalPages || loading} onClick={() => setPage((value) => value + 1)}>
              Berikutnya
            </Button>
          </div>
        )}
      </div>

      <FormModalShell
        title="Edit User"
        description="Perbarui identitas akun. Role tetap diatur saat pembuatan akun agar hak akses tidak berubah tanpa sengaja."
        open={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        className="max-w-2xl"
      >
        {editingUser && (
          <form action={handleEdit} className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-[#4a5657]">Nama</span>
              <input name="name" defaultValue={editingUser.name} className="h-10 w-full rounded-md border border-[#c7c1b5] px-3 text-sm" required />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-[#4a5657]">Email</span>
              <input name="email" type="email" defaultValue={editingUser.email} className="h-10 w-full rounded-md border border-[#c7c1b5] px-3 text-sm" required />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-[#4a5657]">Telepon</span>
              <input name="phone" defaultValue={editingUser.phone ?? ""} className="h-10 w-full rounded-md border border-[#c7c1b5] px-3 text-sm" />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-[#4a5657]">Status</span>
              <select name="isActive" defaultValue={String(editingUser.isActive)} className="h-10 w-full rounded-md border border-[#c7c1b5] px-3 text-sm">
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
              </select>
            </label>
            <div className="flex justify-end gap-3 border-t pt-4 md:col-span-2">
              <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>Batal</Button>
              <Button type="submit">Simpan Perubahan</Button>
            </div>
          </form>
        )}
      </FormModalShell>
    </>
  );
});



