import React, { useState, useEffect, useRef } from 'react';
import { 
  CloudRain, 
  ShieldAlert, 
  MapPin, 
  ChevronDown, 
  Moon, 
  Sun, 
  User, 
  LogOut, 
  Radio, 
  AlertTriangle, 
  Activity, 
  ExternalLink,
  Flame,
  VolumeX
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { LanguageCode, WeatherAlert, Coordinates, IMDWarningsResponse } from '../types';
import { UI_TRANSLATIONS } from '../data/mockWeatherData';
import { LocationSearch } from './LocationSearch';

interface NavbarProps {
  currentLang: LanguageCode;
  onLanguageChange?: (lang: LanguageCode) => void;
  activeAlerts: WeatherAlert[];
  currentLocation: Coordinates;
  onLocationSelect: (loc: Coordinates) => void;
  onOpenSOSModal: () => void;
  isSpeaking?: boolean;
  onStopSpeaking?: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  presetRegions?: Coordinates[];
  currentUser?: string | null;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  onOpenWarnings?: () => void;
  // IMD Warnings Integration
  imdData?: IMDWarningsResponse | null;
  onOpenIMDWarnings?: (tab?: 'district' | 'subdivision' | 'disaster') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLang,
  activeAlerts,
  currentLocation,
  onLocationSelect,
  onOpenSOSModal,
  isSpeaking,
  onStopSpeaking,
  isDarkMode,
  onToggleTheme,
  presetRegions,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenWarnings,
  imdData,
  onOpenIMDWarnings
}) => {
  const [isWarningsDropdownOpen, setIsWarningsDropdownOpen] = useState(false);
  const [activeIMDCategory, setActiveIMDCategory] = useState<'district' | 'subdivision' | 'disaster'>('district');
  const [currentTickerIndex, setCurrentTickerIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsWarningsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Ticker rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTickerIndex((prev) => prev + 1);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const districtList = imdData?.districtWarnings || [];
  const subdivisionList = imdData?.subdivisionWarnings || [];
  const disasterList = imdData?.disasterWarnings || [];

  // Determine current ticker content based on active category
  let currentTickerItem: { title: string; badge: string; color: string; detail: string } = {
    title: 'Loading IMD Meteorological telemetry...',
    badge: 'IMD',
    color: 'Yellow',
    detail: 'National Weather Observation Network'
  };

  if (activeIMDCategory === 'district' && districtList.length > 0) {
    const item = districtList[currentTickerIndex % districtList.length];
    currentTickerItem = {
      title: `${item.district} (${item.state})`,
      badge: `${item.color.toUpperCase()} ALERT`,
      color: item.color,
      detail: item.phenomenon
    };
  } else if (activeIMDCategory === 'subdivision' && subdivisionList.length > 0) {
    const item = subdivisionList[currentTickerIndex % subdivisionList.length];
    currentTickerItem = {
      title: item.subdivision,
      badge: `${item.color.toUpperCase()} ALERT`,
      color: item.color,
      detail: item.warning
    };
  } else if (activeIMDCategory === 'disaster' && disasterList.length > 0) {
    const item = disasterList[currentTickerIndex % disasterList.length];
    currentTickerItem = {
      title: item.title,
      badge: `${item.severity.toUpperCase()}`,
      color: item.color,
      detail: item.advisoryDirective.slice(0, 100) + '...'
    };
  }

  const redCount = imdData?.nationalSummary.redAlerts || 0;
  const orangeCount = imdData?.nationalSummary.orangeAlerts || 0;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 shadow-md">
      {/* 
        MAIN TOP ROW: STRICT ORDER
        1. Icon for WeatherGPT
        2. Name WeatherGPT
        3. Dark Mode button
        4. Location icon only
        5. Dropdown for SOS Warning, IMD Warning, and Live Warning
        6. Login / Sign Up button
      */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left Section: 1. Icon for WeatherGPT + 2. Name WeatherGPT */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* 1. Icon for WeatherGPT */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-cyan-500/15 border border-cyan-400/40 rounded-xl flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.25)] flex-shrink-0">
            <CloudRain className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600 dark:text-cyan-400 animate-pulse" />
          </div>

          {/* 2. Name WeatherGPT */}
          <div className="flex items-center gap-1.5">
            <span className="font-black text-base sm:text-xl tracking-tight bg-gradient-to-r from-cyan-600 via-sky-600 to-emerald-600 dark:from-cyan-400 dark:via-sky-300 dark:to-emerald-400 bg-clip-text text-transparent select-none">
              WeatherGPT
            </span>
            <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 hidden lg:inline-block">
              NWP AI
            </span>
          </div>
        </div>

        {/* Center / Right Section containing ordered items: 3, 4, 5, 6 */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* 3. Dark Mode Button */}
          <button
            id="theme-toggle-btn"
            onClick={onToggleTheme}
            className="p-2 sm:p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-colors flex-shrink-0 flex items-center justify-center"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* 4. Location Icon Only (hover to see tooltip with location details, click to change) */}
          <div className="flex-shrink-0">
            <LocationSearch 
              currentLocation={currentLocation} 
              onLocationSelect={onLocationSelect} 
              presetRegions={presetRegions}
              iconOnly={true}
            />
          </div>

          {/* 5. Dropdown for SOS Warning, IMD Warning, and Live Warning */}
          <div className="relative flex-shrink-0" ref={dropdownRef}>
            <button
              id="warnings-sos-dropdown-btn"
              onClick={() => setIsWarningsDropdownOpen(!isWarningsDropdownOpen)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all border shadow-sm ${
                isWarningsDropdownOpen
                  ? 'bg-red-500 text-white border-red-600 shadow-red-500/30'
                  : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:hover:bg-red-900/50 dark:text-red-300 dark:border-red-900/60'
              }`}
              aria-label="Warnings and SOS Menu"
              aria-expanded={isWarningsDropdownOpen}
            >
              <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 dark:text-red-400 animate-pulse" />
              <span className="hidden sm:inline font-semibold">Warnings & SOS</span>
              <span className="sm:hidden font-semibold">Alerts</span>
              
              {/* Alert Badge Indicator */}
              {(redCount > 0 || activeAlerts.length > 0) && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              )}

              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isWarningsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu (Visible and formatted for Mobile, Tablet, and Desktop) */}
            {isWarningsDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 divide-y divide-slate-100 dark:divide-white/10"
                role="menu"
              >
                {/* Header info */}
                <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Emergency & Early Warnings
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-semibold">
                    Live Feed
                  </span>
                </div>

                <div className="p-1.5 space-y-1">
                  {/* OPTION 1: SOS Warning */}
                  <button
                    onClick={() => {
                      setIsWarningsDropdownOpen(false);
                      onOpenSOSModal();
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex items-start gap-3 group/sos"
                    role="menuitem"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover/sos:scale-105 transition-transform">
                      <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 animate-bounce" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-red-700 dark:text-red-300">
                          🚨 SOS Warning
                        </span>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300">
                          Emergency
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight mt-0.5">
                        Trigger multi-channel emergency broadcast (SMS, WhatsApp, Sirens) to Panchayats
                      </p>
                    </div>
                  </button>

                  {/* OPTION 2: IMD Warning */}
                  <button
                    onClick={() => {
                      setIsWarningsDropdownOpen(false);
                      if (onOpenIMDWarnings) {
                        onOpenIMDWarnings('district');
                      }
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors flex items-start gap-3 group/imd"
                    role="menuitem"
                  >
                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover/imd:scale-105 transition-transform">
                      <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-orange-700 dark:text-orange-300">
                          🇮🇳 IMD Warning
                        </span>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300">
                          Mausam / Govt
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight mt-0.5">
                        District-wise, 36 Meteorological Subdivisions & National Disaster hazard bulletins
                      </p>
                    </div>
                  </button>

                  {/* OPTION 3: Live Warning */}
                  <button
                    onClick={() => {
                      setIsWarningsDropdownOpen(false);
                      if (onOpenWarnings) {
                        onOpenWarnings();
                      }
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors flex items-start gap-3 group/live"
                    role="menuitem"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover/live:scale-105 transition-transform">
                      <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-amber-700 dark:text-amber-300">
                          🛰️ Live Warning
                        </span>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                          NASA EONET
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight mt-0.5">
                        Real-time active meteorological events, storm tracks, severe convection & radar scans
                      </p>
                    </div>
                  </button>
                </div>

                {/* Dropdown Footer Quick Status */}
                <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span>Current: {currentLocation.name.split(',')[0]}</span>
                  <span className="font-semibold text-cyan-600 dark:text-cyan-400">Doppler 2.8 GHz Active</span>
                </div>
              </div>
            )}
          </div>

          {/* 6. Login / Sign Up button */}
          {currentUser ? (
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10">
                <User className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span className="max-w-[70px] sm:max-w-[100px] truncate">{currentUser}</span>
              </div>
              <button
                onClick={onLogout}
                title="Log Out"
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors flex items-center gap-1"
                aria-label="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white font-semibold text-xs transition-all shadow-sm flex items-center gap-1 sm:gap-1.5 flex-shrink-0"
              aria-label="Log In or Sign Up"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Login / Sign Up</span>
              <span className="sm:hidden">Login</span>
            </button>
          )}

          {/* Speaking indicator if active */}
          {isSpeaking && onStopSpeaking && (
            <button
              onClick={onStopSpeaking}
              className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-400/40 animate-pulse flex items-center"
              title="Stop Speech"
            >
              <VolumeX className="w-3.5 h-3.5" />
            </button>
          )}

          {/* PWA Install Button */}
          <div className="hidden sm:block">
            <PWAInstallButton />
          </div>
        </div>
      </div>

      {/* 
        IMD WARNING STRIP / TICKER:
        Fulfills requirement 1:
        "make use of imd apis to fetch data for warning and show it in the home page navbar to show waring for indian district wise , subdivision and disaster warning ."
      */}
      <div className="bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200/80 dark:border-white/10 px-2.5 sm:px-4 lg:px-8 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2">
        {/* IMD Source Badge & Category Buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500/15 border border-orange-400/30 text-orange-700 dark:text-orange-400 font-bold text-[10px] tracking-wider uppercase">
            <Radio className="w-2.5 h-2.5 text-orange-600 dark:text-orange-400 animate-ping" />
            <span>IMD Early Warning</span>
          </div>

          {/* Category Toggle Tabs */}
          <div className="flex items-center space-x-1 p-0.5 bg-slate-200/70 dark:bg-slate-800/80 rounded-lg text-[10px] font-semibold">
            <button
              onClick={() => {
                setActiveIMDCategory('district');
                setCurrentTickerIndex(0);
              }}
              className={`px-2 py-0.5 rounded transition-all ${
                activeIMDCategory === 'district'
                  ? 'bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              District-Wise ({districtList.length})
            </button>
            <button
              onClick={() => {
                setActiveIMDCategory('subdivision');
                setCurrentTickerIndex(0);
              }}
              className={`px-2 py-0.5 rounded transition-all ${
                activeIMDCategory === 'subdivision'
                  ? 'bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              36 Subdivisions
            </button>
            <button
              onClick={() => {
                setActiveIMDCategory('disaster');
                setCurrentTickerIndex(0);
              }}
              className={`px-2 py-0.5 rounded transition-all ${
                activeIMDCategory === 'disaster'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Disaster Alerts ({disasterList.length})
            </button>
          </div>
        </div>

        {/* Live Warning Ticker Item */}
        <div 
          onClick={() => {
            if (onOpenIMDWarnings) {
              onOpenIMDWarnings(activeIMDCategory);
            }
          }}
          className="flex-1 min-w-[240px] max-w-2xl cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-2 overflow-hidden px-2 py-0.5 rounded bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-white/5"
          title="Click to inspect all IMD warnings"
        >
          <span 
            className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold flex-shrink-0 ${
              currentTickerItem.color === 'Red'
                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                : currentTickerItem.color === 'Orange'
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                : currentTickerItem.color === 'Yellow'
                ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border border-yellow-500/30'
                : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {currentTickerItem.badge}
          </span>
          <span className="font-bold text-slate-800 dark:text-slate-200 truncate text-[11px]">
            {currentTickerItem.title}:
          </span>
          <span className="text-slate-600 dark:text-slate-400 truncate text-[11px] flex-1">
            {currentTickerItem.detail}
          </span>
        </div>

        {/* View All IMD Warnings Button */}
        <button
          onClick={() => {
            if (onOpenIMDWarnings) {
              onOpenIMDWarnings(activeIMDCategory);
            }
          }}
          className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 underline flex items-center gap-1 flex-shrink-0"
        >
          <span>View All Warnings</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </header>
  );
};
