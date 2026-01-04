import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import Footer from './Footer';
import blackLogo from '../utils/dark_logo.png';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  // Helper to determine if a path is active
  const isActive = (path) => location.pathname === path;

  // Link classes generator
  const getLinkClasses = (path) => {
    const active = isActive(path);
    return `relative px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-lg group ${active
        ? 'text-white bg-white/10'
        : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`;
  };

  return (
    <div className="min-h-screen bg-background text-gray-100 flex flex-col font-sans selection:bg-primary-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b-0 border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-12">
              <Link to="/dashboard" className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="absolute -inset-2 bg-primary-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <img
                    src={blackLogo}
                    alt="Finora"
                    className="relative w-10 h-10 object-contain drop-shadow-2xl"
                  />
                </div>
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 font-display tracking-tight">
                  Finora
                </span>
              </Link>

              <div className="hidden md:flex items-center gap-2">
                <Link to="/dashboard" className={getLinkClasses('/dashboard')}>
                  Dashboard
                </Link>
                <Link to="/transactions" className={getLinkClasses('/transactions')}>
                  Transactions
                </Link>
                <Link to="/reports" className={getLinkClasses('/reports')}>
                  Reports
                </Link>
                <Link to="/profile" className={getLinkClasses('/profile')}>
                  Profile
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-white">{user?.name}</span>
                <span className="text-xs text-gray-500">Free Plan</span>
              </div>
              <Button variant="outline" onClick={handleLogout} className="!px-4 !py-2 text-sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 pt-24 pb-12 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Layout;
