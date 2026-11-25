import { Printer, X } from 'lucide-react';
import { WORKSHOP_INFO } from '../data/seedData';
import { TransactionRecord } from '../types/erp';
import { formatDateId, formatRupiah } from '../utils/erpLogic';

interface ReceiptModalProps {
  transaction: TransactionRecord | null;
  onClose: () => void;
}

// Modal Nota Digital bergaya struk thermal 58/80mm + dukungan cetak (window.print)
export function ReceiptModal({ transaction, onClose }: ReceiptModalProps) {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header Modal (tidak ikut tercetak) */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h2 id="receipt-title" className="text-base font-bold text-slate-900">
            Nota Digital (Thermal 80mm)
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup nota digital"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Isi Struk Thermal */}
        <div className="overflow-y-auto bg-slate-100 p-4 sm:p-6">
          <div
            id="printable-receipt"
            className="mx-auto w-full max-w-[320px] border border-slate-300 bg-white p-5 font-mono text-xs text-slate-900 shadow-sm"
          >
            {/* Header Bengkel */}
            <div className="border-b border-dashed border-slate-400 pb-3 text-center">
              <div className="text-sm font-bold uppercase tracking-wide">
                {WORKSHOP_INFO.nama}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-700">
                {WORKSHOP_INFO.subjudul}
              </div>
              <div className="mt-1 text-[10px] text-slate-600">
                {WORKSHOP_INFO.alamat}
              </div>
              <div className="text-[10px] text-slate-600">
                Telp/WA: {WORKSHOP_INFO.telepon}
              </div>
            </div>

            {/* Metadata Nota */}
            <div className="space-y-1 border-b border-dashed border-slate-400 py-3 text-[11px]">
              <div className="flex justify-between gap-2">
                <span className="shrink-0">No. Nota</span>
                <span className="font-semibold">{transaction.noNota}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="shrink-0">Tanggal</span>
                <span>
                  {formatDateId(transaction.tanggalTransaksi)} {transaction.waktuTransaksi}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="shrink-0">Pelanggan</span>
                <span className="text-right font-semibold">{transaction.namaPelanggan}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="shrink-0">Plat Nomor</span>
                <span className="text-right font-semibold">{transaction.platNomor}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="shrink-0">Unit</span>
                <span className="text-right">{transaction.tipeKendaraan}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="shrink-0">Kasir</span>
                <span className="text-right">{transaction.namaKasir}</span>
              </div>
            </div>

            {/* Rincian Jasa & Komponen */}
            <div className="space-y-2 border-b border-dashed border-slate-400 py-3 text-[11px]">
              <div className="font-bold uppercase">Rincian Pengerjaan</div>
              <div className="flex justify-between gap-2">
                <span>Jasa: {transaction.layanan}</span>
                <span className="shrink-0 tabular-nums">
                  {formatRupiah(transaction.biayaJasa)}
                </span>
              </div>

              {transaction.komponen.map((item) => (
                <div key={item.itemId} className="space-y-0.5">
                  <div className="font-medium">{item.namaBarang}</div>
                  <div className="flex justify-between text-[10px] text-slate-700 tabular-nums">
                    <span>
                      {item.qty} x {formatRupiah(item.hargaSatuan)}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatRupiah(item.qty * item.hargaSatuan)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total & Pembayaran */}
            <div className="space-y-1.5 border-b border-dashed border-slate-400 py-3">
              <div className="flex justify-between text-sm font-bold tabular-nums">
                <span>TOTAL</span>
                <span>{formatRupiah(transaction.totalBayar)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Metode Bayar</span>
                <span className="font-semibold">{transaction.metodeBayar}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Status</span>
                <span className="font-semibold">LUNAS</span>
              </div>
            </div>

            {/* Informasi Garansi */}
            <div className="pt-3 text-center text-[10px] leading-relaxed text-slate-700">
              <div className="font-bold uppercase text-slate-900">
                Kartu Garansi Resmi ({transaction.durasiGaransiBulan} Bulan)
              </div>
              <div className="mt-1">
                Berlaku: {formatDateId(transaction.garansiMulai)} s/d{' '}
                {formatDateId(transaction.garansiBerakhir)}
              </div>
              <div className="mt-1">Plat Terdaftar: {transaction.platNomor}</div>
              <p className="mt-2 text-slate-600">{WORKSHOP_INFO.garansiCatatan}</p>
              <p className="mt-2 font-semibold text-slate-900">
                Terima kasih telah mempercayakan kendaraan Anda!
              </p>
            </div>
          </div>
        </div>

        {/* Footer Tombol Cetak */}
        <div className="no-print flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-5 py-3.5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Cetak Nota
          </button>
        </div>
      </div>
    </div>
  );
}
