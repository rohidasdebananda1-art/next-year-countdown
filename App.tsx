import React, { useState, useEffect, useRef } from 'react';
import { FontType, BackgroundType, ColorType, AnimationType, Quote, MusicType, HistoryEntry } from './types';
import { LOCAL_QUOTES } from './data/quotes';
import { VideoCanvas, VideoCanvasRef } from './components/VideoCanvas';
import QuotesBrowser from './components/QuotesBrowser';

// Lucide icon imports
import { 
  Calendar, 
  Sparkles, 
  Play, 
  Pause, 
  Download, 
  Share2, 
  History, 
  Volume2, 
  VolumeX, 
  Palette, 
  Music, 
  Type, 
  Video, 
  Trash2, 
  Info, 
  Loader2, 
  Activity, 
  Check, 
  Settings,
  HelpCircle,
  Smartphone,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function App() {
  // 1. Calculate next year countdown data
  const getCountdown = () => {
    const now = new Date();
    const nextYear = now.getFullYear() + 1;
    const targetDate = new Date(`January 1, ${nextYear} 00:00:00`);
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Percentage of the current year that has passed
    const isLeap = (now.getFullYear() % 4 === 0 && now.getFullYear() % 100 !== 0) || (now.getFullYear() % 400 === 0);
    const totalDays = isLeap ? 366 : 365;
    const elapsedDays = totalDays - diffDays;
    const elapsedPercent = Math.max(0, Math.min(100, Math.round((elapsedDays / totalDays) * 100)));

    return {
      days: diffDays,
      year: nextYear,
      percent: elapsedPercent,
    };
  };

  const [countdown, setCountdown] = useState(getCountdown());

  // Periodically update countdown timer in case day shifts
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdown());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // 2. Main customizable state variables
  const [selectedQuote, setSelectedQuote] = useState<Quote>(LOCAL_QUOTES[0]);
  const [selectedFont, setSelectedFont] = useState<FontType>('space-grotesk');
  const [selectedBackground, setSelectedBackground] = useState<BackgroundType>('nebula');
  const [selectedMusic, setSelectedMusic] = useState<MusicType>('lofi');
  const [selectedColor, setSelectedColor] = useState<ColorType>('gold');
  const [selectedAnimation, setSelectedAnimation] = useState<AnimationType>('zoom');
  const [audioVolume, setAudioVolume] = useState<number>(0.4);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);

  // 3. System States (Rendering, History, Modals, Toasts)
  const [isRenderModalOpen, setIsRenderModalOpen] = useState(false);
  const [isQuotesModalOpen, setIsQuotesModalOpen] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStatusText, setRenderStatusText] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // 4. Background Job / WorkManager Simulation
  const [workManagerLogs, setWorkManagerLogs] = useState<string[]>([
    `[08:00:00] [WorkManager] Periodic tasks scheduled every 24 hours.`,
    `[08:00:02] [WorkManager] Selected fresh quote of the day: "He who is brave is free."`,
    `[08:00:05] [WorkManager] Rendered 15s HD video successfully completely offline.`,
    `[08:00:06] [WorkManager] Video exported to internal storage path: /storage/emulated/0/Movies/NextYearCountdown/`
  ]);
  const [isWorkManagerActive, setIsWorkManagerActive] = useState(true);

  const canvasRef = useRef<VideoCanvasRef | null>(null);

  // Load History from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('countdown_video_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading history: ", e);
      }
    }
  }, []);

  // Display clean custom toast
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Helper to trigger random styling preset
  const randomizeStyling = () => {
    const fonts: FontType[] = ['inter', 'space-grotesk', 'playfair-display', 'cinzel', 'jetbrains-mono', 'fredoka'];
    const backgrounds: BackgroundType[] = ['nebula', 'retrowave', 'aurora', 'confetti', 'matrix'];
    const musics: MusicType[] = ['lofi', 'inspirational', 'synthwave'];
    const colors: ColorType[] = ['white', 'gold', 'cyan', 'rose', 'emerald'];
    const animations: AnimationType[] = ['fade', 'zoom', 'slide', 'pulsate'];

    setSelectedFont(fonts[Math.floor(Math.random() * fonts.length)]);
    setSelectedBackground(backgrounds[Math.floor(Math.random() * backgrounds.length)]);
    setSelectedMusic(musics[Math.floor(Math.random() * musics.length)]);
    setSelectedColor(colors[Math.floor(Math.random() * colors.length)]);
    setSelectedAnimation(animations[Math.floor(Math.random() * animations.length)]);

    showToast("🎲 Random aesthetic parameters loaded!");
  };

  // Select a new random quote from 1000 database
  const rollRandomQuote = () => {
    const idx = Math.floor(Math.random() * LOCAL_QUOTES.length);
    setSelectedQuote(LOCAL_QUOTES[idx]);
    showToast(`📝 Selected new quote of the day (Quote #${LOCAL_QUOTES[idx].id})`);
  };

  // Trigger real export & video compile
  const handleCompileVideo = async () => {
    setIsRenderModalOpen(true);
    setRenderProgress(0);
    setRenderStatusText("Initializing offscreen Web Audio context...");
    setIsPreviewPlaying(false); // Stop normal audio output

    try {
      if (!canvasRef.current) throw new Error("Renderer canvas is not initialized");
      
      const videoBlob = await canvasRef.current.generateVideo((progress) => {
        setRenderProgress(progress);
        if (progress < 20) {
          setRenderStatusText("Synthesizing backing melody and mixing sound nodes...");
        } else if (progress < 60) {
          setRenderStatusText("Compiling 1080x1920 HD vector layouts...");
        } else if (progress < 90) {
          setRenderStatusText("Processing micro-animations & rendering frame stream...");
        } else {
          setRenderStatusText("Packaging WebM container & finalizing metadata...");
        }
      });

      setRenderProgress(100);
      setRenderStatusText("Video generated successfully!");

      // Save a local history item
      const videoUrl = URL.createObjectURL(videoBlob);
      const newEntry: HistoryEntry = {
        id: `entry_${Date.now()}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        daysLeft: countdown.days,
        quote: selectedQuote,
        font: selectedFont,
        background: selectedBackground,
        music: selectedMusic,
        color: selectedColor,
        animation: selectedAnimation,
        videoUrl: videoUrl,
      };

      const updatedHistory = [newEntry, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('countdown_video_history', JSON.stringify(updatedHistory));

      // Trigger actual automatic browser download to phone/desktop directory
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = `NextYearCountdown_${countdown.days}_DaysRemaining.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showToast("📥 HD Video successfully downloaded & saved to gallery!");
      setIsRenderModalOpen(false);

    } catch (err) {
      console.error(err);
      setRenderStatusText(`Generation Failed: ${err instanceof Error ? err.message : String(err)}`);
      setTimeout(() => setIsRenderModalOpen(false), 3000);
    }
  };

  // Simulate Android WorkManager manual execution test
  const triggerManualJobSimulation = () => {
    const timeString = new Date().toLocaleTimeString('en-US', { hour12: false });
    const randomJobQuote = LOCAL_QUOTES[Math.floor(Math.random() * LOCAL_QUOTES.length)];
    
    const newLogs = [
      `[${timeString}] [WorkManager] Automated cron wake-up triggered.`,
      `[${timeString}] [WorkManager] Random Quote loaded: "${randomJobQuote.text.substring(0, 30)}..." by ${randomJobQuote.author}`,
      `[${timeString}] [WorkManager] 15s vertical video render compiled successfully (540x960 layout).`,
      `[${timeString}] [WorkManager] Export complete! Next scheduled task in 24 hours.`,
      ...workManagerLogs
    ];
    
    setWorkManagerLogs(newLogs.slice(0, 10)); // Keep last 10 logs
    showToast("⚙️ Background WorkManager simulated job executed!");
  };

  const shareApplication = async () => {
    const shareText = `Only ${countdown.days} days left until New Year ${countdown.year}! 🌟 Here is today's quote: “${selectedQuote.text}” — ${selectedQuote.author}. Generated with Next Year Countdown app.`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Next Year Countdown',
          text: shareText,
          url: window.location.href
        });
        showToast("🔗 Shared successfully!");
      } catch (err) {
        // Fallback
        navigator.clipboard.writeText(shareText);
        showToast("📋 Share text copied to clipboard!");
      }
    } else {
      navigator.clipboard.writeText(shareText);
      showToast("📋 Countdown details copied to clipboard!");
    }
  };

  // Load a previously saved setup from History
  const applyHistoryItem = (entry: HistoryEntry) => {
    setSelectedQuote(entry.quote);
    setSelectedFont(entry.font);
    setSelectedBackground(entry.background);
    setSelectedMusic(entry.music);
    setSelectedColor(entry.color);
    setSelectedAnimation(entry.animation);
    showToast("💾 Saved historical styling template loaded!");
  };

  // Delete a history item
  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = history.filter(h => h.id !== id);
    setHistory(filtered);
    localStorage.setItem('countdown_video_history', JSON.stringify(filtered));
    showToast("🗑️ History entry removed");
  };

  return (
    <div className="min-h-screen bg-[#141218] text-[#E6E1E5] flex flex-col items-center font-sans">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 z-50 bg-[#2B2930] border border-[#D0BCFF]/30 text-[#EADDFF] text-sm font-semibold px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <Sparkles className="w-4 h-4 text-[#D0BCFF]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header / Title Bar */}
      <header className="w-full max-w-7xl px-6 py-5 border-b border-[#49454F]/50 flex justify-between items-center bg-[#141218]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#4F378B] flex items-center justify-center shadow-lg shadow-[#D0BCFF]/10">
            <Calendar className="w-5 h-5 text-[#EADDFF]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#E6E1E5] tracking-tight">Next Year Countdown</h1>
            <p className="text-[10px] font-bold text-[#D0BCFF] font-mono tracking-widest uppercase">Video Synthesizer</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={randomizeStyling}
            className="px-3.5 py-2 text-[#EADDFF] hover:text-white bg-[#2B2930] border border-[#49454F] hover:border-[#D0BCFF] rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:shadow-[#D0BCFF]/10"
            title="Randomize aesthetic styling"
          >
            <span>🎲 Random Styling</span>
          </button>
        </div>
      </header>

      {/* Primary Layout Grid */}
      <main className="w-full max-w-7xl px-4 sm:px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN (7 Cols): Today's Progress, Video Customizer Settings, Quotes & Scheduler */}
        <section className="lg:col-span-7 space-y-8 flex flex-col justify-start">
          
          {/* Today's Countdown Status Card */}
          <div className="bg-[#1D1B20] border border-[#49454F] p-6 rounded-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-6 shadow-xl m3-glow-purple">
            {/* Background glowing circle ornament */}
            <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-[#D0BCFF]/5 blur-3xl pointer-events-none" />

            {/* Circular Progress Gauge */}
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle 
                  cx="56" cy="56" r="46" 
                  stroke="rgba(255, 255, 255, 0.03)" 
                  strokeWidth="8" fill="transparent" 
                />
                <circle 
                  cx="56" cy="56" r="46" 
                  stroke="url(#purpleGrad)" 
                  strokeWidth="8" fill="transparent" 
                  strokeDasharray="289" 
                  strokeDashoffset={289 - (289 * countdown.percent) / 100}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D0BCFF" />
                    <stop offset="100%" stopColor="#381E72" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-bold text-[#E6E1E5] font-mono">{countdown.percent}%</span>
                <span className="text-[9px] font-bold text-[#D0BCFF] font-mono tracking-wider uppercase">Elapsed</span>
              </div>
            </div>

            {/* Countdown textual information */}
            <div className="text-center md:text-left flex-1 space-y-2">
              <span className="text-[10px] font-extrabold text-[#EADDFF] font-mono tracking-wider uppercase bg-[#4F378B]/40 border border-[#4F378B] px-3 py-1 rounded-full">
                ⏳ TIME CONTINUUM GAUGE
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight pt-1">
                Only {countdown.days} Days Left until Jan 1, {countdown.year}
              </h2>
              <p className="text-sm text-[#E6E1E5]/70">
                The current year has {100 - countdown.percent}% remaining. Keep pushing yourself every single day towards your grandest resolutions!
              </p>
            </div>
          </div>

          {/* Core Customizer Panel */}
          <div className="bg-[#1D1B20]/60 border border-[#49454F]/50 rounded-xl p-6 space-y-6">
            <h3 className="text-md font-bold text-white flex items-center gap-2 border-b border-[#49454F]/50 pb-3">
              <Palette className="w-4 h-4 text-[#D0BCFF]" />
              Aesthetic Customization Panel
            </h3>

            {/* 1. Background Selection */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-[#D0BCFF] flex items-center gap-1.5 uppercase tracking-wider font-mono">
                <Layers className="w-3.5 h-3.5 text-[#CCC2DC]" />
                Animated Video Background
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'nebula', name: 'Cosmic Nebula' },
                  { id: 'retrowave', name: 'Retro Sunset' },
                  { id: 'aurora', name: 'Aurora Sky' },
                  { id: 'confetti', name: 'Golden Glitter' },
                  { id: 'matrix', name: 'Code Matrix' },
                ].map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBackground(b.id as BackgroundType)}
                    className={`px-3 py-2.5 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                      selectedBackground === b.id 
                        ? 'bg-[#4F378B] border-[#D0BCFF] text-[#EADDFF] shadow-md shadow-[#D0BCFF]/10' 
                        : 'bg-[#141218]/80 border-[#49454F] text-[#E6E1E5]/70 hover:border-[#D0BCFF]/50 hover:text-white'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Fonts Selection */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-[#D0BCFF] flex items-center gap-1.5 uppercase tracking-wider font-mono">
                <Type className="w-3.5 h-3.5 text-[#CCC2DC]" />
                Typography Font Family
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                {[
                  { id: 'inter', name: 'Modern Clean' },
                  { id: 'space-grotesk', name: 'Tech Future' },
                  { id: 'playfair-display', name: 'Editorial' },
                  { id: 'cinzel', name: 'Cinematic' },
                  { id: 'jetbrains-mono', name: 'Minimalist' },
                  { id: 'fredoka', name: 'Playful Bold' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFont(f.id as FontType)}
                    className={`px-2.5 py-2.5 rounded-lg text-xs font-semibold border transition-all text-center truncate cursor-pointer ${
                      selectedFont === f.id 
                        ? 'bg-[#4F378B] border-[#D0BCFF] text-[#EADDFF] shadow-md shadow-[#D0BCFF]/10' 
                        : 'bg-[#141218]/80 border-[#49454F] text-[#E6E1E5]/70 hover:border-[#D0BCFF]/50 hover:text-white'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Row Layout for Music, Color & Animation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* 3. Music Synth Selection */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-[#D0BCFF] flex items-center gap-1.5 uppercase tracking-wider font-mono">
                  <Music className="w-3.5 h-3.5 text-[#CCC2DC]" />
                  Synthesizer Music Track
                </label>
                <div className="flex flex-col gap-2">
                  {[
                    { id: 'lofi', name: 'Lofi Chilled Dreams' },
                    { id: 'inspirational', name: 'Inspirational Swells' },
                    { id: 'synthwave', name: 'Synthwave Pulse' },
                    { id: 'none', name: '🔇 Muted / Silent' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMusic(m.id as MusicType)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-left flex items-center justify-between cursor-pointer ${
                        selectedMusic === m.id 
                          ? 'bg-[#4F378B]/20 border-[#D0BCFF] text-[#EADDFF]' 
                          : 'bg-[#141218]/80 border-[#49454F] text-[#E6E1E5]/70 hover:border-[#D0BCFF]/50'
                      }`}
                    >
                      <span>{m.name}</span>
                      {selectedMusic === m.id && <Check className="w-3 h-3 text-[#D0BCFF]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Text Color Accent */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-[#D0BCFF] flex items-center gap-1.5 uppercase tracking-wider font-mono">
                  <Palette className="w-3.5 h-3.5 text-[#CCC2DC]" />
                  Text Color Highlight
                </label>
                <div className="flex flex-col gap-2">
                  {[
                    { id: 'white', name: 'Frost White', hex: 'bg-[#E6E1E5]' },
                    { id: 'gold', name: 'Sunset Gold', hex: 'bg-amber-400' },
                    { id: 'cyan', name: 'Cyber Cyan', hex: 'bg-cyan-400' },
                    { id: 'rose', name: 'Coral Rose', hex: 'bg-rose-400' },
                    { id: 'emerald', name: 'Jade Emerald', hex: 'bg-emerald-400' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedColor(c.id as ColorType)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-left flex items-center gap-2.5 cursor-pointer ${
                        selectedColor === c.id 
                          ? 'bg-[#4F378B]/20 border-[#D0BCFF] text-[#EADDFF]' 
                          : 'bg-[#141218]/80 border-[#49454F] text-[#E6E1E5]/70 hover:border-[#D0BCFF]/50'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${c.hex} block`} />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Typography Animation Style */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-[#D0BCFF] flex items-center gap-1.5 uppercase tracking-wider font-mono">
                  <Activity className="w-3.5 h-3.5 text-[#CCC2DC]" />
                  Text Animation Style
                </label>
                <div className="flex flex-col gap-2">
                  {[
                    { id: 'zoom', name: 'Cinematic Breath' },
                    { id: 'fade', name: 'Smooth Radiance' },
                    { id: 'slide', name: 'Gravity Drift' },
                    { id: 'pulsate', name: 'Heartbeat Rhythm' },
                  ].map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAnimation(a.id as AnimationType)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-left flex items-center justify-between cursor-pointer ${
                        selectedAnimation === a.id 
                          ? 'bg-[#4F378B]/20 border-[#D0BCFF] text-[#EADDFF]' 
                          : 'bg-[#141218]/80 border-[#49454F] text-[#E6E1E5]/70 hover:border-[#D0BCFF]/50'
                      }`}
                    >
                      <span>{a.name}</span>
                      {selectedAnimation === a.id && <Check className="w-3 h-3 text-[#D0BCFF]" />}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Volume controller */}
            {selectedMusic !== 'none' && (
              <div className="p-3 bg-[#141218]/80 border border-[#49454F]/50 rounded-lg flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#E6E1E5]/80">
                  <Volume2 className="w-4 h-4 text-[#D0BCFF]" />
                  Synth Volume Control
                </div>
                <div className="flex items-center gap-3 flex-1 max-w-[240px]">
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={audioVolume}
                    onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                    className="w-full accent-[#D0BCFF] bg-[#2B2930] h-1 rounded-full cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-[#E6E1E5] w-8 text-right">{Math.round(audioVolume * 100)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Today's Quote Box */}
          <div className="bg-[#1D1B20]/60 border border-[#49454F]/50 rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-[#D0BCFF] flex items-center gap-1.5 uppercase tracking-wider font-mono">
                <Sparkles className="w-3.5 h-3.5 text-[#D0BCFF]" />
                Active Motivational Quote
              </span>
              <div className="flex gap-2">
                <button
                  onClick={rollRandomQuote}
                  className="px-3 py-1.5 bg-[#2B2930] border border-[#49454F] hover:border-[#D0BCFF] rounded-lg text-xs font-semibold text-[#E6E1E5]/90 transition-colors cursor-pointer"
                >
                  🎲 Roll Random
                </button>
                <button
                  onClick={() => setIsQuotesModalOpen(true)}
                  className="px-3 py-1.5 bg-[#4F378B]/20 border border-[#4F378B] text-[#D0BCFF] rounded-lg text-xs font-semibold hover:bg-[#4F378B]/40 transition-colors cursor-pointer"
                >
                  📂 Browse 1,000 DB
                </button>
              </div>
            </div>

            <div className="p-5 bg-[#141218]/40 border border-[#49454F]/50 rounded-lg">
              <p className="text-sm text-[#E6E1E5]/90 leading-relaxed italic font-serif">
                “{selectedQuote.text}”
              </p>
              <div className="flex items-center justify-between mt-3.5">
                <span className="text-xs font-extrabold text-[#D0BCFF] tracking-wider">
                  - {selectedQuote.author.toUpperCase()}
                </span>
                <span className="text-[10px] text-[#E6E1E5]/40 font-mono">
                  Database Item #{selectedQuote.id}
                </span>
              </div>
            </div>
          </div>

          {/* Android WorkManager Background Scheduler Simulation Panel */}
          <div className="bg-[#1D1B20]/60 border border-[#49454F]/50 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#49454F]/50">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Android WorkManager Daemon Monitoring
                </h4>
                <p className="text-xs text-[#E6E1E5]/60 mt-0.5">
                  Simulates daily background rendering & phone gallery exporting completely offline.
                </p>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <button
                  onClick={triggerManualJobSimulation}
                  className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-bold hover:bg-emerald-500/20 transition-all cursor-pointer"
                >
                  ⚡ Trigger Job Now
                </button>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isWorkManagerActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'} block`} />
                  <span className="text-xs font-bold font-mono text-[#E6E1E5]">{isWorkManagerActive ? 'RUNNING' : 'STOPPED'}</span>
                </div>
              </div>
            </div>

            {/* Task Logs */}
            <div className="bg-[#141218] rounded-lg p-4 font-mono text-[11px] text-[#E6E1E5]/80 border border-[#49454F]/40 space-y-1.5 max-h-[160px] overflow-y-auto">
              {workManagerLogs.map((log, index) => {
                let colorClass = "text-[#E6E1E5]/60";
                if (log.includes("[SUCCESS]")) colorClass = "text-emerald-400 font-bold";
                else if (log.includes("[WorkManager]")) colorClass = "text-[#D0BCFF]";
                
                return (
                  <div key={index} className="flex gap-2">
                    <span className="text-[#E6E1E5]/30 shrink-0 select-none">›</span>
                    <span className={colorClass}>{log}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </section>

        {/* RIGHT COLUMN (5 Cols): Live Preview Stream Frame & Generation Controls */}
        <section className="lg:col-span-5 space-y-8 flex flex-col justify-start lg:sticky lg:top-[110px]">
          
          {/* Smartphone mockup containing live video canvas */}
          <div className="w-full max-w-[340px] mx-auto flex flex-col items-center">
            
            <div className="text-center mb-3">
              <span className="text-xs font-bold text-[#E6E1E5]/80 flex items-center gap-1.5 uppercase tracking-wider font-mono justify-center">
                <Smartphone className="w-4 h-4 text-[#D0BCFF] animate-pulse" />
                Live 9:16 Video Canvas
              </span>
            </div>

            {/* Smartphone frame container */}
            <div className="w-full bg-[#2B2930] rounded-[38px] p-3.5 border-4 border-[#49454F] shadow-2xl relative">
              
              {/* Dynamic Camera Notch decoration */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-5 bg-[#141218] rounded-full z-10 flex items-center justify-center border border-[#49454F]/50">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-900/60 mr-2 border border-[#49454F]/30 shadow-inner" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#2B2930]/80" />
              </div>

              {/* Inside Content: Canvas Component */}
              <VideoCanvas 
                ref={canvasRef}
                daysLeft={countdown.days}
                quote={selectedQuote}
                font={selectedFont}
                background={selectedBackground}
                music={selectedMusic}
                color={selectedColor}
                animation={selectedAnimation}
                volume={audioVolume}
                isPlaying={isPreviewPlaying}
                onMusicStateChange={setIsPreviewPlaying}
              />
            </div>

            {/* Tap Preview audio player toggle */}
            <button
              onClick={() => setIsPreviewPlaying(!isPreviewPlaying)}
              className={`w-full max-w-[280px] mt-4 py-2.5 px-4 border rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isPreviewPlaying 
                  ? 'bg-[#4F378B] text-[#EADDFF] border-[#D0BCFF] shadow-lg shadow-[#D0BCFF]/10' 
                  : 'bg-[#2B2930] hover:bg-[#2B2930]/80 text-[#E6E1E5]/90 border-[#49454F]'
              }`}
            >
              {isPreviewPlaying ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  Mute Preview Music
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  Preview Backing Synth
                </>
              )}
            </button>
          </div>

          {/* Core Generation, Share & Gallery Export Controls */}
          <div className="bg-[#1D1B20]/60 border border-[#49454F]/50 rounded-xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#49454F]/50 pb-3">
              <Video className="w-4 h-4 text-[#D0BCFF]" />
              Generate & Export Controller
            </h4>

            {/* Main Generate Button */}
            <button
              onClick={handleCompileVideo}
              className="w-full py-4 bg-[#4F378B] hover:bg-[#4F378B]/90 text-[#EADDFF] font-extrabold rounded-lg text-md flex items-center justify-center gap-3.5 transition-all shadow-xl shadow-[#D0BCFF]/10 cursor-pointer active:scale-95 border border-[#D0BCFF]/30"
            >
              <Video className="w-5 h-5 animate-pulse" />
              Generate & Download Today's Video
            </button>

            {/* Secondary Action Row: Save & Share */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={shareApplication}
                className="py-3 px-4 bg-[#2B2930] border border-[#49454F] hover:border-[#D0BCFF] rounded-lg text-xs font-bold text-[#E6E1E5]/90 flex items-center justify-center gap-2.5 transition-all cursor-pointer hover:text-white"
              >
                <Share2 className="w-4 h-4" />
                Share Details
              </button>
              <button
                onClick={() => {
                  // Direct manual save current layout config to local history
                  const newEntry: HistoryEntry = {
                    id: `entry_${Date.now()}`,
                    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    daysLeft: countdown.days,
                    quote: selectedQuote,
                    font: selectedFont,
                    background: selectedBackground,
                    music: selectedMusic,
                    color: selectedColor,
                    animation: selectedAnimation,
                  };
                  const updatedHistory = [newEntry, ...history];
                  setHistory(updatedHistory);
                  localStorage.setItem('countdown_video_history', JSON.stringify(updatedHistory));
                  showToast("💾 Saved design template to History list!");
                }}
                className="py-3 px-4 bg-[#2B2930] border border-[#49454F] hover:border-[#D0BCFF] rounded-lg text-xs font-bold text-[#E6E1E5]/90 flex items-center justify-center gap-2.5 transition-all cursor-pointer hover:text-white"
              >
                <History className="w-4 h-4" />
                Save Design
              </button>
            </div>
          </div>

        </section>

      </main>

      {/* History section (Below main grid blocks) */}
      <section className="w-full max-w-7xl px-4 sm:px-6 py-12 border-t border-[#49454F]/40 mt-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-[#E6E1E5] flex items-center gap-2">
              <History className="w-5 h-5 text-[#D0BCFF]" />
              Saved Templates & History
            </h3>
            <p className="text-xs text-[#E6E1E5]/60 mt-1">
              Reload and inspect previous generated aesthetic presets and days-left recordings.
            </p>
          </div>
          <span className="text-[11px] font-bold font-mono text-[#D0BCFF] bg-[#2B2930] border border-[#49454F] px-3.5 py-1.5 rounded-lg">
            📁 {history.length} SAVED CREATIONS
          </span>
        </div>

        {history.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {history.map((entry) => (
              <div 
                key={entry.id}
                onClick={() => applyHistoryItem(entry)}
                className="bg-[#1D1B20]/60 hover:bg-[#1D1B20] border border-[#49454F]/60 hover:border-[#D0BCFF]/60 rounded-lg p-5 flex flex-col justify-between transition-all cursor-pointer group shadow-sm hover:shadow-lg"
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-[#E6E1E5]/40 font-mono tracking-wider uppercase">
                      {entry.date}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                      <span>{entry.daysLeft} Days Left</span>
                    </h4>
                  </div>
                  <button 
                    onClick={(e) => deleteHistoryItem(entry.id, e)}
                    className="p-1.5 text-[#E6E1E5]/40 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quote Text */}
                <div className="my-4 py-3 border-y border-[#49454F]/30">
                  <p className="text-xs text-[#E6E1E5]/70 italic leading-relaxed line-clamp-3">
                    “{entry.quote.text}”
                  </p>
                </div>

                {/* Badges / Styling Metadata */}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="text-[9px] font-bold bg-[#141218] text-[#D0BCFF] px-2 py-0.5 rounded border border-[#49454F]/50 uppercase">
                    BG: {entry.background}
                  </span>
                  <span className="text-[9px] font-bold bg-[#141218] text-[#D0BCFF] px-2 py-0.5 rounded border border-[#49454F]/50 uppercase">
                    COLOR: {entry.color}
                  </span>
                  <span className="text-[9px] font-bold bg-[#141218] text-[#D0BCFF] px-2 py-0.5 rounded border border-[#49454F]/50 uppercase">
                    FONT: {entry.font}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#1D1B20]/30 border border-[#49454F]/40 rounded-lg py-12 px-6 text-center max-w-md mx-auto">
            <History className="w-10 h-10 text-[#E6E1E5]/30 mx-auto mb-3.5" />
            <h4 className="text-sm font-bold text-[#E6E1E5]/60">No Video History Found</h4>
            <p className="text-xs text-[#E6E1E5]/40 mt-1.5 leading-relaxed">
              When you generate a new countdown video, or manually save your current configuration, it will appear here instantly.
            </p>
          </div>
        )}
      </section>

      {/* Render Video Compilation Modal Overlay */}
      {isRenderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#1D1B20] border border-[#49454F] rounded-lg p-8 text-center space-y-6 shadow-2xl">
            
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              {/* Spinning Loader Ring */}
              <Loader2 className="w-20 h-20 text-[#D0BCFF] animate-spin absolute" />
              <Video className="w-8 h-8 text-[#EADDFF]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Rendering Video Track...</h3>
              <p className="text-xs text-[#E6E1E5]/70">Please do not close this window. The video is being rendered and synced directly inside your browser cache.</p>
            </div>

            {/* Custom M3 Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-[#141218] rounded-full h-2.5 overflow-hidden border border-[#49454F]/50">
                <div 
                  className="bg-gradient-to-r from-[#D0BCFF] to-[#4F378B] h-full rounded-full transition-all duration-300"
                  style={{ width: `${renderProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] font-mono font-bold text-[#E6E1E5]/50">
                <span>{renderStatusText}</span>
                <span>{renderProgress}%</span>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[10px] font-bold text-[#D0BCFF] font-mono tracking-wider uppercase bg-[#141218] border border-[#49454F]/50 px-3.5 py-1.5 rounded-lg">
                ⚡ OFFLINE RENDERING DAEMON
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quotes Modal */}
      <QuotesBrowser 
        isOpen={isQuotesModalOpen}
        onClose={() => setIsQuotesModalOpen(false)}
        onSelectQuote={(q) => {
          setSelectedQuote(q);
          showToast(`Quote #${q.id} applied to live countdown template!`);
        }}
        currentQuoteId={selectedQuote.id}
      />

      {/* Elegant Footer Info */}
      <footer className="w-full max-w-7xl px-6 py-12 border-t border-[#49454F]/40 mt-12 text-center text-xs text-[#E6E1E5]/40 space-y-4">
        <div className="flex justify-center items-center gap-2">
          <span className="px-3 py-1 bg-[#2B2930] border border-[#49454F] text-[10px] font-mono tracking-wider text-[#D0BCFF] rounded-lg">
            MATERIAL 3 DARK DESIGN
          </span>
          <span className="px-3 py-1 bg-[#2B2930] border border-[#49454F] text-[10px] font-mono tracking-wider text-emerald-400 rounded-lg">
            WEB AUDIO PROCEDURAL SYNTH
          </span>
        </div>
        <p>© 2026 Next Year Countdown. Fully optimized for high-performance offline rendering, visualizers, and music synthesis.</p>
      </footer>

    </div>
  );
}
