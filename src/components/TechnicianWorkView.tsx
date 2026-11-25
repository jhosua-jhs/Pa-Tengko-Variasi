import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Minus,
  Package,
  Plus,
  Trash2,
  Wrench,
} from 'lucide-react';
import { BookingJob, InventoryItem, JobStatus, UsedComponent } from '../types/erp';
import { formatRupiah, validateComponentSelections } from '../utils/erpLogic';
import { ConfirmModal } from './ConfirmModal';
import { JobStatusBadge } from './StatusBadge';

interface TechnicianWorkViewProps {
  bookings: BookingJob[];
  inventory: InventoryItem[];
  selectedJobId: string | null;
  onSelectJob: (jobId: string) => void;
  onSaveDraft: (jobId: string, catatan: string, komponen: UsedComponent[]) => void;
  onAdvanceStatus: (
    jobId: string,
    nextStatus: JobStatus,
    catatan: string,
    komponen: UsedComponent[]
  ) => void;
}

// Modul 3: Detail & Update Pengerjaan khusus Teknisi
export function TechnicianWorkView({
  bookings,
  inventory,
  selectedJobId,
  onSelectJob,
  onSaveDraft,
  onAdvanceStatus,
}: TechnicianWorkViewProps) {
  const activeJob = useMemo(() => {
    return (
      bookings.find((b) => b.id === selectedJobId) ??
      bookings.find((b) => b.status !== 'Selesai') ??
      bookings[0] ??
      null
    );
  }, [bookings, selectedJobId]);

  const [catatan, setCatatan] = useState(activeJob?.catatan ?? '');
  const [selectedComponents, setSelectedComponents] = useState<UsedComponent[]>(
    activeJob?.komponenDipakai ?? []
  );
  const [itemToAddId, setItemToAddId] = useState('');
  const [confirmTargetStatus, setConfirmTargetStatus] = useState<JobStatus | null>(
    null
  );

  // Sinkronkan form saat teknisi berpindah kendaraan
  useEffect(() => {
    if (activeJob) {
      setCatatan(activeJob.catatan);
      setSelectedComponents(activeJob.komponenDipakai);
      setItemToAddId('');
    }
  }, [activeJob]);

  const availableItems = useMemo(
    () => inventory.filter((item) => item.stok > 0),
    [inventory]
  );

  const inventoryMap = useMemo(
    () => new Map(inventory.map((i) => [i.id, i])),
    [inventory]
  );

  const validation = useMemo(
    () => validateComponentSelections(selectedComponents, inventory),
    [inventory, selectedComponents]
  );

  const handleAddComponent = (itemId: string) => {
    const stockItem = inventoryMap.get(itemId);
    if (!stockItem || stockItem.stok <= 0) return;

    setSelectedComponents((prev) => {
      const existing = prev.find((c) => c.itemId === itemId);
      if (existing) {
        const nextQty = Math.min(stockItem.stok, existing.qty + 1);
        return prev.map((c) => (c.itemId === itemId ? { ...c, qty: nextQty } : c));
      }
      return [
        ...prev,
        {
          itemId: stockItem.id,
          namaBarang: stockItem.namaBarang,
          qty: 1,
          hargaSatuan: stockItem.hargaJual,
          hargaBeliSatuan: stockItem.hargaBeli,
        },
      ];
    });
    setItemToAddId('');
  };

  const handleUpdateQty = (itemId: string, delta: number) => {
    const stockItem = inventoryMap.get(itemId);
    const maxStock = stockItem?.stok ?? 99;
    setSelectedComponents((prev) =>
      prev.map((c) => {
        if (c.itemId !== itemId) return c;
        const nextQty = Math.max(1, Math.min(maxStock, c.qty + delta));
        return { ...c, qty: nextQty };
      })
    );
  };

  const handleDirectQtyChange = (itemId: string, raw: string) => {
    const num = parseInt(raw, 10);
    setSelectedComponents((prev) =>
      prev.map((c) =>
        c.itemId === itemId ? { ...c, qty: Number.isNaN(num) ? 1 : num } : c
      )
    );
  };

  const handleRemoveComponent = (itemId: string) => {
    setSelectedComponents((prev) => prev.filter((c) => c.itemId !== itemId));
  };

  const nextStatusFor = (status: JobStatus): JobStatus | null => {
    if (status === 'Menunggu') return 'Dikerjakan';
    if (status === 'Dikerjakan') return 'Selesai';
    return null;
  };

  if (!activeJob) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <Wrench className="mx-auto h-8 w-8 text-slate-400" />
        <h2 className="mt-3 text-base font-semibold text-slate-900">
          Belum ada pekerjaan teknisi
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Antrean kendaraan yang masuk akan muncul di sini.
        </p>
      </div>
    );
  }

  const nextStatus = nextStatusFor(activeJob.status);
  const isCompleted = activeJob.status === 'Selesai';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
          Detail & Update Pengerjaan
        </h1>
        <p className="mt-0.5 text-sm text-slate-600">
          Pilih kendaraan, catat komponen terpakai, dan perbarui status secara berurutan.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Daftar Tugas Teknisi */}
        <div className="lg:col-span-4 space-y-2.5">
          <h2 className="text-sm font-semibold text-slate-700">
            Antrean Pengerjaan ({bookings.length})
          </h2>
          <div className="space-y-2">
            {bookings.map((job) => {
              const selected = job.id === activeJob.id;
              return (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => onSelectJob(job.id)}
                  className={`flex w-full flex-col gap-1.5 rounded-xl border p-3.5 text-left transition-colors ${
                    selected
                      ? 'border-orange-600 bg-orange-50/50 ring-1 ring-orange-600/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {job.noAntrean} · {job.platNomor}
                    </span>
                    <JobStatusBadge status={job.status} />
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    {job.namaPelanggan}
                  </div>
                  <div className="text-xs text-slate-600">
                    {job.tipeKendaraan} · {job.layanan}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel Detail Pengerjaan */}
        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-6">
            {/* Ringkasan Kendaraan */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono font-bold text-slate-900">
                    {activeJob.noAntrean}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{activeJob.slotWaktu} WITA</span>
                </div>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {activeJob.platNomor} — {activeJob.tipeKendaraan}
                </h2>
                <p className="text-sm text-slate-600">
                  Pelanggan: <strong className="text-slate-900">{activeJob.namaPelanggan}</strong> ({activeJob.noTelepon})
                </p>
                <p className="mt-1 text-sm font-medium text-orange-700">
                  Layanan: {activeJob.layanan}
                </p>
              </div>
              <JobStatusBadge status={activeJob.status} />
            </div>

            {/* Indikator Alur Status Berurutan */}
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center text-xs font-semibold">
              {(['Menunggu', 'Dikerjakan', 'Selesai'] as JobStatus[]).map((step, i) => {
                const isCurrent = activeJob.status === step;
                const passed =
                  (activeJob.status === 'Dikerjakan' && i === 0) ||
                  (activeJob.status === 'Selesai' && i <= 2);
                return (
                  <div
                    key={step}
                    className={`rounded-lg px-2 py-2 ${
                      isCurrent
                        ? 'bg-slate-900 text-white'
                        : passed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-white text-slate-500 border border-slate-200'
                    }`}
                  >
                    {i + 1}. {step}
                  </div>
                );
              })}
            </div>

            {/* Catatan Pengerjaan */}
            <div>
              <label
                htmlFor="tech-notes"
                className="mb-1.5 block text-sm font-semibold text-slate-800"
              >
                Catatan Teknisi
              </label>
              <textarea
                id="tech-notes"
                rows={3}
                disabled={isCompleted}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Catat hasil pengecekan kelistrikan, posisi kabel, atau penyesuaian lampu..."
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 focus:outline-none disabled:bg-slate-50 disabled:text-slate-600"
              />
            </div>

            {/* Pemakaian Komponen dari Daftar Stok */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Package className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  Komponen Terpakai
                </h3>
                {!isCompleted && (
                  <span className="text-xs text-slate-500">
                    Stok berkurang otomatis saat status menjadi Selesai.
                  </span>
                )}
              </div>

              {!isCompleted && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    aria-label="Pilih komponen dari stok"
                    value={itemToAddId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setItemToAddId(val);
                      if (val) handleAddComponent(val);
                    }}
                    className="min-h-[44px] flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 focus:outline-none"
                  >
                    <option value="">+ Tambah komponen dari stok...</option>
                    {availableItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.namaBarang} (Sisa: {item.stok} {item.satuan} ·{' '}
                        {formatRupiah(item.hargaJual)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedComponents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-xs text-slate-500">
                  Belum ada komponen yang dipilih untuk pengerjaan ini.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
                  {selectedComponents.map((comp) => {
                    const stockItem = inventoryMap.get(comp.itemId);
                    const maxStock = stockItem?.stok ?? 0;
                    return (
                      <div
                        key={comp.itemId}
                        className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-900">
                            {comp.namaBarang}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-600 tabular-nums">
                            {formatRupiah(comp.hargaSatuan)} / {stockItem?.satuan ?? 'unit'}
                            {!isCompleted && (
                              <span> · Stok tersedia: {maxStock}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 sm:justify-end">
                          {isCompleted ? (
                            <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                              {comp.qty} {stockItem?.satuan ?? 'unit'}
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                aria-label={`Kurangi jumlah ${comp.namaBarang}`}
                                onClick={() => handleUpdateQty(comp.itemId, -1)}
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <input
                                type="number"
                                min={1}
                                max={maxStock}
                                aria-label={`Jumlah ${comp.namaBarang}`}
                                value={comp.qty}
                                onChange={(e) =>
                                  handleDirectQtyChange(comp.itemId, e.target.value)
                                }
                                className="min-h-[44px] w-14 rounded-lg border border-slate-300 text-center font-mono text-sm font-semibold tabular-nums text-slate-900"
                              />
                              <button
                                type="button"
                                aria-label={`Tambah jumlah ${comp.namaBarang}`}
                                onClick={() => handleUpdateQty(comp.itemId, 1)}
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                aria-label={`Hapus ${comp.namaBarang}`}
                                onClick={() => handleRemoveComponent(comp.itemId)}
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!isCompleted && !validation.valid && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                  <div className="space-y-1">
                    {validation.errors.map((err) => (
                      <div key={err}>{err}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tombol Aksi Status */}
            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              {!isCompleted ? (
                <>
                  <button
                    type="button"
                    disabled={!validation.valid}
                    onClick={() => onSaveDraft(activeJob.id, catatan, selectedComponents)}
                    className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Simpan Catatan & Komponen
                  </button>

                  {nextStatus && (
                    <button
                      type="button"
                      disabled={!validation.valid}
                      onClick={() => setConfirmTargetStatus(nextStatus)}
                      className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span>
                        {nextStatus === 'Dikerjakan'
                          ? 'Mulai Kerjakan (→ Dikerjakan)'
                          : 'Selesaikan Pekerjaan (→ Selesai)'}
                      </span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  Pekerjaan telah selesai dan siap diproses di Kasir.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmTargetStatus !== null}
        title={
          confirmTargetStatus === 'Selesai'
            ? 'Konfirmasi Selesaikan Pengerjaan'
            : 'Konfirmasi Mulai Pengerjaan'
        }
        message={
          confirmTargetStatus === 'Selesai'
            ? `Ubah status ${activeJob.platNomor} menjadi Selesai? Stok dari ${selectedComponents.length} komponen terpakai akan otomatis dikurangi.`
            : `Mulai kerjakan kendaraan ${activeJob.platNomor} (${activeJob.tipeKendaraan})? Status akan berubah menjadi Dikerjakan.`
        }
        confirmLabel={
          confirmTargetStatus === 'Selesai' ? 'Ya, Tandai Selesai' : 'Ya, Mulai Kerjakan'
        }
        onCancel={() => setConfirmTargetStatus(null)}
        onConfirm={() => {
          if (confirmTargetStatus) {
            onAdvanceStatus(
              activeJob.id,
              confirmTargetStatus,
              catatan,
              selectedComponents
            );
          }
          setConfirmTargetStatus(null);
        }}
      />
    </div>
  );
}
