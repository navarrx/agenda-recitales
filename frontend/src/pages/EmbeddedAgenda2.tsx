import React, { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getTicketButtonText } from '../utils/eventUtils';
import { Event } from '../types';

interface EmbeddedAgenda2Props {
  theme?: 'light' | 'dark';
  width?: string;
  initialFilters?: {
    genre?: string;
    location?: string;
    date?: string;
  };
}

const MarqueeText: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shouldMarquee, setShouldMarquee] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [scrollDiff, setScrollDiff] = useState(0);

  useEffect(() => {
    if (containerRef.current && textRef.current) {
      const diff = textRef.current.scrollWidth - containerRef.current.offsetWidth;
      setShouldMarquee(diff > 0);
      setScrollDiff(diff > 0 ? diff : 0);
    }
  }, [children]);

  return (
    <div
      ref={containerRef}
      className={`marquee-container ${className}`}
      style={{ width: '100%' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span
        ref={textRef}
        className="marquee-text"
        style={shouldMarquee && isHovered ? {
          display: 'inline-block',
          transform: `translateX(-${scrollDiff}px)`,
          transition: `transform ${2 + scrollDiff/100}s linear`,
          overflow: 'visible',
          textOverflow: 'unset',
          whiteSpace: 'nowrap',
        } : {
          display: 'inline-block',
          transform: 'translateX(0)',
          transition: 'transform 0.3s',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </span>
    </div>
  );
};

const EmbeddedAgenda2: React.FC<EmbeddedAgenda2Props> = ({
  theme = 'dark',
  width = '100%',
  initialFilters = {}
}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener los 10 eventos más cercanos en tiempo
  const fetchUpcomingEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events?limit=50`);
      if (!response.ok) {
        throw new Error('Error al cargar los eventos');
      }
      
      const data = await response.json();
      if (!data || !data.items || !Array.isArray(data.items)) {
        throw new Error('Formato de respuesta inválido');
      }
      
      // Filtrar eventos futuros y ordenar por fecha ascendente
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const futureEvents = data.items
        .filter((event: Event) => {
          const eventDate = new Date(event.date);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate >= today;
        })
        .sort((a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 10); // Tomar solo los 10 más cercanos
      
      setEvents(futureEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const handleEventClick = (event: Event) => {
    // Abrir en nueva pestaña
    window.open(`/events/${event.id}`, '_blank');
  };

  return (
    <>
      <style>
        {`
          body, .embedded-agenda-2 {
            font-family: 'Poppins', 'Inter', sans-serif !important;
          }
          .embedded-agenda-2 {
            background: #101119 !important;
            color: #fff !important;
          }
          .marquee-container {
            position: relative;
            overflow: hidden;
            white-space: nowrap;
            width: 100%;
            display: block;
          }
          .marquee-text {
            display: inline-block;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
            max-width: 100%;
            vertical-align: middle;
            transition: color 0.2s;
          }
          .card-hover:hover .marquee-text.marquee-animate {
            animation: marquee-scroll 4s linear 1;
          }
           @keyframes marquee-scroll {
             0% { transform: translateX(0); }
             10% { transform: translateX(0); }
             90% { transform: translateX(calc(-100% + 100%)); }
             100% { transform: translateX(calc(-100% + 100%)); }
           }
           
           /* Scrollbar styles - Sin fondo */
           .events-carousel::-webkit-scrollbar {
             height: 8px;
           }
           
           .events-carousel::-webkit-scrollbar-track {
             background: transparent;
           }
           
           .events-carousel::-webkit-scrollbar-thumb {
             background: rgba(255, 255, 255, 0.3);
             border-radius: 4px;
             transition: background 0.3s ease;
           }
           
           .events-carousel::-webkit-scrollbar-thumb:hover {
             background: rgba(255, 255, 255, 0.5);
           }
           
           /* Firefox scrollbar - Sin fondo */
           .events-carousel {
             scrollbar-width: thin;
             scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
           }
        `}
      </style>

      <div 
        className="embedded-agenda-2 min-h-screen"
        style={{ 
          width, 
          background: '#101119',
          fontFamily: 'Poppins, Inter, sans-serif',
          overflowX: 'hidden'
        }}
      >
        <div className="px-6 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 
              className="text-3xl md:text-4xl font-semibold mb-2"
              style={{ 
                color: '#FFFFFF',
                fontFamily: 'Poppins, Inter, sans-serif'
              }}
            >
              Eventos y recitales
            </h1>
          </div>

          {/* Events Carousel Section */}
          <div className="mb-8">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-white/70">Cargando eventos...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-red-400 mb-4">Error: {error}</p>
                <button 
                  onClick={fetchUpcomingEvents}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-white/70">No hay eventos próximos disponibles</p>
              </div>
            ) : (
               <div 
                 className="events-carousel flex overflow-x-auto gap-4 pb-2" 
                 style={{scrollSnapType: 'x mandatory'}}
               >
                {events.map((event, idx, arr) => (
                  <div
                    key={event.id}
                    className="card-hover flex flex-col cursor-pointer shadow hover:shadow-lg transition w-[300px] min-w-[300px] max-w-[300px] h-[450px]"
                    style={{
                      background: '#F5F5F5',
                      borderTopLeftRadius: 0,
                      borderTopRightRadius: 0,
                      borderBottomLeftRadius: '1rem',
                      borderBottomRightRadius: '1rem',
                      marginLeft: idx === 0 ? '0' : undefined,
                      marginRight: idx === arr.length - 1 ? '0' : undefined,
                      scrollSnapAlign: 'start',
                    }}
                    onClick={() => handleEventClick(event)}
                  >
                    {/* Event Image */}
                    {event.image_url ? (
                      <div className="w-full aspect-[5/7] overflow-hidden">
                        <img 
                          src={event.image_url} 
                          alt={event.name} 
                          className="w-full h-full object-cover" 
                          style={{borderRadius: 0, marginBottom: 0}} 
                        />
                      </div>
                    ) : (
                      <div 
                        className="w-full aspect-[5/7] flex items-center justify-center bg-[#1a48c4]" 
                        style={{borderRadius: 0, marginBottom: 0}}
                      >
                        <span className="text-white text-xl font-bold">{event.artist}</span>
                      </div>
                    )}
                    
                    {/* Event Content */}
                    <div 
                      className="flex flex-col justify-between flex-1 px-4 py-4" 
                      style={{color: '#101119'}}
                    >
                      <div>
                        <MarqueeText className="font-bold text-lg mb-6 text-[#101119] min-h-[32px] flex items-center">
                          {event.artist || <span>&nbsp;</span>}
                        </MarqueeText>
                        <MarqueeText className="font-bold text-base mb-2 text-[#101119] min-h-[24px] flex items-center">
                          {event.name || <span>&nbsp;</span>}
                        </MarqueeText>
                        <div style={{minHeight: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                          <div className="flex items-center text-sm mb-1" style={{color: '#101119'}}>
                            <svg 
                              xmlns='http://www.w3.org/2000/svg' 
                              className='mr-2' 
                              width='20' 
                              height='20' 
                              fill='none' 
                              viewBox='0 0 24 24' 
                              stroke='#1a48c4' 
                              strokeWidth='2' 
                              style={{minWidth: '20px', minHeight: '20px', display: 'inline-block', verticalAlign: 'middle'}}
                            >
                              <rect x='3' y='4' width='18' height='18' rx='4' stroke='#1a48c4' strokeWidth='2' fill='none'/>
                              <path d='M16 2v4M8 2v4M3 10h18' stroke='#1a48c4' strokeWidth='2' strokeLinecap='round'/>
                            </svg>
                            {format(new Date(event.date), "d MMM yyyy - HH:mm", { locale: es })}
                          </div>
                          <div className="flex items-center text-sm mb-2" style={{color: '#101119'}}>
                            <svg 
                              xmlns='http://www.w3.org/2000/svg' 
                              className='mr-2' 
                              width='22' 
                              height='22' 
                              fill='none' 
                              viewBox='0 0 24 24' 
                              stroke='#1a48c4' 
                              strokeWidth='2' 
                              style={{minWidth: '22px', minHeight: '22px', display: 'inline-block', verticalAlign: 'middle'}}
                            >
                              <path d='M12 21s-6-5.686-6-10A6 6 0 0118 11c0 4.314-6 10-6 10z' stroke='#1a48c4' strokeWidth='2' fill='none'/>
                              <circle cx='12' cy='11' r='3' stroke='#1a48c4' strokeWidth='2' fill='none'/>
                            </svg>
                            <MarqueeText>{event.venue}, {event.city}</MarqueeText>
                          </div>
                        </div>
                      </div>
                      
                      {/* Ticket Button */}
                      {event.ticket_url && (
                        <a
                          href={event.ticket_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-white text-center px-4 py-2 rounded-lg font transition"
                          style={{background: '#1752F9', textDecoration: 'none'}}
                          onClick={e => e.stopPropagation()}
                        >
                          {getTicketButtonText(event)}
                        </a>
                      )}
                    </div>
                  </div>
                 ))}
               </div>
             )}
           </div>

           {/* Ver todos los eventos button */}
           {!loading && !error && events.length > 0 && (
             <div className="text-center mt-12">
               <button
                 className="text-base font-normal cursor-pointer hover:opacity-80 transition-opacity"
                 style={{
                   color: '#76BADF',
                   fontFamily: 'Poppins, Inter, sans-serif',
                   background: 'none',
                   border: 'none',
                   padding: 0,
                   textDecoration: 'none'
                 }}
                 onClick={() => {
                   window.open('https://billboard.louderband.com/agenda', '_blank');
                 }}
               >
                 Ver todos los eventos
               </button>
             </div>
           )}
         </div>
       </div>
    </>
  );
};

export default EmbeddedAgenda2;
