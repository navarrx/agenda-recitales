import React from 'react';
import Layout from '../../components/layout/Layout';
import EventList from '../../components/events/EventList';

const EventsPage = () => {
  return (
    <Layout>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Fechas
        </h1>
        <p className="text-sm sm:text-base text-white/80">
          Descubre los mejores recitales y festivales en tu ciudad. Filtra por tipo de evento, lugar o género.
        </p>
      </div>
      
      <EventList />
    </Layout>
  );
};

export default EventsPage; 