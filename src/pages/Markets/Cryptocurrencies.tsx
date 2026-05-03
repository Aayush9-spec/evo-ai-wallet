import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import { fetchTopCryptos, getHistoricalPriceData } from "@/services/cryptoApi";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ArrowUpIcon, ArrowDownIcon, ArrowRightIcon, RefreshCw, AlertCircle, Search } from "lucide-react";

interface CryptoData {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  quote: {
    USD: {
      price: number;
      volume_24h: number;
      percent_change_1h: number;
      percent_change_24h: number;
      percent_change_7d: number;
      market_cap: number;
    };
  };
}

interface ChartData {
  date: string;
  price: number;
}

import { usePortfolio } from "@/contexts/PortfolioContext";

const Cryptocurrencies = () => {
  const { toast } = useToast();
  const { balance, assets, buyAsset, sellAsset } = usePortfolio();
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") || "";
  
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [timeRange, setTimeRange] = useState<string>("7d");
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [tradeAmount, setTradeAmount] = useState<string>("0.1");
  const [search, setSearch] = useState(urlSearch);

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  const handleBuy = () => {
    if (!selectedCrypto) return;
    const amount = parseFloat(tradeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }

    try {
      const colors = ["#F7931A", "#627EEA", "#9945FF", "#0033AD", "#26A17B", "#F3BA2F"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      buyAsset(
        selectedCrypto.symbol || "UNK",
        selectedCrypto.name || "Unknown",
        amount,
        selectedCrypto.quote?.USD?.price || 0,
        randomColor
      );
      toast({
        title: "Purchase Successful",
        description: `Bought ${amount} ${selectedCrypto.symbol} for $${(amount * (selectedCrypto.quote?.USD?.price || 0)).toLocaleString()}`,
      });
    } catch (e: any) {
      toast({ title: "Purchase Failed", description: e.message, variant: "destructive" });
    }
  };

  const handleSell = () => {
    if (!selectedCrypto) return;
    const amount = parseFloat(tradeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }

    try {
      sellAsset(selectedCrypto.symbol || "UNK", amount, selectedCrypto.quote?.USD?.price || 0);
      toast({
        title: "Sale Successful",
        description: `Sold ${amount} ${selectedCrypto.symbol} for $${(amount * (selectedCrypto.quote?.USD?.price || 0)).toLocaleString()}`,
      });
    } catch (e: any) {
      toast({ title: "Sale Failed", description: e.message, variant: "destructive" });
    }
  };
  
  const { 
    data: cryptoData, 
    isLoading, 
    error, 
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ["topCryptos"],
    queryFn: async () => {
      try {
        const data = await fetchTopCryptos(10);
        setIsUsingMockData(!data || data.length === 0);
        return data || [];
      } catch (error) {
        setIsUsingMockData(true);
        throw error;
      }
    },
    refetchInterval: 60000,
  });

  const handleRefresh = () => {
    toast({
      title: "Refreshing data",
      description: "Fetching latest market info",
    });
    refetch();
  };

  useEffect(() => {
    if (cryptoData && cryptoData.length > 0 && !selectedCrypto) {
      setSelectedCrypto(cryptoData[0]);
    }
  }, [cryptoData, selectedCrypto]);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (!selectedCrypto) return;
      let days = 7;
      if (timeRange === "1d") days = 1;
      if (timeRange === "30d") days = 30;
      if (timeRange === "90d") days = 90;
      const data = await getHistoricalPriceData(selectedCrypto.symbol || "BTC", days);
      setChartData(data || []);
    };
    fetchHistoricalData();
  }, [selectedCrypto, timeRange]);
  
  const handleSelectCrypto = (crypto: CryptoData) => {
    setSelectedCrypto(crypto);
  };
  
  const getPercentChangeColor = (percentChange: number) => {
    if (percentChange > 0) return "text-green-500";
    if (percentChange < 0) return "text-red-500";
    return "text-gray-500";
  };
  
  const getPercentChangeIcon = (percentChange: number) => {
    if (percentChange > 0) return <ArrowUpIcon className="h-4 w-4" />;
    if (percentChange < 0) return <ArrowDownIcon className="h-4 w-4" />;
    return <ArrowRightIcon className="h-4 w-4" />;
  };
  
  const formatPrice = (price: number) => {
    if (!price) return "0.00";
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 1000) return price.toFixed(2);
    return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };
  
  const userAsset = assets.find(a => a.symbol === selectedCrypto?.symbol);

  const filteredCryptos = (cryptoData || []).filter(crypto => 
    crypto.name.toLowerCase().includes(search.toLowerCase()) || 
    crypto.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3 space-y-6">
          <Card className="p-4 bg-crypto-purple text-white mb-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <RefreshCw size={80} />
            </div>
            <div className="relative z-10">
              <p className="text-sm opacity-80 uppercase font-semibold">Available Balance</p>
              <h2 className="text-3xl font-bold mt-1">${(balance || 0).toLocaleString()}</h2>
              <p className="text-xs mt-2 opacity-70">Simulated Trading Wallet</p>
            </div>
          </Card>

          <Card className="p-4 shadow-lg border-border/50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Markets</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRefresh} className="flex gap-2 items-center">
                  <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Filter coins..." 
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Separator className="mb-4" />
            
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-crypto-purple border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredCryptos.length > 0 ? (
                  filteredCryptos.map((crypto) => (
                    <div
                      key={crypto.id}
                      className={`p-3 rounded-xl cursor-pointer transition-all duration-200 group ${
                        selectedCrypto?.id === crypto.id 
                          ? "bg-crypto-purple text-white shadow-md shadow-crypto-purple/20" 
                          : "hover:bg-muted"
                      }`}
                      onClick={() => handleSelectCrypto(crypto)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            selectedCrypto?.id === crypto.id ? "bg-white/20" : "bg-muted-foreground/10"
                          }`}>
                            {crypto.symbol[0]}
                          </div>
                          <div>
                            <div className="font-bold">{crypto.symbol}</div>
                            <div className="text-[10px] opacity-70 truncate max-w-[80px]">{crypto.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-medium">${formatPrice(crypto.quote?.USD?.price || 0)}</div>
                          <div className={`text-[11px] flex items-center justify-end font-semibold ${
                            selectedCrypto?.id === crypto.id 
                              ? "text-white/90" 
                              : getPercentChangeColor(crypto.quote?.USD?.percent_change_24h || 0)
                          }`}>
                            {getPercentChangeIcon(crypto.quote?.USD?.percent_change_24h || 0)}
                            <span>{Math.abs(crypto.quote?.USD?.percent_change_24h || 0).toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>No coins found</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
        
        <div className="md:w-2/3">
          {selectedCrypto ? (
            <>
              <Card className="p-4 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center">
                      {selectedCrypto.name}
                      <span className="ml-2 text-sm bg-muted px-2 py-1 rounded-full text-foreground">
                        {selectedCrypto.symbol}
                      </span>
                    </h2>
                    <div className="text-3xl font-mono mt-2 mb-2">
                      ${formatPrice(selectedCrypto.quote?.USD?.price || 0)}
                      <span 
                        className={`ml-2 text-sm ${getPercentChangeColor(selectedCrypto.quote?.USD?.percent_change_24h || 0)}`}
                      >
                        {(selectedCrypto.quote?.USD?.percent_change_24h || 0) > 0 ? "+" : ""}
                        {(selectedCrypto.quote?.USD?.percent_change_24h || 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-4 md:mt-0">
                    {["1d", "7d", "30d", "90d"].map((range) => (
                      <Button 
                        key={range}
                        variant={timeRange === range ? "default" : "outline"} 
                        onClick={() => setTimeRange(range)}
                        size="sm"
                      >
                        {range.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="h-[300px] mt-6">
                  {chartData && chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          tickMargin={10}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return timeRange === "1d" ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                          }}
                        />
                        <YAxis 
                          tickFormatter={(value) => `$${formatPrice(value)}`}
                          domain={['auto', 'auto']}
                          tickMargin={10}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}
                          labelFormatter={(value) => new Date(value).toLocaleString()}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card className="p-4 border-2 border-primary/20">
                  <h3 className="text-xl font-bold mb-4 flex justify-between items-center">
                    Trade {selectedCrypto.symbol}
                    {userAsset && (
                      <span className="text-xs font-normal text-muted-foreground">
                        You own: {userAsset.amount.toLocaleString()} {selectedCrypto.symbol}
                      </span>
                    )}
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Amount to Trade</label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          value={tradeAmount} 
                          onChange={(e) => setTradeAmount(e.target.value)}
                          className="pr-16 text-lg font-mono"
                        />
                        <div className="absolute right-3 top-2 font-bold opacity-50">{selectedCrypto.symbol}</div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Estimated Cost: <span className="font-bold text-foreground">${(parseFloat(tradeAmount) * (selectedCrypto.quote?.USD?.price || 0) || 0).toLocaleString()}</span>
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <Button onClick={handleBuy} className="bg-crypto-green hover:bg-green-600 text-white h-12 text-lg">Buy</Button>
                      <Button onClick={handleSell} variant="outline" className="border-crypto-red text-crypto-red hover:bg-crypto-red hover:text-white h-12 text-lg">Sell</Button>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="text-xl font-bold mb-4">Market Stats</h3>
                  <Separator className="mb-4" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-2">
                      <div className="text-xs text-muted-foreground uppercase">Market Cap</div>
                      <div className="font-medium">${((selectedCrypto.quote?.USD?.market_cap || 0) / 1e9).toFixed(2)}B</div>
                    </div>
                    <div className="p-2">
                      <div className="text-xs text-muted-foreground uppercase">24h Volume</div>
                      <div className="font-medium">${((selectedCrypto.quote?.USD?.volume_24h || 0) / 1e9).toFixed(2)}B</div>
                    </div>
                    <div className="p-2">
                      <div className="text-xs text-muted-foreground uppercase">1h Change</div>
                      <div className={`font-medium ${getPercentChangeColor(selectedCrypto.quote?.USD?.percent_change_1h || 0)}`}>
                        {(selectedCrypto.quote?.USD?.percent_change_1h || 0).toFixed(2)}%
                      </div>
                    </div>
                    <div className="p-2">
                      <div className="text-xs text-muted-foreground uppercase">7d Change</div>
                      <div className={`font-medium ${getPercentChangeColor(selectedCrypto.quote?.USD?.percent_change_7d || 0)}`}>
                        {(selectedCrypto.quote?.USD?.percent_change_7d || 0).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          ) : (
            <Card className="p-8 flex items-center justify-center h-[400px]">
              <div className="text-center italic text-muted-foreground">
                Select a cryptocurrency to start trading
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cryptocurrencies;
