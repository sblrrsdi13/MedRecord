"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Activity, Database, Layers3, MoreHorizontal, Pencil, RefreshCw, Search, Sparkles, TableProperties, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormModalShell } from "@/components/shared/form-action-modal";
import { deleteResource, getResource, updateResource } from "@/services/resource-service";
import type { PaginatedResponse } from "@/types/api";
import { normalizeResourceName, RESOURCE_CHANGED_EVENT } from "@/utils/resource-events";
import { useResourceSocket } from "@/hooks/use-resource-socket";

const PAGE_SIZE = 25;

type Column = {
  key: string;
  label: string;
  headerClassName?: string;
  render?: (item: Record<string, unknown>) => ReactNode;
};

type ModulePageProps = {
  title: string;
  description: string;
  endpoint: string;
  columns: Column[];
  notes?: string[];
  deleteEndpoint?: string;
  editEndpoint?: string;
  editFields?: Array<{ key: string; label: string; type?: "text" | "number" | "boolean" }>;
  actionSlot?: ReactNode;
  rowActions?: Array<{
    label: string;
    icon?: ReactNode;
    onClick: (row: Record<string, unknown>) => void;
  }>;
};

function getValue(item: Record<string, unknown>, path: string) {
  return path.split(".").reduce<unknown>((value, key) => {
    if (!value || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[key];
  }, item);
}

function normalizeRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (payload && typeof payload === "object" && Array.isArray((payload as { items?: unknown[] }).items)) {
    return (payload as { items: Record<string, unknown>[] }).items;
  }
  if (payload && typeof payload === "object") return [payload as Record<string, unknown>];
  return [];
}

function normalizePaginatedRows(payload: unknown) {
  const rows = normalizeRows(payload);
  const maybeMeta = payload && typeof payload === "object" ? (payload as Partial<PaginatedResponse<Record<string, unknown>>>).meta : undefined;
  const meta = maybeMeta && typeof maybeMeta === "object"
    ? {
        page: Number(maybeMeta.page || 1),
        limit: Number(maybeMeta.limit || PAGE_SIZE),
        total: Number(maybeMeta.total || rows.length),
        totalPages: Number(maybeMeta.totalPages || 1)
      }
    : null;

  return { rows, meta };
}

function getModuleMeta(endpoint: string, title: string) {
  const normalized = endpoint.replace(/^\//, "");
  const meta: Record<string, { label: string; accent: string }> = {
    doctors: {
      label: "Master tenaga medis",
      accent: "from-[#5f7974] to-[#d7d2eb]"
    },
    polyclinics: {
      label: "Master layanan klinik",
      accent: "from-[#86a197] to-[#9aa9a2]"
    },
    "doctor-schedules": {
      label: "Pengaturan jadwal praktik",
      accent: "from-[#8d879f] to-[#9aa9a2]"
    },
    "medical-records": {
      label: "Dokumentasi klinis",
      accent: "from-[#5f7974] to-[#86a197]"
    },
    prescriptions: {
      label: "Terapi dan obat",
      accent: "from-[#9aa9a2] to-[#86a197]"
    },
    medicines: {
      label: "Inventori farmasi",
      accent: "from-[#5f7974] to-[#86a197]"
    },
    payments: {
      label: "Kasir klinik",
      accent: "from-[#5f7974] to-[#86a197]"
    },
    "vital-signs": {
      label: "Pemeriksaan awal",
      accent: "from-[#b78585] to-[#5f7974]"
    },
    reports: {
      label: "Analitik klinik",
      accent: "from-[#2a3234] to-[#5f7974]"
    },
    settings: {
      label: "Konfigurasi sistem",
      accent: "from-[#6a746f] to-[#9aa9a2]"
    }
  };

  return meta[normalized] ?? {
    label: title,
    accent: "from-[#5f7974] to-[#d7d2eb]"
  };
}

function inferStatus(row: Record<string, unknown>) {
  const raw = row.status ?? row.isActive;
  if (typeof raw === "boolean") return raw ? "Aktif" : "Nonaktif";
  if (typeof raw === "string") return raw;
  return "Tersimpan";
}

function getStatusVariant(status: string): "success" | "secondary" | "warning" | "destructive" | "default" {
  const value = status.toLowerCase();
  if (["aktif", "active", "paid", "completed", "selesai", "tersimpan"].includes(value)) return "success";
  if (["waiting", "called", "registered", "draft", "partial"].includes(value)) return "warning";
  if (["inactive", "nonaktif", "cancelled", "void", "failed"].includes(value)) return "destructive";
  return "secondary";
}

function formatCellValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Aktif" : "Nonaktif";
  if (typeof value === "number") return new Intl.NumberFormat("id-ID").format(value);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  }
  return String(value);
}

export function ModulePage({ title, description, endpoint, columns, notes = [], deleteEndpoint, editEndpoint, editFields = [], actionSlot, rowActions = [] }: ModulePageProps) {
  useResourceSocket();
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [page, setPage] = useState(1);
  const [serverMeta, setServerMeta] = useState<PaginatedResponse<Record<string, unknown>>["meta"] | null>(null);
  const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(null);
  const meta = getModuleMeta(endpoint, title);

  const load = useCallback(
    async () => {
      setLoading(true);
      setError(null);
      try {
        const payload = await getResource<unknown>(endpoint, {
          page,
          limit: PAGE_SIZE,
          search: deferredQuery.trim() || undefined
        });
        const normalized = normalizePaginatedRows(payload);
        setRows(normalized.rows);
        setServerMeta(normalized.meta);
      } catch {
        setError("Data belum dapat dimuat. Pastikan backend aktif dan Anda sudah login.");
      } finally {
        setLoading(false);
      }
    },
    [deferredQuery, endpoint, page]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    function handleResourceChanged(event: Event) {
      const detail = (event as CustomEvent<{ resource?: string }>).detail;
      if (detail?.resource && normalizeResourceName(detail.resource) === normalizeResourceName(endpoint)) {
        void load();
      }
    }

    window.addEventListener(RESOURCE_CHANGED_EVENT, handleResourceChanged);
    return () => window.removeEventListener(RESOURCE_CHANGED_EVENT, handleResourceChanged);
  }, [endpoint, load]);

  useEffect(() => {
    setPage(1);
  }, [endpoint, deferredQuery]);

  async function handleDelete(id: unknown) {
    if (!deleteEndpoint || typeof id !== "string") return;
    if (!window.confirm("Hapus data ini? Aksi ini tidak bisa dibatalkan.")) return;
    try {
      await deleteResource(`${deleteEndpoint}/${id}`);
      await load();
    } catch {
      setError("Gagal menghapus data. Data mungkin masih dipakai modul lain atau role Anda tidak memiliki akses.");
    }
  }

  async function handleEdit(formData: FormData) {
    if (!editingRow || !editEndpoint || typeof editingRow.id !== "string") return;
    const payload = editFields.reduce<Record<string, unknown>>((acc, field) => {
      const value = formData.get(field.key);
      if (field.type === "number") acc[field.key] = Number(value ?? 0);
      else if (field.type === "boolean") acc[field.key] = value === "true";
      else acc[field.key] = String(value ?? "");
      return acc;
    }, {});

    try {
      await updateResource(`${editEndpoint}/${editingRow.id}`, payload);
      setEditingRow(null);
      await load();
    } catch {
      setError("Gagal memperbarui data. Periksa format data atau pastikan data tidak bentrok dengan kode unik.");
    }
  }

  const searchableRows = useMemo(() => {
    return rows.map((row) => ({
      row,
      searchText: columns
        .map((column) => formatCellValue(getValue(row, column.key)))
        .concat(formatCellValue(inferStatus(row)))
        .join(" ")
        .toLowerCase()
    }));
  }, [columns, rows]);

  const filteredRows = useMemo(() => {
    if (serverMeta) return rows;
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return rows;
    return searchableRows.filter((item) => item.searchText.includes(q)).map((item) => item.row);
  }, [deferredQuery, rows, searchableRows, serverMeta]);

  const totalPages = serverMeta?.totalPages ?? Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = useMemo(() => {
    if (serverMeta) return filteredRows;
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredRows, serverMeta]);

  const activeCount = rows.filter((row) => row.isActive === true || row.status === "active" || row.status === "paid" || row.status === "completed").length;

  return (
    <div className="space-y-6">
      <section className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${meta.accent} p-6 text-white shadow-lg`}>
        <div className="absolute right-6 top-6 hidden h-32 w-32 rounded-full bg-white/10 blur-2xl md:block" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
              <Sparkles className="h-3.5 w-3.5" />
              {meta.label}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">{description}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 rounded-xl bg-white/12 p-3 ring-1 ring-white/20 backdrop-blur">
            <Metric icon={Database} label="Total" value={String(rows.length)} />
            <Metric icon={Activity} label="Aktif" value={String(activeCount)} />
            <Metric icon={TableProperties} label="Tampil" value={String(filteredRows.length)} />
          </div>
        </div>
      </section>

      <section>
        <Card className="border-[#c7c1b5]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers3 className="h-5 w-5 text-[#5f7974]" />
              Catatan Modul
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(notes.length > 0 ? notes : ["Gunakan tombol tambah di atas halaman untuk input data.", "Data yang sudah dipakai modul lain mungkin tidak bisa dihapus.", "Gunakan refresh setelah menyimpan data baru."]).map((note) => (
              <div key={note} className="rounded-lg bg-[#faf8ef] p-3 text-sm text-[#4a5657]">{note}</div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card className="border-[#c7c1b5]">
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Detail Data</CardTitle>
            <CardDescription>Gunakan pencarian untuk mempersempit data tanpa kehilangan konteks modul.</CardDescription>
          </div>
          <div className="relative w-full xl:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a827e]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-10 w-full rounded-md border border-[#c7c1b5] bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#5f7974] focus:ring-2 focus:ring-[#5f7974]/15"
              placeholder="Cari data..."
              type="search"
            />
          </div>
          {actionSlot && <div className="min-w-0 shrink-0 sm:[&>*]:w-auto [&>*]:w-full">{actionSlot}</div>}
        </CardHeader>
        <CardContent>
          <div className="max-h-[620px] overflow-auto rounded-xl border border-[#c7c1b5] bg-white shadow-sm">
            <Table className="min-w-[860px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">No</TableHead>
                  {columns.map((column) => <TableHead key={column.key} className={column.headerClassName}>{column.label}</TableHead>)}
                  <TableHead>Status</TableHead>
                  {(deleteEndpoint || editEndpoint || rowActions.length > 0) && <TableHead className="w-32 text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={columns.length + 2 + (deleteEndpoint || editEndpoint || rowActions.length > 0 ? 1 : 0)}>Memuat data...</TableCell></TableRow>
                ) : error ? (
                  <TableRow><TableCell colSpan={columns.length + 2 + (deleteEndpoint || editEndpoint || rowActions.length > 0 ? 1 : 0)} className="text-destructive">{error}</TableCell></TableRow>
                ) : filteredRows.length === 0 ? (
                  <TableRow><TableCell colSpan={columns.length + 2 + (deleteEndpoint || editEndpoint || rowActions.length > 0 ? 1 : 0)}>Belum ada data.</TableCell></TableRow>
                ) : (
                  paginatedRows.map((row, index) => (
                    <TableRow key={String(row.id ?? index)}>
                      <TableCell className="text-center">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#faf8ef] text-xs font-bold text-[#5f7974]">
                          {(currentPage - 1) * PAGE_SIZE + index + 1}
                        </span>
                      </TableCell>
                      {columns.map((column, columnIndex) => {
                        const rawValue = getValue(row, column.key);
                        const content = column.render
                          ? column.render(row)
                          : typeof rawValue === "boolean"
                            ? <Badge variant={rawValue ? "success" : "secondary"}>{rawValue ? "Aktif" : "Nonaktif"}</Badge>
                            : formatCellValue(rawValue);
                        return (
                          <TableCell key={column.key} className={columnIndex === 0 ? "font-semibold" : ""}>
                            {columnIndex === 0 && !column.render ? (
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e6efe5] text-xs font-bold text-[#5f7974]">
                                  {String(content).slice(0, 2).toUpperCase()}
                                </div>
                                <span className="min-w-0 truncate">{content}</span>
                              </div>
                            ) : content}
                          </TableCell>
                        );
                      })}
                      <TableCell>
                        <Badge variant={getStatusVariant(inferStatus(row))}>{inferStatus(row)}</Badge>
                      </TableCell>
                      {(deleteEndpoint || editEndpoint || rowActions.length > 0) && (
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-1 rounded-lg border border-[#c7c1b5] bg-white p-1 shadow-sm">
                            <Button variant="ghost" size="icon" aria-label="Detail data">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            {rowActions.map((action) => (
                              <Button key={action.label} variant="outline" size="icon" aria-label={action.label} onClick={() => action.onClick(row)}>
                                {action.icon ?? action.label.slice(0, 1)}
                              </Button>
                            ))}
                            {editEndpoint && (
                              <Button variant="outline" size="icon" aria-label="Edit data" onClick={() => setEditingRow(row)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {deleteEndpoint && (
                              <Button variant="destructive" size="icon" aria-label="Hapus data" onClick={() => handleDelete(row.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {(serverMeta ? serverMeta.total > PAGE_SIZE : filteredRows.length > PAGE_SIZE) && (
            <div className="mt-4 flex flex-col gap-3 text-sm text-[#4a5657] sm:flex-row sm:items-center sm:justify-between">
              <span>
                Menampilkan {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, serverMeta?.total ?? filteredRows.length)} dari {serverMeta?.total ?? filteredRows.length} data
              </span>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                  Sebelumnya
                </Button>
                <span className="rounded-xl border border-[#c7c1b5] bg-[#faf8ef] px-3 py-2 text-xs font-semibold">
                  {currentPage} / {totalPages}
                </span>
                <Button type="button" variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
                  Berikutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <FormModalShell
        title={`Edit ${title}`}
        description="Perbarui field yang memang didukung oleh modul ini."
        open={Boolean(editingRow)}
        onClose={() => setEditingRow(null)}
        className="max-w-2xl"
      >
        {editingRow && (
          <form action={handleEdit} className="grid gap-4 md:grid-cols-2">
            {editFields.map((field) => (
              <label key={field.key} className="space-y-1.5">
                <span className="text-xs font-semibold text-[#4a5657]">{field.label}</span>
                {field.type === "boolean" ? (
                  <select name={field.key} defaultValue={String(Boolean(editingRow[field.key]))} className="h-10 w-full rounded-md border border-[#c7c1b5] bg-white px-3 text-sm">
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                ) : (
                  <input
                    name={field.key}
                    type={field.type ?? "text"}
                    defaultValue={String(editingRow[field.key] ?? "")}
                    className="h-10 w-full rounded-md border border-[#c7c1b5] bg-white px-3 text-sm outline-none focus:border-[#5f7974] focus:ring-2 focus:ring-[#5f7974]/15"
                  />
                )}
              </label>
            ))}
            <div className="flex justify-end gap-3 border-t pt-4 md:col-span-2">
              <Button type="button" variant="outline" onClick={() => setEditingRow(null)}>Batal</Button>
              <Button type="submit">Simpan Perubahan</Button>
            </div>
          </form>
        )}
      </FormModalShell>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Database; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/10 p-3">
      <Icon className="mb-2 h-4 w-4 text-white/75" />
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-white/65">{label}</p>
    </div>
  );
}



