import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from './ui';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const { login, isLoading } = useApp();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  const fillDemo = () => {
    setEmail('olila.shop.admin@gmail.com');
    setPassword('OlilaGlass2026!');
  };

  return (
    <div className="flex min-h-screen">
      <div
        className="relative hidden w-1/2 overflow-hidden lg:block"
        style={{
          background:
            'linear-gradient(160deg,#0b3d2e 0%,#1b7a3a 45%,#0e5c3a 100%)',
        }}
      >
        <div className="absolute inset-0 flex flex-col justify-end p-10 text-white">
          <p className="mb-2 text-[13px] uppercase tracking-widest text-white/70">
            Olila Glass
          </p>
          <h2 className="mb-3 max-w-md text-3xl font-bold leading-tight">
            Manage plates, cups &amp; ceramic stock in one place.
          </h2>
          <p className="max-w-sm text-[15px] text-white/80">
            POS, inventory alerts, and sales reports built for your tableware
            shop.
          </p>
        </div>
      </div>
      <div
        className="flex w-full items-center justify-center px-6 py-10 lg:w-1/2"
        style={{ background: '#E6F2F4' }}
      >
        <div className="w-full max-w-[420px]">
          <div className="mb-4">
            <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full border-[3px] border-[#00a65a] text-[11px] font-bold leading-tight text-[#008d4c]">
              অলিলা
              <br />
              গ্লাস
            </div>
          </div>
          <h1
            style={{
              color: '#1e293b',
              fontWeight: 700,
              fontSize: 24,
              marginBottom: 8,
            }}
          >
            Olila Glass — Shop login
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>
            Sign in to manage catalog, stock, and counter sales.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-user"
                className="mb-1 block text-[13px] font-medium text-[#435966]"
              >
                Username or email
              </label>
              <input
                id="login-user"
                className="h-[46px] w-full rounded border border-[#ced4da] bg-white px-4 text-[15px]"
                placeholder="e.g. olila.shop.admin@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label
                htmlFor="login-pass"
                className="mb-1 block text-[13px] font-medium text-[#435966]"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-pass"
                  type={showPass ? 'text' : 'password'}
                  className="h-[46px] w-full rounded border border-[#ced4da] bg-white px-4 pr-16 text-[15px]"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={remember ? 'current-password' : 'off'}
                  required
                  minLength={4}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-[#6c757d]"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="h-[46px] w-full rounded bg-[#00a65a] text-[16px] font-semibold text-white hover:bg-[#008d4c] disabled:opacity-70"
            >
              {isLoading ? 'Signing in…' : 'Login'}
            </button>
            <div className="flex items-center justify-between text-[14px]">
              <label
                className="flex items-center gap-2"
                style={{ color: '#4b5563' }}
              >
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />{' '}
                Remember me
              </label>
              <button
                type="button"
                className="font-semibold text-[#2348C2]"
                onClick={() =>
                  toast.info('Ask your shop admin to reset the password.')
                }
              >
                Forgot password?
              </button>
            </div>
          </form>
          <p className="mt-6 text-center text-[13px] text-[#6c757d]">
            Shop admin:{' '}
            <button
              type="button"
              onClick={fillDemo}
              className="font-semibold text-[#00a65a] underline"
            >
              fill login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
