import { ReactNode } from 'react';
import {
  BarChart3,
  CarFront,
  ClipboardList,
  LogOut,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { WORKSHOP_INFO } from '../data/seedData';
import { DemoAccount, ModuleId, UserRole } from '../types/erp';
import { canAccessModule } from '../utils/erpLogic';

interface NavItem {
  id: ModuleId;
  label: string;
  shortLabel: string;
  icon: typeof ClipboardList;
}

const ALL_NAV_ITEMS: NavItem[] = [
  {
    id: 'ringkasan',
    label: 'Ringkasan Pemilik',
    shortLabel: 'Ringkasan',
    icon: BarChart3,
  },
  {
    id: 'antrean',
    label: 'Antrean & Booking',
    shortLabel: 'Antrean',
    icon: ClipboardList,
  },
  {
    id: 'pengerjaan',
    label: 'Detail Pengerjaan',
    shortLabel: 'Kerjakan',
    icon: Wrench,
  },
  {
    id: 'kasir',
    label: 'Kasir / POS & Nota',
    shortLabel: 'Kasir',
    icon: Receipt,
  },
  {
    id: 'garansi-stok',
    label: 'Garansi & Stok',
    shortLabel: 'Garansi/Stok',
    icon: ShieldCheck,
  },
];

const ROLE_LABELS: Record<UserRole, string> = {
  pemilik: 'Pemilik',
  kasir: 'Staf / Kasir',
  teknisi: 'Teknisi',
};

interface AppLayoutProps {
  account: DemoAccount;
  activeRole: UserRole;
  activeModule: ModuleId;
  lowStockCount: number;
  onSelectModule: (moduleId: ModuleId) => void;
  onSwitchRole: () => void;
  onLogout: () => void;
  children: ReactNode;
}

// Kerangka utama aplikasi: Sidebar di desktop dan Bottom Nav di mobile
export function AppLayout({
  account,
  activeRole,
  activeModule,
  lowStockCount,
  onSelectModule,
  onSwitchRole,
  onLogout,
  children,
}: AppLayoutProps) {
  const allowedNavItems = ALL_NAV_ITEMS.filter((item) =>
    canAccessModule(activeRole, item.id)
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar Desktop (>= md) */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-orange-500">
            <CarFront className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-slate-900">
              {WORKSHOP_INFO.nama}
            </div>
            <div className="truncate text-xs text-slate-500">Manado · ERP</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3" aria-label="Navigasi utama">
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectModule(item.id)}
                className={`flex min-h-[44px] w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-left text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-orange-50 font-semibold text-orange-700'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? 'text-orange-600' : 'text-slate-500'
                    }`}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </span>
                {item.id === 'garansi-stok' && lowStockCount > 0 && (
                  <span className="tabular-nums text-xs font-semibold text-amber-700">
                    {lowStockCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-3 space-y-2">
          <button
            type="button"
            onClick={onSwitchRole}
            className="flex min-h-[44px] w-full items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4 text-slate-500" aria-hidden="true" />
            Ganti Peran
          </button>
        </div>
      </aside>

      {/* Wrapper Konten Utama */}
      <div className="flex min-h-screen flex-col md:pl-64">
        {/* Top Header Sticky (ringkas, tinggi <= 56px di mobile) */}
        <header className="no-print sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-3 backdrop-blur-sm sm:h-16 sm:gap-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-orange-500 md:hidden">
              <CarFront className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-sm font-bold text-slate-900 sm:hidden">
                Pa&apos;tengko
              </span>
              <span className="hidden truncate text-sm font-bold text-slate-900 sm:block md:hidden">
                {WORKSHOP_INFO.nama}
              </span>
              <span className="hidden text-sm font-semibold text-slate-900 md:block">
                {allowedNavItems.find((i) => i.id === activeModule)?.label ?? 'Dashboard'}
              </span>
            </div>
          </div>

          {/* Info Pengguna + Peran + Tombol Keluar */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="text-right">
              <div className="max-w-[112px] truncate text-xs font-semibold text-slate-900 sm:max-w-none sm:text-sm">
                {account.namaLengkap}
              </div>
              <div className="text-[11px] font-medium text-orange-700 sm:text-xs">
                {ROLE_LABELS[activeRole]}
              </div>
            </div>
            <button
              type="button"
              onClick={onSwitchRole}
              aria-label="Ganti peran"
              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 md:hidden"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 sm:min-h-[44px] sm:px-3.5 sm:text-sm whitespace-nowrap shrink-0"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>Keluar</span>
            </button>
          </div>
        </header>

        {/* Konten Halaman */}
        <main className="flex-1 px-4 py-5 pb-24 sm:px-6 sm:py-6 md:pb-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      {/* Bottom Navigation Mobile (< md) */}
      <nav
        aria-label="Navigasi bawah mobile"
        className="no-print fixed right-0 bottom-0 left-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md md:hidden"
      >
        <div
          className="grid h-16 items-center"
          style={{
            gridTemplateColumns: `repeat(${allowedNavItems.length}, minmax(0, 1fr))`,
          }}
        >
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectModule(item.id)}
                className={`relative flex min-h-[48px] flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-orange-600 font-semibold' : 'text-slate-600'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="truncate max-w-full">{item.shortLabel}</span>
                {item.id === 'garansi-stok' && lowStockCount > 0 && (
                  <span className="absolute top-1.5 right-1/4 rounded-full bg-amber-600 px-1.5 text-[10px] font-bold text-white tabular-nums">
                    {lowStockCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
