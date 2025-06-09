import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue in React
// This is needed because Leaflet expects images to be in a specific location
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface EventMapProps {
  address: string;
  venueName: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  className?: string;
}

interface GeocodingResult {
  lat: number;
  lon: number;
}

const EventMap = ({ address, venueName, city, latitude, longitude, className = '' }: EventMapProps) => {
  const [coordinates, setCoordinates] = useState<GeocodingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapElement, setMapElement] = useState<HTMLDivElement | null>(null);
  
  // Default coordinates (Buenos Aires, Argentina)
  const defaultCoordinates = { lat: -34.6037, lon: -58.3816 };

  // Obtener las coordenadas
  useEffect(() => {
    // Si ya tenemos coordenadas del evento, usarlas
    if (latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined) {
      setCoordinates({ lat: latitude, lon: longitude });
      setLoading(false);
      return;
    }

    const getCoordinates = async () => {
      if (!address && !city) {
        setCoordinates(defaultCoordinates);
        setLoading(false);
        return;
      }

      try {
        const searchQuery = encodeURIComponent(`${address || venueName}, ${city}, Argentina`);
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${searchQuery}&format=json&limit=1`);
        
        if (!response.ok) {
          throw new Error('Error en la búsqueda de ubicación');
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
          setCoordinates({
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon)
          });
        } else {
          // Si no encontramos la dirección exacta, intentamos solo con la ciudad
          if (address && city) {
            const cityQuery = encodeURIComponent(`${city}, Argentina`);
            const cityResponse = await fetch(`https://nominatim.openstreetmap.org/search?q=${cityQuery}&format=json&limit=1`);
            const cityData = await cityResponse.json();
            
            if (cityData && cityData.length > 0) {
              setCoordinates({
                lat: parseFloat(cityData[0].lat),
                lon: parseFloat(cityData[0].lon)
              });
            } else {
              // Si todo falla, usamos coordenadas predeterminadas
              setCoordinates(defaultCoordinates);
            }
          } else {
            setCoordinates(defaultCoordinates);
          }
        }
      } catch (err) {
        console.error('Error fetching coordinates:', err);
        setError('No se pudo cargar el mapa');
        setCoordinates(defaultCoordinates);
      } finally {
        setLoading(false);
      }
    };

    getCoordinates();
  }, [address, venueName, city, latitude, longitude]);

  // Inicializar el mapa cuando las coordenadas están disponibles
  useEffect(() => {
    if (!coordinates || !mapElement) return;
    
    // Limpiar el contenido anterior
    mapElement.innerHTML = '';
    
    try {
      // Creamos el mapa
      const map = L.map(mapElement).setView([coordinates.lat, coordinates.lon], 15);
      
      // Añadimos el tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      // Añadimos un marcador
      const marker = L.marker([coordinates.lat, coordinates.lon]).addTo(map);
      
      // Añadimos un popup
      marker.bindPopup(`
        <div>
          <strong>${venueName}</strong>
          <p style="font-size: 0.875rem">${address}</p>
          <p style="font-size: 0.875rem">${city}</p>
        </div>
      `);
      
      // Limpiar al desmontar
      return () => {
        map.remove();
      };
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Error al inicializar el mapa');
    }
  }, [coordinates, mapElement, address, venueName, city]);

  if (loading) {
    return (
      <div className={`bg-gray-200 dark:bg-gray-700 rounded-lg h-64 flex items-center justify-center ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !coordinates) {
    return (
      <div className={`bg-gray-200 dark:bg-gray-700 rounded-lg h-64 flex items-center justify-center text-gray-500 dark:text-gray-400 ${className}`}>
        <p>{error || 'No se pudo cargar el mapa'}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden ${className}`}>
      <div 
        ref={setMapElement}
        style={{ height: '400px', width: '100%', position: 'relative', zIndex: 0 }}
        className="leaflet-container"
      />
    </div>
  );
};

export default EventMap; 