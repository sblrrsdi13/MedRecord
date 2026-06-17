"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CalendarDays, IdCard, MoreHorizontal, Pencil, Phone, Search, Trash2, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PatientForm } from "@/components/forms/patient-form";
import { FormModalShell } from "@/components/shared/form-action-modal";
import { useDebounce } from "@/hooks/use-debounce";
import { getPatients } from "@/features/patients/services/patient-service";
import { deleteResource } from "@/features/resources/services/resource-service";
import type { Patient } from "@/types/api";

export function PatientTable({ actionSlot }: { actionSlot?: ReactNode }) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  async function reload() {
    const data = await getPatients({ page: 1, search: debouncedSearch || undefined });
    setPatients(data.items);
  }

  useEffect(() => {
    setLoading(true);
    setError(null);
    reload()
      .catch(() => setError("Data pasien belum dapat dimuat. Pastikan Anda login dengan role yang sesuai."))
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  async function handleDelete(id: string) {
    if (!window.confirm("Hapus pasien ini?")) return;
    try {
      await deleteResource(`/patients/${id}`);
      await reload();
    } catch {
      setError("Gagal menghapus pasien. Data mungkin masih dipakai kunjungan atau role Anda tidak punya akses.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#c7c1b5] bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#c7c1b5] bg-[#faf8ef]/70 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold text-[#2a3234]">Direktori Pasien</h2>
            <p className="text-sm text-[#6a746f]">Menampilkan {patients.length} pasien dari hasil pencarian aktif.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row md:max-w-xl">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a827e]" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama, NIK, atau nomor RM" className="pl-9" />
            </div>
            {actionSlot && <div className="shrink-0">{actionSlot}</div>}
          </div>
        </div>

        <div className="max-h-[640px] overflow-auto">
        <Table className="min-w-[980px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">No</TableHead>
              <TableHead className="min-w-[260px]">Identitas Pasien</TableHead>
              <TableHead>NIK</TableHead>
              <TableHead>Demografi</TableHead>
              <TableHead>Kontak</TableHead>
              <TableHead>Catatan Klinis</TableHead>
              <TableHead className="w-28 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7}>Memuat data pasien...</TableCell></TableRow>
            ) : error ? (
              <TableRow><TableCell colSpan={7} className="text-destructive">{error}</TableCell></TableRow>
            ) : patients.length === 0 ? (
              <TableRow><TableCell colSpan={7}>Belum ada data pasien.</TableCell></TableRow>
            ) : (
              patients.map((patient, index) => (
                <TableRow key={patient.id}>
                  <TableCell className="text-center">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#faf8ef] text-xs font-bold text-[#5f7974]">
                      {index + 1}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e6efe5] font-bold text-[#5f7974]">
                        {patient.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#2a3234]">{patient.name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#6a746f]">
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#e6efe5] px-2 py-1 font-mono font-semibold text-[#5f7974]">
                            <IdCard className="h-3 w-3" />
                            {patient.patientCode ?? patient.id}
                          </span>
                          {patient.medicalRecordNo ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#faf8ef] px-2 py-1 font-mono">
                              <IdCard className="h-3 w-3" />
                              {patient.medicalRecordNo}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#f3efe2] px-2 py-1 text-[#6a746f]">
                              <IdCard className="h-3 w-3" />
                              Belum ada RM
                            </span>
                          )}
                          {patient.userId && <Badge variant="success">Portal aktif</Badge>}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs">{patient.nik ?? "-"}</div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <Badge variant="secondary">{patient.gender === "MALE" ? "Laki-laki" : "Perempuan"}</Badge>
                      <p className="flex items-center gap-1 text-xs text-[#6a746f]">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(patient.birthDate))}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <p className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-[#7a827e]" />
                        {patient.phone ?? "-"}
                      </p>
                      <p className="line-clamp-1 text-xs text-[#6a746f]">{patient.address ?? "Alamat belum diisi"}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {patient.allergyNotes ? (
                      <Badge variant="warning">{patient.allergyNotes}</Badge>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-[#6a746f]">
                        <UserRound className="h-3.5 w-3.5" />
                        Tidak ada catatan
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1 rounded-lg border border-[#c7c1b5] bg-white p-1 shadow-sm">
                      <Button variant="ghost" size="icon" aria-label="Detail pasien">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" aria-label="Edit pasien" onClick={() => setEditingPatient(patient)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" aria-label="Hapus pasien" onClick={() => handleDelete(patient.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>
      <FormModalShell
        title="Edit Data Pasien"
        description="Perbaiki identitas, kontak, akun portal, atau catatan klinis pasien."
        open={Boolean(editingPatient)}
        onClose={() => setEditingPatient(null)}
        className="max-w-4xl"
      >
        {editingPatient && (
          <PatientForm
            initialPatient={editingPatient}
            onSaved={async () => {
              await reload();
              setEditingPatient(null);
            }}
          />
        )}
      </FormModalShell>
    </div>
  );
}



