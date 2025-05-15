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
    <div className="card group hover-lift">
      <div className="relative h-48 overflow-hidden">
        {event.image_url ? (
          <img 
            src={event.image_url} 
            alt={event.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-neutral-200/80 to-neutral-300/80 dark:from-neutral-700/80 dark:to-neutral-600/80">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-neutral-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Genre badge */}
        <div className="absolute top-3 left-3 bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md transform -translate-y-1 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          {event.genre}
        </div>
      </div>
      
      <div className="p-5">
        {/* Artist name with hover effect */}
        <h3 className="font-bold text-xl text-neutral-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
          {event.artist}
        </h3>
        
        {/* Event name */}
        <h4 className="text-md text-neutral-700 dark:text-neutral-300 mb-3">
          {event.name}
        </h4>
        
        {/* Date and location with icon */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formattedDate}</span>
          </div>
          
          <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-secondary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{event.venue}, {event.city}</span>
          </div>
        </div>
        
        {/* Action buttons with hover effect */}
        <div className="flex justify-between items-center pt-2 border-t border-neutral-200 dark:border-neutral-700">
          <Link 
            to={`/events/${event.id}`}
            className="link inline-flex items-center group"
          >
            <span>Ver detalles</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          
          {event.ticket_url && (
            <a 
              href={event.ticket_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-primary py-1 px-3 text-sm"
            >
              Comprar entradas
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard; 