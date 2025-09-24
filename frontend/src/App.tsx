import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import EventsPage from './pages/events/EventsPage';
import EventDetailPage from './pages/events/EventDetailPage';
import AdminPage from './pages/admin/AdminPage';
import EventFormPage from './pages/admin/EventFormPage';
import EmbeddedAgenda from '@/pages/EmbeddedAgenda';
import EmbeddedAgenda2 from '@/pages/EmbeddedAgenda2';
import Login from './pages/Login';
import EventRequestsPage from './pages/admin/EventRequestsPage';
import PastEventsPage from './pages/admin/PastEventsPage';
import HeroEventsPage from './pages/admin/HeroEventsPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events/new"
          element={
            <ProtectedRoute>
              <EventFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events/:id"
          element={
            <ProtectedRoute>
              <EventFormPage />
            </ProtectedRoute>
          }
        />
        <Route path="/embed" element={<EmbeddedAgenda />} />
        <Route path="/embed-2" element={<EmbeddedAgenda2 />} />
        <Route
          path="/admin/event-requests"
          element={
            <ProtectedRoute>
              <EventRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/past-events"
          element={
            <ProtectedRoute>
              <PastEventsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/hero-events"
          element={
            <ProtectedRoute>
              <HeroEventsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App; 