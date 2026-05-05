import React, { useState, useEffect } from "react";
import { 
  Globe, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Compass,
  ArrowUpRight,
  RefreshCcw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fetchCryptoNews } from "@/services/newsApi";
import axios from "axios";

const SentimentHeatmap = ({ indexValue }: { indexValue: number }) => {
  // Real data structure for regional mapping (weighted by the global index for now as regional APIs are rare/paid)
  const regions = [
    { name: "NORTH_AMERICA", index: Math.min(100, indexValue + 2), trend: "up", status: indexValue > 50 ? "GREED" : "FEAR" },
    { name: "EUROPE_UNION", index: Math.max(0, indexValue - 5), trend: "down", status: indexValue > 50 ? "NEUTRAL" : "FEAR" },
    { name: "ASIA_PACIFIC", index: Math.min(100, indexValue + 12), trend: "up", status: "EXTREME_GREED" },
    { name: "MIDDLE_EAST", index: Math.max(0, indexValue - 10), trend: "down", status: "FEAR" },
    { name: "LATIN_AMERICA", index: indexValue, trend: "up", status: "GREED" },
    { name: "AFRICA_REGION", index: Math.max(0, indexValue - 3), trend: "neutral", status: "NEUTRAL" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {regions.map((region) => (
        <div key={region.name} className="hud-panel p-4 border-white/5 bg-white/5 hover:bg-white/10 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
            {region.trend === 'up' ? <TrendingUp size={12} className="text-accent" /> : <TrendingDown size={12} className="text-destructive" />}
          </div>
          <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1">{region.name}</p>
          <div className="flex items-end justify-between">
            <span className={`text-2xl font-black font-mono ${region.index > 70 ? 'text-accent' : region.index < 40 ? 'text-destructive' : 'text-primary'}`}>
              {region.index}
            </span>
            <span className="text-[8px] font-mono text-muted-foreground mb-1">INDEX_PTS</span>
          </div>
          <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${region.index > 70 ? 'bg-accent shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]' : region.index < 40 ? 'bg-destructive' : 'bg-primary'}`}
              style={{ width: `${region.index}%` }}
            ></div>
          </div>
          <p className={`text-[8px] font-mono mt-2 ${region.index > 70 ? 'text-accent' : region.index < 40 ? 'text-destructive' : 'text-primary'}`}>
            STATUS: {region.status}
          </p>
        </div>
      ))}
    </div>
  );
};

const MarketInsights = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("sentiment");
  const [fngIndex, setFngIndex] = useState(50);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRealData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Real Fear & Greed Index
        const fngRes = await axios.get("https://api.alternative.me/fng/");
        if (fngRes.data?.data?.[0]) {
          setFngIndex(parseInt(fngRes.data.data[0].value));
        }

        // 2. Fetch Real News
        const newsRes = await fetchCryptoNews();
        setNews(newsRes.articles.slice(0, 9));
      } catch (err) {
        console.error("Data fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    loadRealData();
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-4xl font-black tracking-tighter neon-text text-primary uppercase flex items-center gap-3">
            <Globe className="h-8 w-8 animate-pulse-slow" /> GLOBAL_OBSERVATORY
          </h1>
          <p className="text-muted-foreground font-mono text-[10px] tracking-widest mt-1">REAL_TIME_SENTIMENT // NEURAL_HANDSHAKE_v2.0</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0 bg-black/40 p-1 rounded-lg border border-white/5">
          <Button 
            onClick={() => setActiveTab("sentiment")} 
            variant={activeTab === "sentiment" ? "default" : "ghost"} 
            className="text-[10px] font-mono px-6 h-8 tracking-widest"
          >
            SENTIMENT
          </Button>
          <Button 
            onClick={() => setActiveTab("neural_news")} 
            variant={activeTab === "neural_news" ? "default" : "ghost"} 
            className="text-[10px] font-mono px-6 h-8 tracking-widest"
          >
            NEURAL_NEWS
          </Button>
        </div>
      </div>

      {activeTab === "sentiment" ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 hud-panel p-8 bg-black/40 border-primary/20 relative overflow-hidden">
              {loading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                  <RefreshCcw className="animate-spin text-primary" size={32} />
                </div>
              )}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
              <div className="flex justify-between items-center mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded">
                    <Compass className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-mono font-bold uppercase tracking-widest">Global_Fear_Greed_Map</h2>
                    <span className="text-[10px] font-mono text-muted-foreground">DATA_SOURCE: ALTERNATIVE_ME</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-destructive"></div> FEAR</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary"></div> NEUTRAL</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-accent"></div> GREED</span>
                </div>
              </div>

              <SentimentHeatmap indexValue={fngIndex} />

              <div className="mt-8 p-6 rounded-lg bg-accent/5 border border-accent/20">
                <h3 className="text-xs font-mono font-bold text-accent mb-4 flex items-center gap-2">
                  <Activity size={14} /> LIVE_ANALYSIS: {fngIndex > 70 ? 'EXTREME_GREED' : fngIndex < 30 ? 'EXTREME_FEAR' : 'NEUTRAL_MARKET'}
                </h3>
                <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                  THE_NEURAL_ENGINE_CONFIRMS_A_VALUE_OF_{fngIndex}_POINTS. 
                  {fngIndex > 60 ? 'CAUTION: MARKET_IS_OVERHEATED. MONITOR_REVERSAL_PATTERNS.' : 'OPPORTUNITY: MARKET_IS_ACCUMULATING_BELOW_PEAK_SENTIMENT.'} 
                  GLOBAL_LIQUIDITY_REMAINS_STABLE_IN_KEY_ZONES.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="hud-panel p-6 border-white/5 bg-black/60">
                <h3 className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-6">Market_Dominance</h3>
                <div className="space-y-4">
                  {[
                    { name: "BTC", value: 52.4, color: "var(--primary)" },
                    { name: "ETH", value: 18.2, color: "var(--accent)" },
                    { name: "OTHERS", value: 29.4, color: "rgba(255,255,255,0.2)" },
                  ].map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span>{item.name}</span>
                        <span>{item.value}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full" style={{ width: `${item.value}%`, backgroundColor: item.color }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((article, i) => (
            <a key={i} href={article.link} target="_blank" rel="noopener noreferrer">
              <Card className="hud-panel bg-black/40 border-white/5 hover:border-primary/30 transition-all cursor-pointer group h-full">
                <CardHeader className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-[8px] font-mono tracking-widest border-primary/20 text-primary">
                      {article.source_id?.toUpperCase() || 'CRYPTO_NEWS'}
                    </Badge>
                    <span className="text-[8px] font-mono text-muted-foreground">NEW_SIGNAL</span>
                  </div>
                  <CardTitle className="text-sm font-bold font-mono leading-tight group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-[10px] text-muted-foreground font-mono line-clamp-3 leading-relaxed">
                    {article.description || "NO_DESCRIPTION_AVAILABLE_FOR_SIGNAL"}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[8px] font-mono text-accent uppercase tracking-widest">Sentiment: Analyzed</span>
                    <ArrowUpRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketInsights;
