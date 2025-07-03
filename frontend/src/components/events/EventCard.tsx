import { Link } from 'react-router-dom';
import { Event } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EventCardProps {
  event: Event;
}

const EventCard = ({ event }: EventCardProps) => {
  const formattedDate = format(new Date(event.date), 'dd MMM yyyy - HH:mm', { locale: es });
  
  return (
    <Link 
      to={`/events/${event.id}`}
      className="block bg-[#101119] rounded-xl hover:scale-[1.02] transition-all duration-300 w-full"
      style={{ minHeight: 'clamp(320px, 40vw, 420px)' }}
    >
      <div className="p-2">
        <div className="relative w-full aspect-[1/1.1] rounded-xl overflow-hidden border border-white flex items-center justify-center bg-neutral-900">
          {event.image_url ? (
            <img 
              src={event.image_url} 
              alt={event.name} 
              className="w-full h-full object-cover object-center transition-all duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-neutral-200/80 to-neutral-300/80 dark:from-neutral-700/80 dark:to-neutral-600/80">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-neutral-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
          )}
        </div>
      </div>
      
      <div className="px-2 pb-2">
        <h3 className="text-sm sm:text-base font-bold text-white mb-1 line-clamp-2">
          {event.name}
        </h3>
        
        <div className="space-y-0.5 text-xs text-white/70">
          <p className="font-medium">{event.artist}</p>
          <p>{formattedDate}</p>
          <p className="line-clamp-1">{event.venue}</p>
        </div>
      </div>
    </Link>
  );
};

export default EventCard; 