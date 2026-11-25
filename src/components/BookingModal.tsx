import { FormEvent, useMemo, useState } from 'react';
import { AlertTriangle, Calendar, Clock, X } from 'lucide-react';
import {
  MAX_BAY_PER_SLOT,
  SERVICE_CONFIG,
  TIME_SLOTS,
  TODAY_DATE,
} from '../data/seedData';
import { BookingJob, ServiceType } from '../types/erp';
import {
  countSlotBookings,
  findNearestAvailableSlot,
  formatDateId,
  isSlotAvailable,
  validatePlate,
} from '../utils/erpLogic';

interface BookingModalProps {
  open: boolean;
  bookings: BookingJob[];
  onClose: () => void;
  onCreateBooking: (data: {
    namaPelanggan: string;
    noTelepon: string;
    platNomor: string;
    tipeKendaraan: string;
    layanan: ServiceType;
    tanggal: string;
    slotWaktu: string;
    catatan: string;
  }) => void;
}

const SERVICE_LIST: ServiceType[] = [
  'Upgrade Headlamp/Foglamp',
  'Upgrade Stoplamp',
  'Upgrade Interior',
  'Upgrade Part Body',
];

// Modal form Tambah Booking / Walk-in dengan validasi plat dan saran slot terdekat jika penuh
export function BookingModal({
  open,
  bookings,
  onClose,
  onCreateBooking,
}: BookingModalProps) {
  const [namaPelanggan, setNamaPelanggan] = useState('');
  const [noTelepon, setNoTelepon] = useState('');
  const [platNomor, setPlatNomor] = useState('');
  const [tipeKendaraan, setTipeKendaraan] = useState('');
  const [layanan, setLayanan] = useState<ServiceType>('Upgrade Headlamp/Foglamp');
  const [tanggal, setTanggal] = useState(TODAY_DATE);
  const [slotWaktu, setSlotWaktu] = useState<string>(TIME_SLOTS[0]);
  const [catatan, setCatatan] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const slotFull = useMemo(
    () => !isSlotAvailable(bookings, tanggal, slotWaktu, MAX_BAY_PER_SLOT),
    [bookings, tanggal, slotWaktu]
  );

  const suggestedSlot = useMemo(() => {
    if (!slotFull) return null;
    return findNearestAvailableSlot(bookings, tanggal, slotWaktu, TIME_SLOTS, MAX_BAY_PER_SLOT);
  }, [bookings, slotFull, slotWaktu, tanggal]);

  if (!open) return null;

  const resetAndClose = () => {
    setErrors({});
    onClose();
  };

  const handleApplySuggestion = () => {
    if (!suggestedSlot) return;
    setTanggal(suggestedSlot.tanggal);
    setSlotWaktu(suggestedSlot.slotWaktu);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.slotWaktu;
      return next;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!namaPelanggan.trim()) {
      nextErrors.namaPelanggan = 'Nama pelanggan wajib diisi.';
    }
    const cleanPhone = noTelepon.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      nextErrors.noTelepon = 'Nomor telepon minimal 9 digit angka.';
    }

    const plateCheck = validatePlate(platNomor);
    if (!plateCheck.valid) {
      nextErrors.platNomor = plateCheck.message ?? 'Plat nomor tidak valid.';
    }

    if (!tipeKendaraan.trim()) {
      nextErrors.tipeKendaraan = 'Tipe kendaraan wajib diisi.';
    }

    if (!tanggal) {
      nextErrors.tanggal = 'Tanggal pengerjaan wajib dipilih.';
    }

    if (slotFull) {
      nextErrors.slotWaktu =
        'Slot waktu yang dipilih sudah penuh. Pilih slot lain atau gunakan saran slot terdekat.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onCreateBooking({
      namaPelanggan: namaPelanggan.trim(),
      noTelepon: noTelepon.trim(),
      platNomor: plateCheck.normalized,
      tipeKendaraan: tipeKendaraan.trim(),
      layanan,
      tanggal,
      slotWaktu,
      catatan: catatan.trim(),
    });

    setNamaPelanggan('');
    setNoTelepon('');
    setPlatNomor('');
    setTipeKendaraan('');
    setCatatan('');
    setErrors({});
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h2 id="booking-modal-title" className="text-lg font-bold text-slate-900">
              Tambah Booking / Walk-in
            </h2>
            <p className="text-xs text-slate-600">
              Isi data kendaraan untuk masuk ke antrean bengkel.
            </p>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            aria-label="Tutup form booking"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="bk-nama"
                className="mb-1.5 block text-sm font-medium text-slate-800"
              >
                Nama Pelanggan <span className="text-red-600">*</span>
              </label>
              <input
                id="bk-nama"
                type="text"
                value={namaPelanggan}
                onChange={(e) => setNamaPelanggan(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 focus:outline-none"
              />
              {errors.namaPelanggan && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {errors.namaPelanggan}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="bk-telp"
                className="mb-1.5 block text-sm font-medium text-slate-800"
              >
                No. Telepon / WA <span className="text-red-600">*</span>
              </label>
              <input
                id="bk-telp"
                type="tel"
                value={noTelepon}
                onChange={(e) => setNoTelepon(e.target.value)}
                placeholder="Contoh: 0812-4400-1122"
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 focus:outline-none"
              />
              {errors.noTelepon && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {errors.noTelepon}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="bk-plat"
                className="mb-1.5 block text-sm font-medium text-slate-800"
              >
                Plat Nomor <span className="text-red-600">*</span>
              </label>
              <input
                id="bk-plat"
                type="text"
                value={platNomor}
                onChange={(e) => setPlatNomor(e.target.value.toUpperCase())}
                placeholder="Contoh: DB 1234 AB"
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3.5 py-2 font-mono text-sm uppercase text-slate-900 focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 focus:outline-none"
              />
              {errors.platNomor && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {errors.platNomor}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="bk-kendaraan"
                className="mb-1.5 block text-sm font-medium text-slate-800"
              >
                Tipe Kendaraan <span className="text-red-600">*</span>
              </label>
              <input
                id="bk-kendaraan"
                type="text"
                value={tipeKendaraan}
                onChange={(e) => setTipeKendaraan(e.target.value)}
                placeholder="Contoh: Toyota Avanza 2023"
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 focus:outline-none"
              />
              {errors.tipeKendaraan && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {errors.tipeKendaraan}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="bk-layanan"
              className="mb-1.5 block text-sm font-medium text-slate-800"
            >
              Jenis Layanan
            </label>
            <select
              id="bk-layanan"
              value={layanan}
              onChange={(e) => setLayanan(e.target.value as ServiceType)}
              className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 focus:outline-none"
            >
              {SERVICE_LIST.map((srv) => (
                <option key={srv} value={srv}>
                  {srv} (Estimasi {SERVICE_CONFIG[srv].estimasiDurasi})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="bk-tanggal"
                className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-800"
              >
                <Calendar className="h-4 w-4 text-slate-500" aria-hidden="true" />
                Tanggal
              </label>
              <input
                id="bk-tanggal"
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 focus:outline-none"
              />
              {errors.tanggal && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {errors.tanggal}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="bk-slot"
                className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-800"
              >
                <Clock className="h-4 w-4 text-slate-500" aria-hidden="true" />
                Slot Waktu
              </label>
              <select
                id="bk-slot"
                value={slotWaktu}
                onChange={(e) => setSlotWaktu(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 focus:outline-none"
              >
                {TIME_SLOTS.map((slot) => {
                  const used = countSlotBookings(bookings, tanggal, slot);
                  const penuh = used >= MAX_BAY_PER_SLOT;
                  return (
                    <option key={slot} value={slot}>
                      {slot} WITA — {penuh ? 'Penuh' : `Tersedia (${MAX_BAY_PER_SLOT - used} bay)`}
                    </option>
                  );
                })}
              </select>
              {errors.slotWaktu && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {errors.slotWaktu}
                </p>
              )}
            </div>
          </div>

          {/* Peringatan otomatis & saran slot terdekat jika slot penuh */}
          {slotFull && (
            <div
              role="status"
              className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div className="flex-1">
                  <p className="font-semibold">
                    Slot pukul {slotWaktu} pada {formatDateId(tanggal)} sudah penuh ({MAX_BAY_PER_SLOT}/{MAX_BAY_PER_SLOT} bay).
                  </p>
                  {suggestedSlot ? (
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-amber-800">
                        Slot terdekat tersedia:{' '}
                        <strong className="font-semibold">
                          {suggestedSlot.samaHari
                            ? `Hari yang sama pukul ${suggestedSlot.slotWaktu}`
                            : `${formatDateId(suggestedSlot.tanggal)} pukul ${suggestedSlot.slotWaktu}`}
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={handleApplySuggestion}
                        className="min-h-[40px] rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                      >
                        Pakai Slot {suggestedSlot.slotWaktu}
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-amber-800">
                      Silakan pilih tanggal lain yang masih kosong.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="bk-catatan"
              className="mb-1.5 block text-sm font-medium text-slate-800"
            >
              Catatan Keluhan / Permintaan (Opsional)
            </label>
            <textarea
              id="bk-catatan"
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Minta lampu warna putih 6000K, cek sekring foglamp"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 focus:outline-none"
            />
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetAndClose}
              className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[44px] rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
            >
              Simpan Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
