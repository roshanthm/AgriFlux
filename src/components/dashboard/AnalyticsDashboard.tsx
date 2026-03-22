import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Droplets, CloudRain, Sprout, Leaf, Thermometer, Wind, Sun } from 'lucide-react';
import { motion } from 'motion/react';

interface AnalyticsProps {
  chartData: any[];
  soilData: any;
}

export default function AnalyticsDashboard({ chartData, soilData }: AnalyticsProps) {
  if (!chartData || chartData.length === 0) return null;

  // Format dates for the chart
  const formattedData = chartData.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }));

  const NutrientGauge = ({ label, value, color, unit, max }: { label: string, value: number, color: string, unit: string, max: number }) => (
    <div className="flex flex-col items-center text-center">
      <div className="relative w-28 h-28 mb-3">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="56"
            cy="56"
            r="50"
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-white/5"
          />
          <motion.circle
            cx="56"
            cy="56"
            r="50"
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={314.159}
            initial={{ strokeDashoffset: 314.159 }}
            animate={{ strokeDashoffset: 314.159 - (314.159 * Math.min(value / max, 1)) }}
            style={{ color }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-text-primary">{value}</span>
          <span className="text-[7px] font-black uppercase tracking-tighter text-text-secondary">{label}</span>
        </div>
      </div>
      <p className="text-[9px] text-text-secondary font-bold uppercase tracking-widest">{unit}</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Climate Dynamics Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-dark p-6 rounded-2xl border-white/10"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-accent/10 rounded-xl flex items-center justify-center">
            <CloudRain className="w-5 h-5 text-emerald-accent" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Climate Dynamics</h3>
            <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">7-Day Forecast Projection</p>
          </div>
        </div>
        
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData}>
              <defs>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: '#9CA3AF', fontWeight: 'bold' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: '#9CA3AF', fontWeight: 'bold' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(10, 10, 10, 0.9)', 
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="maxTemp" 
                name="Max Temp (°C)"
                stroke="#10B981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorTemp)" 
              />
              <Area 
                type="monotone" 
                dataKey="precip" 
                name="Rain (mm)"
                stroke="#38BDF8" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorRain)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Soil Composition Grid */}
      {soilData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-dark p-6 rounded-2xl border-white/10"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-sky-highlight/10 rounded-xl flex items-center justify-center">
                <Droplets className="w-5 h-5 text-sky-highlight" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">Soil Composition</h3>
                <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">Sub-surface Analysis</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Clay Content', value: soilData.clay, color: 'bg-emerald-accent' },
                { label: 'Sand Content', value: soilData.sand, color: 'bg-sky-highlight' },
                { label: 'Silt Content', value: soilData.silt, color: 'bg-coral-accent' },
                { label: 'Organic Carbon', value: `${soilData.organicCarbon} g/kg`, color: 'bg-emerald-glow', percent: 60 }
              ].map((item, idx) => (
                <div key={idx} className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.05]">
                  <div className="flex justify-between items-end mb-1.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary">{item.label}</p>
                    <p className="text-xs font-bold text-text-primary">{item.value}</p>
                  </div>
                  <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: item.percent ? `${item.percent}%` : `${parseFloat(item.value) || 0}%` }}
                      className={`h-full ${item.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-dark p-6 rounded-2xl border-white/10"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-accent/10 rounded-xl flex items-center justify-center">
                <Sprout className="w-5 h-5 text-emerald-accent" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">Nutrient Profile</h3>
                <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">NPK Concentration</p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-6">
              <NutrientGauge label="Nitrogen" value={parseFloat(soilData.nitrogen) || 0} color="#10B981" unit="cg/kg" max={400} />
              <NutrientGauge label="Phosphorus" value={parseFloat(soilData.phosphorus) || 0} color="#38BDF8" unit="mg/kg" max={100} />
              <NutrientGauge label="Potassium" value={parseFloat(soilData.potassium) || 0} color="#FF7A59" unit="mg/kg" max={600} />
            </div>
          </motion.div>
        </div>
      )}

      {/* Environmental Sensors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-dark p-6 rounded-2xl border-white/10 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-accent/10 rounded-xl flex items-center justify-center">
            <Thermometer className="w-5 h-5 text-emerald-accent" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary">Soil Temp</p>
            <p className="text-lg font-bold text-text-primary">{soilData?.temperature?.mean || '24.5'}°C</p>
          </div>
        </div>
        <div className="glass-dark p-6 rounded-2xl border-white/10 flex items-center gap-4">
          <div className="w-10 h-10 bg-sky-highlight/10 rounded-xl flex items-center justify-center">
            <Wind className="w-5 h-5 text-sky-highlight" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary">Wind Speed</p>
            <p className="text-lg font-bold text-text-primary">12 km/h</p>
          </div>
        </div>
        <div className="glass-dark p-6 rounded-2xl border-white/10 flex items-center gap-4">
          <div className="w-10 h-10 bg-coral-accent/10 rounded-xl flex items-center justify-center">
            <Sun className="w-5 h-5 text-coral-accent" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary">UV Index</p>
            <p className="text-lg font-bold text-text-primary">High (8)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
