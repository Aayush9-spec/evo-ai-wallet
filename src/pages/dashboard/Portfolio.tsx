
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ArrowUpRight, ArrowDownRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

import { usePortfolio } from "@/contexts/PortfolioContext";
import { fetchTopCryptos } from "@/services/cryptoApi";

const Portfolio = () => {
  const { balance, assets } = usePortfolio();
  const [portfolioData, setPortfolioData] = useState<any[]>([]);

  useEffect(() => {
    const loadPrices = async () => {
      const cryptos = await fetchTopCryptos(20);
      if (cryptos) {
        setPortfolioData((assets || []).map(item => {
          const crypto = cryptos?.find(c => c.symbol === item.symbol);
          return {
            ...item,
            value: item.amount || 0,
            price: crypto?.quote?.USD?.price || item.avgPrice || 0,
            change: crypto?.quote?.USD?.percent_change_24h || 0
          };
        }));
      } else {
        setPortfolioData((assets || []).map(item => ({
          ...item,
          value: item.amount || 0,
          price: item.avgPrice || 0,
          change: 0
        })));
      }
    };
    loadPrices();
  }, [assets]);

  const totalValue = (portfolioData || []).reduce((acc, coin) => acc + (coin.amount || 0) * (coin.price || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Your Portfolio</h1>
          <p className="text-muted-foreground">Track and manage your crypto assets</p>
        </div>
        <div className="flex gap-4 mt-4 sm:mt-0">
           <div className="bg-card p-3 rounded-lg border flex flex-col items-end">
              <span className="text-xs text-muted-foreground uppercase">Available Cash</span>
              <span className="font-bold text-xl text-crypto-green">${(balance || 0).toLocaleString()}</span>
           </div>
          <Link to="/markets/cryptocurrencies">
            <Button className="h-full bg-crypto-purple hover:bg-crypto-deep-purple flex gap-2">
              <Plus size={16} /> Add Asset
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border border-border hover-scale animate-fade-in">
        <CardHeader>
          <CardTitle>Portfolio Overview</CardTitle>
          <CardDescription>Your crypto asset allocation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">Portfolio Value</p>
                <p className="text-4xl font-bold">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                <div className="flex items-center text-crypto-green mt-2">
                  <ArrowUpRight size={16} />
                  <span className="text-sm">Mock Data • Live Prices</span>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div style={{ width: '100%', height: 300 }}>
                {portfolioData && portfolioData.length > 0 ? (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={portfolioData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {(portfolioData || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || "#ccc"} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [`${value}`, name]}
                        contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground italic">
                    No assets in portfolio. Start by buying some coins!
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto animate-fade-in">
        <h2 className="text-xl font-bold mb-4">Your Assets</h2>
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Asset</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Holdings</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Price</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Value</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">24h %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(portfolioData || []).map((coin, index) => (
              <tr key={coin.symbol || index} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: coin.color || "#ccc" }}></div>
                    <div className="ml-3">
                      <div className="font-medium">{coin.name || "Unknown"}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-right font-medium">
                  {(coin.amount || 0).toLocaleString()} {coin.symbol || ""}
                </td>
                <td className="px-4 py-4 text-right font-medium">
                  ${(coin.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-4 text-right font-medium">
                  ${((coin.amount || 0) * (coin.price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className={`px-4 py-4 text-right ${(coin.change || 0) >= 0 ? 'text-crypto-green' : 'text-crypto-red'}`}>
                  <div className="flex items-center justify-end">
                    {(coin.change || 0) >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    <span>{Math.abs(coin.change || 0).toFixed(2)}%</span>
                  </div>
                </td>
              </tr>
            ))}
            {(!portfolioData || portfolioData.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground italic">
                  Your portfolio is currently empty.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Portfolio;
