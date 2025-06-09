import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Event {
  id: number;
  name: string;
  artist: string;
  genre: string;
  date: string;
  location: string;
  city: string;
  venue: string;
  description: string;
  image_url: string | null;
  ticket_url: string | null;
  is_featured: boolean;
  latitude: number | null;
  longitude: number | null;
}

interface EmbeddedAgendaProps {
  theme?: 'light' | 'dark';
  width?: string;
  initialFilters?: {
    genre?: string;
    location?: string;
    date?: string;
  };
}

const EmbeddedAgenda: React.FC<EmbeddedAgendaProps> = ({
  theme = 'dark',
  width = '100%',
  initialFilters = {}
}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedEvent(null);
    }, 300);
  };

  return (
    <div className="embedded-agenda" style={{ width }}>
      {isModalOpen && selectedEvent && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300"
          onClick={closeModal}
        >
          <div 
            className="bg-[#101119] rounded-xl shadow-xl w-full max-w-lg transform transition-all duration-300 scale-100 opacity-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative">
              <button 
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10"
                onClick={closeModal}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              <div className="relative h-48 overflow-hidden rounded-t-xl">
                {selectedEvent.image_url ? (
                  <img 
                    src={selectedEvent.image_url} 
                    alt={selectedEvent.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#1a48c4]">
                    <span className="text-white text-2xl font-bold">{selectedEvent.artist}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#101119] via-transparent to-transparent"></div>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <span className="inline-block bg-[#1a48c4] text-white text-sm font-semibold px-3 py-1 rounded-full mb-2">
                    {selectedEvent.genre}
                  </span>
                  <h2 className="text-xl font-bold text-white mb-1">{selectedEvent.name}</h2>
                  <h3 className="text-lg text-white/80">{selectedEvent.artist}</h3>
                </div>

                <div className="space-y-4 text-white/80">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#1a48c4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{format(new Date(selectedEvent.date), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}</span>
                  </div>

                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#1a48c4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p>{selectedEvent.venue}</p>
                      <p>{selectedEvent.location}, {selectedEvent.city}</p>
                    </div>
                  </div>

                  {selectedEvent.description && (
                    <div className="pt-2 border-t border-white/10">
                      <p className="text-sm">{selectedEvent.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmbeddedAgenda; 