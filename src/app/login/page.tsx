'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Shield, ShieldAlert, Key, User, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { ToastContainer } from '@/components/ui/toast';

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useStore();
  const [roleInput, setRoleInput] = useState<'admin' | 'staff'>('admin');
  const [emailInput, setEmailInput] = useState('admin@atulglass.com');
  const [passwordInput, setPasswordInput] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleRoleChange = (role: 'admin' | 'staff') => {
    setRoleInput(role);
    if (role === 'admin') {
      setEmailInput('admin@atulglass.com');
      setPasswordInput('Admin@123');
    } else {
      setEmailInput('staff@atulglass.com');
      setPasswordInput('Staff@123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);

    try {
      const success = await login(emailInput, passwordInput, roleInput);
      if (success) {
        const target = roleInput === 'staff' ? '/quick-scan' : '/dashboard';
        router.push(target);
      } else {
        setAuthError('Invalid email or password. Please verify credentials.');
      }
    } catch {
      setAuthError('Authentication failed. Server unreachable or connection timed out.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans text-slate-900">
      <div className="w-full max-w-md bg-white border border-slate-300 rounded shadow-sm p-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center bg-blue-600 text-white font-mono font-black text-xl px-3 py-1 rounded mb-2">
            ATGA
          </div>
          <h1 className="text-lg font-bold text-slate-900">Atul Glass Agency</h1>
          <p className="text-xs text-slate-500">Automotive Safety Glass ERP System</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Wardhaman Nagar, Nagpur</p>
        </div>

        {/* Role Context Selector */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
            Account Role Context
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleRoleChange('admin')}
              className={`flex items-center justify-center space-x-1.5 py-2 px-3 text-xs font-semibold rounded border transition-colors cursor-pointer ${
                roleInput === 'admin'
                  ? 'bg-blue-50 border-blue-600 text-blue-700'
                  : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Administrator</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('staff')}
              className={`flex items-center justify-center space-x-1.5 py-2 px-3 text-xs font-semibold rounded border transition-colors cursor-pointer ${
                roleInput === 'staff'
                  ? 'bg-blue-50 border-blue-600 text-blue-700'
                  : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Counter Staff</span>
            </button>
          </div>
        </div>

        {authError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs flex items-center space-x-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-red-600" />
            <span>{authError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-xs bg-white text-slate-900 focus:outline-none focus:border-blue-600"
                placeholder="user@atulglass.com"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full pl-9 pr-9 py-2 border border-slate-300 rounded text-xs bg-white text-slate-900 focus:outline-none focus:border-blue-600"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Key className="h-4 w-4" />
            <span>{isLoading ? 'Verifying...' : 'Sign In to ERP'}</span>
          </button>
        </form>

        {/* Quick Credentials Card */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2 text-center">
            Default Credentials
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
            <div>
              <p className="font-bold text-slate-900">Admin</p>
              <p>admin@atulglass.com</p>
              <p className="text-slate-500">Admin@123</p>
            </div>
            <div>
              <p className="font-bold text-slate-900">Staff</p>
              <p>staff@atulglass.com</p>
              <p className="text-slate-500">Staff@123</p>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
