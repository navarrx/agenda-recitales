import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

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

  const headerClasses = `sticky top-0 z-50 transition-all duration-300 
    ${isScrolled 
      ? 'bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm shadow-md py-2' 
      : 'bg-white dark:bg-neutral-800 py-4'}`;

  return (
    <header className={headerClasses}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center">
          <Link 
            to="/" 
            className="text-2xl font-bold transition-all duration-300 hover-scale"
          >
            <span className="text-primary-600 dark:text-primary-400">Agenda</span>
            <span className="text-secondary-600 dark:text-secondary-400">Recitales</span>
          </Link>
        </div>
        
        <nav className="hidden md:flex space-x-6">
          <NavLink to="/">Inicio</NavLink>
          <NavLink to="/events">Eventos</NavLink>
          <NavLink to="/?admin=true">Admin</NavLink>
        </nav>
        
        <div className="md:hidden">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-neutral-700 dark:text-neutral-300 transition-colors hover:text-primary-600 dark:hover:text-primary-400"
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
          <div className="px-4 py-4 space-y-3 bg-white dark:bg-neutral-800 shadow-md">
            <MobileNavLink to="/" onClick={() => setIsMobileMenuOpen(false)}>Inicio</MobileNavLink>
            <MobileNavLink to="/events" onClick={() => setIsMobileMenuOpen(false)}>Eventos</MobileNavLink>
            <MobileNavLink to="/?admin=true" onClick={() => setIsMobileMenuOpen(false)}>Admin</MobileNavLink>
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
          ? 'text-primary-600 dark:text-primary-400 font-medium' 
          : 'text-neutral-700 hover:text-primary-600 dark:text-neutral-300 dark:hover:text-primary-400'
        }
      `}
    >
      {children}
      <span 
        className={`absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 dark:bg-primary-400 transform origin-bottom-right transition-all duration-300
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
          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium' 
          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
        }
      `}
    >
      {children}
    </Link>
  );
};

export default Header; 