import { ArrowRight, Check, LogOut, ShieldCheck, UserCheck, Wrench } from 'lucide-react';
import { ROLE_OPTIONS, WORKSHOP_INFO } from '../data/seedData';
import { DemoAccount, UserRole } from '../types/erp';

interface RoleSelectScreenProps {
  account: DemoAccount;
  onSelectRole: (role: UserRole) => void;
  onLogout: () => void;
}

// Layar pemilihan peran setelah login: Pemilik, Staf/Kasir, atau Teknisi
export function RoleSelectScreen({
  account,
  onSelectRole,
  onLogout,
}: RoleSelectScreenProps) {
  const iconForRole = (role: UserRole) => {
    if (role === 'pemilik') return <ShieldCheck className="h-6 w-6" aria-hidden="true" />;
    if (role === 'kasir') return <UserCheck className="h-6 w-6" aria-hidden="true" />;
    return <Wrench className="h-6 w-6" aria-hidden="true" />;
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header ringkas */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-sm font-medium text-orange-600">{WORKSHOP_INFO.nama} ERP</p>
            <h1 className="mt-0.5 text-2xl font-bold text-slate-900">
              Pilih Peran Kerja
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Masuk sebagai <span className="font-semibold text-slate-900">{account.namaLengkap}</span> ({account.jabatan}). Pilih ruang kerja sesuai tugas Anda.
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Keluar
          </button>
        </div>

        {/* 3 Opsi Peran */}
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {ROLE_OPTIONS.map((option) => {
            const isRecommended = option.role === account.defaultRole;
            return (
              <div
                key={option.role}
                className={`flex flex-col justify-between rounded-2xl border bg-white p-6 transition-shadow ${
                  isRecommended
                    ? 'border-orange-500 ring-2 ring-orange-500/15 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                        isRecommended
                          ? 'bg-orange-50 text-orange-600'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {iconForRole(option.role)}
                    </div>
                    {isRecommended && (
                      <span className="text-xs font-semibold text-orange-700">
                        Peran Akun Anda
                      </span>
                    )}
                  </div>

                  <h2 className="mt-4 text-lg font-bold text-slate-900">
                    {option.label}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {option.deskripsi}
                  </p>

                  <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                    {option.hakAkses.map((akses) => (
                      <li
                        key={akses}
                        className="flex items-start gap-2 text-xs text-slate-700"
                      >
                        <Check
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600"
                          aria-hidden="true"
                        />
                        <span>{akses}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectRole(option.role)}
                  className={`mt-6 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                    isRecommended
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  Masuk sebagai {option.label}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
