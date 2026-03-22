import { useState, useEffect } from 'react';
import { useStore } from './store/useStore';
import AuthScreen from './components/auth/AuthScreen';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './components/dashboard/Dashboard';
import AnalyticsDashboard from './components/dashboard/AnalyticsDashboard';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { BarChart4 } from 'lucide-react';

export default function App() {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const language = useStore((state) => state.language);
  const setLanguage = useStore((state) => state.setLanguage);
  const activePlotId = useStore((state) => state.activePlotId);
  const plots = useStore((state) => state.plots);
  const [activeTab, setActiveTab] = useState('map');
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
        });
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, [setUser]);

  const activePlot = plots.find(p => p.id === activePlotId);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'map' && <Dashboard setActiveTab={setActiveTab} />}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-text-primary tracking-tight">Global Analytics</h1>
              <p className="text-sm text-text-secondary font-medium mt-1">Detailed performance metrics across all fields</p>
            </div>
          </div>

          {activePlot && activePlot.weatherData ? (
            <div className="space-y-8">
              <div className="glass-dark p-8 rounded-3xl border-white/10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-text-primary">Showing data for: {activePlot.name}</h3>
                    <p className="text-text-secondary text-xs mt-1 font-medium uppercase tracking-widest">Crop: {activePlot.crop} • Area: {activePlot.area} hectares</p>
                  </div>
                  <div className="px-4 py-2 bg-emerald-accent/10 rounded-xl border border-emerald-accent/20">
                    <span className="text-emerald-accent text-[10px] font-black uppercase tracking-widest">Active Analysis</span>
                  </div>
                </div>
                <AnalyticsDashboard chartData={activePlot.weatherData.chartData} soilData={activePlot.soilData} />
              </div>
            </div>
          ) : (
            <div className="glass-dark border-white/10 p-16 rounded-3xl h-full flex flex-col items-center justify-center text-center min-h-[500px]">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <BarChart4 className="w-10 h-10 text-text-secondary opacity-20" />
              </div>
              <h3 className="text-2xl font-display font-bold text-text-primary mb-3">No Data Available</h3>
              <p className="max-w-md text-text-secondary text-sm leading-relaxed font-medium">
                Select a plot from the Farm Map and generate a report to view detailed analytics here.
              </p>
              <button 
                onClick={() => setActiveTab('map')}
                className="mt-8 px-8 py-3 bg-emerald-accent text-bg-primary rounded-xl font-bold text-xs shadow-lg shadow-emerald-accent/20 hover:scale-[1.02] transition-all"
              >
                GO TO FARM MAP
              </button>
            </div>
          )}
        </div>
      )}
      {activeTab === 'settings' && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl max-w-2xl mx-auto">
          <h3 className="text-2xl font-medium text-white mb-6">Settings</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-2">Report Language</label>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none"
              >
                <option value="English" className="bg-stone-900">English</option>
                <option value="Spanish" className="bg-stone-900">Spanish</option>
                <option value="French" className="bg-stone-900">French</option>
                <option value="Hindi" className="bg-stone-900">Hindi</option>
                <option value="Swahili" className="bg-stone-900">Swahili</option>
                <option value="Portuguese" className="bg-stone-900">Portuguese</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

