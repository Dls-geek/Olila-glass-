import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Mail, ShieldCheck, TrendingUp, Boxes } from 'lucide-react';
import { Button, Input, useToast } from './ui';

export function LoginPage() {
  const [email, setEmail] = useState('admin@shop.com');
  const [password, setPassword] = useState('1234');
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
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-700 p-12 text-white lg:flex">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35) 0, transparent 45%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.25) 0, transparent 40%)',
          }}
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-lg font-bold ring-1 ring-white/25">
            O
          </div>
          <div>
            <p className="text-lg font-bold leading-tight">Olila Glass</p>
            <p className="text-sm text-white/70">Retail Manager</p>
          </div>
        </div>

        <div className="relative">
          <h2 className="max-w-md text-3xl font-bold leading-tight">
            Run your glassware store with clarity and confidence.
          </h2>
          <p className="mt-4 max-w-md text-white/70">
            Billing, inventory, and sales insights in one clean, fast workspace
            built for everyday retail.
          </p>
          <div className="mt-10 space-y-4">
            {[
              { icon: TrendingUp, text: 'Real-time sales and revenue overview' },
              { icon: Boxes, text: 'Automatic stock tracking on every sale' },
              { icon: ShieldCheck, text: 'Fast, reliable point-of-sale billing' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm text-white/85">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/50">
          © {new Date().getFullYear()} Olila Glass. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-1 items-center justify-center bg-canvas p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
              O
            </div>
            <h1 className="text-xl font-bold text-slate-900">Olila Glass</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-500">
              Sign in to your store dashboard to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email address"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@store.com"
              icon={<Mail className="h-5 w-5" />}
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock className="h-5 w-5" />}
              autoComplete="current-password"
            />
            <Button
              type="submit"
              size="lg"
              fullWidth
              isLoading={isLoading}
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-center text-sm text-slate-500">
              <span className="font-semibold text-slate-700">
                Demo credentials
              </span>
              <br />
              admin@shop.com&nbsp;·&nbsp;password 1234
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
