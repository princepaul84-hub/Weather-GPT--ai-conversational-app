import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Coordinates } from '../types';
import { AlertTriangle, MapPin, Activity, Wind, Flame, MountainSnow } from 'lucide-react';

interface WarningsPageProps {
  currentLocation: Coordinates;
}

interface EonetEvent {
  id: string;
  title: string;
  description: string;
  categories: { id: string; title: string }[];
  geometry: {
    magnitudeValue: number | null;
    magnitudeUnit: string | null;
    date: string;
    type: string;
    coordinates: number[];
  }[];
}

const getCategoryIcon = (categoryId: string) => {
  switch (categoryId) {
    case 'wildfires': return <Flame className="w-4 h-4 text-orange-500" />;
    case 'severeStorms': return <Wind className="w-4 h-4 text-cyan-500" />;
    case 'volcanoes': return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case 'seaLakeIce': return <MountainSnow className="w-4 h-4 text-blue-300" />;
    default: return <Activity className="w-4 h-4 text-slate-500" />;
  }
};

const getCategoryColor = (categoryId: string) => {
  switch (categoryId) {
    case 'wildfires': return '#f97316';
    case 'severeStorms': return '#06b6d4';
    case 'volcanoes': return '#ef4444';
    case 'seaLakeIce': return '#93c5fd';
    default: return '#64748b';
  }
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const WarningsPage: React.FC<WarningsPageProps> = ({ currentLocation }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  
  const [events, setEvents] = useState<(EonetEvent & { distance: number; latestCoords: [number, number] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    // Initialize map
    if (!mapInstanceRef.current && mapContainerRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: true
      }).setView([currentLocation.lat, currentLocation.lng], 4);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);

      L.control.zoom({ position: 'bottomright' }).addTo(mapInstanceRef.current);

      layerGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    }
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const response = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=200');
        if (response.ok) {
          const data = await response.json();
          let processedEvents = data.events.map((ev: EonetEvent) => {
            // Find valid point geometry for distance calculation
            const pointGeo = ev.geometry.find(g => g.type === 'Point' && g.coordinates.length >= 2);
            let latestCoords: [number, number] = [0, 0];
            let distance = 999999;
            
            if (pointGeo) {
              // EONET returns [lon, lat]
              const [lon, lat] = pointGeo.coordinates;
              latestCoords = [lat, lon];
              distance = calculateDistance(currentLocation.lat, currentLocation.lng, lat, lon);
            } else if (ev.geometry.length > 0 && ev.geometry[0].type === 'Polygon' && ev.geometry[0].coordinates.length > 0) {
              // Just use first point of polygon
              const firstPolyArray = ev.geometry[0].coordinates[0] as unknown as number[][];
              if (Array.isArray(firstPolyArray) && firstPolyArray.length > 0) {
                 const [lon, lat] = firstPolyArray[0];
                 latestCoords = [lat, lon];
                 distance = calculateDistance(currentLocation.lat, currentLocation.lng, lat, lon);
              }
            }
            
            return { ...ev, distance, latestCoords };
          });

          processedEvents = processedEvents.filter((ev: any) => ev.latestCoords[0] !== 0 || ev.latestCoords[1] !== 0);
          processedEvents.sort((a: any, b: any) => a.distance - b.distance);
          setEvents(processedEvents);
          
          plotEventsOnMap(processedEvents);
        }
      } catch (err) {
        console.error('Failed to fetch EONET events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [currentLocation]);

  const plotEventsOnMap = (eventsToPlot: (EonetEvent & { distance: number; latestCoords: [number, number] })[]) => {
    if (!layerGroupRef.current || !mapInstanceRef.current) return;
    layerGroupRef.current.clearLayers();

    // Add user location
    L.circleMarker([currentLocation.lat, currentLocation.lng], {
      radius: 8,
      fillColor: '#3b82f6',
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(layerGroupRef.current).bindTooltip('Selected Region', { permanent: false, direction: 'top' });

    eventsToPlot.forEach(ev => {
      const categoryId = ev.categories.length > 0 ? ev.categories[0].id : 'unknown';
      const color = getCategoryColor(categoryId);
      
      const marker = L.circleMarker(ev.latestCoords, {
        radius: 6,
        fillColor: color,
        color: '#ffffff',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.7
      }).addTo(layerGroupRef.current!);
      
      marker.bindPopup(`
        <div style="font-family: inherit; color: #0f172a; padding: 4px;">
          <strong style="display: block; font-size: 13px; margin-bottom: 4px;">${ev.title}</strong>
          <span style="font-size: 11px; color: #475569;">${ev.categories[0]?.title || 'Unknown Category'}</span><br/>
          <span style="font-size: 11px; color: #475569;">${ev.geometry[0]?.date ? new Date(ev.geometry[0].date).toLocaleDateString() : ''}</span>
        </div>
      `);
      
      marker.on('click', () => {
        setSelectedEventId(ev.id);
      });
    });
  };

  const handleEventClick = (ev: EonetEvent & { latestCoords: [number, number] }) => {
    setSelectedEventId(ev.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(ev.latestCoords, 7, {
        animate: true,
        duration: 1.5
      });
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-128px)] w-full overflow-hidden relative">
      {/* Sidebar List */}
      <div className="w-full md:w-96 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/10 flex flex-col z-10 shrink-0 h-1/2 md:h-full">
        <div className="p-4 border-b border-slate-200 dark:border-white/10 shrink-0">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-500" />
            Live NASA EONET Warnings
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Global natural disaster tracker. Events sorted by proximity to {currentLocation.name}.
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center p-6 text-sm text-slate-500">
              No live events found at this time.
            </div>
          ) : (
            events.map((ev) => (
              <button
                key={ev.id}
                onClick={() => handleEventClick(ev)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedEventId === ev.id 
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' 
                    : 'border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                      {ev.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        {getCategoryIcon(ev.categories[0]?.id)}
                        <span>{ev.categories[0]?.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">•</span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                        <MapPin className="w-3 h-3" />
                        <span>{Math.round(ev.distance).toLocaleString()} km away</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
      
      {/* Map Container */}
      <div className="flex-1 relative h-1/2 md:h-full z-0 bg-slate-900">
        <div ref={mapContainerRef} className="absolute inset-0" style={{ backgroundColor: '#0f172a' }}></div>
      </div>
    </div>
  );
};
