import { useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  Building2,
  CheckCircle2,
  Printer,
  QrCode,
  Receipt,
  ShieldCheck,
} from 'lucide-react';
import { SERVICE_CONFIG } from '../data/seedData';
import { BookingJob, PaymentMethod, TransactionRecord } from '../types/erp';
import {
  calculateJobTotals,
  formatDateId,
  formatRupiah,
} from '../utils/erpLogic';
import { ConfirmModal } from './ConfirmModal';
import { ReceiptModal } from './ReceiptModal';

interface CashierPosViewProps {
  bookings: BookingJob[];
  transactions: TransactionRecord[];
  selectedJobId: string | null;
  onSelectJob: (jobId: string) => void;
  onCompleteTransaction: (
    jobId: string,
    metodeBayar: PaymentMethod
  ) => TransactionRecord | null;
}

const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  icon: typeof Banknote;
}[] = [
  { id: 'Tunai', label: 'Tunai', icon: Banknote },
  { id: 'Transfer', label: 'Transfer Bank', icon: Building2 },
  { id: 'QRIS', label: 'QRIS', icon: QrCode },
];

// Modul 4: Kasir / POS & Nota (akses: Staf/Kasir, Pemilik)
export function CashierPosView({
  bookings,
  transactions,
  selectedJobId,
  onSelectJob,
  onCompleteTransaction,
}: CashierPosViewProps) {
  const readyJobs = useMemo(
    () => bookings.filter((b) => b.status === 'Selesai' && !b.sudahDibayar),
    [bookings]
  );

  const activeJob = useMemo(() => {
    return (
      readyJobs.find((b) => b.id === selectedJobId) ?? readyJobs[0] ?? null
    );
  }, [readyJobs, selectedJobId]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Tunai');
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<TransactionRecord | null>(
    null
  );
  const [lastSavedReceipt, setLastSavedReceipt] =
    useState<TransactionRecord | null>(null);

  useEffect(() => {
    if (activeJob) {
      setLastSavedReceipt(null);
    }
  }, [activeJob?.id]);

  const totals = useMemo(() => {
    if (!activeJob) return null;
    return calculateJobTotals(activeJob.biayaJasa, activeJob.komponenDipakai);
  }, [activeJob]);

  const handleConfirmSave = () => {
    if (!activeJob) return;
    const saved = onCompleteTransaction(activeJob.id, paymentMethod);
    setConfirmSaveOpen(false);
    if (saved) {
      setLastSavedReceipt(saved);
      setActiveReceipt(saved);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
          Kasir / POS & Nota Digital
        </h1>
        <p className="mt-0.5 text-sm text-slate-600">
          Pilih pekerjaan berstatus Selesai, proses pembayaran, dan cetak nota thermal garansi.
        </p>
      </div>

      {/* Banner transaksi baru selesai disimpan */}
      {lastSavedReceipt && (
        <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-950">
                Transaksi {lastSavedReceipt.noNota} berhasil disimpan ({lastSavedReceipt.platNomor})
              </p>
              <p className="text-xs text-emerald-800">
                Garansi {lastSavedReceipt.durasiGaransiBulan} bulan otomatis tercatat s/d{' '}
                {formatDateId(lastSavedReceipt.garansiBerakhir)}.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveReceipt(lastSavedReceipt)}
              className="min-h-[44px] rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 whitespace-nowrap"
            >
              Lihat Nota Digital
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Daftar Pekerjaan Siap Bayar */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">
            Siap Bayar — Status Selesai ({readyJobs.length})
          </h2>

          {readyJobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
              <Receipt className="mx-auto h-7 w-7 text-slate-400" />
              <p className="mt-2 text-sm font-semibold text-slate-900">
                Semua pekerjaan selesai sudah dibayar
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Pekerjaan baru akan muncul di sini setelah teknisi menandai status Selesai.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {readyJobs.map((job) => {
                const isSelected = activeJob?.id === job.id;
                const jobTotal = calculateJobTotals(
                  job.biayaJasa,
                  job.komponenDipakai
                );
                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => onSelectJob(job.id)}
                    className={`flex w-full items-start justify-between gap-3 rounded-xl border p-4 text-left transition-colors ${
                      isSelected
                        ? 'border-orange-600 bg-orange-50/50 ring-1 ring-orange-600/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-bold text-slate-900">
                        {job.noAntrean} · {job.platNomor}
                      </div>
                      <div className="mt-0.5 truncate text-sm font-semibold text-slate-900">
                        {job.namaPelanggan}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-600">
                        {job.tipeKendaraan} · {job.layanan}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                        {formatRupiah(jobTotal.grandTotal)}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {job.komponenDipakai.length} komponen
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel Ringkasan Tagihan & Pembayaran */}
        <div className="lg:col-span-7">
          {activeJob && totals ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 pb-4">
                <div>
                  <span className="font-mono text-xs font-semibold text-orange-700">
                    {activeJob.noAntrean} · {activeJob.platNomor}
                  </span>
                  <h2 className="mt-0.5 text-lg font-bold text-slate-900">
                    {activeJob.namaPelanggan} — {activeJob.tipeKendaraan}
                  </h2>
                  <p className="text-xs text-slate-600">
                    Layanan: {activeJob.layanan} (Garansi{' '}
                    {SERVICE_CONFIG[activeJob.layanan].garansiBulan} bulan)
                  </p>
                </div>
              </div>

              {/* Rincian Biaya */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-800">
                  Rincian Jasa & Komponen
                </h3>
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <div className="font-medium text-slate-900">
                        Biaya Jasa ({activeJob.layanan})
                      </div>
                      <div className="text-xs text-slate-500">
                        Pemasangan & kalibrasi bengkel
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {formatRupiah(totals.totalJasa)}
                    </span>
                  </div>

                  {activeJob.komponenDipakai.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-slate-500">
                      Tidak ada tambahan komponen suku cadang.
                    </div>
                  ) : (
                    activeJob.komponenDipakai.map((comp) => (
                      <div
                        key={comp.itemId}
                        className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900">
                            {comp.namaBarang}
                          </div>
                          <div className="font-mono text-xs text-slate-500 tabular-nums">
                            {comp.qty} x {formatRupiah(comp.hargaSatuan)}
                          </div>
                        </div>
                        <span className="shrink-0 font-mono font-semibold text-slate-900 tabular-nums">
                          {formatRupiah(comp.qty * comp.hargaSatuan)}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3.5 text-white">
                  <span className="text-sm font-semibold">Total Pembayaran</span>
                  <span className="font-mono text-xl font-bold tabular-nums">
                    {formatRupiah(totals.grandTotal)}
                  </span>
                </div>
              </div>

              {/* Metode Pembayaran */}
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-800">
                  Pilih Metode Pembayaran
                </h3>
                <div className="grid grid-cols-3 gap-2.5">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    const active = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-semibold transition-colors sm:flex-row sm:gap-2 sm:text-sm ${
                          active
                            ? 'border-orange-600 bg-orange-50 text-orange-700 ring-1 ring-orange-600/20'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  Menyimpan transaksi otomatis mencatat garansi untuk plat{' '}
                  <strong className="font-mono text-slate-900">
                    {activeJob.platNomor}
                  </strong>
                  .
                </span>
              </div>

              <button
                type="button"
                onClick={() => setConfirmSaveOpen(true)}
                className="min-h-[48px] w-full rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
              >
                Simpan Transaksi & Terbitkan Nota
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm font-semibold text-slate-900">
                Tidak ada tagihan aktif yang dipilih
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Anda dapat melihat atau mencetak ulang nota dari riwayat transaksi di bawah.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Riwayat Transaksi & Cetak Ulang Nota */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">
            Riwayat Transaksi & Nota Terbit ({transactions.length})
          </h2>
          <p className="text-xs text-slate-600">
            Klik &ldquo;Lihat Nota Digital&rdquo; untuk melihat pratinjau struk thermal 80mm atau mencetak.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {transactions.map((trx) => (
            <div
              key={trx.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono font-bold text-slate-900">
                    {trx.noNota}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    {formatDateId(trx.tanggalTransaksi)} {trx.waktuTransaksi}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{trx.metodeBayar}</span>
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {trx.namaPelanggan}{' '}
                  <span className="font-mono text-xs font-semibold text-slate-700">
                    ({trx.platNomor})
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  {trx.tipeKendaraan} · {trx.layanan}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                <div className="text-left sm:text-right">
                  <div className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                    {formatRupiah(trx.totalBayar)}
                  </div>
                  <div className="text-[11px] text-emerald-700">
                    Garansi s/d {formatDateId(trx.garansiBerakhir)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveReceipt(trx)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
                >
                  <Printer className="h-4 w-4 text-slate-600" aria-hidden="true" />
                  Lihat Nota Digital
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal
        open={confirmSaveOpen}
        title="Konfirmasi Simpan Transaksi"
        message={
          activeJob && totals
            ? `Simpan pembayaran ${formatRupiah(totals.grandTotal)} via ${paymentMethod} untuk ${activeJob.namaPelanggan} (${activeJob.platNomor})? Garansi akan otomatis aktif.`
            : ''
        }
        confirmLabel="Ya, Simpan & Cetak Nota"
        onCancel={() => setConfirmSaveOpen(false)}
        onConfirm={handleConfirmSave}
      />

      <ReceiptModal
        transaction={activeReceipt}
        onClose={() => setActiveReceipt(null)}
      />
    </div>
  );
}
