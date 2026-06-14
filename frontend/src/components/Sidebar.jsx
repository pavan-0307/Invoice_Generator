import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Receipt,
  ChevronRight,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard',  href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients',    href: '/clients',   icon: Users },
  { name: 'Invoices',   href: '/invoices',  icon: FileText },
  { name: 'Reports',    href: '/reports',   icon: BarChart3 },
  { name: 'Settings',   href: '/settings',  icon: Settings },
];

const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const logoUrl = user?.settings?.logo_path
    ? `${import.meta.env.VITE_API_URL}/${user.settings.logo_path}`
    : null;

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out successfully');
    navigate('/login');
  };

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const NavItem = ({ item }) => {
    const active = isActive(item.href);
    return (
      <Link
        to={item.href}
        onClick={() => setIsOpen(false)}
        title={item.name}
        className={`
          group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
          transition-all duration-150 select-none
          ${active
            ? 'bg-brand-500/15 text-brand-400'
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
          }
        `}
      >
        {/* Active left indicator */}
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-400 rounded-r-full" />
        )}
        <item.icon className={`w-5 h-5 shrink-0 ${active ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
        <span>{item.name}</span>
        {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-brand-400/60" />}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: '#0b1120' }}>
      {/* ── Brand Header ── */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white/10 p-1" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-brand shrink-0">
            <Receipt className="w-4.5 h-4.5 text-white" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-white font-bold text-base leading-tight tracking-tight truncate">ClearLedger</p>
          <p className="text-slate-500 text-xs font-medium truncate">Invoice Portal</p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden ml-auto p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Business Info ── */}
      {user && (
        <div className="px-4 py-3 mx-3 mt-3 rounded-xl bg-white/5 border border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center shrink-0">
              <span className="text-brand-400 text-xs font-bold">{getInitials(user.business_name)}</span>
            </div>
            <div className="min-w-0">
              <p className="text-slate-200 text-xs font-semibold truncate">{user.business_name}</p>
              <p className="text-slate-500 text-xs truncate">{user.owner_name}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest text-slate-600">Menu</p>
        {navigation.map(item => <NavItem key={item.name} item={item} />)}
      </nav>

      {/* ── Footer ── */}
      <div className="px-3 py-4 border-t border-white/5 space-y-1">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                     text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-150"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile Top Bar ── */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-navy-900 border-b border-white/5 sticky top-0 z-40 no-print" style={{ background: '#0b1120' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
            <Receipt className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-base tracking-tight">ClearLedger</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Desktop Sidebar ── */}
      <aside className={`
        fixed top-0 left-0 bottom-0 z-50 w-60
        lg:sticky lg:top-0 lg:h-screen lg:translate-x-0
        transition-transform duration-300 no-print
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent />
      </aside>

      {/* ── Mobile Overlay ── */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        />
      )}
    </>
  );
};

export default Sidebar;
