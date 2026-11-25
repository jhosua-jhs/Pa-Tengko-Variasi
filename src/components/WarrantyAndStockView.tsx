import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Minus,
  Package,
  Plus,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { TODAY_DATE } from '../data/seedData';
import { InventoryItem, TransactionRecord, UserRole } from '../types/erp';
import {
  computeWarrantyStatus,
  formatDateId,
  formatRupiah,
  getStockStatus,
} from '../utils/erpLogic';
import { StockStatusBadge, WarrantyStatusBadge } from './StatusBadge';

interface WarrantyAndStockViewProps {
  role: UserRole;
  transactions: TransactionRecord[];
  inventory: InventoryItem[];
  onAdjustStock: (itemId: string, delta: number) => void;
}

// Modul 5: Cek Garansi & Stok Ringkas (edit stok hanya Pemilik)
export function WarrantyAndStockView({
  role,
  transactions,
  inventory,
  onAdjustStock,
}: WarrantyAndStockViewProps) {
  const [plateSearch, setPlateSearch] = useState('');
  const [stockSearch, setStockSearch] = useState('');

  const isOwner = role === 'pemilik';

  const matchingWarranties = useMemo(() => {
    const q = plateSearch.trim().toUpperCase();
    if (!q) return transactions;
    return transactions.filter(
      (t) =>
        t.platNomor.toUpperCase().includes(q) ||
        t.namaPelanggan.toUpperCase().includes(q)
    );
  }, [plateSearch, transactions]);

  const lowStockItems = useMemo(
    () => inventory.filter((item) => getStockStatus(item) !== 'Aman'),
    [inventory]
  );

  const filteredInventory = useMemo(() => {
    const q = stockSearch.trim().toLowerCase();
    if (!q) return inventory;
    return inventory.filter(
      (i) =>
        i.namaBarang.toLowerCase().includes(q) ||
        i.kode.toLowerCase().includes(q) ||
        i.kategori.toLowerCase().includes(q)
    );
  }, [inventory, stockSearch]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
          Cek Garansi & Stok Ringkas
        </h1>
        <p className="mt-0.5 text-sm text-slate-600">
          Periksa masa berlaku garansi berdasarkan plat nomor dan pantau ketersediaan suku cadang bengkel.
        </p>
      </div>

      {/* Banner Peringatan Stok Di Bawah Minimum */}
      {lowStockItems.length > 0 && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-semibold">
              Peringatan Stok: {lowStockItems.length} barang berada di batas minimum atau habis!
            </p>
            <p className="mt-0.5 text-xs text-amber-900">
              {lowStockItems.map((i) => `${i.namaBarang} (sisa ${i.stok})`).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* Bagian 1: Cek Garansi Berdasarkan Plat Nomor */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Cek Garansi Pelanggan
              </h2>
              <p className="text-xs text-slate-600">
                Cari plat nomor (contoh: DB 6631 AR, DB 7023 AB) untuk melihat riwayat & status garansi.
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Cari plat nomor untuk cek garansi"
              value={plateSearch}
              onChange={(e) => setPlateSearch(e.target.value.toUpperCase())}
              placeholder="Ketik plat nomor (DB ...)"
              className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white py-2 pr-3.5 pl-10 font-mono text-sm uppercase text-slate-900 placeholder:font-sans placeholder:normal-case placeholder:text-slate-400 focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 focus:outline-none"
            />
          </div>
        </div>

        {matchingWarranties.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-sm font-semibold text-slate-900">
              Data garansi untuk plat &ldquo;{plateSearch}&rdquo; tidak ditemukan
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Pastikan penulisan plat nomor benar atau transaksi sudah diselesaikan di Kasir.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {matchingWarranties.map((item) => {
              const status = computeWarrantyStatus(
                item.garansiBerakhir,
                TODAY_DATE
              );
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-sm font-bold text-slate-900">
                        {item.platNomor}
                      </div>
                      <div className="text-sm font-semibold text-slate-800">
                        {item.tipeKendaraan} · {item.namaPelanggan}
                      </div>
                    </div>
                    <WarrantyStatusBadge status={status} />
                  </div>

                  <div className="text-xs text-slate-700">
                    <div>
                      Layanan: <span className="font-medium">{item.layanan}</span>
                    </div>
                    <div className="mt-0.5 text-slate-600">
                      Komponen:{' '}
                      {item.komponen.length > 0
                        ? item.komponen.map((c) => `${c.namaBarang} (${c.qty})`).join(', ')
                        : 'Jasa pemasangan'}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-2.5 text-xs text-slate-600 tabular-nums">
                    <span>
                      Mulai: <strong className="text-slate-900">{formatDateId(item.garansiMulai)}</strong>
                    </span>
                    <span>
                      Berakhir:{' '}
                      <strong className="text-slate-900">
                        {formatDateId(item.garansiBerakhir)}
                      </strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Bagian 2: Panel Stok Ringkas */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Package className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Stok Ringkas Komponen ({inventory.length} Barang)
              </h2>
              <p className="text-xs text-slate-600">
                {isOwner
                  ? 'Sebagai Pemilik, Anda dapat menyesuaikan jumlah stok masuk atau koreksi.'
                  : 'Mode lihat saja. Hubungi Pemilik untuk penyesuaian stok manual.'}
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Cari nama barang atau kode stok"
              value={stockSearch}
              onChange={(e) => setStockSearch(e.target.value)}
              placeholder="Cari nama barang atau kode..."
              className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white py-2 pr-3.5 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 focus:outline-none"
            />
          </div>
        </div>

        {/* Kartu Mobile (< md) */}
        <div className="space-y-3 md:hidden">
          {filteredInventory.map((item) => {
            const status = getStockStatus(item);
            return (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono text-xs text-slate-500">
                      {item.kode} · {item.kategori}
                    </div>
                    <h3 className="mt-0.5 text-sm font-semibold text-slate-900">
                      {item.namaBarang}
                    </h3>
                  </div>
                  <StockStatusBadge status={status} />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 tabular-nums">
                  <span>
                    Stok: <strong className="text-sm text-slate-900">{item.stok}</strong> {item.satuan}
                  </span>
                  <span>Min: {item.stokMinimum} {item.satuan}</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {formatRupiah(item.hargaJual)}
                  </span>
                </div>

                {isOwner && (
                  <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2.5">
                    <span className="mr-auto text-xs font-medium text-slate-500">
                      Sesuaikan Stok:
                    </span>
                    <button
                      type="button"
                      disabled={item.stok <= 0}
                      aria-label={`Kurangi stok ${item.namaBarang}`}
                      onClick={() => onAdjustStock(item.id, -1)}
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Tambah stok ${item.namaBarang}`}
                      onClick={() => onAdjustStock(item.id, 1)}
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Tabel Desktop (>= md) */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="px-4 py-3">Kode & Nama Barang</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3 text-right">Harga Jual</th>
                <th className="px-4 py-3 text-right">Stok</th>
                <th className="px-4 py-3 text-right">Min</th>
                <th className="px-4 py-3">Status</th>
                {isOwner && <th className="px-4 py-3 text-right">Penyesuaian</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.map((item) => {
                const status = getStockStatus(item);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">
                        {item.namaBarang}
                      </div>
                      <div className="font-mono text-xs text-slate-500">
                        {item.kode}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {item.kategori}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-slate-900 tabular-nums">
                      {formatRupiah(item.hargaJual)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {item.stok} {item.satuan}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-slate-500 tabular-nums">
                      {item.stokMinimum}
                    </td>
                    <td className="px-4 py-3">
                      <StockStatusBadge status={status} />
                    </td>
                    {isOwner && (
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={item.stok <= 0}
                            aria-label={`Kurangi stok ${item.namaBarang}`}
                            onClick={() => onAdjustStock(item.id, -1)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Tambah stok ${item.namaBarang}`}
                            onClick={() => onAdjustStock(item.id, 1)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
