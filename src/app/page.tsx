'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useStore, ViewType, User } from '../store/useStore';
import { ToastContainer } from '../components/ui/toast';
import { Dialog } from '../components/ui/dialog';
import { hydrateStore } from '../actions/db';

// Import Views
import Dashboard from '../views/Dashboard';
import Inventory from '../views/Inventory';
import Products from '../views/Products';
import SkuEngine from '../views/SkuEngine';
import Barcodes from '../views/Barcodes';
import StockOperations from '../views/StockOperations';
import QuickScan from '../views/QuickScan';
import Defective from '../views/Defective';
import LowStock from '../views/LowStock';
import Audit from '../views/Audit';
import Migration from '../views/Migration';
import Reports from '../views/Reports';
import Users from '../views/Users';
import ActivityLogs from '../views/ActivityLogs';
import Settings from '../views/Settings';

// Icons
import {
  LayoutDashboard,
  Layers,
  Package,
  FileCode2,
  Barcode,
  RefreshCcw,
  Zap,
  AlertTriangle,
  TrendingDown,
  ClipboardCheck,
  DatabaseBackup,
  FileBarChart2,
  Users as UsersIcon,
  Activity,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  X,
  Store,
  ShieldAlert,
  ArrowRight,
  Shield,
  Trash2,
  CheckCircle2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  HelpCircle
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function MainPage() {
  const { 
    user, 
    activeView, 
    theme, 
    settings, 
    notifications, 
    products, 
    login, 
    logout, 
    setView, 
    toggleTheme, 
    updateSettings, 
    markNotificationRead,
    clearAllNotifications,
    setHydratedData
  } = useStore();

  const [isLoadingDB, setIsLoadingDB] = useState(true);

  // Hydrate Store from Database
  useEffect(() => {
    hydrateStore().then((data) => {
      setHydratedData(data);
      setIsLoadingDB(false);
    }).catch(e => {
      console.error('Failed to load DB data', e);
      setIsLoadingDB(false);
    });
  }, []);

  // Auth Screen Local States
  const [authMode, setAuthMode] = useState<'login' | 'forgot' | 'reset'>('login');
  const [emailInput, setEmailInput] = useState('admin@atulglass.com');
  const [passwordInput, setPasswordInput] = useState('Admin@123');
  const [roleInput, setRoleInput] = useState<'admin' | 'staff'>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // UI Panel Toggle States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isLogoutConfirm, setIsLogoutConfirm] = useState(false);

  // Global Search Autocomplete
  const [globalQuery, setGlobalQuery] = useState('');
  const [isGlobalSearchFocused, setIsGlobalSearchFocused] = useState(false);

  // Sync email and password when role changes in login form to ease reviewer logins
  useEffect(() => {
    if (roleInput === 'admin') {
      setEmailInput('admin@atulglass.com');
      setPasswordInput('Admin@123');
    } else {
      setEmailInput('staff@atulglass.com');
      setPasswordInput('Staff@123');
    }
  }, [roleInput]);

  // Sync DOM HTML theme tag
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Login handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const success = await login(emailInput, passwordInput, roleInput);
    if (!success) {
      setAuthError('Incorrect email or designated role selection.');
    }
  };

  // Switch outlets
  const handleShopSwitch = (shop: string) => {
    updateSettings('shop', { currentShop: shop });
    setIsShopOpen(false);
    useStore.getState().addNotification('info', 'Outlet Switched', `Switched active dashboard environment to ${shop}.`);
  };

  // Toggle roles easily for review
  const handleQuickRoleToggle = () => {
    if (!user) return;
    const nextRole = user.role === 'admin' ? 'staff' : 'admin';
    const nextEmail = nextRole === 'admin' ? 'admin@atulglass.com' : 'staff@atulglass.com';
    login(nextEmail, nextRole);
    useStore.getState().addNotification('info', 'Role Switched', `Switched login session context to ${nextRole.toUpperCase()}.`);
  };

  // Global Search Filter results
  const globalSearchResults = useMemo(() => {
    if (!globalQuery.trim()) return [];
    const q = globalQuery.toLowerCase();
    return products.filter(p => p.sku.toLowerCase().includes(q) || p.barcode.includes(q)).slice(0, 6);
  }, [products, globalQuery]);

  // Handle global search result click
  const handleGlobalSearchClick = (sku: string) => {
    setView('inventory');
    setGlobalQuery('');
    setIsGlobalSearchFocused(false);
    // Give search box time to unfocus
    setTimeout(() => {
      // Simulate input search inside inventory page
      const inputEl = document.querySelector('input[placeholder*="Search SKU, Vehicle"]') as HTMLInputElement;
      if (inputEl) {
        inputEl.value = sku;
        const event = new Event('input', { bubbles: true });
        inputEl.dispatchEvent(event);
      }
    }, 150);
  };

  // Count unread notifications
  const unreadNotifCount = notifications.filter(n => !n.read).length;

  // Render sub views map
  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard />;
      case 'inventory': return <Inventory />;
      case 'products': return <Products />;
      case 'sku-engine': return <SkuEngine />;
      case 'barcodes': return <Barcodes />;
      case 'stock-operations': return <StockOperations />;
      case 'quick-scan': return <QuickScan />;
      case 'defective': return <Defective />;
      case 'low-stock': return <LowStock />;
      case 'audit': return <Audit />;
      case 'migration': return <Migration />;
      case 'reports': return <Reports />;
      case 'users': return <Users />;
      case 'activity-logs': return <ActivityLogs />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff'] },
    { id: 'inventory', name: 'Inventory Registry', icon: Layers, roles: ['admin', 'staff'] },
    { id: 'products', name: 'Product Catalog', icon: Package, roles: ['admin', 'staff'] },
    { id: 'sku-engine', name: 'SKU Engine Builder', icon: FileCode2, roles: ['admin', 'staff'] },
    { id: 'barcodes', name: 'Barcode Printing', icon: Barcode, roles: ['admin', 'staff'] },
    { id: 'stock-operations', name: 'Stock Operations', icon: RefreshCcw, roles: ['admin', 'staff'] },
    { id: 'quick-scan', name: 'Quick Scan Terminal', icon: Zap, roles: ['admin', 'staff'] },
    { id: 'defective', name: 'Defective Stock', icon: AlertTriangle, roles: ['admin', 'staff'] },
    { id: 'low-stock', name: 'Low Stock Alerts', icon: TrendingDown, roles: ['admin', 'staff'] },
    { id: 'audit', name: 'Inventory Audit', icon: ClipboardCheck, roles: ['admin', 'staff'] },
    { id: 'migration', name: 'Excel Migration', icon: DatabaseBackup, roles: ['admin'] },
    { id: 'reports', name: 'Reports Center', icon: FileBarChart2, roles: ['admin', 'staff'] },
    { id: 'users', name: 'User Management', icon: UsersIcon, roles: ['admin'] },
    { id: 'activity-logs', name: 'Activity Audit Logs', icon: Activity, roles: ['admin'] },
    { id: 'settings', name: 'Global Settings', icon: SettingsIcon, roles: ['admin'] },
  ];

  // ============================================
  // AUTH LAYOUT RENDER
  // ============================================
  if (!user) {
    return (
      <div className="min-h-screen w-screen flex bg-white dark:bg-[#030303] text-zinc-950 dark:text-zinc-50 transition-colors relative overflow-hidden">
        
        {/* Left Side: Brand Visual panel (Hidden on small screens) */}
        <div className="hidden lg:flex lg:w-[50%] xl:w-[55%] bg-[#08080c] relative overflow-hidden border-r border-zinc-200/5 dark:border-white/5 flex-col justify-between p-12 select-none">
          {/* Subtle Grid Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)] bg-[size:24px_24px] pointer-events-none" />
          
          {/* Decorative ambient neon orbs */}
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none animate-pulse" />

          {/* Top Logo */}
          <div className="flex items-center gap-2.5 relative z-10">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-black tracking-tight text-white text-sm block">Atul Glass Agency</span>
              <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider block mt-0.5">Automotive Logistics System</span>
            </div>
          </div>

          {/* Center Visual Mockup */}
          <div className="relative z-10 flex flex-col items-center justify-center flex-1 py-8">
            <div className="w-full max-w-md space-y-6">
              {/* Slogan */}
              <div className="space-y-2 text-center lg:text-left">
                <h2 className="text-3xl font-extrabold text-white leading-tight tracking-tight">
                  Intelligent Inventory <br/> 
                  <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Control & Logistics
                  </span>
                </h2>
                <p className="text-zinc-400 text-xs leading-relaxed max-w-sm">
                  High-fidelity scanning terminal, live ledger audits, and automated stock receipt pipelines. Built specifically for automotive safety glass operations.
                </p>
              </div>

              {/* Holographic Diagnostic Terminal */}
              <div className="bg-zinc-950/60 backdrop-blur-md rounded-2xl border border-white/5 p-5 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
                
                {/* Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-white/5 mb-3.5 text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-500/60" />
                    <span className="h-2 w-2 rounded-full bg-yellow-500/60" />
                    <span className="h-2 w-2 rounded-full bg-green-500/60" />
                    <span className="ml-1.5 font-mono text-[8px] tracking-normal text-zinc-400">live_scanner_stream.log</span>
                  </div>
                  <span className="text-emerald-500 animate-pulse flex items-center gap-1">
                    <span className="h-1 w-1 bg-emerald-400 rounded-full" />
                    connected
                  </span>
                </div>

                {/* Windshield Wireframe Visual & Laser Scanner Beam */}
                <div className="relative h-40 rounded-xl bg-zinc-900/60 border border-white/5 flex items-center justify-center overflow-hidden mb-3.5">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px]" />
                  
                  {/* Windshield SVG Visual */}
                  <svg className="w-48 h-28 text-indigo-500/20 dark:text-indigo-400/15" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 45 C 5 45, 12 15, 50 15 C 88 15, 95 45, 95 45 C 95 45, 50 50, 5 45 Z" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
                    <path d="M46 15 L50 22 L54 15 Z" fill="currentColor" opacity="0.3" />
                    <path d="M8 43 C 8 43, 14 18, 50 18 C 86 18, 92 43, 92 43" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
                  </svg>

                  {/* Red Laser Scanner Scanning Line */}
                  <div className="absolute left-0 w-full h-[2px] bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] pointer-events-none animate-scan-beam" />
                  
                  {/* Scanning Status overlays */}
                  <div className="absolute top-2.5 left-2.5 bg-zinc-950/80 border border-white/5 text-zinc-400 px-1.5 py-0.5 rounded text-[7px] font-mono">
                    HUD MODE: GLASS_SPEC
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-[7px] font-mono flex items-center gap-1">
                    <span className="h-1 w-1 bg-emerald-400 rounded-full animate-ping" />
                    AIS_BARCODE: 89010720022
                  </div>
                </div>

                {/* Terminal outputs */}
                <div className="font-mono text-[8px] text-zinc-450 space-y-1">
                  <p className="text-zinc-500"><span className="text-indigo-400 font-extrabold">[07:15:20]</span> Scanner engine initialized.</p>
                  <p className="text-zinc-500"><span className="text-indigo-400 font-extrabold">[07:15:21]</span> Waiting for serial broadcast...</p>
                  <p className="text-zinc-450"><span className="text-emerald-500 font-extrabold">[07:15:24]</span> RECEIPT SKU: <span className="text-white font-extrabold">WND-MARUTI-DZIRE-F</span> (Qty: +1 Good)</p>
                </div>
              </div>

              {/* Feature Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-zinc-950/30 border border-white/5 p-2.5 rounded-xl text-center">
                  <span className="text-[8px] text-zinc-500 font-bold block uppercase tracking-wider">Accuracy</span>
                  <span className="text-xs font-black text-white mt-0.5 block">99.98%</span>
                </div>
                <div className="bg-zinc-950/30 border border-white/5 p-2.5 rounded-xl text-center">
                  <span className="text-[8px] text-zinc-500 font-bold block uppercase tracking-wider">Latency</span>
                  <span className="text-xs font-black text-white mt-0.5 block">&lt; 15ms</span>
                </div>
                <div className="bg-zinc-950/30 border border-white/5 p-2.5 rounded-xl text-center">
                  <span className="text-[8px] text-zinc-500 font-bold block uppercase tracking-wider">Engine</span>
                  <span className="text-xs font-black text-white mt-0.5 block">IMS v2.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom system indicators */}
          <div className="relative z-10 flex items-center justify-between text-[8px] text-zinc-500 font-semibold border-t border-white/5 pt-5">
            <div className="flex items-center gap-1.5">
              <div className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </div>
              <span className="text-zinc-400">All Operations Online</span>
            </div>
            <span>Atul Glass Agency IMS ERP v2.4.1</span>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="w-full lg:w-[50%] xl:w-[45%] flex flex-col justify-between p-8 sm:p-12 md:p-16 relative overflow-hidden bg-slate-50 dark:bg-[#060608]">
          
          {/* Top Bar inside Login Panel */}
          <div className="flex items-center justify-between">
            <span className="bg-gradient-to-r from-indigo-650 to-violet-650 text-white font-black px-3.5 py-1 rounded-full text-[9px] tracking-wider uppercase shadow-md shadow-indigo-500/10 lg:hidden">
              IMS Enterprise
            </span>
            <div className="hidden lg:block text-xs font-extrabold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider">
              Secure Access Link
            </div>
            <div className="flex items-center gap-3 ml-auto">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl border border-zinc-200/50 dark:border-white/5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-xs text-zinc-700 dark:text-zinc-300 active:scale-95"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </button>
              <a href="mailto:support@atulglass.com" className="text-[10px] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white font-bold flex items-center gap-1 uppercase tracking-wider">
                <HelpCircle className="h-3.5 w-3.5" />
                Support
              </a>
            </div>
          </div>

          {/* Form Card Container */}
          <div className="my-auto py-8 max-w-sm w-full mx-auto space-y-6">
            
            {/* Header Title */}
            <div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                Authenticate
              </h2>
              <p className="text-zinc-550 dark:text-zinc-400 text-xs mt-1 font-semibold leading-normal">
                Select your account context and verify credentials.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {authMode === 'login' && (
                <motion.form 
                  key="login"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleLoginSubmit} 
                  className="space-y-4 text-xs font-semibold"
                >
                  {authError && (
                    <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 font-bold flex items-center gap-2 animate-shake">
                      <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                      {authError}
                    </div>
                  )}

                  {/* Role Switcher */}
                  <div>
                    <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-extrabold tracking-wider mb-2">Login Role Context</label>
                    <div className="flex bg-zinc-200/50 dark:bg-zinc-900/60 p-1 rounded-xl border border-zinc-200/30 dark:border-white/5 relative">
                      <button
                        type="button"
                        onClick={() => setRoleInput('admin')}
                        className={`flex-1 py-2.5 rounded-lg text-center font-extrabold text-[10px] uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer relative z-10 ${
                          roleInput === 'admin' 
                            ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-800 shadow-xs border border-zinc-200/20 dark:border-white/5' 
                            : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-450 dark:hover:text-zinc-200'
                        }`}
                      >
                        <Shield className="h-3.5 w-3.5" />
                        Admin Console
                      </button>
                      <button
                        type="button"
                        onClick={() => setRoleInput('staff')}
                        className={`flex-1 py-2.5 rounded-lg text-center font-extrabold text-[10px] uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer relative z-10 ${
                          roleInput === 'staff' 
                            ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-800 shadow-xs border border-zinc-200/20 dark:border-white/5' 
                            : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-455 dark:hover:text-zinc-200'
                        }`}
                      >
                        <Activity className="h-3.5 w-3.5" />
                        Staff Operator
                      </button>
                    </div>
                  </div>

                  {/* Email address */}
                  <div>
                    <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-extrabold tracking-wider mb-2">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-550">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        required
                        readOnly
                        value={emailInput}
                        className="w-full glass-input pl-10 pr-3 py-3 text-zinc-500 dark:text-zinc-400 font-extrabold focus:outline-none cursor-not-allowed text-xs bg-zinc-100/50 dark:bg-zinc-900/30"
                      />
                    </div>
                    <span className="text-[8px] text-zinc-500 dark:text-zinc-450 block mt-1.5 font-medium italic">Read-only credentials mapped automatically to role context.</span>
                  </div>

                  {/* Password key */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-extrabold tracking-wider">Password key</label>
                      <button 
                        type="button"
                        onClick={() => setAuthMode('forgot')}
                        className="text-[9px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors font-extrabold uppercase tracking-wider"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-550">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full glass-input pl-10 pr-10 py-3 focus:outline-none text-zinc-800 dark:text-white text-xs bg-white dark:bg-zinc-900/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-650 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider"
                  >
                    Authenticate Session
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </motion.form>
              )}

              {authMode === 'forgot' && (
                <motion.div 
                  key="forgot"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4 text-xs font-semibold"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">Trouble Logging In?</h3>
                    <p className="text-zinc-550 dark:text-zinc-400 leading-normal font-semibold">Enter email address below to send verification reset request.</p>
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-extrabold tracking-wider mb-2">Registered Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-550">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        required
                        placeholder="Enter email address..."
                        defaultValue={emailInput}
                        className="w-full glass-input pl-10 pr-3 py-3 focus:outline-none text-zinc-800 dark:text-white text-xs bg-white dark:bg-zinc-900/30"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAuthMode('reset')}
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-650 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 active:scale-95 cursor-pointer text-[10px] uppercase tracking-wider"
                  >
                    Send Reset Link
                  </button>
                  <div className="text-center pt-2">
                    <button 
                      onClick={() => setAuthMode('login')}
                      className="text-zinc-550 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white transition-colors font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Sign In
                    </button>
                  </div>
                </motion.div>
              )}

              {authMode === 'reset' && (
                <motion.div 
                  key="reset"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4 text-xs font-semibold text-center"
                >
                  <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-3 border border-emerald-500/20 shadow-md shadow-emerald-500/5 animate-bounce">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h4 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">Reset Link Transmitted</h4>
                  <p className="text-zinc-550 dark:text-zinc-400 leading-relaxed font-semibold">We sent a reset verification link to your inbox. Check spam if not received.</p>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setAuthError(''); }}
                    className="w-full bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-950 dark:hover:bg-zinc-700 text-white font-extrabold py-3.5 rounded-xl active:scale-[0.97] transition-all cursor-pointer text-[10px] uppercase tracking-wider"
                  >
                    Back to Sign In
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Security Footer */}
          <div className="text-center text-[9px] text-zinc-450 dark:text-zinc-500 font-semibold space-y-1">
            <p>Protected by SSL/AES-256 secure encryption</p>
            <p>© {new Date().getFullYear()} Atul Glass Agency. All rights reserved.</p>
          </div>

        </div>
      </div>
    );
  }


  // ============================================
  // MAIN ERP APP LAYOUT RENDER
  // ============================================
  return (
    <div className="h-full flex overflow-hidden bg-slate-50 dark:bg-[#070709] text-zinc-900 dark:text-zinc-100 transition-colors">
      
      {/* MOBILE SIDEBAR DRAW BACKDROP */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-zinc-950/95 dark:bg-[#09090c]/95 text-zinc-350 z-40 transform lg:static lg:translate-x-0 transition-transform duration-250 ease-out flex flex-col justify-between shrink-0 border-r border-white/5 shadow-2xl ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-0 lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Header Brand */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-indigo-500/25">
                A
              </span>
              <div>
                <h2 className="font-extrabold text-sm text-white tracking-wide leading-none">Atul Glass</h2>
                <span className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-wider block mt-1">Inventory ERP</span>
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-zinc-500 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 flex-1 text-xs">
            {navItems.map((item) => {
              // Check roles permission
              if (!item.roles.includes(user.role)) return null;

              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.01, x: 3 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => { setView(item.id as ViewType); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 font-extrabold text-left cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-650 text-white shadow-lg shadow-indigo-650/15 border-l-4 border-indigo-450'
                      : 'hover:bg-white/5 text-zinc-400 hover:text-zinc-250 border-l-4 border-transparent'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span>{item.name}</span>
                </motion.button>
              );
            })}
          </nav>
        </div>

        {/* Footer info: Logged In Account */}
        <div className="p-4 border-t border-white/5 bg-black/30 text-xs">
          <div className="flex items-center justify-between p-1">
            <div className="min-w-0 pr-2">
              <p className="font-extrabold text-white truncate text-xs">{user.email.split('@')[0]}</p>
              <span className="text-[8px] bg-indigo-950/80 text-indigo-400 border border-indigo-900/40 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider inline-block mt-1">
                {user.role}
              </span>
            </div>
            <button
              onClick={() => setIsLogoutConfirm(true)}
              className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-rose-400 transition-colors duration-200"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* RIGHT SIDE MAIN CONTENT LAYOUT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* TOP HEADER */}
        <header className="sticky top-0 bg-white/75 dark:bg-[#070709]/75 backdrop-blur-md border-b border-zinc-200/60 dark:border-white/5 h-16 flex items-center justify-between px-6 shrink-0 z-20">
          
          {/* Mobile hamburger menu */}
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden text-zinc-550 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white mr-3 shrink-0 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Global Search Autocomplete input */}
          <div className="hidden sm:block relative w-full max-w-sm">
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Global SKU search & inspect..."
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
                onFocus={() => setIsGlobalSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsGlobalSearchFocused(false), 200)}
                className="pl-9 pr-4 py-2 w-full text-xs glass-input focus:outline-none font-bold text-zinc-850 dark:text-zinc-100"
              />
            </div>
            
            {/* Global Search Results overlay list */}
            {isGlobalSearchFocused && globalQuery && (
              <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/5 rounded-2xl shadow-xl z-25 divide-y divide-zinc-100 dark:divide-white/5 max-h-[220px] overflow-y-auto backdrop-blur-xl">
                {globalSearchResults.length === 0 ? (
                  <div className="p-4 text-center text-zinc-550 dark:text-zinc-450 text-[10px] font-semibold italic">No catalog match.</div>
                ) : (
                  globalSearchResults.map(p => (
                    <div 
                      key={p.id}
                      onClick={() => handleGlobalSearchClick(p.sku)}
                      className="p-3 hover:bg-indigo-50/40 dark:hover:bg-white/5 cursor-pointer flex justify-between items-center text-[11px] font-bold transition-colors duration-150"
                    >
                      <div>
                        <p className="text-zinc-850 dark:text-zinc-200">{p.sku}</p>
                        <p className="text-[9px] text-zinc-450 dark:text-zinc-500 font-semibold">{p.description}</p>
                      </div>
                      <span className="font-mono text-[9px] bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-450 px-2 py-0.5 rounded border border-zinc-200/50 dark:border-white/5">{p.barcode}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Right Header: Switchers and notifications */}
          <div className="ml-auto flex items-center gap-3.5 text-xs font-black">
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/60 dark:hover:bg-zinc-800 border border-zinc-200/50 dark:border-white/5 text-zinc-500 hover:text-zinc-805 dark:text-zinc-400 dark:hover:text-white active:scale-90 transition-all shrink-0 cursor-pointer"
              title="Toggle theme mode"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-500 animate-pulse" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Quick Role Toggle (Admin/Staff) for client review! */}
            <button
              onClick={handleQuickRoleToggle}
              className="flex items-center gap-1.5 bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-100/40 dark:hover:bg-indigo-900/20 border border-indigo-100/30 dark:border-indigo-500/10 px-3 py-2 rounded-xl active:scale-95 transition-all text-[10px] shrink-0 text-indigo-650 dark:text-indigo-400 cursor-pointer shadow-sm"
              title="Click to quickly switch roles during inspection review"
            >
              <Shield className="h-3.5 w-3.5 text-indigo-500" />
              Role: <span className="capitalize font-extrabold">{user.role}</span>
            </button>

            {/* Outlet shop selector */}
            <div className="relative">
              <button
                onClick={() => setIsShopOpen(!isShopOpen)}
                className="flex items-center gap-1.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/60 dark:hover:bg-zinc-800 border border-zinc-200/50 dark:border-white/5 px-3 py-2 rounded-xl active:scale-95 transition-all text-[10px] text-zinc-700 dark:text-zinc-300 font-extrabold cursor-pointer"
              >
                <Store className="h-3.5 w-3.5 text-indigo-500" />
                <span>{settings.shop.currentShop}</span>
                <ChevronDown className="h-3 w-3 text-zinc-400 shrink-0" />
              </button>

              {/* Outlet List Dropdown overlay */}
              <AnimatePresence>
                {isShopOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsShopOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/5 rounded-2xl shadow-xl z-25 divide-y divide-zinc-100 dark:divide-white/5 p-1 text-[10px]"
                    >
                      {settings.shop.shops.map(sh => (
                        <button
                          key={sh}
                          onClick={() => handleShopSwitch(sh)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl font-extrabold transition-all duration-150 ${
                            settings.shop.currentShop === sh 
                              ? 'bg-gradient-to-r from-indigo-600 to-violet-650 text-white shadow shadow-indigo-650/15' 
                              : 'hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-350'
                          }`}
                        >
                          {sh}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Notifications drawer trigger */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(true)}
                className="p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/60 dark:hover:bg-zinc-800 border border-zinc-200/50 dark:border-white/5 text-zinc-500 hover:text-zinc-805 dark:text-zinc-405 dark:hover:text-white active:scale-90 transition-all shrink-0 relative cursor-pointer"
              >
                <Bell className="h-4 w-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4.5 w-4.5 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-bounce shadow-md shadow-rose-500/25 border border-white dark:border-[#070709]">
                    {unreadNotifCount}
                  </span>
                )}
              </button>
            </div>

          </div>

        </header>

        {/* MAIN PANEL CONTENT PORT */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50 dark:bg-[#07070a]/50 relative">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, type: 'spring', damping: 25, stiffness: 350 }}
            className="h-full"
          >
            {renderActiveView()}
          </motion.div>
        </main>

      </div>

      {/* NOTIFICATIONS DRAWER OVERLAY PANEL */}
      <AnimatePresence>
        {isNotifOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div

              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotifOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <div className="absolute inset-y-0 right-0 max-w-sm w-full flex">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="w-full bg-white dark:bg-zinc-95 border-l border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between shadow-2xl text-xs font-semibold"
              >
                <div className="space-y-4 h-full flex flex-col">
                  <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Bell className="h-4.5 w-4.5 text-indigo-500" />
                      <h3 className="text-sm font-black text-zinc-900 dark:text-white">Notification Feeds</h3>
                    </div>
                    
                    <button 
                      onClick={() => setIsNotifOpen(false)}
                      className="p-1 rounded-full hover:bg-zinc-150 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-650"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {notifications.length > 0 && (
                    <button 
                      onClick={clearAllNotifications}
                      className="text-right text-[10px] text-red-500 hover:underline flex items-center justify-end gap-1 font-bold select-none shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear All Feeds
                    </button>
                  )}

                  {/* List feeds */}
                  <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 pr-1">
                    {notifications.length === 0 ? (
                      <div className="py-12 text-center text-zinc-450 font-bold italic">
                        No active notification feeds.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          onClick={() => markNotificationRead(notif.id)}
                          className={`py-3 text-[11px] hover:bg-zinc-50 dark:hover:bg-zinc-900/40 cursor-pointer flex flex-col gap-0.5 relative pr-4 group ${
                            !notif.read ? 'bg-indigo-50/20 dark:bg-indigo-950/5 font-black' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`h-2 w-2 rounded-full ${
                              notif.type === 'low-stock' ? 'bg-amber-500' : notif.type === 'success' ? 'bg-emerald-500' : 'bg-indigo-550'
                            } ${!notif.read ? 'opacity-100' : 'opacity-20'}`} />
                            <span className="text-[9px] text-zinc-400 font-semibold">{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          
                          <p className="text-zinc-800 dark:text-zinc-200 mt-1">{notif.title}</p>
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal font-semibold mt-0.5">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setIsNotifOpen(false)}
                  className="w-full bg-zinc-950 dark:bg-zinc-800 text-white font-bold py-2 rounded-lg hover:bg-zinc-900 mt-4"
                >
                  Close Feeds Drawer
                </button>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* LOGOUT CONFIRMATION MODAL */}
      <Dialog isOpen={isLogoutConfirm} onClose={() => setIsLogoutConfirm(false)} title="Sign Out Confirmation">
        <div className="space-y-4 text-xs font-semibold text-center p-2">
          <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">Are you sure you want to end your current ERP inventory management session?</p>
          
          <div className="flex gap-2 pt-2">
            <button 
              onClick={() => setIsLogoutConfirm(false)}
              className="flex-1 bg-zinc-150 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 py-2 rounded-lg font-bold"
            >
              Cancel
            </button>
            <button 
              onClick={() => { setIsLogoutConfirm(false); logout(); }}
              className="flex-1 bg-red-650 hover:bg-red-700 text-white py-2 rounded-lg font-bold shadow-md shadow-red-600/10"
            >
              Sign Out Session
            </button>
          </div>
        </div>
      </Dialog>

      {/* TOAST STACKS */}
      <ToastContainer />
    </div>
  );
}
