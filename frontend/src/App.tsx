import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import EventsPage from './pages/events/EventsPage';
import EventDetailPage from './pages/events/EventDetailPage';
import AdminPage from './pages/admin/AdminPage';
import EventFormPage from './pages/admin/EventFormPage';
import EmbeddedAgenda from '@/pages/EmbeddedAgenda';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/:id" element={<EventDetailPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/events/new" element={<EventFormPage />} />
      <Route path="/admin/events/:id" element={<EventFormPage />} />
      <Route path="/embed" element={<EmbeddedAgenda />} />
    </Routes>
  );
}

export default App; 