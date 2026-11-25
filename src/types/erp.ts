// Tipe data utama sistem Pa'tengko Variasi ERP

export type UserRole = 'pemilik' | 'kasir' | 'teknisi';

export type ModuleId =
  | 'ringkasan'
  | 'antrean'
  | 'pengerjaan'
  | 'kasir'
  | 'garansi-stok';

export type ServiceType =
  | 'Upgrade Headlamp/Foglamp'
  | 'Upgrade Stoplamp'
  | 'Upgrade Interior'
  | 'Upgrade Part Body';

export type JobStatus = 'Menunggu' | 'Dikerjakan' | 'Selesai';

export type PaymentMethod = 'Tunai' | 'Transfer' | 'QRIS';

export type StockLevelStatus = 'Aman' | 'Menipis' | 'Habis';

export interface DemoAccount {
  id: string;
  username: string;
  password: string;
  namaLengkap: string;
  defaultRole: UserRole;
  jabatan: string;
}

export interface RoleOption {
  role: UserRole;
  label: string;
  deskripsi: string;
  hakAkses: string[];
}

export interface UsedComponent {
  itemId: string;
  namaBarang: string;
  qty: number;
  hargaSatuan: number;
  hargaBeliSatuan: number;
}

export interface BookingJob {
  id: string;
  noAntrean: string;
  namaPelanggan: string;
  noTelepon: string;
  platNomor: string;
  tipeKendaraan: string;
  layanan: ServiceType;
  tanggal: string; // YYYY-MM-DD
  slotWaktu: string; // HH:mm
  status: JobStatus;
  catatan: string;
  teknisiPenanggungJawab?: string;
  biayaJasa: number;
  komponenDipakai: UsedComponent[];
  sudahDibayar: boolean;
  selesaiPada?: string;
}

export interface InventoryItem {
  id: string;
  kode: string;
  namaBarang: string;
  kategori: 'Pencahayaan' | 'Interior' | 'Eksterior & Body' | 'Kelistrikan';
  satuan: string;
  stok: number;
  stokMinimum: number;
  hargaBeli: number;
  hargaJual: number;
}

export interface TransactionRecord {
  id: string;
  noNota: string;
  jobId: string;
  noAntrean: string;
  tanggalTransaksi: string; // YYYY-MM-DD
  waktuTransaksi: string; // HH:mm
  namaPelanggan: string;
  noTelepon: string;
  platNomor: string;
  tipeKendaraan: string;
  layanan: ServiceType;
  biayaJasa: number;
  komponen: UsedComponent[];
  totalKomponen: number;
  totalModalKomponen: number;
  totalBayar: number;
  metodeBayar: PaymentMethod;
  namaKasir: string;
  garansiMulai: string; // YYYY-MM-DD
  garansiBerakhir: string; // YYYY-MM-DD
  durasiGaransiBulan: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
}
