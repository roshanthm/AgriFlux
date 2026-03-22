  import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Calendar, Ruler, Leaf, Loader2, AlertTriangle, ChevronRight, CheckCircle2, Sprout, Save, Plus, X, Database, LayoutGrid, Activity, TrendingUp, Clock, BarChart4, CloudRain, Droplets, Thermometer, Zap } from 'lucide-react';
import FarmMap from '../map/FarmMap';
import { useStore } from '../../store/useStore';
import { fetchFarmData } from '../../services/weatherService';
import { fetchSoilData } from '../../services/soilService';
import { generateAgronomyReport } from '../../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AnalyticsDashboard from './AnalyticsDashboard';

export default function Dashboard({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { plots, activePlotId, savePlot, setActivePlot, language, searchQuery } = useStore();
  
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [activeInsightTab, setActiveInsightTab] = useState('financials');
  const [plotName, setPlotName] = useState('');
  const [crop, setCrop] = useState('');
  const [area, setArea] = useState('');
  const [daysPlanted, setDaysPlanted] = useState('');
  const [userInputs, setUserInputs] = useState('');
  const [geojson, setGeojson] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [soilData, setSoilData] = useState<any>(null);

  const activePlot = plots.find(p => p.id === activePlotId);

  // Load active plot data when it changes
  useEffect(() => {
    if (activePlotId) {
      const plot = plots.find(p => p.id === activePlotId);
      if (plot) {
        setLat(plot.lat);
        setLon(plot.lon);
        setPlotName(plot.name);
        setCrop(plot.crop);
        setArea(plot.area.toString());
        setDaysPlanted(plot.daysPlanted.toString());
        setUserInputs(plot.soilHealthInputs);
        setGeojson(plot.geojson || null);
        if (plot.report) setReport(plot.report);
        if (plot.weatherData) setWeatherData(plot.weatherData);
        if (plot.soilData) setSoilData(plot.soilData);
      }
    }
  }, [activePlotId, plots]);

  const handlePlotDrawn = useCallback((newLat: number, newLon: number, areaInHectares: number, newGeojson?: any) => {
    if (newLat === 0 && newLon === 0 && areaInHectares === 0) {
      setLat(null);
      setLon(null);
      setArea('');
      setGeojson(null);
      return;
    }
    setLat(newLat);
    setLon(newLon);
    if (areaInHectares > 0) {
      setArea(areaInHectares.toFixed(2));
    }
    if (newGeojson) {
      setGeojson(newGeojson);
    }
  }, []);

  const handleNewPlot = () => {
    setActivePlot('');
    setLat(null);
    setLon(null);
    setPlotName('');
    setCrop('');
    setArea('');
    setDaysPlanted('');
    setUserInputs('');
    setReport(null);
    setWeatherData(null);
    setSoilData(null);
    setGeojson(null);
    setError(null);
  };

  const handleGenerateReport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!lat || !lon || !area) {
      setError("Please trace your field boundary on the map first.");
      return;
    }
    if (!crop) {
      setError("Please enter the type of crop you are growing.");
      return;
    }

    const finalPlotName = plotName || `${crop} Plot ${plots.length + 1}`;
    setPlotName(finalPlotName);

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const [weather, soil] = await Promise.all([
        fetchFarmData(lat, lon),
        fetchSoilData(lat, lon)
      ]);
      
      setWeatherData(weather);
      setSoilData(soil);

      const result = await generateAgronomyReport({
        lat,
        lon,
        crop,
        daysPlanted: daysPlanted ? parseInt(daysPlanted, 10) : 0,
        area: parseFloat(area),
        userInputs,
        soilData: weather.soilData,
        soilGridsData: soil.rawSummary,
        weatherData: weather.weatherForecast,
        etData: weather.etData,
        language
      });

      setReport(result);
      
      const newPlot = {
        id: activePlotId || Date.now().toString(),
        name: finalPlotName,
        lat,
        lon,
        crop,
        area: parseFloat(area),
        daysPlanted: daysPlanted ? parseInt(daysPlanted, 10) : 0,
        soilHealthInputs: userInputs,
        report: result,
        weatherData: weather,
        soilData: soil,
        geojson
      };
      
      savePlot(newPlot);

    } catch (err: any) {
      setError(err.message || "An error occurred while generating the report.");
    } finally {
      setLoading(false);
    }
  };

  const growthStages = [
    { id: 1, label: 'Sowing', range: 'Day 0–30', status: 'completed' },
    { id: 2, label: 'Vegetative', range: 'Day 31–120', status: 'current' },
    { id: 3, label: 'Flowering', range: 'Day 121–180', status: 'upcoming' },
    { id: 4, label: 'Ripening', range: 'Day 181–240', status: 'upcoming' },
    { id: 5, label: 'Harvest', range: 'Day 241–270', status: 'upcoming' },
  ];

  const filteredPlots = plots.filter(plot => 
    plot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plot.crop.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* ① HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary tracking-tight">Your Farm Maps</h1>
          <p className="text-sm text-text-secondary font-medium mt-1">{plots.length} {plots.length === 1 ? 'field' : 'fields'} saved</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-text-primary hover:bg-white/10 transition-all">
            <Database className="w-4 h-4 text-emerald-accent" />
            MANAGE DATA
          </button>
          <button 
            onClick={handleNewPlot}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-accent text-bg-primary text-xs font-bold shadow-lg shadow-emerald-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            ADD NEW FIELD
          </button>
        </div>
      </div>

      {/* ② SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-dark p-6 border-white/10 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-accent/10 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-emerald-accent" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Selected Plot</p>
          </div>
          <p className="text-2xl font-bold text-text-primary">{activePlot?.name || 'No Plot Selected'}</p>
          <p className="text-xs text-text-secondary mt-1">{activePlot?.crop || 'Select a field on the map'}</p>
        </div>

        <div className="glass-dark p-6 border-white/10 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-sky-highlight/10 rounded-xl flex items-center justify-center">
              <Ruler className="w-5 h-5 text-sky-highlight" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Total Area</p>
          </div>
          <p className="text-2xl font-bold text-text-primary">{activePlot?.area ? `${(activePlot.area * 2.471).toFixed(2)} Acres` : '263.16 Acres'}</p>
          <p className="text-xs text-text-secondary mt-1">Calculated from boundaries</p>
        </div>

        <div className="glass-dark p-6 border-white/10 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-coral-accent/10 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-coral-accent" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Soil Health Index</p>
          </div>
          <p className="text-2xl font-bold text-text-primary">{activePlot?.soilData ? '82%' : '82%'}</p>
          <p className="text-xs text-text-secondary mt-1">Based on recent analysis</p>
        </div>
      </div>

      {/* ③ MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        {/* LEFT: Map Card (70%) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-dark rounded-3xl border-white/10 overflow-hidden relative group">
            <div className="h-[500px] w-full relative">
              <FarmMap lat={lat || 0} lon={lon || 0} onPlotDrawn={handlePlotDrawn} geojson={geojson} />
              
              {/* Map Overlay Tools (Right side vertical) */}
              <div className="absolute top-6 right-6 flex flex-col gap-2 z-20">
                <button className="p-3 bg-bg-primary/80 backdrop-blur-md border border-white/10 rounded-xl text-text-primary hover:bg-emerald-accent hover:text-bg-primary transition-all shadow-xl">
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button className="p-3 bg-bg-primary/80 backdrop-blur-md border border-white/10 rounded-xl text-text-primary hover:bg-emerald-accent hover:text-bg-primary transition-all shadow-xl">
                  <TrendingUp className="w-5 h-5" />
                </button>
              </div>

              {/* Bottom Hint Text */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                <div className="bg-bg-primary/80 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/10 text-[10px] font-bold text-text-primary shadow-2xl flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-accent rounded-full animate-pulse" />
                  CLICK MAP TO TRACE BOUNDARIES. DOUBLE CLICK TO FINISH.
                </div>
              </div>
            </div>

            {/* Field Intelligence Input Bar */}
            <div className="p-6 border-t border-white/10 bg-white/[0.02] flex flex-wrap items-center gap-6">
              <div className="flex-1 min-w-[200px]">
                <label className="text-[9px] font-black uppercase tracking-widest text-text-secondary mb-1 block ml-1">Crop Type</label>
                <div className="relative">
                  <Leaf className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-accent" />
                  <input 
                    type="text" 
                    value={crop} 
                    onChange={(e) => setCrop(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-text-primary focus:outline-none focus:border-emerald-accent/50 transition-all"
                    placeholder="Enter crop (e.g. Corn)"
                  />
                </div>
              </div>
              <div className="w-32">
                <label className="text-[9px] font-black uppercase tracking-widest text-text-secondary mb-1 block ml-1">Area (ha)</label>
                <div className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs font-bold text-text-primary">
                  {area || '0.00'}
                </div>
              </div>
              <button
                onClick={handleGenerateReport}
                disabled={loading || !lat || !crop}
                className={`px-8 py-3 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                  loading || !lat || !crop
                    ? 'bg-white/5 text-text-secondary cursor-not-allowed'
                    : 'bg-emerald-accent text-bg-primary shadow-lg shadow-emerald-accent/20 hover:scale-[1.02]'
                }`}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sprout className="w-4 h-4" />}
                {loading ? 'ANALYZING...' : 'ANALYZE FIELD'}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Sidebar Cards (30%) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Saved Fields Card */}
          <div className="glass-dark rounded-3xl border-white/10 p-6 flex flex-col h-[320px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-display font-bold text-text-primary">Saved Fields</h3>
              <span className="px-2 py-1 bg-emerald-accent/10 text-emerald-accent text-[10px] font-black rounded-md">{filteredPlots.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
              {filteredPlots.length > 0 ? (
                filteredPlots.map(plot => (
                  <button 
                    key={plot.id}
                    onClick={() => setActivePlot(plot.id)}
                    className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                      activePlotId === plot.id 
                        ? 'bg-emerald-accent/10 border-emerald-accent/30' 
                        : 'bg-white/5 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="text-left">
                      <p className="text-xs font-bold text-text-primary">{plot.name}</p>
                      <p className="text-[10px] text-text-secondary mt-0.5">{plot.crop} • {plot.area} ha</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${activePlotId === plot.id ? 'text-emerald-accent translate-x-1' : 'text-text-secondary group-hover:translate-x-1'}`} />
                  </button>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-40">
                  <MapPin className="w-8 h-8 mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No fields saved yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Status Card */}
          <div className="glass-dark rounded-3xl border-white/10 p-6 bg-emerald-accent/5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-accent/20 rounded-2xl flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-accent" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary">Map Saved Safely</h4>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">Your field boundaries and intelligence reports are encrypted and stored securely.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ④ FARM INSIGHTS SECTION (ONLY ONCE) */}
      <div className="space-y-8 mt-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <BarChart4 className="w-6 h-6 text-emerald-accent" />
              <h2 className="text-2xl font-display font-bold text-text-primary tracking-tight">Farm Insights</h2>
            </div>
            <p className="text-xs text-text-secondary font-medium ml-9">Checking progress for {activePlot?.name || 'My Spices Plot'}</p>
          </div>
          
          {/* Insight Tabs Navigation */}
          <div className="flex flex-wrap items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
            {[
              { id: 'financials', label: 'Financials' },
              { id: 'timeline', label: 'Timeline' },
              { id: 'climate', label: 'Climate' },
              { id: 'soil', label: 'Soil' },
              { id: 'subsurface', label: 'Sub-surface' },
              { id: 'nutrients', label: 'Nutrients' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveInsightTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeInsightTab === tab.id
                    ? 'bg-emerald-accent text-bg-primary shadow-lg shadow-emerald-accent/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Growth Stages Stepper (Always Visible) */}
        <div className="glass-dark p-8 rounded-3xl border-white/10">
          <h3 className="text-sm font-bold text-text-primary mb-10 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-accent" />
            Current Growth Progress
          </h3>
          <div className="relative flex justify-between px-4 overflow-x-auto pb-4 md:pb-0">
            {/* Progress Line */}
            <div className="absolute top-5 left-10 right-10 h-0.5 bg-white/5 z-0" />
            <div 
              className="absolute top-5 left-10 h-0.5 bg-emerald-accent z-0 transition-all duration-1000" 
              style={{ width: '30%' }} 
            />

            {growthStages.map((stage) => (
              <div key={stage.id} className="relative z-10 flex flex-col items-center min-w-[80px]">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${
                  stage.status === 'completed' 
                    ? 'bg-emerald-accent border-emerald-accent/20 text-bg-primary' 
                    : stage.status === 'current'
                    ? 'bg-bg-primary border-emerald-accent text-emerald-accent shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'bg-bg-primary border-white/5 text-text-secondary'
                }`}>
                  {stage.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-[10px] font-black">{stage.id}</span>}
                </div>
                <div className="text-center mt-4">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${
                    stage.status === 'current' ? 'text-emerald-accent' : 'text-text-secondary'
                  }`}>
                    {stage.label}
                  </p>
                  <p className="text-[8px] text-text-secondary/60 mt-1 font-bold">{stage.range}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeInsightTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeInsightTab === 'financials' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 glass-dark p-8 rounded-3xl border-white/10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">Expected Income</p>
                        <h4 className="text-4xl font-bold text-text-primary">₹5921k</h4>
                        <p className="text-xs text-emerald-accent font-bold mt-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          +12.4% over seasonal average
                        </p>
                      </div>
                      <div className="p-4 bg-emerald-accent/10 rounded-2xl">
                        <TrendingUp className="w-6 h-6 text-emerald-accent" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-h-[200px] flex items-end justify-between gap-4 px-4">
                      {['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
                        <div key={month} className="flex-1 flex flex-col items-center gap-4 group">
                          <div className="relative w-full flex flex-col items-center">
                            <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 px-2 py-1 rounded text-[8px] font-bold">
                              ₹{[400, 550, 450, 700, 900, 650][i]}k
                            </div>
                            <div 
                              className={`w-full rounded-t-xl transition-all duration-1000 ${i === 4 ? 'bg-emerald-accent' : 'bg-white/10 group-hover:bg-white/20'}`}
                              style={{ height: `${[40, 55, 45, 70, 90, 65][i]}%`, minHeight: '4px' }}
                            />
                          </div>
                          <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{month}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="glass-dark p-6 rounded-3xl border-white/10">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-4">Market Analysis</h5>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-text-primary">Current Price</span>
                          <span className="text-xs font-bold text-emerald-accent">₹42.5/kg</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-text-primary">Demand Index</span>
                          <span className="text-xs font-bold text-sky-highlight">Very High</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-text-primary">Export Potential</span>
                          <span className="text-xs font-bold text-emerald-accent">Strong</span>
                        </div>
                      </div>
                    </div>
                    <div className="glass-dark p-6 rounded-3xl border-white/10 bg-emerald-accent/5">
                      <p className="text-xs text-text-primary font-medium leading-relaxed">
                        "Your current crop quality is trending above the regional average, potentially unlocking premium pricing in the export market."
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeInsightTab === 'timeline' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="glass-dark p-8 rounded-3xl border-white/10 flex items-center gap-8">
                    <div className="w-24 h-24 rounded-3xl bg-sky-highlight/10 flex items-center justify-center shrink-0">
                      <Clock className="w-12 h-12 text-sky-highlight" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">Time to Harvest</p>
                      <h4 className="text-5xl font-bold text-text-primary">125 Days</h4>
                      <p className="text-sm text-sky-highlight font-bold mt-2">Optimal Growth Conditions</p>
                    </div>
                  </div>
                  <div className="glass-dark p-8 rounded-3xl border-white/10">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-6">Upcoming Milestones</h5>
                    <div className="space-y-6">
                      {[
                        { label: 'Nutrient Boost', date: 'In 12 days', icon: Sprout },
                        { label: 'Flowering Stage', date: 'In 45 days', icon: Leaf },
                        { label: 'Quality Check', date: 'In 90 days', icon: CheckCircle2 },
                      ].map((m, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                            <m.icon className="w-4 h-4 text-text-secondary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-text-primary">{m.label}</p>
                            <p className="text-[10px] text-text-secondary">{m.date}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-text-secondary/20" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeInsightTab === 'climate' && (
                <div className="glass-dark rounded-3xl border-white/10 overflow-hidden">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h4 className="text-lg font-bold text-text-primary">Climate Dynamics</h4>
                        <p className="text-[10px] text-text-secondary uppercase tracking-widest font-black">7-Day Atmospheric Forecast</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                          <Thermometer className="w-3.5 h-3.5 text-coral-accent" />
                          <span className="text-[10px] font-bold text-text-primary">28°C Avg</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                          <Droplets className="w-3.5 h-3.5 text-sky-highlight" />
                          <span className="text-[10px] font-bold text-text-primary">65% Hum</span>
                        </div>
                      </div>
                    </div>
                    {weatherData ? (
                      <AnalyticsDashboard chartData={weatherData.chartData} soilData={null} />
                    ) : (
                      <div className="h-[300px] flex flex-col items-center justify-center text-center opacity-40">
                        <CloudRain className="w-12 h-12 mb-4" />
                        <p className="text-xs font-bold uppercase tracking-widest">Analyze field to view climate dynamics</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeInsightTab === 'soil' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="glass-dark p-8 rounded-3xl border-white/10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-emerald-accent/10 rounded-2xl flex items-center justify-center">
                        <Droplets className="w-6 h-6 text-emerald-accent" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-text-primary">Soil Composition</h4>
                        <p className="text-[10px] text-text-secondary uppercase tracking-widest font-black">Surface Layer Analysis</p>
                      </div>
                    </div>
                    <div className="space-y-6">
                      {[
                        { label: 'Moisture Level', value: '68%', color: 'bg-sky-highlight', desc: 'Optimal for current stage' },
                        { label: 'Temperature', value: '24.5°C', color: 'bg-coral-accent', desc: 'Stable within range' },
                        { label: 'pH Level', value: '6.8', color: 'bg-emerald-accent', desc: 'Slightly acidic (Ideal)' },
                      ].map((item, idx) => (
                        <div key={idx} className="p-4 bg-white/[0.02] rounded-2xl border border-white/[0.05]">
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{item.label}</p>
                              <p className="text-[9px] text-text-secondary/60 mt-0.5">{item.desc}</p>
                            </div>
                            <p className="text-lg font-bold text-text-primary">{item.value}</p>
                          </div>
                          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: '70%' }}
                              className={`h-full ${item.color}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="glass-dark p-8 rounded-3xl border-white/10 flex flex-col justify-center items-center text-center">
                    <div className="w-20 h-20 rounded-full border-4 border-emerald-accent/20 flex items-center justify-center mb-6">
                      <CheckCircle2 className="w-10 h-10 text-emerald-accent" />
                    </div>
                    <h5 className="text-xl font-bold text-text-primary mb-2">Soil Health: Excellent</h5>
                    <p className="text-sm text-text-secondary max-w-xs">
                      Your soil structure is maintaining high porosity and water retention capabilities.
                    </p>
                  </div>
                </div>
              )}

              {activeInsightTab === 'subsurface' && (
                <div className="glass-dark p-8 rounded-3xl border-white/10">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-sky-highlight/10 rounded-2xl flex items-center justify-center">
                      <Database className="w-6 h-6 text-sky-highlight" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-text-primary">Sub-surface Analysis</h4>
                      <p className="text-[10px] text-text-secondary uppercase tracking-widest font-black">Deep Soil Profile (0-30cm)</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'Clay Content', value: '22.0%', color: 'text-emerald-accent', bg: 'bg-emerald-accent/10' },
                      { label: 'Sand Content', value: '47.9%', color: 'text-sky-highlight', bg: 'bg-sky-highlight/10' },
                      { label: 'Silt Content', value: '30.1%', color: 'text-coral-accent', bg: 'bg-coral-accent/10' },
                      { label: 'Organic Carbon', value: '273 g/kg', color: 'text-emerald-glow', bg: 'bg-emerald-glow/10' },
                    ].map((item, idx) => (
                      <div key={idx} className="p-6 bg-white/[0.02] rounded-2xl border border-white/[0.05] flex flex-col items-center text-center">
                        <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center mb-4`}>
                          <div className={`w-2 h-2 rounded-full ${item.color.replace('text-', 'bg-')}`} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">{item.label}</p>
                        <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 p-6 bg-white/5 rounded-2xl border border-white/10">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-4">Profile Summary</h5>
                    <p className="text-xs text-text-primary leading-relaxed">
                      The high sand content (47.9%) ensures excellent drainage, while the significant organic carbon (273 g/kg) provides a rich reservoir for nutrient retention and microbial activity.
                    </p>
                  </div>
                </div>
              )}

              {activeInsightTab === 'nutrients' && (
                <div className="glass-dark p-8 rounded-3xl border-white/10">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-emerald-accent/10 rounded-2xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-emerald-accent" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-text-primary">Nutrient Profile</h4>
                      <p className="text-[10px] text-text-secondary uppercase tracking-widest font-black">NPK Concentration Analysis</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-12 py-8">
                    {/* Nitrogen */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-40 h-40 relative">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                          <motion.circle 
                            cx="80" cy="80" r="70" stroke="#10B981" strokeWidth="8" fill="transparent" 
                            strokeDasharray={439.8} initial={{ strokeDashoffset: 439.8 }} animate={{ strokeDashoffset: 439.8 - (439.8 * (soilData?.nitrogen ? Math.min(soilData.nitrogen / 100, 1) : 0.75)) }}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold text-text-primary">{soilData?.nitrogen || '75'}</span>
                          <span className="text-[8px] font-black uppercase tracking-widest text-text-secondary">Nitrogen (N)</span>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-emerald-accent/10 rounded-full">
                        <p className="text-[10px] font-bold text-emerald-accent uppercase tracking-widest">Optimal</p>
                      </div>
                    </div>

                    {/* Phosphorus */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-40 h-40 relative">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                          <motion.circle 
                            cx="80" cy="80" r="70" stroke="#38BDF8" strokeWidth="8" fill="transparent" 
                            strokeDasharray={439.8} initial={{ strokeDashoffset: 439.8 }} animate={{ strokeDashoffset: 439.8 - (439.8 * (soilData?.phosphorus ? Math.min(soilData.phosphorus / 100, 1) : 0.6)) }}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold text-text-primary">{soilData?.phosphorus || '60'}</span>
                          <span className="text-[8px] font-black uppercase tracking-widest text-text-secondary">Phosphorus (P)</span>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-sky-highlight/10 rounded-full">
                        <p className="text-[10px] font-bold text-sky-highlight uppercase tracking-widest">Good</p>
                      </div>
                    </div>

                    {/* Potassium */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-40 h-40 relative">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                          <motion.circle 
                            cx="80" cy="80" r="70" stroke="#FF7A59" strokeWidth="8" fill="transparent" 
                            strokeDasharray={439.8} initial={{ strokeDashoffset: 439.8 }} animate={{ strokeDashoffset: 439.8 - (439.8 * (soilData?.potassium ? Math.min(soilData.potassium / 100, 1) : 0.85)) }}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold text-text-primary">{soilData?.potassium || '85'}</span>
                          <span className="text-[8px] font-black uppercase tracking-widest text-text-secondary">Potassium (K)</span>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-coral-accent/10 rounded-full">
                        <p className="text-[10px] font-bold text-coral-accent uppercase tracking-widest">High</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[10px] font-black text-text-secondary uppercase mb-2">Nitrogen Status</p>
                      <p className="text-xs text-text-primary">Sufficient for vegetative growth. No immediate top-dressing required.</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[10px] font-black text-text-secondary uppercase mb-2">Phosphorus Status</p>
                      <p className="text-xs text-text-primary">Adequate levels for root development. Monitor during flowering stage.</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[10px] font-black text-text-secondary uppercase mb-2">Potassium Status</p>
                      <p className="text-xs text-text-primary">High levels detected. Excellent for fruit quality and disease resistance.</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Detailed AI Report (Conditional) */}
        <AnimatePresence>
          {report && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-dark rounded-3xl border-white/10 overflow-hidden"
            >
              <div className="p-1 bg-white/5 border-b border-white/10 flex">
                <button className="flex-1 py-4 text-[10px] font-black tracking-widest uppercase bg-emerald-accent text-bg-primary">
                  Full Intelligence Report
                </button>
              </div>
              
              <div className="p-8">
                <div className="markdown-body max-w-4xl mx-auto">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {report}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
