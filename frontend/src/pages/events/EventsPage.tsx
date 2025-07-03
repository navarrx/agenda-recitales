import Layout from '../../components/layout/Layout';
import EventList from '../../components/events/EventList';

const EventsPage = () => {
  return (
    <Layout>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Eventos y Recitales
        </h1>
        <p className="text-sm sm:text-base text-white/80">
          Descubre los mejores eventos musicales y recitales en tu ciudad. Filtra por tipo de evento, fecha o lugar.
        </p>
      </div>
      
      <EventList />
    </Layout>
  );
};

export default EventsPage; 