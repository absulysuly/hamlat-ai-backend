import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, BarChart3, MessageSquare, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';

export default function Sidebar() {
  const { logout } = useAuthStore();
  const { t } = useLanguageStore();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { to: '/content', icon: FileText, label: t('content') },
    { to: '/analytics', icon: BarChart3, label: t('analytics') },
    { to: '/mentions', icon: MessageSquare, label: t('mentions') },
    { to: '/settings', icon: Settings, label: t('settings') },
  ];

  return (
    <aside className="w-64 bg-white border-e border-gray-200">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary-600">HamlatAI</h1>
        <p className="text-sm text-gray-500 mt-1">حملة - کەمپین</p>
      </div>

      <nav className="px-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <Icon size={20} />
            <span className="font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-0 w-64 p-3 border-t border-gray-200">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">{t('logout')}</span>
        </button>
      </div>
    </aside>
  );
}
