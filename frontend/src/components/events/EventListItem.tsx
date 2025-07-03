import { Link } from 'react-router-dom';
import { Event } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EventListItemProps {
  event?: Event;
  isHeader?: boolean;
}

const EventListItem = ({ event, isHeader = false }: EventListItemProps) => {
  if (isHeader) {
    return (
      <>
        {/* Header mobile */}
        <div className="sm:hidden grid grid-cols-[2fr_1fr_1fr] gap-4 px-4 py-2 text-xs font-semibold text-white/50 uppercase tracking-wider">
          <div className="truncate">Artista</div>
          <div className="truncate">Ciudad</div>
          <div className="truncate">Fecha</div>
        </div>
        {/* Header desktop */}
        <div className="hidden sm:grid grid-cols-4 gap-4 px-4 py-2 text-sm font-semibold text-white/50 uppercase tracking-wider">
          <div className="col-span-1">Artista</div>
          <div className="col-span-1">Lugar</div>
          <div className="col-span-1">Ciudad</div>
          <div className="col-span-1">Fecha</div>
        </div>
      </>
    );
  }

  if (!event) return null;
  
  const formattedDate = format(new Date(event.date), "dd MMM - HH:mm", { locale: es }).replace('.', '');
  
  return (
    <Link 
      to={`/events/${event.id}`}
      className="block bg-[#101119] rounded-xl hover:bg-white/5 transition-all duration-300 border-b border-white/10 last:border-b-0"
    >
      {/* Vista móvil */}
      <div className="sm:hidden grid grid-cols-[2fr_1fr_1fr] gap-4 p-4 items-center min-h-0">
        <div className="min-h-0">
          <h3 className="text-base font-bold text-white mb-1 overflow-hidden line-clamp-2 break-words min-h-0">
            {event.artist}
          </h3>
        </div>
        <div className="text-white/70 text-sm truncate overflow-hidden min-h-0">
          {event.city}
        </div>
        <div className="text-white/70 text-sm truncate overflow-hidden min-h-0">
          {/* Solo día y mes en mobile */}
          {format(new Date(event.date), "dd MMM", { locale: es }).replace('.', '')}
        </div>
      </div>
      
      {/* Vista desktop */}
      <div className="hidden sm:grid grid-cols-4 gap-4 p-4 items-center">
        <div className="col-span-1">
          <h3 className="text-base font-bold text-white">
            {event.artist}
          </h3>
        </div>
        
        <div className="col-span-1 text-white/70">
          {event.venue}
        </div>

        <div className="col-span-1 text-white/70">
          {event.city}
        </div>

        <div className="col-span-1 text-white/70">
          {formattedDate}
        </div>
      </div>
    </Link>
  );
};

export default EventListItem; 