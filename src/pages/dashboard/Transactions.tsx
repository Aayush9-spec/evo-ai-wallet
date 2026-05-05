
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowDownUp, ArrowUpRight, ArrowDownLeft, Search, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { usePortfolio } from "@/contexts/PortfolioContext";

const Transactions = () => {
  const { transactions } = usePortfolio();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesFilter = filterType === "all" || tx.type === filterType;
    
    return matchesSearch && matchesFilter;
  });
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).toUpperCase();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black tracking-tighter neon-text text-primary uppercase">Ledger_Sync</h1>
        <p className="text-muted-foreground font-mono text-xs tracking-widest mt-1">READING_ON_CHAIN_ACTIVITY...</p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-primary/5 p-4 rounded-lg border border-primary/10 backdrop-blur-md">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-primary/60" />
          <Input
            placeholder="FILTER_BY_HASH_OR_SYMBOL..."
            className="pl-10 bg-transparent border-primary/20 font-mono text-xs uppercase tracking-widest focus-visible:ring-primary/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-64">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="bg-transparent border-primary/20 font-mono text-xs uppercase tracking-widest">
              <Filter className="mr-2 h-3 w-3" />
              <SelectValue placeholder="TYPE_FILTER" />
            </SelectTrigger>
            <SelectContent className="bg-background/95 border-primary/20 backdrop-blur-xl">
              <SelectItem value="all" className="font-mono text-xs uppercase">ALL_OPERATIONS</SelectItem>
              <SelectItem value="buy" className="font-mono text-xs uppercase">BUY_ORDERS</SelectItem>
              <SelectItem value="sell" className="font-mono text-xs uppercase">SELL_ORDERS</SelectItem>
              <SelectItem value="receive" className="font-mono text-xs uppercase">INBOUND_TRANSFER</SelectItem>
              <SelectItem value="send" className="font-mono text-xs uppercase">OUTBOUND_TRANSFER</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" className="w-full sm:w-auto border-primary/30 font-mono text-[10px] tracking-[0.2em] hover:bg-primary/10">
          EXPORT_DATA.LOG
        </Button>
      </div>
      
      <div className="hud-panel overflow-hidden">
        <div className="p-4 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowDownUp size={16} className="text-primary animate-pulse" />
            <h3 className="font-mono font-bold text-xs tracking-[0.3em] uppercase">Historical_Feed</h3>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">{filteredTransactions.length} ENTRIES_DETECTED</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary/5">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Status_Code</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Asset_Identifier</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Quantum_Amt</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-primary uppercase tracking-[0.2em]">USD_Value</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-6 py-5">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded border font-mono text-[9px] font-bold uppercase tracking-widest ${
                      tx.type === "receive" || tx.type === "buy"
                        ? "bg-accent/10 text-accent border-accent/20" 
                        : "bg-destructive/10 text-destructive border-destructive/20"
                    }`}>
                      {tx.type === "receive" || tx.type === "buy" ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                      {tx.type}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors">{tx.asset}</div>
                    <div className="text-[10px] font-mono text-muted-foreground uppercase">{tx.symbol}</div>
                  </td>
                  <td className="px-6 py-5 text-right font-mono text-sm">
                    {tx.amount} {tx.symbol}
                  </td>
                  <td className="px-6 py-5 text-right font-mono font-bold text-sm">
                    ${tx.value.toLocaleString()}
                  </td>
                  <td className="px-6 py-5 text-right font-mono text-[10px] text-muted-foreground">
                    {formatDate(tx.date)}
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground font-mono text-xs tracking-[0.3em] uppercase opacity-40">
                    NULL_SET: NO_RECORDS_MATCH_QUERY
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


export default Transactions;
