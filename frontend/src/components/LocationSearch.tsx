import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronDown, Search, Loader2 } from 'lucide-react';
import { Coordinates } from '../types';
import { PRESET_REGIONS } from '../data/mockWeatherData';

interface LocationSearchProps {
  currentLocation: Coordinates;
  onLocationSelect: (loc: Coordinates) => void;
  presetRegions?: Coordinates[];
  iconOnly?: boolean;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({ 
  currentLocation, 
  onLocationSelect, 
  presetRegions,
  iconOnly = true
}) => {
  const regionsToUse = presetRegions || PRESET_REGIONS;
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`);
        const data = await res.json();
        if (data.results) {
          setResults(data.results);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error("Geocoding failed", error);
      } finally {
        setIsSearching(false);
      }
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (loc: Coordinates) => {
    onLocationSelect(loc);
    setIsOpen(false);
    setQuery('');
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const resp = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/geocode/reverse?lat=${lat}&lon=${lng}`);
          if (resp.ok) {
            const data = await resp.json();
            handleSelect({ name: data.name || `My Location (${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E)`, lat, lng });
          } else {
            handleSelect({ name: `My Location (${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E)`, lat, lng });
          }
        } catch (e) {
          handleSelect({ name: `My Location (${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E)`, lat, lng });
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      {iconOnly ? (
        <div className="relative group/loc">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`p-2 sm:p-2.5 rounded-lg border transition-all flex items-center justify-center flex-shrink-0 ${
              isOpen 
                ? 'bg-cyan-100 dark:bg-cyan-500/25 border-cyan-500 text-cyan-600 dark:text-cyan-300 ring-2 ring-cyan-400/30' 
                : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10'
            }`}
            title={`Current Location: ${currentLocation.name} (${currentLocation.lat.toFixed(2)}°N, ${currentLocation.lng.toFixed(2)}°E) • Click to change`}
            aria-label="Change location"
          >
            <MapPin className="w-4 h-4 text-cyan-600 dark:text-cyan-400 animate-pulse" />
          </button>

          {/* Hover Tooltip - Desktop & Tablet */}
          <div className="hidden sm:group-hover/loc:flex pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 flex-col items-center whitespace-nowrap">
            <div className="w-2 h-2 bg-slate-900 rotate-45 -mb-1"></div>
            <div className="bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-md shadow-xl border border-white/10 flex flex-col items-center">
              <span className="font-semibold text-cyan-300">{currentLocation.name.split(',')[0]}</span>
              <span className="text-[9px] text-slate-400">{currentLocation.lat.toFixed(2)}°N, {currentLocation.lng.toFixed(2)}°E • Click to change</span>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 text-xs font-medium backdrop-blur-md transition-all"
        >
          <MapPin className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
          <span className="max-w-[70px] sm:max-w-[140px] truncate">{currentLocation.name.split(',')[0]}</span>
          <ChevronDown className={`w-3 h-3 text-slate-500 dark:text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* Popover / Search Modal */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2.5 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Select Location</span>
              <button
                onClick={handleDetectGPS}
                disabled={isLocating}
                className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold disabled:opacity-50"
              >
                {isLocating ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <MapPin className="w-2.5 h-2.5" />}
                <span>{isLocating ? 'Detecting...' : 'Use GPS'}</span>
              </button>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search Indian city or district (e.g. Pune, Wayanad)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 dark:text-slate-100 placeholder-slate-400"
                autoFocus
              />
              {isSearching && <Loader2 className="w-3 h-3 text-cyan-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />}
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto py-1 divide-y divide-slate-100 dark:divide-white/5">
            {query && results.length > 0 ? (
              <div>
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-950/30">
                  Search Results
                </div>
                {results.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { 
                      if (r.latitude !== undefined && r.longitude !== undefined) {
                        handleSelect({ 
                          name: `${r.name}, ${r.admin1 || r.country}`, 
                          lat: r.latitude, 
                          lng: r.longitude,
                          state: r.admin1,
                          country: r.country
                        });
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-cyan-50 dark:hover:bg-cyan-500/10 hover:text-cyan-700 dark:hover:text-cyan-300 flex flex-col transition-colors text-slate-700 dark:text-slate-300"
                  >
                    <span className="font-semibold">{r.name}</span>
                    <span className="text-[10px] text-slate-500">{r.admin1 ? `${r.admin1}, ` : ''}{r.country}</span>
                  </button>
                ))}
              </div>
            ) : query && !isSearching ? (
              <div className="px-3 py-4 text-center text-xs text-slate-500">No matching places found</div>
            ) : (
              <div>
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/30">
                  Key Indian Meteorological Hubs
                </div>
                {regionsToUse.map((region) => (
                  <button
                    key={region.name}
                    onClick={() => handleSelect(region)}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-cyan-50 dark:hover:bg-cyan-500/10 hover:text-cyan-700 dark:hover:text-cyan-300 flex items-center justify-between transition-colors ${
                      currentLocation.name === region.name 
                        ? 'text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 font-semibold' 
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <span className="block font-medium">{region.name}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{region.state || 'India'}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{region.lat.toFixed(1)}°N, {region.lng.toFixed(1)}°E</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
