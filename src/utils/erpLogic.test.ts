import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_BOOKINGS,
  INITIAL_INVENTORY,
  INITIAL_TRANSACTIONS,
  TODAY_DATE,
} from '../data/seedData';
import {
  addMonthsIso,
  calculateJobTotals,
  canAccessModule,
  computeOwnerMetrics,
  computeWarrantyStatus,
  deductInventoryForJob,
  findNearestAvailableSlot,
  formatRupiah,
  getStockStatus,
  isSlotAvailable,
  normalizePlate,
  validateComponentSelections,
  validatePlate,
} from './erpLogic';

test('formatRupiah formats Indonesian currency accurately', () => {
  assert.equal(formatRupiah(1250000), 'Rp 1.250.000');
  assert.equal(formatRupiah(0), 'Rp 0');
});

test('validatePlate accepts Sulawesi Utara plates and rejects malformed plates', () => {
  const ok = validatePlate('db1234ab');
  assert.equal(ok.valid, true);
  assert.equal(ok.normalized, 'DB 1234 AB');

  const empty = validatePlate('   ');
  assert.equal(empty.valid, false);

  const bad = validatePlate('12345');
  assert.equal(bad.valid, false);
  assert.equal(normalizePlate('db  8821mk'), 'DB 8821 MK');
});

test('slot availability detects full slot and suggests nearest open slot', () => {
  // Pada TODAY_DATE slot 09:00 sudah diisi job-101 & job-102 (kapasitas 2)
  assert.equal(isSlotAvailable(INITIAL_BOOKINGS, TODAY_DATE, '09:00'), false);
  assert.equal(isSlotAvailable(INITIAL_BOOKINGS, TODAY_DATE, '13:00'), true);

  // Slot 10:30 juga penuh (job-103 & job-104), sehingga saran terdekat harus ke 13:00
  const suggestion = findNearestAvailableSlot(INITIAL_BOOKINGS, TODAY_DATE, '09:00');
  assert.ok(suggestion);
  assert.equal(suggestion.tanggal, TODAY_DATE);
  assert.equal(suggestion.slotWaktu, '13:00');
  assert.equal(suggestion.samaHari, true);
});

test('stock status and component deduction enforce stock bounds', () => {
  assert.equal(getStockStatus({ stok: 0, stokMinimum: 2 }), 'Habis');
  assert.equal(getStockStatus({ stok: 2, stokMinimum: 3 }), 'Menipis');
  assert.equal(getStockStatus({ stok: 6, stokMinimum: 3 }), 'Aman');

  const overLimit = validateComponentSelections(
    [
      {
        itemId: 'inv-3',
        namaBarang: 'Foglamp LED Projector 3 Warna',
        qty: 5,
        hargaSatuan: 750000,
        hargaBeliSatuan: 480000,
      },
    ],
    INITIAL_INVENTORY
  );
  assert.equal(overLimit.valid, false);

  const validSel = validateComponentSelections(
    [
      {
        itemId: 'inv-1',
        namaBarang: 'Projector Bi-LED 3 Inch 60W (Sepasang)',
        qty: 2,
        hargaSatuan: 1650000,
        hargaBeliSatuan: 1150000,
      },
    ],
    INITIAL_INVENTORY
  );
  assert.equal(validSel.valid, true);

  const updatedInv = deductInventoryForJob(INITIAL_INVENTORY, [
    {
      itemId: 'inv-1',
      namaBarang: 'Projector Bi-LED 3 Inch 60W (Sepasang)',
      qty: 2,
      hargaSatuan: 1650000,
      hargaBeliSatuan: 1150000,
    },
  ]);
  const updatedItem = updatedInv.find((i) => i.id === 'inv-1');
  assert.equal(updatedItem?.stok, 4);
});

test('POS calculation, warranty expiry, and owner metrics are accurate', () => {
  const totals = calculateJobTotals(350000, [
    {
      itemId: 'inv-1',
      namaBarang: 'Projector Bi-LED',
      qty: 1,
      hargaSatuan: 1650000,
      hargaBeliSatuan: 1150000,
    },
  ]);
  assert.equal(totals.totalKomponen, 1650000);
  assert.equal(totals.grandTotal, 2000000);
  assert.equal(totals.estimasiLaba, 850000);

  assert.equal(addMonthsIso('2026-11-25', 12), '2027-11-25');
  assert.equal(computeWarrantyStatus('2027-11-25', TODAY_DATE), 'Aktif');
  assert.equal(computeWarrantyStatus('2026-10-15', TODAY_DATE), 'Kedaluwarsa');

  const metrics = computeOwnerMetrics(
    INITIAL_BOOKINGS,
    INITIAL_TRANSACTIONS,
    INITIAL_INVENTORY,
    TODAY_DATE
  );
  assert.equal(metrics.kendaraanHariIni, 8);
  assert.equal(metrics.pendapatanHariIni, 870000);
  assert.equal(metrics.pendapatanBulanIni, 5910000);
  assert.equal(metrics.jumlahStokMenipis, 3);
});

test('RBAC matrix strictly enforces module visibility per role', () => {
  assert.equal(canAccessModule('pemilik', 'ringkasan'), true);
  assert.equal(canAccessModule('pemilik', 'kasir'), true);
  assert.equal(canAccessModule('kasir', 'ringkasan'), false);
  assert.equal(canAccessModule('kasir', 'kasir'), true);
  assert.equal(canAccessModule('teknisi', 'kasir'), false);
  assert.equal(canAccessModule('teknisi', 'ringkasan'), false);
  assert.equal(canAccessModule('teknisi', 'pengerjaan'), true);
});
