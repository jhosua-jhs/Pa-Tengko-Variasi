import { MAX_BAY_PER_SLOT, TIME_SLOTS } from '../data/seedData';
import {
  BookingJob,
  InventoryItem,
  ModuleId,
  StockLevelStatus,
  TransactionRecord,
  UsedComponent,
  UserRole,
} from '../types/erp';

// Format angka menjadi mata uang Rupiah yang rapi dan konsisten
export function formatRupiah(amount: number): string {
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('id-ID').format(rounded);
  return `Rp ${formatted}`;
}

// Normalisasi plat nomor menjadi huruf kapital dengan spasi standar (contoh: "DB 1234 AB")
export function normalizePlate(rawPlate: string): string {
  const compact = rawPlate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const match = compact.match(/^([A-Z]{1,2})(\d{1,4})([A-Z]{0,3})$/);
  if (!match) {
    return rawPlate.trim().toUpperCase().replace(/\s+/g, ' ');
  }
  const [, area, digits, suffix] = match;
  return suffix ? `${area} ${digits} ${suffix}` : `${area} ${digits}`;
}

// Validasi format plat nomor kendaraan Indonesia (contoh: DB 1234 AB)
export function validatePlate(rawPlate: string): { valid: boolean; message?: string; normalized: string } {
  const trimmed = rawPlate.trim();
  if (!trimmed) {
    return {
      valid: false,
      message: 'Plat nomor wajib diisi.',
      normalized: '',
    };
  }
  const normalized = normalizePlate(trimmed);
  const plateRegex = /^[A-Z]{1,2}\s\d{1,4}\s[A-Z]{1,3}$/;
  if (!plateRegex.test(normalized)) {
    return {
      valid: false,
      message: 'Format plat tidak valid. Gunakan contoh seperti "DB 1234 AB".',
      normalized,
    };
  }
  return { valid: true, normalized };
}

// Cek ketersediaan slot waktu pada tanggal tertentu
export function countSlotBookings(
  bookings: BookingJob[],
  tanggal: string,
  slotWaktu: string
): number {
  return bookings.filter(
    (b) => b.tanggal === tanggal && b.slotWaktu === slotWaktu
  ).length;
}

export function isSlotAvailable(
  bookings: BookingJob[],
  tanggal: string,
  slotWaktu: string,
  maxCapacity = MAX_BAY_PER_SLOT
): boolean {
  return countSlotBookings(bookings, tanggal, slotWaktu) < maxCapacity;
}

// Menyarankan slot terdekat jika slot yang dipilih penuh
export function findNearestAvailableSlot(
  bookings: BookingJob[],
  tanggal: string,
  requestedSlot: string,
  slots: readonly string[] = TIME_SLOTS,
  maxCapacity = MAX_BAY_PER_SLOT
): { tanggal: string; slotWaktu: string; samaHari: boolean } | null {
  const reqIdx = slots.indexOf(requestedSlot);
  const orderedIndices: number[] = [];

  for (let offset = 1; offset < slots.length; offset++) {
    if (reqIdx + offset < slots.length) orderedIndices.push(reqIdx + offset);
    if (reqIdx - offset >= 0) orderedIndices.push(reqIdx - offset);
  }

  for (const idx of orderedIndices) {
    const candidate = slots[idx];
    if (isSlotAvailable(bookings, tanggal, candidate, maxCapacity)) {
      return { tanggal, slotWaktu: candidate, samaHari: true };
    }
  }

  // Jika semua slot hari tersebut penuh, cari di hari berikutnya
  const nextDate = addDaysIso(tanggal, 1);
  for (const candidate of slots) {
    if (isSlotAvailable(bookings, nextDate, candidate, maxCapacity)) {
      return { tanggal: nextDate, slotWaktu: candidate, samaHari: false };
    }
  }

  return null;
}

export function addDaysIso(dateIso: string, days: number): string {
  const [y, m, d] = dateIso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

export function addMonthsIso(dateIso: string, months: number): string {
  const [y, m, d] = dateIso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1 + months, d));
  return date.toISOString().slice(0, 10);
}

// Menentukan status stok barang: Habis, Menipis, atau Aman
export function getStockStatus(item: Pick<InventoryItem, 'stok' | 'stokMinimum'>): StockLevelStatus {
  if (item.stok <= 0) return 'Habis';
  if (item.stok <= item.stokMinimum) return 'Menipis';
  return 'Aman';
}

// Validasi jumlah komponen yang dipilih teknisi agar tidak melebihi stok
export function validateComponentSelections(
  selections: UsedComponent[],
  inventory: InventoryItem[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const inventoryMap = new Map(inventory.map((item) => [item.id, item]));

  for (const sel of selections) {
    const stockItem = inventoryMap.get(sel.itemId);
    if (!stockItem) {
      errors.push(`Barang "${sel.namaBarang}" tidak ditemukan di daftar stok.`);
      continue;
    }
    if (!Number.isInteger(sel.qty) || sel.qty <= 0) {
      errors.push(`Jumlah "${stockItem.namaBarang}" minimal 1 ${stockItem.satuan}.`);
      continue;
    }
    if (sel.qty > stockItem.stok) {
      errors.push(
        `Jumlah "${stockItem.namaBarang}" (${sel.qty}) melebihi stok tersedia (${stockItem.stok} ${stockItem.satuan}).`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

// Kurangi stok komponen secara otomatis saat pengerjaan selesai
export function deductInventoryForJob(
  inventory: InventoryItem[],
  usedComponents: UsedComponent[]
): InventoryItem[] {
  const qtyById = new Map<string, number>();
  for (const comp of usedComponents) {
    qtyById.set(comp.itemId, (qtyById.get(comp.itemId) ?? 0) + comp.qty);
  }

  return inventory.map((item) => {
    const used = qtyById.get(item.id) ?? 0;
    if (used === 0) return item;
    return {
      ...item,
      stok: Math.max(0, item.stok - used),
    };
  });
}

// Hitung total biaya jasa, komponen, harga modal, dan estimasi laba
export function calculateJobTotals(
  biayaJasa: number,
  komponen: UsedComponent[]
): {
  totalJasa: number;
  totalKomponen: number;
  totalModalKomponen: number;
  grandTotal: number;
  estimasiLaba: number;
} {
  const totalKomponen = komponen.reduce(
    (sum, item) => sum + item.hargaSatuan * item.qty,
    0
  );
  const totalModalKomponen = komponen.reduce(
    (sum, item) => sum + item.hargaBeliSatuan * item.qty,
    0
  );
  const grandTotal = biayaJasa + totalKomponen;
  const estimasiLaba = grandTotal - totalModalKomponen;

  return {
    totalJasa: biayaJasa,
    totalKomponen,
    totalModalKomponen,
    grandTotal,
    estimasiLaba,
  };
}

// Cek apakah garansi masih aktif atau sudah kedaluwarsa berdasarkan tanggal referensi
export function computeWarrantyStatus(
  garansiBerakhirIso: string,
  referenceDateIso: string
): 'Aktif' | 'Kedaluwarsa' {
  return garansiBerakhirIso >= referenceDateIso ? 'Aktif' : 'Kedaluwarsa';
}

// Ringkasan metrik khusus Pemilik
export function computeOwnerMetrics(
  bookings: BookingJob[],
  transactions: TransactionRecord[],
  inventory: InventoryItem[],
  todayIso: string
): {
  kendaraanHariIni: number;
  pendapatanHariIni: number;
  pendapatanBulanIni: number;
  estimasiLabaBulanIni: number;
  jumlahStokMenipis: number;
} {
  const monthPrefix = todayIso.slice(0, 7);
  const kendaraanHariIni = bookings.filter((b) => b.tanggal === todayIso).length;

  const pendapatanHariIni = transactions
    .filter((t) => t.tanggalTransaksi === todayIso)
    .reduce((sum, t) => sum + t.totalBayar, 0);

  const trxBulanIni = transactions.filter((t) =>
    t.tanggalTransaksi.startsWith(monthPrefix)
  );

  const pendapatanBulanIni = trxBulanIni.reduce(
    (sum, t) => sum + t.totalBayar,
    0
  );
  const estimasiLabaBulanIni = trxBulanIni.reduce(
    (sum, t) => sum + (t.totalBayar - t.totalModalKomponen),
    0
  );

  const jumlahStokMenipis = inventory.filter(
    (item) => getStockStatus(item) !== 'Aman'
  ).length;

  return {
    kendaraanHariIni,
    pendapatanHariIni,
    pendapatanBulanIni,
    estimasiLabaBulanIni,
    jumlahStokMenipis,
  };
}

// Matriks hak akses ketat per peran (RBAC)
export function canAccessModule(role: UserRole, moduleId: ModuleId): boolean {
  switch (role) {
    case 'pemilik':
      return ['ringkasan', 'antrean', 'kasir', 'garansi-stok'].includes(moduleId);
    case 'kasir':
      return ['antrean', 'kasir', 'garansi-stok'].includes(moduleId);
    case 'teknisi':
      return ['antrean', 'pengerjaan', 'garansi-stok'].includes(moduleId);
    default:
      return false;
  }
}

// Generate nomor antrean berikutnya (contoh: A-010)
export function generateNextQueueNumber(bookings: BookingJob[]): string {
  const maxNum = bookings.reduce((max, item) => {
    const match = item.noAntrean.match(/(\d+)$/);
    const num = match ? parseInt(match[1], 10) : 0;
    return Math.max(max, num);
  }, 0);
  return `A-${String(maxNum + 1).padStart(3, '0')}`;
}

// Generate nomor nota baru (contoh: PV-20261125-002)
export function generateNextInvoiceNumber(
  transactions: TransactionRecord[],
  dateIso: string
): string {
  const datePart = dateIso.replace(/-/g, '');
  const sameDayCount = transactions.filter(
    (t) => t.tanggalTransaksi === dateIso
  ).length;
  return `PV-${datePart}-${String(sameDayCount + 1).padStart(3, '0')}`;
}

// Format tanggal YYYY-MM-DD menjadi format Indonesia ringkas
export function formatDateId(dateIso: string): string {
  const bulan = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ];
  const parts = dateIso.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return dateIso;
  const [y, m, d] = parts;
  return `${d} ${bulan[m - 1] ?? ''} ${y}`;
}
