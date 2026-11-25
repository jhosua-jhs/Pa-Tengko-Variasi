import { useMemo, useState } from 'react';
import { CalendarClock, ClipboardList, Plus, Search } from 'lucide-react';
import { BookingJob, JobStatus, UserRole } from '../types/erp';
import { formatDateId } from '../utils/erpLogic';
import { BookingModal } from './BookingModal';
import { JobStatusBadge } from './StatusBadge';

interface QueueViewProps {
  role: UserRole;
  bookings: BookingJob[];
  isLoading: boolean;
  onAddBooking: (data: Parameters<typeof BookingModal>[0]['onCreateBooking'] extends (a: infer T) => void ? T : never) => void;
  onOpenJobForTech: (jobId: string) => void;
  onOpenJobForPos: (jobId: string) => void;
}

type StatusFilter = 'Semua' | JobStatus;

// Modul 2: Daftar Antrean & Booking (akses: Pemilik, Staf/Kasir, Teknisi)
export function QueueView({
  role,
  bookings,
  isLoading,
  onAddBooking,
  onOpenJobForTech,
  onOpenJobForPos,
}: QueueViewProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const counts = useMemo(() => {
    return {
      Semua: bookings.length,
      Menunggu: bookings.filter((b) => b.status === 'Menunggu').length,
      Dikerjakan: bookings.filter((b) => b.status === 'Dikerjakan').length,
      Selesai: bookings.filter((b) => b.status === 'Selesai').length,
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bookings.filter((b) => {
      const matchStatus = statusFilter === 'Semua' || b.status === statusFilter;
      const matchSearch =
        !q ||
        b.namaPelanggan.toLowerCase().includes(q) ||
        b.platNomor.toLowerCase().includes(q) ||
        b.noAntrean.toLowerCase().includes(q) ||
        b.tipeKendaraan.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [bookings, searchQuery, statusFilter]);

  const filterTabs: StatusFilter[] = ['Semua', 'Menunggu', 'Dikerjakan', 'Selesai'];

  return (
    <div className="space-y-5">
      {/* Header Bagian & Aksi Tambah */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Daftar Antrean & Booking
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Pantau status pengerjaan kendaraan dan tambah jadwal booking atau walk-in.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700 whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Tambah Booking/Walk-in
        </button>
      </div>

      {/* Filter Status & Kolom Pencarian */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-100 p-1"
          role="tablist"
          aria-label="Filter status antrean"
        >
          {filterTabs.map((tab) => {
            const active = statusFilter === tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStatusFilter(tab)}
                className={`min-h-[40px] rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap sm:text-sm ${
                  active
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}{' '}
                <span className="ml-1 tabular-nums text-slate-500">
                  ({counts[tab]})
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-80">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Cari nama pelanggan atau plat nomor"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau plat (mis. DB 1234 AB)"
            className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white py-2 pr-3.5 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 focus:outline-none"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-3" aria-label="Memuat antrean">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="h-20 animate-pulse rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="h-4 w-1/3 rounded bg-slate-200" />
              <div className="mt-3 h-3 w-2/3 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <ClipboardList className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-3 text-base font-semibold text-slate-900">
            Tidak ada antrean yang cocok
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Ubah kata kunci pencarian atau filter status, atau tambah booking baru.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            {(searchQuery || statusFilter !== 'Semua') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('Semua');
                }}
                className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Reset Filter
              </button>
            )}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="min-h-[44px] rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
            >
              Tambah Booking Baru
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Tampilan Kartu Mobile (< md) */}
          <div className="space-y-3 md:hidden">
            {filteredBookings.map((job) => (
              <div
                key={job.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-bold text-slate-900">
                        {job.noAntrean}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                        {formatDateId(job.tanggal)} {job.slotWaktu}
                      </span>
                    </div>
                    <h3 className="mt-1 text-base font-semibold text-slate-900">
                      {job.namaPelanggan}
                    </h3>
                    <p className="text-xs text-slate-600">
                      <span className="font-mono font-semibold text-slate-800">
                        {job.platNomor}
                      </span>{' '}
                      · {job.tipeKendaraan}
                    </p>
                  </div>
                  <JobStatusBadge status={job.status} />
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <span className="text-xs font-medium text-slate-700">
                    {job.layanan}
                  </span>
                  {role === 'teknisi' && (
                    <button
                      type="button"
                      onClick={() => onOpenJobForTech(job.id)}
                      className="min-h-[40px] rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      Buka Pengerjaan
                    </button>
                  )}
                  {(role === 'kasir' || role === 'pemilik') &&
                    job.status === 'Selesai' &&
                    !job.sudahDibayar && (
                      <button
                        type="button"
                        onClick={() => onOpenJobForPos(job.id)}
                        className="min-h-[40px] rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700"
                      >
                        Proses Kasir
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>

          {/* Tampilan Tabel Desktop (>= md) */}
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="px-4 py-3.5">No. Antrean</th>
                    <th className="px-4 py-3.5">Pelanggan</th>
                    <th className="px-4 py-3.5">Plat & Kendaraan</th>
                    <th className="px-4 py-3.5">Jenis Layanan</th>
                    <th className="px-4 py-3.5">Jadwal</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3.5 font-mono font-semibold text-slate-900 tabular-nums">
                        {job.noAntrean}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {job.namaPelanggan}
                        </div>
                        <div className="text-xs text-slate-500 tabular-nums">
                          {job.noTelepon}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-xs font-semibold text-slate-900">
                          {job.platNomor}
                        </div>
                        <div className="text-xs text-slate-600">
                          {job.tipeKendaraan}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-800">{job.layanan}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 tabular-nums">
                        <div>{formatDateId(job.tanggal)}</div>
                        <div className="font-medium text-slate-800">
                          {job.slotWaktu} WITA
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <JobStatusBadge status={job.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {role === 'teknisi' ? (
                          <button
                            type="button"
                            onClick={() => onOpenJobForTech(job.id)}
                            className="min-h-[38px] rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap"
                          >
                            Detail Pengerjaan
                          </button>
                        ) : job.status === 'Selesai' && !job.sudahDibayar ? (
                          <button
                            type="button"
                            onClick={() => onOpenJobForPos(job.id)}
                            className="min-h-[38px] rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 whitespace-nowrap"
                          >
                            Buat Nota
                          </button>
                        ) : job.sudahDibayar ? (
                          <span className="text-xs font-medium text-emerald-700">
                            Lunas
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <BookingModal
        open={modalOpen}
        bookings={bookings}
        onClose={() => setModalOpen(false)}
        onCreateBooking={onAddBooking}
      />
    </div>
  );
}
