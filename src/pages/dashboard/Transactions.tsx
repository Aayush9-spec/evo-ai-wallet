
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
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transaction History</h1>
        <p className="text-muted-foreground">View and manage your crypto transactions</p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by asset, symbol..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="buy">Bought</SelectItem>
              <SelectItem value="sell">Sold</SelectItem>
              <SelectItem value="receive">Received</SelectItem>
              <SelectItem value="send">Sent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" className="w-full sm:w-auto">Export CSV</Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownUp size={20} className="text-crypto-purple" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Asset</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Value</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs capitalize ${
                        tx.type === "receive" || tx.type === "buy"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                          : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                      }`}>
                        {tx.type === "receive" || tx.type === "buy" ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                        {tx.type}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium">{tx.asset}</div>
                      <div className="text-xs text-muted-foreground">{tx.symbol}</div>
                    </td>
                    <td className="px-4 py-4 text-right font-medium">
                      {tx.amount} {tx.symbol}
                    </td>
                    <td className="px-4 py-4 text-right font-medium">
                      ${tx.value.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-muted-foreground">
                      {formatDate(tx.date)}
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No transactions found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;
