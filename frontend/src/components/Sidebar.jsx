import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart3, 
  LogOut, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  Receipt,
  Settings
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, darkMode, toggleDarkMode } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const logoUrl = user?.settings?.logo_path ? `${import.meta.env.VITE_API_URL}/${user.settings.logo_path}` : null;

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Clients', href: '/clients', icon: Users },
    { name: 'Invoices', href: '/invoices', icon: FileText },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    toast.success('Logout Successful');
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Mobile top navigation bar */}
      <div className="lg:hidden flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 sticky top-0 z-40 no-print">
        <div className="flex items-center space-x-2">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="Business Logo" 
              className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-200 dark:border-slate-800 p-0.5" 
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
              <Receipt className="w-5 h-5" />
            </div>
          )}
          <span className="font-bold text-lg text-slate-800 dark:text-white font-display">Invoive</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md text-slate-500 hover:text-slate-600 focus:outline-none"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen no-print
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Header Branding */}
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Business Logo" 
                  className="w-9 h-9 rounded-xl object-contain bg-white border border-slate-205 dark:border-slate-800 p-0.5 shadow-sm" 
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
                  <Receipt className="w-5.5 h-5.5" />
                </div>
              )}
              <span className="font-bold text-xl text-slate-850 dark:text-white font-display tracking-tight">Invoive</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* User Business Details */}
          {user && (
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Business</p>
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 truncate">{user.business_name}</h4>
              <p className="text-xs text-slate-500 truncate">{user.owner_name}</p>
            </div>
          )}

          {/* Main Links */}
          <nav className="px-4 py-6 space-y-1.5">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${active 
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/30 dark:text-brand-400 font-semibold' 
                      : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-100'}
                  `}
                >
                  <item.icon className={`w-5 h-5 ${active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-450 dark:text-slate-500'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer controls & Profile actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay background for open mobile side bar */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden no-print"
        />
      )}
    </>
  );
};

export default Sidebar;
