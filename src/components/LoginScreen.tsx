import { FormEvent, useState } from 'react';
import { CarFront, Eye, EyeOff, Lock, User } from 'lucide-react';
import { DEMO_ACCOUNTS, WORKSHOP_INFO } from '../data/seedData';
import { DemoAccount } from '../types/erp';

interface LoginScreenProps {
  onLoginSuccess: (account: DemoAccount) => void;
}

// Halaman Login awal dengan 3 akun demo (pemilik, kasir, teknisi)
export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser || !password.trim()) {
      setError('Nama pengguna dan kata sandi wajib diisi.');
      return;
    }

    const found = DEMO_ACCOUNTS.find(
      (acc) => acc.username === cleanUser && acc.password === password
    );

    if (!found) {
      setError('Nama pengguna atau kata sandi salah. Silakan pilih akun demo di bawah.');
      return;
    }

    setError('');
    onLoginSuccess(found);
  };

  const handleQuickFill = (acc: DemoAccount) => {
    setUsername(acc.username);
    setPassword(acc.password);
    setError('');
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-md">
        {/* Identitas bengkel */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-orange-500 shadow-sm">
            <CarFront className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {WORKSHOP_INFO.nama} ERP
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {WORKSHOP_INFO.subjudul} · Manado
          </p>
        </div>

        {/* Kartu Form Login */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">Masuk ke Sistem</h2>
          <p className="mt-1 text-sm text-slate-600">
            Masukkan akun staf atau pemilik bengkel untuk melanjutkan.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            <div>
              <label
                htmlFor="login-username"
                className="mb-1.5 block text-sm font-medium text-slate-800"
              >
                Username
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: pemilik"
                  className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white py-2.5 pr-3.5 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-sm font-medium text-slate-800"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white py-2.5 pr-12 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                  className="absolute top-1/2 right-1 flex min-h-[40px] min-w-[40px] -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="min-h-[46px] w-full rounded-lg bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
            >
              Masuk
            </button>
          </form>

          {/* Daftar akun demo siap pakai */}
          <div className="mt-6 border-t border-slate-200 pt-5">
            <p className="text-xs font-semibold text-slate-500">
              Akun Demo (klik untuk isi otomatis):
            </p>
            <div className="mt-2.5 grid grid-cols-1 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleQuickFill(acc)}
                  className="flex min-h-[44px] items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-left transition-colors hover:border-orange-300 hover:bg-orange-50/50"
                >
                  <div>
                    <span className="text-sm font-semibold text-slate-900">
                      {acc.jabatan}
                    </span>
                    <span className="block text-xs text-slate-600">
                      {acc.namaLengkap}
                    </span>
                  </div>
                  <div className="text-right font-mono text-xs text-slate-700">
                    <div>{acc.username}</div>
                    <div className="text-slate-500">{acc.password}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-slate-500">
          {WORKSHOP_INFO.alamat}
        </p>
      </div>
    </div>
  );
}
