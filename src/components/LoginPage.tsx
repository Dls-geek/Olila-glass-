import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Mail } from 'lucide-react';
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
    <div className="flex min-h-screen items-center justify-center bg-[#e9ecef] p-4">
      <div className="w-full max-w-sm rounded-[4px] border border-[#dee2e6] bg-white p-6 shadow-card">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#28a745] text-center text-[11px] font-bold leading-tight text-[#1e7e34]">
            অলিলা
            <br />
            গ্লাস
          </div>
          <h1 className="text-lg font-semibold">Olila Glass</h1>
          <p className="text-[13px] text-[#6c757d]">Retail Manager</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="h-4 w-4" />}
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="h-4 w-4" />}
            autoComplete="current-password"
          />
          <Button type="submit" variant="success" fullWidth isLoading={isLoading}>
            {isLoading ? 'Signing in…' : 'Login'}
          </Button>
        </form>
        <p className="mt-4 text-center text-[12px] text-[#6c757d]">
          Demo: admin@shop.com / 1234
        </p>
      </div>
    </div>
  );
}
