import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  // Check if page is scrolled
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const headerClasses = `sticky top-0 z-50 transition-all duration-300 
    ${isScrolled 
      ? 'bg-[#101119]/80 backdrop-blur-md shadow-md py-2' 
      : 'bg-[#101119]/60 backdrop-blur-sm py-4'}`;

  return (
    <header className={headerClasses}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center">
          <Link 
            to="/" 
            className="transition-all duration-300 hover-scale"
          >
            <img 
              src="/images/logo_top.png" 
              alt="Billboard Agenda Logo" 
              className="h-16 w-auto"
            />
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6">
          <NavLink to="/">Inicio</NavLink>
          <NavLink to="/events">Eventos</NavLink>
          {isAuthenticated && <NavLink to="/admin">Admin</NavLink>}
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="text-white hover:text-[#1a48c4] transition-colors duration-200"
            >
              Cerrar sesión
            </button>
          )}
        </nav>
        
        <div className="md:hidden">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white transition-colors hover:text-[#1a48c4]"
            aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {isMobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden slide-down">
          <div className="px-4 py-4 space-y-3 bg-[#101119] shadow-md">
            <MobileNavLink to="/" onClick={() => setIsMobileMenuOpen(false)}>Inicio</MobileNavLink>
            <MobileNavLink to="/events" onClick={() => setIsMobileMenuOpen(false)}>Eventos</MobileNavLink>
            {isAuthenticated && (
              <>
                <MobileNavLink to="/admin" onClick={() => setIsMobileMenuOpen(false)}>Admin</MobileNavLink>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-white hover:bg-[#1a48c4]/20 transition-colors duration-200"
                >
                  Cerrar sesión
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

// Navigation link components
const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link 
      to={to} 
      className={`relative py-2 transition-all duration-300
        ${isActive 
          ? 'text-[#1a48c4] font-medium' 
          : 'text-white hover:text-[#1a48c4]'
        }
      `}
    >
      {children}
      <span 
        className={`absolute bottom-0 left-0 w-full h-0.5 bg-[#1a48c4] transform origin-bottom-right transition-all duration-300
          ${isActive ? 'scale-x-100' : 'scale-x-0 hover:scale-x-100'}`}
      />
    </Link>
  );
};

const MobileNavLink = ({ to, children, onClick }: { to: string; children: React.ReactNode; onClick?: () => void }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`block px-3 py-2 rounded-md transition-all duration-200
        ${isActive 
          ? 'bg-[#1a48c4]/20 text-[#1a48c4] font-medium' 
          : 'text-white hover:bg-[#1a48c4]/20'
        }
      `}
    >
      {children}
    </Link>
  );
};

export default Header; 