import { AlertTriangle, CheckCircle2, Clock, Wrench, XCircle } from 'lucide-react';
import { JobStatus, StockLevelStatus } from '../types/erp';

// Badge status pengerjaan kendaraan dengan warna + ikon agar mudah dibaca
export function JobStatusBadge({ status }: { status: JobStatus }) {
  if (status === 'Menunggu') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 whitespace-nowrap">
        <Clock className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
        Menunggu
      </span>
    );
  }
  if (status === 'Dikerjakan') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 whitespace-nowrap">
        <Wrench className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
        Dikerjakan
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 whitespace-nowrap">
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
      Selesai
    </span>
  );
}

// Badge status ketersediaan stok barang
export function StockStatusBadge({ status }: { status: StockLevelStatus }) {
  if (status === 'Habis') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800 whitespace-nowrap">
        <XCircle className="h-3.5 w-3.5 text-red-600" aria-hidden="true" />
        Habis
      </span>
    );
  }
  if (status === 'Menipis') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 whitespace-nowrap">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
        Menipis
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 whitespace-nowrap">
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
      Aman
    </span>
  );
}

// Badge status garansi
export function WarrantyStatusBadge({ status }: { status: 'Aktif' | 'Kedaluwarsa' }) {
  if (status === 'Aktif') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 whitespace-nowrap">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
        Aktif
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800 whitespace-nowrap">
      <XCircle className="h-3.5 w-3.5 text-red-600" aria-hidden="true" />
      Kedaluwarsa
    </span>
  );
}
