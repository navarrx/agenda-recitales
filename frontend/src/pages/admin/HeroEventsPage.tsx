import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { getHeroEvents, deleteHeroEvent, reorderHeroEvents } from '../../services/api';
import { HeroEvent } from '../../types';
import { Trash2, Plus, Star, GripVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import AddToHeroModal from '../../components/modals/AddToHeroModal';
import { isEventFinished } from '../../utils/eventUtils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Componente para cada item sortable
const SortableHeroEventItem = ({ 
  heroEvent, 
  onDelete
}: { 
  heroEvent: HeroEvent; 
  onDelete: (id: number) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: heroEvent.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-[#101119] rounded-lg p-4 border border-white/10 hover:border-white/20 transition-all duration-300 ${
        isDragging ? 'shadow-lg scale-105' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="p-2 text-white/40 hover:text-white/60 hover:bg-white/10 rounded cursor-grab active:cursor-grabbing transition-colors"
          title="Arrastrar para reordenar"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Position indicator */}
        <div className="flex items-center justify-center w-8 h-8 bg-[#1a48c4] rounded-full text-white text-sm font-bold">
          {heroEvent.order_position}
        </div>

        {/* Event image */}
        <img
          src={heroEvent.hero_image_url}
          alt={heroEvent.event.name}
          className="w-20 h-12 object-cover rounded border border-white/10"
        />

        {/* Event info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-medium truncate">{heroEvent.event.name}</h3>
            {/* Badge "Finalizado" para eventos pasados */}
            {isEventFinished(heroEvent.event.date) && (
              <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 text-red-300 text-xs rounded-full font-medium">
                Finalizado
              </span>
            )}
          </div>
          <p className="text-white/60 text-sm truncate">{heroEvent.event.artist}</p>
          <p className="text-white/40 text-xs">
            {new Date(heroEvent.event.date).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })} • {heroEvent.event.venue}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            to={`/admin/events/${heroEvent.event.id}`}
            className="px-3 py-1 bg-white/10 text-white rounded hover:bg-white/20 transition-colors text-sm"
          >
            Editar
          </Link>
          <button
            onClick={() => onDelete(heroEvent.id)}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors"
            title="Eliminar del hero banner"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const HeroEventsPage = () => {
  const [heroEvents, setHeroEvents] = useState<HeroEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchHeroEvents();
  }, []);

  const fetchHeroEvents = async () => {
    try {
      setLoading(true);
      const events = await getHeroEvents();
      setHeroEvents(events);
      setError(null);
    } catch (err) {
      console.error('Error fetching hero events:', err);
      setError('Error al cargar eventos del hero banner');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (heroEventId: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este evento del hero banner?')) {
      try {
        await deleteHeroEvent(heroEventId);
        setHeroEvents(heroEvents.filter(item => item.id !== heroEventId));
      } catch (err) {
        console.error('Error deleting hero event:', err);
        setError('Error al eliminar el evento del hero banner');
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setHeroEvents((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Actualizar posiciones
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          order_position: index + 1
        }));

        // Actualizar silenciosamente en el background
        handleReorderSilently(updatedItems);

        return updatedItems;
      });
    }
  };

  const handleReorderSilently = async (updatedEvents: HeroEvent[]) => {
    try {
      await reorderHeroEvents(updatedEvents.map(item => item.id));
      // No mostrar errores silenciosos, solo log
    } catch (err) {
      console.error('Error reordering silently:', err);
      // Solo mostrar error si es crítico
      if (err instanceof Error && err.message.includes('network')) {
        setError('Error de conexión al reordenar');
      }
    }
  };



  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a48c4]"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Eventos Hero Banner
          </h1>
          <p className="text-white/60 mt-1">
            Gestiona los eventos destacados en el banner principal
          </p>
          {/* Estadísticas de eventos */}
          {(() => {
            const finishedEvents = heroEvents.filter(heroEvent => 
              isEventFinished(heroEvent.event.date)
            );
            const activeEvents = heroEvents.length - finishedEvents.length;
            
            return (
              <div className="flex gap-4 mt-2 text-sm">
                <span className="text-green-400">
                  {activeEvents} activos
                </span>
                {finishedEvents.length > 0 && (
                  <span className="text-red-400">
                    {finishedEvents.length} finalizados
                  </span>
                )}
              </div>
            );
          })()}
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin"
            className="px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition-all duration-300"
          >
            Volver al Admin
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-all duration-300 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Agregar Evento
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-400/10 border border-red-400 text-red-400 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Consejo sobre eventos finalizados */}
      {(() => {
        const finishedEvents = heroEvents.filter(heroEvent => 
          isEventFinished(heroEvent.event.date)
        );
        
        return finishedEvents.length > 0 ? (
          <div className="bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 px-4 py-3 rounded mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <span className="text-sm">
              <strong>Nota:</strong> Los eventos marcados como "Finalizado" no aparecen en el hero banner público.
            </span>
          </div>
        ) : null;
      })()}

      {heroEvents.length === 0 ? (
        <div className="bg-[#101119] rounded-lg shadow-md p-8 text-center border border-white/10">
          <Star className="h-16 w-16 mx-auto text-white/40 mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">
            No hay eventos en el hero banner
          </h3>
          <p className="text-white/80 mb-4">
            Agrega eventos destacados para que aparezcan en el banner principal.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            Agregar Evento al Hero
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={heroEvents.map(event => event.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
                             {heroEvents.map((heroEvent) => (
                 <SortableHeroEventItem
                   key={heroEvent.id}
                   heroEvent={heroEvent}
                   onDelete={handleDelete}
                 />
               ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {heroEvents.length > 0 && (
        <div className="mt-6 p-4 bg-blue-400/10 border border-blue-400/20 rounded-lg">
          <p className="text-blue-400 text-sm">
            <strong>Consejo:</strong> Puedes arrastrar y soltar los eventos para reordenarlos. 
            Los eventos se mostrarán en el banner principal en el orden que aparecen aquí.
          </p>
        </div>
      )}

      {/* Modal para agregar eventos al hero */}
      <AddToHeroModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          fetchHeroEvents();
          setShowAddModal(false);
        }}
      />
    </Layout>
  );
};

export default HeroEventsPage;
