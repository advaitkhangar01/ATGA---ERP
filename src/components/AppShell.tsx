'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { hydrateStore } from '@/actions/db';
import { ToastContainer } from '@/components/ui/toast';
import {
  LayoutDashboard,
  Boxes,
  Database,
  ArrowLeftRight,
  Scan,
  AlertOctagon,
  TrendingDown,
  Barcode,
  ClipboardCheck,
  Wrench,
  FileSpreadsheet,
  BarChart3,
  Users2,
  FileClock,
  Settings,
  LogOut,
  MapPin,
  Shield,
  User as UserIcon,
  ChevronRight
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly: boolean;
  description: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, adminOnly: false, description: 'Operational metrics & alerts' },
  { name: 'Inventory Registry', href: '/inventory', icon: Boxes, adminOnly: false, description: 'Active glass stock & bins' },
  { name: 'Products Catalog', href: '/products', icon: Database, adminOnly: true, description: 'Safety glass models CRUD' },
  { name: 'Stock Operations', href: '/stock-operations', icon: ArrowLeftRight, adminOnly: false, description: 'Stock In & Stock Out' },
  { name: 'Quick Scanner', href: '/quick-scan', icon: Scan, adminOnly: false, description: 'Hardware scanner dispatch/inward' },
  { name: 'Defective Glass', href: '/defective', icon: AlertOctagon, adminOnly: false, description: 'Quarantine & scrap write-offs' },
  { name: 'Low Stock Alerts', href: '/low-stock', icon: TrendingDown, adminOnly: false, description: 'Minimum safety thresholds' },
  { name: 'Barcode Printing', href: '/barcodes', icon: Barcode, adminOnly: false, description: 'Label preview & browser print' },
  { name: 'Physical Audit', href: '/audit', icon: ClipboardCheck, adminOnly: true, description: 'Cycle count reconciliation' },
  { name: 'SKU Naming Engine', href: '/sku-engine', icon: Wrench, adminOnly: false, description: 'Standard SKU builder' },
  { name: 'CSV Migration', href: '/migration', icon: FileSpreadsheet, adminOnly: true, description: 'Legacy catalog import' },
  { name: 'Reports & Valuation', href: '/reports', icon: BarChart3, adminOnly: true, description: 'Stock turnover & scrap loss' },
  { name: 'User Management', href: '/users', icon: Users2, adminOnly: true, description: 'Staff credentials & roles' },
  { name: 'Activity Logs', href: '/activity-logs', icon: FileClock, adminOnly: true, description: 'Immutable ledger audit trail' },
  { name: 'System Settings', href: '/settings', icon: Settings, adminOnly: true, description: 'Warehouse identity & defaults' }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, setHydratedData } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Initial data hydration from database
    hydrateStore().then((data) => {
      setHydratedData(data);
    }).catch((err) => {
      console.error('Failed to hydrate database:', err);
    });
  }, [setHydratedData]);

  // Handle redirect if unauthenticated
  useEffect(() => {
    if (mounted && !user) {
      router.push('/login');
    }
  }, [mounted, user, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const currentNav = navItems.find((item) => item.href === pathname);
  const userRole = user?.role || 'staff';
  const visibleItems = navItems.filter((item) => !item.adminOnly || userRole === 'admin');

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 overflow-hidden font-sans">
      {/* FIXED SIDEBAR */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="bg-blue-600 text-white font-mono font-black text-sm px-2 py-1 rounded">
              ATGA
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white tracking-wider uppercase">Atul Glass</span>
              <span className="text-[10px] text-slate-400">Inventory ERP</span>
            </div>
          </div>
          <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
            userRole === 'admin'
              ? 'bg-purple-950 text-purple-300 border-purple-800'
              : 'bg-blue-950 text-blue-300 border-blue-800'
          }`}>
            {userRole}
          </span>
        </div>

        {/* Outlet Location Indicator */}
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center space-x-1.5 text-slate-400 text-[11px]">
          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
          <span className="truncate">Nagpur Central Warehouse</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 text-xs rounded transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex flex-col space-y-2">
          <div className="flex items-center space-x-2 px-2 py-1">
            <div className="w-7 h-7 bg-slate-800 rounded flex items-center justify-center text-slate-200">
              <UserIcon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{user?.email || 'Logged in'}</p>
              <p className="text-[10px] text-slate-500 capitalize">{userRole} Access</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-1.5 text-xs text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <span className="text-slate-400">Home</span>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="font-semibold text-slate-900">{currentNav?.name || 'Dashboard'}</span>
            {currentNav?.description && (
              <span className="text-slate-400 hidden md:inline">— {currentNav.description}</span>
            )}
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded text-slate-700">
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              <span className="font-medium text-[11px]">Online (Live Session)</span>
            </div>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#f8fafc]">
          {children}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
