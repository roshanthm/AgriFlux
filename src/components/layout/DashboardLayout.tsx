import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sprout, Map, BarChart3, Settings, LogOut, Menu, X, Search, Bell, User } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function DashboardLayout({ children, activeTab, setActiveTab }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const searchQuery = useStore((state) => state.searchQuery);
  const setSearchQuery = useStore((state) => state.setSearchQuery);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    { id: 'map', label: 'Intelligence', icon: Map },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex overflow-hidden relative">
      {/* Ambient Mesh Gradient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 mesh-gradient opacity-40" />
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 grain" />
      
      {/* Sidebar (Fixed Left) */}
      <aside className="hidden md:flex flex-col w-64 glass-dark border-r border-white/10 fixed inset-y-0 left-0 z-50">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-10 h-10 bg-emerald-accent rounded-xl flex items-center justify-center shadow-lg shadow-emerald-accent/20">
            <Sprout className="w-6 h-6 text-bg-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-lg tracking-tight leading-none">Aethera</span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-emerald-accent font-black">Intelligence</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === item.id 
                  ? 'bg-emerald-accent text-bg-primary shadow-lg shadow-emerald-accent/20' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label.toUpperCase()}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-text-secondary hover:text-coral-accent hover:bg-coral-accent/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            SIGN OUT
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col md:pl-64 min-h-screen">
        {/* Top Navbar (Fixed Top) */}
        <header className="fixed top-0 right-0 left-0 md:left-64 h-20 glass-dark border-b border-white/10 z-40 px-6 flex items-center justify-between">
          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-text-primary mr-4"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Left: Logo (Mobile only) */}
          <div className="flex md:hidden items-center gap-2 mr-auto">
            <Sprout className="w-6 h-6 text-emerald-accent" />
            <span className="font-display font-bold text-lg tracking-tight">Aethera</span>
          </div>

          {/* Center: Search Bar */}
          <div className="hidden sm:flex flex-1 max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search farm data, analytics, or fields..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-11 pr-4 text-xs text-text-primary focus:outline-none focus:border-emerald-accent/50 transition-all"
            />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4 ml-auto sm:ml-0">
            <button className="p-2.5 bg-white/5 rounded-xl text-text-secondary hover:text-text-primary transition-all relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-coral-accent rounded-full border-2 border-bg-primary"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="hidden lg:block text-right">
                <p className="text-[10px] font-bold text-text-primary">{user?.name || 'Farmer'}</p>
                <p className="text-[8px] text-emerald-accent font-black uppercase tracking-wider">Elite Access</p>
              </div>
              <div className="w-10 h-10 rounded-xl border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-text-secondary" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="fixed inset-0 z-[60] md:hidden"
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
              <div className="absolute inset-y-0 left-0 w-64 glass-dark border-r border-white/10 p-6 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <Sprout className="w-6 h-6 text-emerald-accent" />
                    <span className="font-display font-bold text-lg tracking-tight">Aethera</span>
                  </div>
                  <button onClick={() => setIsMobileMenuOpen(false)}>
                    <X className="w-6 h-6 text-text-secondary" />
                  </button>
                </div>
                <nav className="flex-1 space-y-2">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                        activeTab === item.id 
                          ? 'bg-emerald-accent text-bg-primary' 
                          : 'text-text-secondary hover:bg-white/5'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label.toUpperCase()}
                    </button>
                  ))}
                </nav>
                <button 
                  onClick={handleSignOut}
                  className="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-text-secondary hover:text-coral-accent"
                >
                  <LogOut className="w-4 h-4" />
                  SIGN OUT
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content (Scrollable) */}
        <main className="flex-1 pt-20 relative z-10 w-full overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto p-6 md:p-8">
            {children}
          </div>
          
          {/* Footer */}
          <footer className="py-12 px-8 text-center text-text-secondary text-[10px] font-medium tracking-widest uppercase opacity-50">
            <p>© 2026 Aethera Intelligence. Advanced Living Systems Management.</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
