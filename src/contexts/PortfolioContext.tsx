
import React, { createContext, useContext, useState, useEffect } from "react";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

export interface Asset {
  symbol: string;
  name: string;
  amount: number;
  avgPrice: number;
  color: string;
}

export interface Transaction {
  id: string;
  type: "buy" | "sell" | "receive" | "send";
  asset: string;
  symbol: string;
  amount: number;
  value: number;
  date: string;
  status: "completed" | "pending";
}

interface PortfolioContextType {
  balance: number;
  assets: Asset[];
  transactions: Transaction[];
  buyAsset: (symbol: string, name: string, amount: number, price: number, color: string) => void;
  sellAsset: (symbol: string, amount: number, price: number) => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(50000);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load Initial Data (Firestore or LocalStorage)
  useEffect(() => {
    const loadData = async () => {
      if (user && db && Object.keys(db).length > 0) {
        try {
          const docRef = doc(db, "portfolios", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            setBalance(data.balance ?? 50000);
            setAssets(data.assets ?? []);
            setTransactions(data.transactions ?? []);
          } else {
            // New user, set defaults
            const defaultAssets = [
              { symbol: "BTC", name: "Bitcoin", amount: 0.5, avgPrice: 60000, color: "#F7931A" },
              { symbol: "ETH", name: "Ethereum", amount: 4, avgPrice: 3000, color: "#627EEA" },
            ];
            setAssets(defaultAssets);
            await setDoc(docRef, { balance: 50000, assets: defaultAssets, transactions: [] });
          }
        } catch (error) {
          console.error("Firestore Load Failed:", error);
          loadFromLocalStorage();
        }
      } else {
        loadFromLocalStorage();
      }
      setIsInitialLoad(false);
    };

    const loadFromLocalStorage = () => {
      try {
        const savedAssets = localStorage.getItem("portfolio_assets");
        const savedTx = localStorage.getItem("portfolio_transactions");
        const savedBal = localStorage.getItem("portfolio_balance");
        
        if (savedAssets) setAssets(JSON.parse(savedAssets));
        else setAssets([
          { symbol: "BTC", name: "Bitcoin", amount: 0.5, avgPrice: 60000, color: "#F7931A" },
          { symbol: "ETH", name: "Ethereum", amount: 4, avgPrice: 3000, color: "#627EEA" },
        ]);
        
        if (savedTx) setTransactions(JSON.parse(savedTx));
        if (savedBal) setBalance(parseFloat(savedBal));
      } catch (error) {
        console.error("Failed to load portfolio from localStorage:", error);
        // Fallback defaults
        setAssets([
          { symbol: "BTC", name: "Bitcoin", amount: 0.5, avgPrice: 60000, color: "#F7931A" },
          { symbol: "ETH", name: "Ethereum", amount: 4, avgPrice: 3000, color: "#627EEA" },
        ]);
      }
    };

    loadData();
  }, [user]);

  // Sync Changes
  useEffect(() => {
    if (isInitialLoad) return;

    const syncData = async () => {
      localStorage.setItem("portfolio_assets", JSON.stringify(assets));
      localStorage.setItem("portfolio_transactions", JSON.stringify(transactions));
      localStorage.setItem("portfolio_balance", balance.toString());

      if (user && db && Object.keys(db).length > 0) {
        try {
          await setDoc(doc(db, "portfolios", user.uid), {
            balance,
            assets,
            transactions,
            lastUpdated: new Date().toISOString()
          }, { merge: true });
        } catch (error) {
          console.error("Firestore Sync Failed:", error);
        }
      }
    };

    syncData();
  }, [assets, transactions, balance, user, isInitialLoad]);

  const buyAsset = (symbol: string, name: string, amount: number, price: number, color: string) => {
    const totalCost = amount * price;
    if (totalCost > balance) {
      throw new Error("Insufficient balance");
    }

    setBalance(prev => prev - totalCost);
    
    setAssets(prev => {
      const existing = prev.find(a => a.symbol === symbol);
      if (existing) {
        const newAmount = existing.amount + amount;
        const newAvgPrice = (existing.avgPrice * existing.amount + price * amount) / newAmount;
        return prev.map(a => a.symbol === symbol ? { ...a, amount: newAmount, avgPrice: newAvgPrice } : a);
      }
      return [...prev, { symbol, name, amount, avgPrice: price, color }];
    });

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: "buy",
      asset: name,
      symbol,
      amount,
      value: totalCost,
      date: new Date().toISOString(),
      status: "completed"
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const sellAsset = (symbol: string, amount: number, price: number) => {
    setAssets(prev => {
      const existing = prev.find(a => a.symbol === symbol);
      if (!existing || existing.amount < amount) {
        throw new Error("Insufficient assets");
      }
      
      const newAmount = existing.amount - amount;
      if (newAmount === 0) {
        return prev.filter(a => a.symbol === symbol);
      }
      return prev.map(a => a.symbol === symbol ? { ...a, amount: newAmount } : a);
    });

    const totalValue = amount * price;
    setBalance(prev => prev + totalValue);

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: "sell",
      asset: symbol,
      symbol,
      amount,
      value: totalValue,
      date: new Date().toISOString(),
      status: "completed"
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  return (
    <PortfolioContext.Provider value={{ balance, assets, transactions, buyAsset, sellAsset }}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }
  return context;
};
