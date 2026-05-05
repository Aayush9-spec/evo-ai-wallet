import { useState, useEffect } from "react";
import { Link, useLocation, Navigate, Routes, Route } from "react-router-dom";
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Settings as SettingsIcon,
  MessageSquare,
  Shield,
  Zap,
  Activity,
  ChevronRight,
  Eye,
  AlertTriangle,
  CircleHelp,
  Home,
  ArrowRightLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePortfolio } from "@/contexts/PortfolioContext";
import Portfolio from "./dashboard/Portfolio";
import Transactions from "./dashboard/Transactions";
import Settings from "./dashboard/Settings";

const Dashboard = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { balance, assets } = usePortfolio();
  const [activeObservations, setActiveObservations] = useState<any[]>([]);

  useEffect(() => {
    const generateRealObservations = async () => {
      const { fetchTopCryptos } = await import("@/services/cryptoApi");
      const topData = await fetchTopCryptos(5);
      
      const alerts = [];
      
      // 1. Check for significant price movements
      const bigMover = topData.find(c => Math.abs(c.quote.USD.percent_change_24h) > 5);
      if (bigMover) {
        alerts.push({
          id: 1,
          type: "pattern",
          title: `${bigMover.symbol}_VOLATILITY_ALERT`,
          content: `Significant 24h movement detected in ${bigMover.name} (${bigMover.quote.USD.percent_change_24h.toFixed(2)}%). Neural Link suggests a potential trend ${bigMover.quote.USD.percent_change_24h > 0 ? 'breakout' : 'correction'}.`,
          severity: "high",
          action: "ANALYZ_TREND"
        });
      }

      // 2. Check for BTC dominance or ETH strength
      const eth = topData.find(c => c.symbol === 'ETH');
      if (eth && eth.quote.USD.percent_change_24h > 3) {
        alerts.push({
          id: 2,
          type: "alpha",
          title: "ETH_MOMENTUM_SIGNAL",
          content: "Ethereum is showing relative strength compared to the market average. L2 ecosystem activity is spiking.",
          severity: "medium",
          action: "VIEW_DETAILS"
        });
      }

      // Fallback/Default if no big movers
      if (alerts.length === 0) {
        alerts.push({
          id: 3,
          type: "status",
          title: "MARKET_EQUILIBRIUM",
          content: "Global markets are currently in a consolidation phase. Neural scanners detect high-volume accumulation in cold wallets.",
          severity: "low",
          action: "MONITOR_FLOW"
        });
      }

      setActiveObservations(alerts);
    };

    generateRealObservations();
    const interval = setInterval(generateRealObservations, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [assets]);

  const totalValue = (assets || []).reduce((acc, curr) => acc + (curr.amount * curr.avgPrice), balance);

  const navItems = [
    {
      name: "CORE_HUB",
      path: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      exact: true,
    },
    {
      name: "PORTFOLIO",
      path: "/dashboard/portfolio",
      icon: <Wallet className="h-5 w-5" />,
    },
    {
      name: "LEDGER_SYNC",
      path: "/dashboard/transactions",
      icon: <ArrowRightLeft className="h-5 w-5" />,
    },
    {
      name: "NEURAL_LINK",
      path: "/markets/ai-assistant",
      icon: <MessageSquare className="h-5 w-5" />,
      accent: true
    },
    {
      name: "SYS_CONFIG",
      path: "/dashboard/settings",
      icon: <SettingsIcon className="h-5 w-5" />,
    }
  ];

  const isActivePath = (path: string) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    return location.pathname.startsWith(path) && path !== '/dashboard';
  };

  return (
    <div className="min-h-screen bg-[#050505] text-foreground selection:bg-primary/30 flex overflow-hidden">
      {/* Background Cyber-Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] cyber-grid"></div>
      
      {/* HUD Scanline Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 hud-scanline opacity-[0.02]"></div>

      {/* Sidebar */}
      <aside className={`border-r border-white/5 bg-black/40 backdrop-blur-xl transition-all duration-300 relative z-10 flex flex-col ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/50 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
              <Zap className="text-primary w-6 h-6 animate-pulse" />
            </div>
            {sidebarOpen && (
              <div className="animate-in fade-in duration-500">
                <h1 className="text-xl font-black tracking-tighter uppercase text-white">Evo_Core</h1>
                <span className="text-[8px] font-mono text-primary tracking-[0.3em] uppercase">Neural_Terminal_v4</span>
              </div>
            )}
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono transition-all duration-300 group hover:bg-white/5 ${
                  isActivePath(item.path)
                    ? 'bg-primary/20 text-primary border border-primary/40'
                    : 'text-muted-foreground hover:text-white'
                } ${item.accent ? 'text-accent' : ''}`}
              >
                <span className={isActivePath(item.path) ? 'animate-pulse' : ''}>{item.icon}</span>
                {sidebarOpen && <span className="tracking-widest animate-in fade-in duration-300">{item.name}</span>}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-2 rounded-md hover:bg-white/5 text-muted-foreground transition-all border border-white/5"
          >
            {sidebarOpen ? <ChevronRight className="rotate-180" size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen relative z-10 overflow-hidden">
        <header className="h-16 border-b border-white/5 bg-black/20 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-[0.2em]">Net_Worth_USD</span>
              <span className="text-lg font-bold font-mono text-white tracking-tight">${totalValue.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-mono text-[10px] tracking-widest px-3 py-1">
              <Activity size={10} className="mr-2" /> LEDGER_SYNCED
            </Badge>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Proactive AI Observatory Panel - ONLY ON MAIN DASHBOARD */}
            {location.pathname === '/dashboard' && (
              <div className="hud-panel p-1 bg-accent/10 border-accent/20 animate-in slide-in-from-top duration-700">
                <div className="p-4 bg-black/60 backdrop-blur-3xl rounded-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent/20 rounded">
                        <Eye className="text-accent h-5 w-5 animate-pulse" />
                      </div>
                      <div>
                        <h2 className="text-xs font-mono font-bold text-accent uppercase tracking-[0.3em]">Neural_Observatory</h2>
                        <p className="text-[10px] text-muted-foreground font-mono">AUTONOMOUS_MARKET_SURVEILLANCE_ACTIVE</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeObservations.map((obs) => (
                      <div key={obs.id} className="p-4 rounded border border-accent/20 bg-accent/5 hover:bg-accent/10 transition-all cursor-pointer group">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-mono text-accent font-bold uppercase tracking-widest">{obs.title}</span>
                          <AlertTriangle size={12} className={obs.severity === 'high' ? 'text-destructive animate-pulse' : 'text-accent'} />
                        </div>
                        <p className="text-xs text-muted-foreground font-mono leading-relaxed mb-4">
                          {obs.content}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge className="bg-accent/20 text-accent hover:bg-accent/30 text-[9px] font-mono">
                            {obs.action}
                          </Badge>
                          <span className="text-[9px] font-mono text-muted-foreground group-hover:text-accent transition-colors uppercase tracking-widest">Initiate_Protocol →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <Routes>
              <Route index element={<Portfolio />} />
              <Route path="portfolio" element={<Portfolio />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
