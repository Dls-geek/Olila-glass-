import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from './ui';

export function LoginPage() {
  const [email, setEmail] = useState('Deshi Voj');
  const [password, setPassword] = useState('root');
  const [showPass, setShowPass] = useState(false);
  const { login, isLoading } = useApp();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (!success) {
      toast.error('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="flex min-h-screen">
      <div
        className="hidden w-1/2 bg-cover bg-center lg:block"
        style={{
          backgroundImage:
            'linear-gradient(160deg,#0b3d2e 0%,#1b7a3a 45%,#0e5c3a 100%)',
        }}
      />
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
          <h3
            style={{
              color: '#1e293b',
              fontWeight: 700,
              fontSize: 24,
              marginBottom: 10,
            }}
          >
            Sign Into Your Account
          </h3>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 30 }}>
            Welcome back! Please enter your details.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                className="h-[46px] w-full rounded border border-[#ced4da] bg-white px-4 text-[15px]"
                placeholder="username or email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                className="h-[46px] w-full rounded border border-[#ced4da] bg-white px-4 text-[15px]"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-5 top-3 text-[#6c757d]"
                onClick={() => setShowPass((v) => !v)}
              >
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="h-[46px] w-full rounded bg-[#00a65a] text-[16px] font-semibold text-white hover:bg-[#008d4c]"
            >
              {isLoading ? 'Login…' : 'Login'}
            </button>
            <div className="flex items-center justify-between text-[14px]">
              <label className="flex items-center gap-2" style={{ color: '#4b5563' }}>
                <input type="checkbox" /> Remember me
              </label>
              <span style={{ color: '#2348C2', fontWeight: 600 }}>
                Forgot Password?
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
