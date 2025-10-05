import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, LayoutDashboard, Mic, Send, Settings, Shield, Users, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../store/languageStore';
import LanguageSelector from './LanguageSelector';

const navLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'dashboard' },
  { to: '/content', icon: Send, label: 'content' },
  { to: '/analytics', icon: BarChart3, label: 'analytics' },
  { to: '/mentions', icon: Users, label: 'mentions' },
  { to: '/settings', icon: Settings, label: 'settings' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - layout adjusted for better RTL support */}
      <aside className="w-64 bg-white shadow-md flex flex-col flex-shrink-0">
        <div className="p-6 text-center border-b">
          <Link to="/" className="text-2xl font-bold text-primary-600">HamlatAI</Link>
        </div>
        <nav className="flex-1 px-4 py-2 space-y-2">
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-primary-50 hover:text-primary-600'
                }`
              }
            >
              <link.icon size={20} />
              <span>{t(link.label)}</span>
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-red-600 text-white'
                    : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
                }`
              }
            >
              <Shield size={20} />
              <span>{t('admin_dashboard')}</span>
            </NavLink>
          )}
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-gradient-to-r from-primary-600 to-primary-700 shadow-md p-4 flex justify-between items-center text-white">
          <div>
            <h1 className="text-xl font-semibold capitalize">
              {t(location.pathname.substring(1) || 'dashboard')}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <div className="w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center font-bold border-2 border-white/50">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Voice Command Button */}
      <button className="fixed bottom-6 end-6 w-16 h-16 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 transition-transform hover:scale-110 voice-active">
        <Mic size={28} />
      </button>
    </div>
  );
}
