import { useCallback, useMemo, useState } from 'react';
import { AppLayout } from './components/AppLayout';
import { CashierPosView } from './components/CashierPosView';
import { LoginScreen } from './components/LoginScreen';
import { OwnerSummaryView } from './components/OwnerSummaryView';
import { QueueView } from './components/QueueView';
import { RoleSelectScreen } from './components/RoleSelectScreen';
import { TechnicianWorkView } from './components/TechnicianWorkView';
import { ToastContainer } from './components/ToastContainer';
import { WarrantyAndStockView } from './components/WarrantyAndStockView';
import {
  INITIAL_BOOKINGS,
  INITIAL_INVENTORY,
  INITIAL_TRANSACTIONS,
  SERVICE_CONFIG,
  TODAY_DATE,
} from './data/seedData';
import {
  BookingJob,
  DemoAccount,
  InventoryItem,
  JobStatus,
  ModuleId,
  PaymentMethod,
  ServiceType,
  ToastMessage,
  TransactionRecord,
  UsedComponent,
  UserRole,
} from './types/erp';
import {
  addMonthsIso,
  calculateJobTotals,
  canAccessModule,
  deductInventoryForJob,
  generateNextInvoiceNumber,
  generateNextQueueNumber,
  getStockStatus,
} from './utils/erpLogic';

function defaultModuleForRole(role: UserRole): ModuleId {
  if (role === 'pemilik') return 'ringkasan';
  if (role === 'kasir') return 'antrean';
  return 'antrean';
}

export default function App() {
  const [loggedInAccount, setLoggedInAccount] = useState<DemoAccount | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleId>('antrean');

  const [bookings, setBookings] = useState<BookingJob[]>(INITIAL_BOOKINGS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [transactions, setTransactions] =
    useState<TransactionRecord[]>(INITIAL_TRANSACTIONS);

  const [selectedTechJobId, setSelectedTechJobId] = useState<string | null>(null);
  const [selectedPosJobId, setSelectedPosJobId] = useState<string | null>(null);
  const [isLoadingView, setIsLoadingView] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback(
    (
      type: ToastMessage['type'],
      title: string,
      description?: string
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, title, description }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const lowStockCount = useMemo(
    () => inventory.filter((item) => getStockStatus(item) !== 'Aman').length,
    [inventory]
  );

  const handleLoginSuccess = (account: DemoAccount) => {
    setLoggedInAccount(account);
    setActiveRole(null);
    pushToast('success', 'Berhasil Masuk', `Selamat datang, ${account.namaLengkap}.`);
  };

  const handleSelectRole = (role: UserRole) => {
    setActiveRole(role);
    setActiveModule(defaultModuleForRole(role));
    setIsLoadingView(true);
    setTimeout(() => setIsLoadingView(false), 180);
  };

  const handleLogout = () => {
    setLoggedInAccount(null);
    setActiveRole(null);
    setSelectedTechJobId(null);
    setSelectedPosJobId(null);
    pushToast('info', 'Keluar dari Sistem', 'Sesi Anda telah berakhir.');
  };

  const handleNavigate = (moduleId: ModuleId) => {
    if (!activeRole || !canAccessModule(activeRole, moduleId)) {
      pushToast('error', 'Akses Ditolak', 'Peran Anda tidak memiliki akses ke menu ini.');
      return;
    }
    setActiveModule(moduleId);
  };

  // Tambah booking atau walk-in baru
  const handleAddBooking = (data: {
    namaPelanggan: string;
    noTelepon: string;
    platNomor: string;
    tipeKendaraan: string;
    layanan: ServiceType;
    tanggal: string;
    slotWaktu: string;
    catatan: string;
  }) => {
    const nextNo = generateNextQueueNumber(bookings);
    const newJob: BookingJob = {
      id: `job-${Date.now()}`,
      noAntrean: nextNo,
      namaPelanggan: data.namaPelanggan,
      noTelepon: data.noTelepon,
      platNomor: data.platNomor,
      tipeKendaraan: data.tipeKendaraan,
      layanan: data.layanan,
      tanggal: data.tanggal,
      slotWaktu: data.slotWaktu,
      status: 'Menunggu',
      catatan: data.catatan,
      biayaJasa: SERVICE_CONFIG[data.layanan].biayaJasaDefault,
      komponenDipakai: [],
      sudahDibayar: false,
    };

    setBookings((prev) => [newJob, ...prev]);
    pushToast(
      'success',
      `Booking ${nextNo} Ditambahkan`,
      `${data.platNomor} (${data.namaPelanggan}) dijadwalkan pukul ${data.slotWaktu}.`
    );
  };

  // Teknisi menyimpan catatan & komponen sementara
  const handleSaveTechDraft = (
    jobId: string,
    catatan: string,
    komponen: UsedComponent[]
  ) => {
    setBookings((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? {
              ...job,
              catatan,
              komponenDipakai: komponen,
              teknisiPenanggungJawab: loggedInAccount?.namaLengkap ?? 'Teknisi',
            }
          : job
      )
    );
    pushToast('success', 'Data Pengerjaan Disimpan', 'Catatan dan komponen telah diperbarui.');
  };

  // Teknisi mengubah status berurutan; stok berkurang otomatis saat Selesai
  const handleAdvanceJobStatus = (
    jobId: string,
    nextStatus: JobStatus,
    catatan: string,
    komponen: UsedComponent[]
  ) => {
    if (nextStatus === 'Selesai') {
      setInventory((prevInv) => deductInventoryForJob(prevInv, komponen));
    }

    setBookings((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? {
              ...job,
              status: nextStatus,
              catatan,
              komponenDipakai: komponen,
              teknisiPenanggungJawab: loggedInAccount?.namaLengkap ?? 'Teknisi',
              selesaiPada:
                nextStatus === 'Selesai' ? `${TODAY_DATE} 11:30` : job.selesaiPada,
            }
          : job
      )
    );

    pushToast(
      'success',
      `Status Diperbarui ke ${nextStatus}`,
      nextStatus === 'Selesai'
        ? 'Stok komponen otomatis dikurangi dan unit siap diproses Kasir.'
        : 'Pengerjaan kendaraan sedang berlangsung.'
    );
  };

  // Kasir menyimpan transaksi & mencatat garansi otomatis
  const handleCompleteTransaction = (
    jobId: string,
    metodeBayar: PaymentMethod
  ): TransactionRecord | null => {
    const job = bookings.find((b) => b.id === jobId);
    if (!job || job.sudahDibayar) return null;

    const totals = calculateJobTotals(job.biayaJasa, job.komponenDipakai);
    const durasiGaransiBulan = SERVICE_CONFIG[job.layanan].garansiBulan;
    const garansiMulai = TODAY_DATE;
    const garansiBerakhir = addMonthsIso(garansiMulai, durasiGaransiBulan);
    const noNota = generateNextInvoiceNumber(transactions, TODAY_DATE);

    const newTrx: TransactionRecord = {
      id: `trx-${Date.now()}`,
      noNota,
      jobId: job.id,
      noAntrean: job.noAntrean,
      tanggalTransaksi: TODAY_DATE,
      waktuTransaksi: '11:45',
      namaPelanggan: job.namaPelanggan,
      noTelepon: job.noTelepon,
      platNomor: job.platNomor,
      tipeKendaraan: job.tipeKendaraan,
      layanan: job.layanan,
      biayaJasa: job.biayaJasa,
      komponen: job.komponenDipakai,
      totalKomponen: totals.totalKomponen,
      totalModalKomponen: totals.totalModalKomponen,
      totalBayar: totals.grandTotal,
      metodeBayar,
      namaKasir: loggedInAccount?.namaLengkap ?? 'Kasir',
      garansiMulai,
      garansiBerakhir,
      durasiGaransiBulan,
    };

    setTransactions((prev) => [newTrx, ...prev]);
    setBookings((prev) =>
      prev.map((b) => (b.id === jobId ? { ...b, sudahDibayar: true } : b))
    );

    pushToast(
      'success',
      `Nota ${noNota} Tersimpan`,
      `Pembayaran ${metodeBayar} lunas & garansi ${job.platNomor} aktif.`
    );

    return newTrx;
  };

  // Pemilik menyesuaikan stok barang
  const handleAdjustStock = (itemId: string, delta: number) => {
    if (activeRole !== 'pemilik') return;
    let adjustedName = '';
    let newQty = 0;

    setInventory((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        adjustedName = item.namaBarang;
        newQty = Math.max(0, item.stok + delta);
        return { ...item, stok: newQty };
      })
    );

    if (adjustedName) {
      pushToast(
        'info',
        'Stok Diperbarui',
        `${adjustedName} sekarang berjumlah ${newQty}.`
      );
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {!loggedInAccount ? (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      ) : !activeRole ? (
        <RoleSelectScreen
          account={loggedInAccount}
          onSelectRole={handleSelectRole}
          onLogout={handleLogout}
        />
      ) : (
        <AppLayout
          account={loggedInAccount}
          activeRole={activeRole}
          activeModule={activeModule}
          lowStockCount={lowStockCount}
          onSelectModule={handleNavigate}
          onSwitchRole={() => setActiveRole(null)}
          onLogout={handleLogout}
        >
          {activeModule === 'ringkasan' && activeRole === 'pemilik' && (
            <OwnerSummaryView
              bookings={bookings}
              transactions={transactions}
              inventory={inventory}
              onNavigate={handleNavigate}
            />
          )}

          {activeModule === 'antrean' && (
            <QueueView
              role={activeRole}
              bookings={bookings}
              isLoading={isLoadingView}
              onAddBooking={handleAddBooking}
              onOpenJobForTech={(jobId) => {
                setSelectedTechJobId(jobId);
                handleNavigate('pengerjaan');
              }}
              onOpenJobForPos={(jobId) => {
                setSelectedPosJobId(jobId);
                handleNavigate('kasir');
              }}
            />
          )}

          {activeModule === 'pengerjaan' && activeRole === 'teknisi' && (
            <TechnicianWorkView
              bookings={bookings}
              inventory={inventory}
              selectedJobId={selectedTechJobId}
              onSelectJob={setSelectedTechJobId}
              onSaveDraft={handleSaveTechDraft}
              onAdvanceStatus={handleAdvanceJobStatus}
            />
          )}

          {activeModule === 'kasir' &&
            (activeRole === 'kasir' || activeRole === 'pemilik') && (
              <CashierPosView
                bookings={bookings}
                transactions={transactions}
                selectedJobId={selectedPosJobId}
                onSelectJob={setSelectedPosJobId}
                onCompleteTransaction={handleCompleteTransaction}
              />
            )}

          {activeModule === 'garansi-stok' && (
            <WarrantyAndStockView
              role={activeRole}
              transactions={transactions}
              inventory={inventory}
              onAdjustStock={handleAdjustStock}
            />
          )}
        </AppLayout>
      )}
    </>
  );
}
