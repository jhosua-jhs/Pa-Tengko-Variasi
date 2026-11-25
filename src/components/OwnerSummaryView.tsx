import { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CarFront,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { TODAY_DATE } from '../data/seedData';
import { BookingJob, InventoryItem, ModuleId, TransactionRecord } from '../types/erp';
import {
  computeOwnerMetrics,
  formatDateId,
  formatRupiah,
  getStockStatus,
} from '../utils/erpLogic';

interface OwnerSummaryViewProps {
  bookings: BookingJob[];
  transactions: TransactionRecord[];
  inventory: InventoryItem[];
  onNavigate: (moduleId: ModuleId) => void;
}

// Modul 6: Ringkasan Pemilik (akses: hanya Pemilik)
export function OwnerSummaryView({
  bookings,
  transactions,
  inventory,
  onNavigate,
}: OwnerSummaryViewProps) {
  const metrics = useMemo(
    () => computeOwnerMetrics(bookings, transactions, inventory, TODAY_DATE),
    [bookings, inventory, transactions]
  );

  const lowStockList = useMemo(
    () => inventory.filter((item) => getStockStatus(item) !== 'Aman'),
    [inventory]
  );

  const waitingCount = bookings.filter((b) => b.status === 'Menunggu').length;
  const activeCount = bookings.filter((b) => b.status === 'Dikerjakan').length;
  const readyForCashierCount = bookings.filter(
    (b) => b.status === 'Selesai' && !b.sudahDibayar
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Ringkasan Bengkel Pemilik
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Pantauan operasional harian & estimasi laba Pa&apos;tengko Variasi per {formatDateId(TODAY_DATE)}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('antrean')}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 whitespace-nowrap shrink-0"
        >
          Kelola Antrean
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* 5 Metrik Utama Pemilik */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Kendaraan Hari Ini</span>
              <CarFront className="h-4 w-4 text-slate-400" aria-hidden="true" />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {metrics.kendaraanHariIni}
            </div>
            <p className="mt-1 text-xs text-slate-600">
              {waitingCount} menunggu · {activeCount} dikerjakan
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Pendapatan Hari Ini</span>
              <Wallet className="h-4 w-4 text-slate-400" aria-hidden="true" />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {formatRupiah(metrics.pendapatanHariIni)}
            </div>
            <p className="mt-1 text-xs text-slate-600">
              {readyForCashierCount} unit selesai siap bayar
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Pendapatan Bulan Ini</span>
              <Wallet className="h-4 w-4 text-slate-400" aria-hidden="true" />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {formatRupiah(metrics.pendapatanBulanIni)}
            </div>
            <p className="mt-1 text-xs text-slate-600">Periode November 2026</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
            <div className="flex items-center justify-between text-xs font-medium text-emerald-800">
              <span>Estimasi Laba Bulan Ini</span>
              <TrendingUp className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold text-emerald-900 tabular-nums">
              {formatRupiah(metrics.estimasiLabaBulanIni)}
            </div>
            <p className="mt-1 text-xs text-emerald-800">
              Total pendapatan dikurangi harga beli komponen terpakai
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5">
            <div className="flex items-center justify-between text-xs font-medium text-amber-800">
              <span>Barang Stok Menipis / Habis</span>
              <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="font-mono text-2xl font-bold text-amber-900 tabular-nums">
                {metrics.jumlahStokMenipis} Barang
              </span>
              <button
                type="button"
                onClick={() => onNavigate('garansi-stok')}
                className="text-xs font-semibold text-amber-800 underline hover:text-amber-950"
              >
                Lihat & atur stok
              </button>
            </div>
            <p className="mt-1 text-xs text-amber-800">
              Stok berada di bawah atau sama dengan batas minimum
            </p>
          </div>
        </div>
      </div>

      {/* Dua Kolom Bawah: Peringatan Stok & Transaksi Terakhir */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              Barang Perlu Restok
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('garansi-stok')}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              Kelola Stok
            </button>
          </div>

          {lowStockList.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Semua stok komponen berada di level aman.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {lowStockList.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <div>
                    <div className="font-semibold text-slate-900">
                      {item.namaBarang}
                    </div>
                    <div className="text-xs text-slate-500">
                      Batas minimum: {item.stokMinimum} {item.satuan}
                    </div>
                  </div>
                  <div className="text-right font-mono tabular-nums">
                    <span
                      className={`text-sm font-bold ${
                        item.stok === 0 ? 'text-red-600' : 'text-amber-700'
                      }`}
                    >
                      {item.stok} {item.satuan}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              Transaksi Terbaru
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('kasir')}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              Buka Kasir
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {transactions.slice(0, 4).map((trx) => {
              const laba = trx.totalBayar - trx.totalModalKomponen;
              return (
                <div
                  key={trx.id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <div>
                    <div className="font-semibold text-slate-900">
                      {trx.platNomor} · {trx.namaPelanggan}
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatDateId(trx.tanggalTransaksi)} · {trx.metodeBayar}
                    </div>
                  </div>
                  <div className="text-right font-mono tabular-nums">
                    <div className="font-bold text-slate-900">
                      {formatRupiah(trx.totalBayar)}
                    </div>
                    <div className="text-[11px] font-medium text-emerald-700">
                      Laba: {formatRupiah(laba)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
