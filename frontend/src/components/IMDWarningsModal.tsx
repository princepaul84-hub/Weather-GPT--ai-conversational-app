import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  MapPin, 
  Search, 
  AlertTriangle, 
  Flame, 
  Wind, 
  CloudRain, 
  Info, 
  CheckCircle2, 
  Radio, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { IMDWarningsResponse, IMDDistrictWarning, IMDSubdivisionWarning, IMDDisasterWarning } from '../types';

interface IMDWarningsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: IMDWarningsResponse | null;
  currentLocationName?: string;
  onRefresh?: () => void;
  initialTab?: 'district' | 'subdivision' | 'disaster';
}

export const IMDWarningsModal: React.FC<IMDWarningsModalProps> = ({
  isOpen,
  onClose,
  data,
  currentLocationName = '',
  onRefresh,
  initialTab = 'district'
}) => {
  const [activeTab, setActiveTab] = useState<'district' | 'subdivision' | 'disaster'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<'All' | 'Red' | 'Orange' | 'Yellow' | 'Green'>('All');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');

  if (!isOpen) return null;

  const districts = data?.districtWarnings || [];
  const subdivisions = data?.subdivisionWarnings || [];
  const disasters = data?.disasterWarnings || [];

  // Filter districts
  const filteredDistricts = districts.filter(d => {
    const matchesSearch = !searchQuery || 
      d.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.subdivision.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phenomenon.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesColor = selectedColor === 'All' || d.color === selectedColor;
    return matchesSearch && matchesColor;
  });

  // Filter subdivisions
  const filteredSubdivisions = subdivisions.filter(s => {
    const matchesSearch = !searchQuery ||
      s.subdivision.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.warning.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesColor = selectedColor === 'All' || s.color === selectedColor;
    const matchesRegion = selectedRegion === 'All' || s.region === selectedRegion;
    return matchesSearch && matchesColor && matchesRegion;
  });

  // Filter disasters
  const filteredDisasters = disasters.filter(dis => {
    const matchesSearch = !searchQuery ||
      dis.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dis.affectedDistricts.some(ad => ad.toLowerCase().includes(searchQuery.toLowerCase())) ||
      dis.affectedSubdivisions.some(as => as.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const getAlertBadge = (color: string) => {
    switch (color) {
      case 'Red':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            RED ALERT
          </span>
        );
      case 'Orange':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            ORANGE ALERT
          </span>
        );
      case 'Yellow':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border border-yellow-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            YELLOW WATCH
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            GREEN (NO WARNING)
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 via-amber-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
                  IMD Meteorological Early Warnings
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30">
                  Govt. of India
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official India Meteorological Department (Mausam) warning bulletin for districts, subdivisions & disasters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                title="Refresh IMD Feeds"
                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* National Alert Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-5 py-2.5 bg-slate-100/70 dark:bg-slate-950/40 border-b border-slate-200 dark:border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">Red Alerts:</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">{data?.nationalSummary.redAlerts ?? 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">Orange Alerts:</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{data?.nationalSummary.orangeAlerts ?? 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">Yellow Watches:</span>
            <span className="font-bold text-yellow-600 dark:text-yellow-400">{data?.nationalSummary.yellowAlerts ?? 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">Green (Normal):</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{data?.nationalSummary.greenAlerts ?? 0}</span>
          </div>
        </div>

        {/* Navigation Tabs & Controls */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900">
          <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('district')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'district'
                  ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>District-Wise ({districts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('subdivision')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'subdivision'
                  ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>36 Subdivisions</span>
            </button>
            <button
              onClick={() => setActiveTab('disaster')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'disaster'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Disaster Warnings ({disasters.length})</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                activeTab === 'district'
                  ? 'Search district or state...'
                  : activeTab === 'subdivision'
                  ? 'Search subdivision...'
                  : 'Search disaster hazard...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg focus:outline-none focus:border-cyan-500 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Severity filter pills */}
        <div className="px-5 py-2 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Severity Filter:</span>
          {(['All', 'Red', 'Orange', 'Yellow', 'Green'] as const).map((col) => (
            <button
              key={col}
              onClick={() => setSelectedColor(col)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                selectedColor === col
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {col === 'All' ? 'All Alerts' : `${col} Alerts`}
            </button>
          ))}

          {activeTab === 'subdivision' && (
            <div className="ml-auto flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Region:</span>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-md px-2 py-0.5 text-slate-700 dark:text-slate-300"
              >
                <option value="All">All Regions</option>
                <option value="Northwest">Northwest</option>
                <option value="Central">Central</option>
                <option value="East & Northeast">East & Northeast</option>
                <option value="South Peninsular">South Peninsular</option>
              </select>
            </div>
          )}
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {/* TAB 1: DISTRICT-WISE WARNINGS */}
          {activeTab === 'district' && (
            <div className="space-y-3">
              {filteredDistricts.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <MapPin className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-semibold">No districts match the selected filters</p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedColor('All'); }}
                    className="mt-2 text-xs text-cyan-600 dark:text-cyan-400 underline"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredDistricts.map((d) => (
                    <div
                      key={`${d.state}-${d.district}`}
                      className={`p-4 rounded-xl border transition-all ${
                        d.color === 'Red'
                          ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/50'
                          : d.color === 'Orange'
                          ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/50'
                          : d.color === 'Yellow'
                          ? 'bg-yellow-50/70 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-900/50'
                          : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {d.district}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              ({d.state})
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Subdivision: {d.subdivision}
                          </span>
                        </div>
                        {getAlertBadge(d.color)}
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                        <div className="flex items-start gap-1.5">
                          <CloudRain className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 mt-0.5 flex-shrink-0" />
                          <span className="font-semibold">{d.phenomenon}</span>
                        </div>

                        <div className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200/50 dark:border-white/5">
                          <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                          <span>{d.advisory}</span>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-[10px] text-slate-500">
                        <span>Validity: {d.validUntil}</span>
                        {d.rainfallMmEstimated && (
                          <span className="font-mono font-medium text-cyan-700 dark:text-cyan-300">
                            Est. Rain: ~{d.rainfallMmEstimated} mm
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 36 METEOROLOGICAL SUBDIVISIONS */}
          {activeTab === 'subdivision' && (
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredSubdivisions.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-white/20 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {s.subdivision}
                        </span>
                        <span className="ml-2 text-[10px] uppercase font-semibold text-slate-400">
                          {s.region}
                        </span>
                      </div>
                      {getAlertBadge(s.color)}
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 mb-1">
                      {s.warning}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200/50 dark:border-white/5">
                      <span>Impact: {s.impactLevel}</span>
                      <span className="font-mono text-[10px]">{s.bulletinDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DISASTER EARLY WARNINGS */}
          {activeTab === 'disaster' && (
            <div className="space-y-4">
              {filteredDisasters.map((dis) => (
                <div
                  key={dis.id}
                  className="p-4 rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-rose-950 dark:text-rose-200">
                          {dis.title}
                        </h3>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Issued by {dis.issuingAuthority} • {dis.issuedAt}
                        </span>
                      </div>
                    </div>
                    {getAlertBadge(dis.color)}
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-rose-200/60 dark:border-rose-900/40">
                      <span className="font-semibold text-rose-800 dark:text-rose-300 block mb-1">
                        NDMA & IMD Directives:
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {dis.advisoryDirective}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded bg-slate-100 dark:bg-slate-800/60">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                          Affected Subdivisions:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {dis.affectedSubdivisions.map((as) => (
                            <span key={as} className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                              {as}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-2 rounded bg-slate-100 dark:bg-slate-800/60">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                          Key Affected Districts:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {dis.affectedDistricts.map((ad) => (
                            <span key={ad} className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/30">
                              {ad}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/70 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Feed Synced: {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : 'Live'}</span>
            <span>•</span>
            <a
              href="https://mausam.imd.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-0.5"
            >
              <span>mausam.imd.gov.in</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-semibold transition-all"
          >
            Close Bulletin
          </button>
        </div>
      </div>
    </div>
  );
};
