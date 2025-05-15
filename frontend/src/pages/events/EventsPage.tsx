import Layout from '../../components/layout/Layout';
import EventList from '../../components/events/EventList';

const EventsPage = () => {
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Eventos y Recitales
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Descubre los mejores eventos musicales y recitales en tu ciudad. Filtra por género, fecha o lugar.
        </p>
      </div>
      
      <EventList />
    </Layout>
  );
};

export default EventsPage; 