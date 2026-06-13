"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteUserPermanent, getUsers, type UserRow } from "@/services/user-service";
import { deleteResource, updateResource } from "@/services/resource-service";
import { FormModalShell } from "@/components/shared/form-action-modal";

export function UserTable({ reloadKey = 0 }: { reloadKey?: number }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);

  useEffect(() => {
    setError(null);
    getUsers()
      .then(setUsers)
      .catch(() => setError("Tidak bisa memuat data user. Pastikan Anda login sebagai ADMIN."))
      .finally(() => setLoading(false));
  }, [reloadKey]);

  async function handleDeactivate(id: string) {
    if (!window.confirm("Nonaktifkan user ini?")) return;
    try {
      await deleteResource(`/users/${id}`);
      setUsers(await getUsers());
    } catch {
      setError("Gagal menonaktifkan user. Pastikan backend sudah direstart dan Anda login sebagai ADMIN.");
    }
  }

  async function handleDeletePermanent(id: string) {
    const confirmed = window.confirm("Hapus permanen user ini? Gunakan hanya untuk akun test yang belum punya data transaksi.");
    if (!confirmed) return;
    try {
      await deleteUserPermanent(id);
      setUsers(await getUsers());
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
      setUsers(await getUsers());
    } catch {
      setError("Gagal memperbarui user. Pastikan email belum dipakai akun lain.");
    }
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border bg-white">
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
            ) : error ? (
              <TableRow><TableCell colSpan={5} className="text-destructive">{error}</TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={5}>Belum ada user.</TableCell></TableRow>
            ) : (
              users.map((user) => (
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
}



