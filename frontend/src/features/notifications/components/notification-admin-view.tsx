"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getResource } from "@/features/resources/services/resource-service";
import { sendNotification } from "@/features/notifications/services/notification-service";
import type { RoleName } from "@/types/api";

type UserRow = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  role: { name: RoleName };
};

const roles: Array<{ value: RoleName; label: string }> = [
  { value: "ADMIN", label: "Admin" },
  { value: "RECEPTIONIST", label: "Receptionist" },
  { value: "NURSE", label: "Nurse" },
  { value: "DOCTOR", label: "Doctor" },
  { value: "PHARMACY", label: "Pharmacy" },
  { value: "CASHIER", label: "Cashier" },
  { value: "PATIENT", label: "Patient" }
];

export function NotificationAdminView() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [scope, setScope] = useState<"all" | "role" | "user">("all");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getResource<UserRow[]>("/users").then(setUsers).catch(() => setUsers([]));
  }, []);

  const activeUsers = useMemo(() => users.filter((user) => user.isActive), [users]);

  async function onSubmit(formData: FormData) {
    setMessage(null);
    setError(null);

    const targetRole = String(formData.get("targetRole") || "") as RoleName;
    const recipientId = String(formData.get("recipientId") || "");

    try {
      const result = await sendNotification({
        title: String(formData.get("title")),
        message: String(formData.get("message")),
        type: String(formData.get("type")) as "info" | "success" | "warning" | "danger",
        ...(scope === "role" && targetRole ? { targetRole } : {}),
        ...(scope === "user" && recipientId ? { recipientId } : {})
      });
      setMessage(`Notifikasi berhasil dikirim ke ${result.sent} user.`);
    } catch {
      setError("Gagal mengirim notifikasi. Pastikan data lengkap dan role Anda memiliki akses.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Notifikasi</h1>
        <p className="text-sm text-muted-foreground">Kirim notifikasi in-app untuk semua user, role tertentu, atau satu user. Label pengirim dibedakan antara Admin dan Operasional.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Kirim Notifikasi
          </CardTitle>
          <CardDescription>Notifikasi akan muncul di icon bell pada topbar penerima.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={onSubmit} className="grid gap-4 md:grid-cols-2">
            <Input name="title" placeholder="Judul notifikasi" required />
            <select name="type" className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue="info">
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="danger">Danger</option>
            </select>

            <select value={scope} onChange={(event) => setScope(event.target.value as "all" | "role" | "user")} className="h-10 rounded-md border bg-background px-3 text-sm">
              <option value="all">Semua user aktif</option>
              <option value="role">Role tertentu</option>
              <option value="user">User tertentu</option>
            </select>

            {scope === "role" && (
              <select name="targetRole" className="h-10 rounded-md border bg-background px-3 text-sm" required>
                {roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
              </select>
            )}

            {scope === "user" && (
              <select name="recipientId" className="h-10 rounded-md border bg-background px-3 text-sm" required>
                <option value="">Pilih user</option>
                {activeUsers.map((user) => <option key={user.id} value={user.id}>{user.name} - {user.role.name}</option>)}
              </select>
            )}

            <textarea name="message" placeholder="Isi pesan notifikasi" className="min-h-32 rounded-md border bg-background px-3 py-2 text-sm md:col-span-2" required />

            {message && <p className="text-sm text-[#5f7974] md:col-span-2">{message}</p>}
            {error && <p className="text-sm text-destructive md:col-span-2">{error}</p>}

            <Button type="submit" className="md:w-fit">
              <Send className="h-4 w-4" />
              Kirim Notifikasi
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}



