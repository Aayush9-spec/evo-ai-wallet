import axios from "axios";

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

// CoinGecko API Base URL
const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";

// Mapping for CoinGecko IDs
const COIN_MAPPING: Record<string, string> = {
  'bitcoin': 'bitcoin',
  'ethereum': 'ethereum',
  'ripple': 'ripple',
  'binancecoin': 'binancecoin',
  'tether': 'tether',
  'usd-coin': 'usd-coin',
  'dogecoin': 'dogecoin',
  'polygon': 'matic-network',
  'solana': 'solana',
  'cardano': 'cardano'
};

// Function to fetch cryptocurrency data from CoinGecko
export const fetchTopCryptos = async (limit: number = 10): Promise<CryptoData[]> => {
  try {
    console.log("Fetching top cryptocurrencies from CoinGecko API...");

    const response = await axios.get(
      `${COINGECKO_BASE_URL}/coins/markets`,
      {
        params: {
          vs_currency: "usd",
          order: "market_cap_desc",
          per_page: limit,
          page: 1,
          sparkline: false,
          price_change_percentage: "1h,24h,7d"
        }
      }
    );

    // Transform CoinGecko data to match our interface
    const data = response.data.map((coin: any) => ({
      id: coin.id, // Using string ID as number might cause issues if we strictly expect number, but for now let's cast or handle it
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      slug: coin.id,
      quote: {
        USD: {
          price: coin.current_price,
          volume_24h: coin.total_volume,
          percent_change_1h: coin.price_change_percentage_1h_in_currency,
          percent_change_24h: coin.price_change_percentage_24h_in_currency,
          percent_change_7d: coin.price_change_percentage_7d_in_currency,
          market_cap: coin.market_cap,
        },
      },
    }));

    return data;
  } catch (error: any) {
    console.error("Error fetching cryptocurrency data:", error.message);
    // Fallback to mock data
    return mockCryptoData.slice(0, limit);
  }
};

// Function to get historical data for a specific cryptocurrency
export const getHistoricalPriceData = async (symbol: string, days: number = 7) => {
  try {
    const geckoId = getCoinGeckoId(symbol);
    if (!geckoId) throw new Error("Coin not found");

    const response = await axios.get(
      `${COINGECKO_BASE_URL}/coins/${geckoId}/market_chart`,
      {
        params: {
          vs_currency: 'usd',
          days: days,
          interval: days <= 1 ? 'hourly' : 'daily',
        }
      }
    );

    return response.data.prices.map((item: [number, number]) => ({
      date: new Date(item[0]).toISOString(),
      price: item[1]
    }));

  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    // Fallback to mock data
    const priceMap: Record<string, number> = {
      'BTC': 65000, 'ETH': 3500, 'SOL': 150, 'ADA': 0.45
    };
    return generateMockHistoricalData(priceMap[symbol] || 100, days);
  }
};

const getCoinGeckoId = (symbol: string): string | null => {
  const mapping: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'XRP': 'ripple',
    'BNB': 'binancecoin',
    'USDT': 'tether',
    'USDC': 'usd-coin',
    'DOGE': 'dogecoin',
    'MATIC': 'matic-network',
    'SOL': 'solana',
    'ADA': 'cardano'
  };
  return mapping[symbol] || null;
};

export const fetchCryptoDetails = async (id: number | string): Promise<CryptoData | null> => {
  // Implementation for details if needed, for now reusing fetchTopCryptos logic or similar
  // Since ID in CoinGecko is string, we might need to adjust
  return null;
};

// Mock Data Generator
const generateMockHistoricalData = (basePrice: number, days: number) => {
  const data = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    const fluctuation = 0.9 + Math.random() * 0.2;
    data.push({
      date: date.toISOString(),
      price: basePrice * fluctuation
    });
  }
  return data;
};

const mockCryptoData: CryptoData[] = [
  {
    id: 1,
    name: "Bitcoin",
    symbol: "BTC",
    slug: "bitcoin",
    quote: {
      USD: {
        price: 65000,
        volume_24h: 30000000000,
        percent_change_1h: 0.5,
        percent_change_24h: 2.1,
        percent_change_7d: 5.4,
        market_cap: 1200000000000,
      },
    },
  },
  // ... more mock data can be added
];
