"use client";

import { useState } from "react";
import { RegisterUserForm } from "@/components/forms/register-user-form";
import { FormActionModal } from "@/components/shared/form-action-modal";
import { UserTable } from "@/components/shared/user-table";

export function UserManagementView() {
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">User & Role Management</h1>
          <p className="text-sm text-muted-foreground">
            Kelola akun, status user, dan pembuatan akun staff/dokter dalam satu tempat.
          </p>
        </div>
        <FormActionModal title="Data User Baru" description="Gunakan email unik dan password awal yang kuat." triggerLabel="Tambah User">
          <RegisterUserForm onSuccess={() => setReloadKey((value) => value + 1)} />
        </FormActionModal>
      </div>

      <UserTable reloadKey={reloadKey} />
    </div>
  );
}
