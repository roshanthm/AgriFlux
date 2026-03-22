import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
}

interface Plot {
  id: string;
  name: string;
  lat: number;
  lon: number;
  crop: string;
  area: number;
  daysPlanted: number;
  soilHealthInputs: string;
  report?: string;
  weatherData?: any;
  soilData?: any;
  geojson?: any;
}

interface AppState {
  user: User | null;
  plots: Plot[];
  activePlotId: string | null;
  language: string;
  searchQuery: string;
  setUser: (user: User | null) => void;
  savePlot: (plot: Plot) => void;
  setActivePlot: (id: string) => void;
  setLanguage: (lang: string) => void;
  setSearchQuery: (query: string) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  plots: [],
  activePlotId: null,
  language: 'English',
  searchQuery: '',
  setUser: (user) => set({ user }),
  savePlot: (plot) => set((state) => {
    const existingIndex = state.plots.findIndex(p => p.id === plot.id);
    if (existingIndex >= 0) {
      const newPlots = [...state.plots];
      newPlots[existingIndex] = plot;
      return { plots: newPlots, activePlotId: plot.id };
    }
    return { 
      plots: [...state.plots, plot],
      activePlotId: plot.id 
    };
  }),
  setActivePlot: (id) => set({ activePlotId: id }),
  setLanguage: (lang) => set({ language: lang }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
