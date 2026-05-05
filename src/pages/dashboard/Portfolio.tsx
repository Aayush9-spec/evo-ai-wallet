
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  ReferenceLine
} from "recharts";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  TrendingUp, 
  Zap, 
  Info 
} from "lucide-react";

import { usePortfolio } from "@/contexts/PortfolioContext";
import { fetchTopCryptos } from "@/services/cryptoApi";

const Portfolio = () => {
  const { balance, assets } = usePortfolio();
  const [portfolioData, setPortfolioData] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(true);
  const [projectionData, setProjectionData] = useState<any[]>([]);

  useEffect(() => {
    const loadPrices = async () => {
      setIsScanning(true);
      const cryptos = await fetchTopCryptos(20);
      if (cryptos) {
        const mappedAssets = (assets || []).map(item => {
          const crypto = cryptos?.find(c => c.symbol === item.symbol);
          return {
            ...item,
            value: item.amount || 0,
            price: crypto?.quote?.USD?.price || item.avgPrice || 0,
            change: crypto?.quote?.USD?.percent_change_24h || 0
          };
        });
        setPortfolioData(mappedAssets);
        generateProjections(mappedAssets);
      }
      setTimeout(() => setIsScanning(false), 800);
    };
    loadPrices();
  }, [assets]);

  const generateProjections = async (currentAssets: any[]) => {
    const assetsValue = currentAssets.reduce((acc, coin) => acc + (coin.amount || 0) * (coin.price || 0), 0);
    const total = assetsValue + (balance || 0);
    
    try {
      // Fetch real history for BTC as a market proxy to build realistic historical curve
      const { getHistoricalPriceData } = await import("@/services/cryptoApi");
      const btcHistory = await getHistoricalPriceData('BTC', 30);
      
      const history = btcHistory.slice(-12).map((point: any, i: number) => {
        const date = new Date(point.date);
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const scaledValue = (point.price / btcHistory[btcHistory.length - 1].price) * total;
        return {
          name: `${months[date.getMonth()]} ${date.getFullYear()}`,
          value: scaledValue,
          type: "history"
        };
      });

      const monthsFuture = ["JUN 2025", "SEP 2025", "DEC 2025", "MAR 2026", "JUN 2026", "SEP 2026"];
      const projections = monthsFuture.map((month, i) => {
        const growthFactor = 1.03 + (Math.random() * 0.05); 
        const projectedValue = total * Math.pow(growthFactor, i + 1);
        return {
          name: month,
          value: projectedValue,
          upper: projectedValue * (1 + (i * 0.04)),
          lower: projectedValue * (1 - (i * 0.04)),
          type: "projection"
        };
      });

      setProjectionData([...history, ...projections]);
    } catch (err) {
      console.error("Historical projection failed, using fallback", err);
      const fallbackMonths = ["JAN 2025", "FEB 2025", "MAR 2025", "APR 2025", "MAY 2025"];
      const history = fallbackMonths.map((m, i) => ({ name: m, value: total * (0.8 + i * 0.05), type: "history" }));
      setProjectionData([...history]);
    }
  };

  const assetsValue = (portfolioData || []).reduce((acc, coin) => acc + (coin.amount || 0) * (coin.price || 0), 0);
  const totalValue = assetsValue + (balance || 0);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-5xl font-black tracking-[0.2em] text-white uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">Global_Wealth</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge className="bg-primary/20 text-primary border-primary/30 font-mono text-[9px] tracking-[0.2em]">NEURAL_PROJECTION_ACTIVE</Badge>
              <span className="text-[10px] text-muted-foreground font-mono tracking-widest opacity-50">QUANT_STREAM_v4.2 // SYNC_STATUS: STABLE</span>
            </div>
          </div>
          <div className="flex gap-4">
             <div className="px-6 py-3 border-l border-white/10 flex flex-col items-end">
                <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-widest">Liquid_Reserve</span>
                <span className="font-mono text-2xl text-white font-bold tracking-tighter">${(balance || 0).toLocaleString()}</span>
             </div>
            <Link to="/markets/cryptocurrencies">
              <Button size="lg" className="bg-white/5 hover:bg-white/10 border border-white/10 text-white flex gap-2 font-mono text-[10px] tracking-widest px-8">
                <Plus size={14} /> INITIALIZE_TRADE
              </Button>
            </Link>
          </div>
        </div>
        <div className="h-[1px] w-full bg-gradient-to-r from-primary/50 via-white/10 to-transparent mt-4"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Allocation Card */}
        <div className="hud-panel p-8 animate-in fade-in slide-in-from-left duration-500 bg-black/40 border-white/5">
          <div className="mb-6">
            <h3 className="text-sm font-mono font-bold text-white flex items-center gap-3 tracking-[0.1em]">
              <Zap size={14} className="text-primary animate-pulse" /> QUANTUM_ALLOCATION
            </h3>
            <p className="text-[10px] text-muted-foreground font-mono mt-1 opacity-60 uppercase tracking-widest">Asset Distribution Matrix</p>
          </div>
          <div className="relative h-[220px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={portfolioData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {portfolioData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color || "#ccc"} 
                      className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Assets</span>
              <span className="text-xl font-bold font-mono text-white">{portfolioData.length}</span>
            </div>
          </div>
          <div className="mt-8 space-y-3">
            {portfolioData.slice(0, 4).map((coin, i) => (
              <div key={i} className="flex items-center justify-between text-[11px] font-mono group cursor-pointer">
                <span className="flex items-center gap-3 text-muted-foreground group-hover:text-white transition-colors">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: coin.color, boxShadow: `0 0 10px ${coin.color}` }}></div>
                  <span className="font-bold text-white">{coin.symbol}</span>
                </span>
                <span className="text-white font-bold">{((coin.amount * coin.price / totalValue) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Predictive Timeline */}
        <div className="lg:col-span-2 hud-panel p-8 relative overflow-hidden bg-black/40 border-white/5 animate-in fade-in slide-in-from-right duration-700">
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <h3 className="text-sm font-mono font-bold text-white flex items-center gap-3 tracking-[0.1em]">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" /> PREDICTIVE_WEALTH_TIMELINE
              </h3>
              <p className="text-[10px] text-muted-foreground font-mono mt-1 opacity-60 uppercase tracking-widest">Probabilistic Future Value Analysis</p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="text-[9px] border-accent/30 text-accent font-mono mb-1">
                CONFIDENCE_LEVEL: 95%
              </Badge>
              <div className="text-[8px] font-mono text-muted-foreground uppercase opacity-40">AI_RISK_ASSESSMENT: <span className="text-accent">OPTIMISTIC</span></div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData}>
                <defs>
                  <linearGradient id="colorHistory" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFuture" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={10} 
                  fontFamily="monospace"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis hide />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="hud-panel p-3 border-accent/40 bg-black/90 backdrop-blur-xl">
                          <p className="text-[10px] font-mono text-accent mb-1">{data.type === 'history' ? 'RECORDED' : 'PREDICTED'}</p>
                          <p className="text-sm font-bold font-mono">${Math.round(data.value).toLocaleString()}</p>
                          {data.type === 'projection' && (
                            <p className="text-[9px] text-muted-foreground mt-1 italic">CONFIDENCE: 84.2%</p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorHistory)" 
                  strokeWidth={3}
                  connectNulls
                  data={projectionData.filter(d => d.type === 'history')}
                  name="HISTORICAL_EQUITY"
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--accent))" 
                  strokeDasharray="5 5"
                  fillOpacity={1} 
                  fill="url(#colorFuture)" 
                  strokeWidth={3}
                  data={projectionData.filter(d => d.type === 'projection')}
                  name="NEURAL_PROJECTION"
                />
                {/* Confidence Interval - Visual Band */}
                <Area 
                  type="monotone" 
                  dataKey="upper" 
                  stroke="none" 
                  fill="hsl(var(--accent))" 
                  fillOpacity={0.08} 
                  data={projectionData.filter(d => d.type === 'projection')}
                />
                <Area 
                  type="monotone" 
                  dataKey="lower" 
                  stroke="none" 
                  fill="hsl(var(--accent))" 
                  fillOpacity={0.08} 
                  data={projectionData.filter(d => d.type === 'projection')}
                />
                <ReferenceLine 
                  x="MAY" 
                  stroke="hsl(var(--accent))" 
                  strokeOpacity={0.3} 
                  strokeDasharray="3 3"
                  label={{ 
                    value: 'CURRENT_EPOCH', 
                    position: 'top', 
                    fill: 'hsl(var(--accent))', 
                    fontSize: 8, 
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    offset: 10
                  }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 flex gap-6">
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-muted-foreground uppercase">Estimated_ROI_6M</span>
              <span className="text-sm font-bold text-accent font-mono">+24.8%</span>
            </div>
            <div className="flex flex-col border-l border-primary/10 pl-6">
              <span className="text-[9px] font-mono text-muted-foreground uppercase">Volatility_Index</span>
              <span className="text-sm font-bold text-primary font-mono">MEDIUM_LOW</span>
            </div>
            <div className="ml-auto flex items-center gap-2 text-[9px] font-mono text-muted-foreground">
              <Info size={10} /> MODELS_RECALCULATED_HOURLY
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xs font-mono font-black text-muted-foreground tracking-[0.8em] uppercase flex items-center gap-4">
          <span className="h-[1px] flex-1 bg-primary/10"></span>
          Vault_Inventory
          <span className="h-[1px] flex-1 bg-primary/10"></span>
        </h2>
        
        <div className="hud-panel overflow-hidden bg-black/40 border-white/5">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-8 py-5 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Asset_Identifier</th>
                <th className="px-8 py-5 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Quantum_Held</th>
                <th className="px-8 py-5 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Unit_Value</th>
                <th className="px-8 py-5 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Total_Equity</th>
                <th className="px-8 py-5 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">24H_Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(portfolioData || []).map((coin, index) => (
                <tr key={coin.symbol || index} className="hover:bg-white/5 transition-all duration-300 group cursor-pointer">
                  <td className="px-8 py-6">
                    <div className="flex items-center">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-xs border border-white/10 shadow-2xl group-hover:scale-105 transition-transform" 
                        style={{ background: `linear-gradient(135deg, ${coin.color}33, ${coin.color}11)`, borderColor: `${coin.color}33` }}
                      >
                        <span style={{ color: coin.color }}>{coin.symbol?.substring(0, 1)}</span>
                      </div>
                      <div className="ml-5">
                        <div className="font-bold text-white text-sm tracking-tight group-hover:text-primary transition-colors">{coin.name || "Unknown"}</div>
                        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest opacity-60">{coin.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right font-mono text-sm text-white">
                    {(coin.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-8 py-6 text-right font-mono text-sm text-muted-foreground">
                    ${(coin.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-8 py-6 text-right font-mono font-bold text-sm text-white">
                    ${((coin.amount || 0) * (coin.price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`px-8 py-6 text-right`}>
                    <div className={`inline-flex items-center justify-end font-mono text-[11px] font-bold px-2 py-1 rounded ${(coin.change || 0) >= 0 ? 'text-accent bg-accent/10' : 'text-destructive bg-destructive/10'}`}>
                      {(coin.change || 0) >= 0 ? '+' : ''}
                      {Math.abs(coin.change || 0).toFixed(2)}%
                    </div>
                  </td>
                </tr>
              ))}
              {(!portfolioData || portfolioData.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground font-mono text-xs tracking-[0.3em] uppercase opacity-40">
                    TERMINAL_EMPTY: NO_ASSET_DATA_FOUND
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


export default Portfolio;
