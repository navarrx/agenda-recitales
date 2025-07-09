import { Link } from 'react-router-dom';
import { useState } from 'react';
import EventRequestModal from '../modals/EventRequestModal';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [showModal, setShowModal] = useState(false);

  return (
    <footer className="bg-[#101119] shadow-soft-up py-10 mt-12 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="slide-up">
            <div className="flex items-center mb-4">
              <span className="text-2xl font-bold text-white">
                <span className="text-white">ABC1</span>
              </span>
            </div>
            <p className="text-white/80 max-w-md leading-relaxed">
              Tu agenda de eventos musicales favorita. Encuentra los mejores recitales en tu ciudad 
              y disfruta de la música en vivo.
            </p>
            <div className="flex space-x-4 mt-6">
              <SocialIcon type="x" />
              <SocialIcon type="instagram" />
              <SocialIcon type="facebook" />
              <SocialIcon type="tiktok" />
              <SocialIcon type="youtube" />
            </div>
          </div>
          
          <div className="slide-up" style={{ animationDelay: '100ms' }}>
            <h3 className="text-lg font-semibold text-white mb-4">
              Enlaces Rápidos
            </h3>
            <ul className="space-y-3">
              <FooterLink to="/">Inicio</FooterLink>
              <FooterLink to="/events">Eventos</FooterLink>
            </ul>
          </div>
          
          <div className="slide-up" style={{ animationDelay: '200ms' }}>
            <h3 className="text-lg font-semibold text-white mb-4">
              Contacto
            </h3>
            <p className="text-white/80 mb-4">
              ¿Tienes un evento que quieras agregar a nuestra agenda?
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="btn bg-[#1a48c4] text-white hover:bg-[#1a48c4]/90 mb-4"
            >
              Solicitar agregar evento
            </button>
            <p className="flex items-center text-white/80">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#1a48c4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              contacto@fechasbybillboard.com
            </p>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-white/60 text-sm text-center sm:text-left">
            &copy; {currentYear} ABC1. Todos los derechos reservados.
          </p>
          <div className="mt-4 sm:mt-0">
            <ul className="flex flex-wrap space-x-5 justify-center">
              <li><a href="#" className="text-white/60 hover:text-[#1a48c4] text-sm transition-colors">Privacidad</a></li>
              <li><a href="#" className="text-white/60 hover:text-[#1a48c4] text-sm transition-colors">Términos</a></li>
            </ul>
          </div>
        </div>
      </div>

      <EventRequestModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </footer>
  );
};

const FooterLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <li>
    <Link 
      to={to} 
      className="text-white/80 hover:text-[#1a48c4] transition-colors duration-200 hover:translate-x-1 inline-block"
    >
      {children}
    </Link>
  </li>
);

const SocialIcon = ({ type }: { type: 'x' | 'instagram' | 'facebook' | 'tiktok' | 'youtube' }) => {
  const getIcon = () => {
    switch (type) {
      case 'x':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        );
      case 'instagram':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        );
      case 'facebook':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
          </svg>
        );
      case 'tiktok':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
          </svg>
        );
      case 'youtube':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        );
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'x':
        return 'X (Twitter)';
      case 'instagram':
        return 'Instagram';
      case 'facebook':
        return 'Facebook';
      case 'tiktok':
        return 'TikTok';
      case 'youtube':
        return 'YouTube';
    }
  };

  const getUrl = () => {
    switch (type) {
      case 'x':
        return 'https://x.com/BillboardArg';
      case 'instagram':
        return 'https://www.instagram.com/billboardar/?hl=es';
      case 'facebook':
        return 'https://www.facebook.com/BillboardAR/?locale=es_LA';
      case 'tiktok':
        return 'https://www.tiktok.com/@billboardar?lang=es';
      case 'youtube':
        return 'https://www.youtube.com/user/BillboardArgentina';
    }
  };

  return (
    <a 
      href={getUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className="text-white/80 hover:text-[#1a48c4] transition-colors duration-200 hover-scale"
      aria-label={`Síguenos en ${getLabel()}`}
    >
      {getIcon()}
    </a>
  );
};

export default Footer; 