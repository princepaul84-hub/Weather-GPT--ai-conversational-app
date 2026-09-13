import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { GISMap } from './components/GISMap';
import { WeatherDashboard } from './components/WeatherDashboard';
import { AnalyticsChart } from './components/AnalyticsChart';
import { WeatherChatWorkbench } from './components/WeatherChatWorkbench';
import { ChatBubble } from './components/ChatBubble';
import { EmergencyBroadcastModal } from './components/EmergencyBroadcastModal';
import { InstallPWA } from './components/InstallPWA';
import { ReloadPrompt } from './components/ReloadPrompt';
import { InteractiveMapView } from './components/InteractiveMapView';
import { SettingsView } from './components/SettingsView';
import { WarningsPage } from './components/WarningsPage';
import { OfflineIndicator } from './components/OfflineIndicator';
import { IMDWarningsModal } from './components/IMDWarningsModal';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { 
  Coordinates, 
  PersonaType, 
  LanguageCode, 
  WeatherMetrics, 
  WeatherAlert, 
  ChatMessage,
  IMDWarningsResponse
} from './types';
import { 
  PRESET_REGIONS, 
  INITIAL_ALERTS, 
  UI_TRANSLATIONS 
} from './data/mockWeatherData';

export default function App() {
  const [currentLocation, setCurrentLocation] = useState<Coordinates>(PRESET_REGIONS[0]);
  const [activeTab, setActiveTab] = useState<'Forecast' | 'Maps' | 'Chat' | 'Settings' | 'Warnings'>('Forecast');
  const [currentPersona, setCurrentPersona] = useState<PersonaType>('Farmer');
  const [currentLang, setCurrentLang] = useState<LanguageCode>('en');
  const [weatherData, setWeatherData] = useState<WeatherMetrics | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
  const [activeAlerts, setActiveAlerts] = useState<WeatherAlert[]>(INITIAL_ALERTS);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [presetRegions, setPresetRegions] = useState<Coordinates[]>(PRESET_REGIONS);

  const handleAddRegion = (reg: Coordinates) => {
    setPresetRegions(prev => [reg, ...prev]);
  };

  const handleRemoveRegion = (name: string) => {
    setPresetRegions(prev => prev.filter(r => r.name !== name));
  };
  
  // Emergency Broadcast Modal state
  const [isSOSModalOpen, setIsSOSModalOpen] = useState(false);
  const [sosPrefillText, setSosPrefillText] = useState<string | undefined>();

  // IMD Warnings State
  const [imdData, setImdData] = useState<IMDWarningsResponse | null>(null);
  const [isIMDModalOpen, setIsIMDModalOpen] = useState(false);
  const [activeIMDTab, setActiveIMDTab] = useState<'district' | 'subdivision' | 'disaster'>('district');

  const fetchIMDData = useCallback(async () => {
    try {
      const distName = currentLocation.name.split(',')[0].trim();
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/warnings/imd?district=${encodeURIComponent(distName)}&locationName=${encodeURIComponent(currentLocation.name)}&lat=${currentLocation.lat}&lon=${currentLocation.lng}`);
      if (res.ok) {
        const data = await res.json();
        setImdData(data);
      }
    } catch (e) {
      console.warn('Could not fetch IMD warnings', e);
    }
  }, [currentLocation]);

  useEffect(() => {
    fetchIMDData();
  }, [fetchIMDData]);

  const handleOpenIMDWarnings = (tab?: 'district' | 'subdivision' | 'disaster') => {
    if (tab) setActiveIMDTab(tab);
    setIsIMDModalOpen(true);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'ai',
      content: `🛰️ **WeatherGPT Synoptic Intelligence Core Initialized**\n\n- **Target Region:** Pune (Maharashtra) — GFS 0.25° & WRF-India 3km grid active.\n- **Active Persona:** **Farmer (Agro-Advisory)**\n- **Live Alert Status:** Flash flood warning watch in Mula-Mutha river basin.\n\nHow can I assist your crop management, flight dispatch, or disaster mitigation decisions today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      persona: 'Farmer',
    }
  ]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('token');
      if (currentUser && token) {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/chat/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.messages && data.messages.length > 0) {
              setMessages(data.messages);
            }
          }
        } catch (e) {}
      }
    };
    fetchHistory();
  }, [currentUser]);

  const saveHistory = async (newMessages: ChatMessage[]) => {
    const token = localStorage.getItem('token');
    if (currentUser && token) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL || ''}/api/chat/history`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ messages: newMessages })
        });
      } catch (e) {}
    }
  };

  // Voice Assistant Hook
  const {
    isListening,
    isSpeaking,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    setTranscript
  } = useVoiceAssistant(currentLang);

  // Fetch Weather Data whenever currentLocation changes
  const fetchWeather = useCallback(async (loc: Coordinates) => {
    setIsLoadingWeather(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/weather/current?lat=${loc.lat}&lon=${loc.lng}&name=${encodeURIComponent(loc.name)}`);
      if (resp.ok) {
        const data = await resp.json();
        setWeatherData(data);
      }
    } catch (err) {
      console.error('Failed to load weather:', err);
    } finally {
      setIsLoadingWeather(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather(currentLocation);
  }, [currentLocation, fetchWeather]);

  // Handle Location Selection
  const handleLocationSelect = (loc: Coordinates) => {
    if (!loc || isNaN(Number(loc.lat)) || isNaN(Number(loc.lng))) return;
    setCurrentLocation({ ...loc, lat: Number(loc.lat), lng: Number(loc.lng) });
  };

  // Handle Persona Switching
  const handlePersonaChange = (persona: PersonaType) => {
    setCurrentPersona(persona);
    const welcomeMap: Record<PersonaType, string> = {
      'Farmer': `🌾 **Agro-Meteorology Persona Active**\nConfigured for soil moisture tracking, crop spray windows, and irrigation alerts for ${currentLocation.name}.`,
      'Aviator': `✈️ **Aviation Weather Briefing (METAR/TAF) Active**\nReady to analyze cloud ceilings, runway crosswinds, and low-level wind shear for your flight corridor.`,
      'Disaster Manager': `🚨 **Disaster Early Warning & Response Active**\nMonitoring convective flash flood indices, storm surge models, and emergency broadcast thresholds.`,
      'Researcher': `🔬 **Climate Anomaly & NWP Research Mode Active**\nAnalyzing 10-year decadal deviations, CAPE soundings, and GFS vs ECMWF model convergence.`,
      'Citizen': `🏙️ **Daily Weather & Commuter Assistant Active**\nProviding umbrella advice, real-time AQI health tips, and temperature outlooks.`
    };

    setMessages(prev => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        role: 'ai',
        content: welcomeMap[persona],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        persona: persona
      }
    ]);
  };

  // Send message to AI Backend
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      persona: currentPersona,
      lang: currentLang
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    saveHistory(newMessages);
    setIsGeneratingAI(true);
    setTranscript('');

    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/chat/intelligence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          history: messages, // Send existing chat history
          persona: currentPersona,
          lang: currentLang,
          weatherContext: weatherData
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'ai',
          content: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          persona: currentPersona,
          lang: currentLang
        };
        setMessages(prev => { const updated = [...prev, aiMsg]; saveHistory(updated); return updated; });
        
        // If user query came via voice, auto read-back the response for rural accessibility
        if (isListening || transcript) {
          speak(data.text);
        }
      } else {
        throw new Error('AI Engine failed');
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'ai',
          content: `⚠️ Meteorological computation temporarily offline. Retrying synoptic link...`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          persona: currentPersona
        }
      ]);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleOpenSOSModalWithContext = (text: string) => {
    setSosPrefillText(`[EMERGENCY BROADCAST]: ${text.slice(0, 160)}`);
    setIsSOSModalOpen(true);
  };

    return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-white dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      <OfflineIndicator />
      <InstallPWA />
      <ReloadPrompt />
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onLogin={(username) => setCurrentUser(username)} 
      />

      {activeTab === 'Warnings' ? (
        <>
          <Navbar
            currentLang={currentLang}
            onLanguageChange={setCurrentLang}
            activeAlerts={activeAlerts}
            currentLocation={currentLocation}
            onLocationSelect={handleLocationSelect}
            onOpenSOSModal={() => {
              setSosPrefillText(undefined);
              setIsSOSModalOpen(true);
            }}
            isSpeaking={isSpeaking}
            onStopSpeaking={stopSpeaking}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            presetRegions={presetRegions}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onLogout={() => { localStorage.removeItem('token'); setCurrentUser(null); }}
            onOpenWarnings={() => setActiveTab('Warnings')}
            imdData={imdData}
            onOpenIMDWarnings={handleOpenIMDWarnings}
          />
          <WarningsPage currentLocation={currentLocation} />
        </>
      ) : activeTab === 'Maps' ? (
        <InteractiveMapView 
          currentLocation={currentLocation} 
          onLocationSelect={(loc) => {
            handleLocationSelect(loc);
            setActiveTab('Forecast');
          }}
        />
      ) : activeTab === 'Settings' ? (
        <>
          <Navbar
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onLogout={() => { localStorage.removeItem('token'); setCurrentUser(null); }}
            onOpenWarnings={() => setActiveTab('Warnings')}
            currentLang={currentLang}
            onLanguageChange={setCurrentLang}
            activeAlerts={activeAlerts}
            currentLocation={currentLocation}
            onLocationSelect={handleLocationSelect}
            onOpenSOSModal={() => {
              setSosPrefillText(undefined);
              setIsSOSModalOpen(true);
            }}
            isSpeaking={isSpeaking}
            onStopSpeaking={stopSpeaking}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            presetRegions={presetRegions}
            imdData={imdData}
            onOpenIMDWarnings={handleOpenIMDWarnings}
          />
          <SettingsView
            presetRegions={presetRegions}
            onAddRegion={handleAddRegion}
            onRemoveRegion={handleRemoveRegion}
            currentPersona={currentPersona}
            onPersonaChange={handlePersonaChange}
            currentLang={currentLang}
            onLanguageChange={setCurrentLang}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
          />
        </>
      ) : activeTab === 'Chat' ? (
        <>
          <Navbar
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onLogout={() => { localStorage.removeItem('token'); setCurrentUser(null); }}
            onOpenWarnings={() => setActiveTab('Warnings')}
            currentLang={currentLang}
            onLanguageChange={setCurrentLang}
            activeAlerts={activeAlerts}
            currentLocation={currentLocation}
            onLocationSelect={handleLocationSelect}
            onOpenSOSModal={() => {
              setSosPrefillText(undefined);
              setIsSOSModalOpen(true);
            }}
            isSpeaking={isSpeaking}
            onStopSpeaking={stopSpeaking}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            presetRegions={presetRegions}
            imdData={imdData}
            onOpenIMDWarnings={handleOpenIMDWarnings}
          />
          <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-28">
            <div className="h-[75vh] min-h-[550px]">
              <WeatherChatWorkbench
                currentPersona={currentPersona}
                onPersonaChange={handlePersonaChange}
                currentLang={currentLang}
                weatherData={weatherData}
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isGeneratingAI}
                isListening={isListening}
                onStartListening={startListening}
                onStopListening={stopListening}
                transcript={transcript}
                onSpeak={speak}
                onOpenSOSModalWithContext={handleOpenSOSModalWithContext}
              />
            </div>
          </main>
        </>
      ) : (
        <>
          <Navbar
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onLogout={() => { localStorage.removeItem('token'); setCurrentUser(null); }}
            onOpenWarnings={() => setActiveTab('Warnings')}
            currentLang={currentLang}
            onLanguageChange={setCurrentLang}
            activeAlerts={activeAlerts}
            currentLocation={currentLocation}
            onLocationSelect={handleLocationSelect}
            onOpenSOSModal={() => {
              setSosPrefillText(undefined);
              setIsSOSModalOpen(true);
            }}
            isSpeaking={isSpeaking}
            onStopSpeaking={stopSpeaking}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            presetRegions={presetRegions}
            imdData={imdData}
            onOpenIMDWarnings={handleOpenIMDWarnings}
          />
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 space-y-6">
                <section aria-label="Interactive GIS Meteorological Map">
                  <GISMap
                    currentLocation={currentLocation}
                    onLocationSelect={handleLocationSelect}
                    activeAlerts={activeAlerts}
                    weatherData={weatherData}
                  />
                </section>
                <section aria-label="Atmospheric Metrics & Forecasts">
                  <WeatherDashboard
                    data={weatherData}
                    currentLang={currentLang}
                    isLoading={isLoadingWeather}
                  />
                </section>
                <section aria-label="Decadal Climate Trends">
                  <AnalyticsChart />
                </section>
              </div>
              <div className="lg:col-span-4 lg:sticky lg:top-24 h-[650px] sm:h-[720px]">
                <WeatherChatWorkbench
                  currentPersona={currentPersona}
                  onPersonaChange={handlePersonaChange}
                  currentLang={currentLang}
                  weatherData={weatherData}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isGeneratingAI}
                  isListening={isListening}
                  onStartListening={startListening}
                  onStopListening={stopListening}
                  transcript={transcript}
                  onSpeak={speak}
                  onOpenSOSModalWithContext={handleOpenSOSModalWithContext}
                />
              </div>
            </div>
          </main>
          
          <ChatBubble
            currentPersona={currentPersona}
            currentLang={currentLang}
            weatherData={weatherData}
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isGeneratingAI}
            isListening={isListening}
            onStartListening={startListening}
            onStopListening={stopListening}
            onSpeak={speak}
          />
        </>
      )}

      <EmergencyBroadcastModal
        isOpen={isSOSModalOpen}
        onClose={() => setIsSOSModalOpen(false)}
        currentLocation={currentLocation}
        activeAlerts={activeAlerts}
        prefilledMessage={sosPrefillText}
      />

      <IMDWarningsModal
        isOpen={isIMDModalOpen}
        onClose={() => setIsIMDModalOpen(false)}
        data={imdData}
        currentLocationName={currentLocation.name}
        onRefresh={fetchIMDData}
        initialTab={activeIMDTab}
      />

      {/* Shared Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t pb-[env(safe-area-inset-bottom,16px)] pt-2 px-4 flex justify-around items-center z-[9999] h-16 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] shrink-0 ${activeTab === 'Maps' ? 'bg-[#121826]/90 backdrop-blur-md border-white/10' : 'bg-[#182133] border-white/5'}`}>
        <button 
          onClick={() => setActiveTab('Forecast')}
          className={`flex flex-col items-center justify-center space-y-1 transition-colors group ${activeTab === 'Forecast' ? 'text-blue-500' : 'text-[#94A3B8] hover:text-[#F8FAFC]'}`}
        >
          <svg className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          <span className="text-[10px] font-medium">Forecast</span>
        </button>
        <button 
          onClick={() => setActiveTab('Maps')}
          className={`flex flex-col items-center justify-center space-y-1 transition-colors group ${activeTab === 'Maps' ? 'text-blue-500' : 'text-[#94A3B8] hover:text-[#F8FAFC]'}`}
        >
          <div className={`${activeTab === 'Maps' ? 'bg-blue-500/20' : ''} p-1.5 rounded-full group-hover:scale-110 transition-transform duration-200`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
          </div>
          <span className="text-[10px] font-medium">Maps</span>
        </button>
        <button 
          onClick={() => setActiveTab('Chat')}
          className={`flex flex-col items-center justify-center space-y-1 transition-colors group ${activeTab === 'Chat' ? 'text-blue-500' : 'text-[#94A3B8] hover:text-[#F8FAFC]'}`}
        >
          <svg className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
          <span className="text-[10px] font-medium">AI Chat</span>
        </button>
        <button 
          onClick={() => setActiveTab('Settings')}
          className={`flex flex-col items-center justify-center space-y-1 transition-colors group ${activeTab === 'Settings' ? 'text-blue-500' : 'text-[#94A3B8] hover:text-[#F8FAFC]'}`}
        >
          <svg className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </nav>
    </div>
  );
}
