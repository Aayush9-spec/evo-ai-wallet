import axios from "axios";

const getApiKey = () => localStorage.getItem("GROQ_API_KEY") || (import.meta.env as any).VITE_GROQ_API_KEY;

// Flag to toggle between mock and production API calls
const isMockMode = () => !getApiKey(); 

interface AIAnalysisResponse {
  analysis: string;
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  keyPoints: string[];
}

// Helper functions for parsing AI responses
const determineSentiment = (aiResponse: string): "bullish" | "bearish" | "neutral" => {
  const lowerCaseResponse = aiResponse.toLowerCase();
  if (lowerCaseResponse.includes("bullish") ||
    lowerCaseResponse.includes("positive") ||
    lowerCaseResponse.includes("upward") ||
    lowerCaseResponse.includes("growth")) {
    return "bullish";
  } else if (lowerCaseResponse.includes("bearish") ||
    lowerCaseResponse.includes("negative") ||
    lowerCaseResponse.includes("downward") ||
    lowerCaseResponse.includes("decline")) {
    return "bearish";
  }
  return "neutral";
};

const calculateConfidence = (aiResponse: string): number => {
  // Look for confidence indicators in text
  const confidencePatterns = [
    { pattern: /strong confidence|highly confident|very likely|certainly|definitely/i, value: 0.9 },
    { pattern: /confident|likely|probably|good chance|expect/i, value: 0.75 },
    { pattern: /possible|might|could|may|moderate confidence/i, value: 0.6 },
    { pattern: /uncertain|unclear|difficult to predict|hard to say/i, value: 0.4 },
    { pattern: /unlikely|doubtful|improbable/i, value: 0.25 },
    { pattern: /highly unlikely|very doubtful|extremely improbable/i, value: 0.1 },
  ];

  for (const { pattern, value } of confidencePatterns) {
    if (pattern.test(aiResponse)) {
      return value;
    }
  }

  // Default confidence if no patterns match
  return 0.6;
};

const extractKeyPoints = (aiResponse: string): string[] => {
  // Split by common list markers
  const splitByBullet = aiResponse.split(/•|\*|\-|\d+\.\s/);

  // If we have bullet points, process them
  if (splitByBullet.length > 1) {
    return splitByBullet
      .map(point => point.trim())
      .filter(point => point.length > 10) // Filter out too short items
      .slice(0, 5); // Limit to 5 key points
  }

  // If no bullet points found, try to extract sentences
  const sentences = aiResponse.split(/\.(?!\d)/g); // Split by periods not followed by digits

  return sentences
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 15 && sentence.length < 100)
    .slice(0, 4); // Get first 4 meaningful sentences
};

// Mock analysis responses
const mockAnalysisResponses: Record<string, AIAnalysisResponse> = {
  "BTC": {
    analysis: "Bitcoin continues to demonstrate strong fundamentals with increasing institutional adoption. The recent price consolidation above the $60,000 level suggests a stable support base. On-chain metrics indicate accumulation by long-term holders which is historically bullish.",
    sentiment: "bullish",
    confidence: 0.85,
    keyPoints: [
      "Institutional adoption continues to grow",
      "Strong support at $60,000",
      "On-chain metrics show accumulation",
      "Decreasing exchange reserves indicate reduced selling pressure"
    ]
  },
  "ETH": {
    analysis: "Ethereum's transition to proof-of-stake has significantly reduced its energy consumption and created a deflationary mechanism through token burning. The upcoming protocol upgrades focus on scalability and should reduce gas fees further, making the network more accessible.",
    sentiment: "bullish",
    confidence: 0.78,
    keyPoints: [
      "Deflationary tokenomics through ETH burning",
      "Layer 2 solutions gaining traction",
      "DeFi ecosystem growth",
      "Upcoming scalability improvements"
    ]
  },
  "BNB": {
    analysis: "Binance Coin benefits from the exchange's dominant position in crypto trading volumes. The regular token burns reduce supply, creating upward price pressure. However, regulatory concerns around centralized exchanges remain a risk factor to monitor.",
    sentiment: "neutral",
    confidence: 0.65,
    keyPoints: [
      "Regular token burning mechanism",
      "Strong ecosystem on Binance Smart Chain",
      "Regulatory uncertainty remains a concern",
      "Competition from other exchange tokens increasing"
    ]
  },
  "XRP": {
    analysis: "XRP faces ongoing regulatory uncertainty with the SEC lawsuit. Despite this, Ripple continues to expand its cross-border payment solutions internationally. Resolution of legal challenges could potentially unlock significant upside if favorable.",
    sentiment: "neutral",
    confidence: 0.52,
    keyPoints: [
      "Legal uncertainty remains the primary factor",
      "Strong international partnerships",
      "Growing adoption outside the US",
      "Technical analysis shows consolidation pattern"
    ]
  },
  "DOGE": {
    analysis: "Dogecoin continues to benefit from strong community support and occasional celebrity endorsements. However, the token lacks technical development and meaningful utility beyond payments. Volatility is likely to continue with sentiment-driven price action.",
    sentiment: "bearish",
    confidence: 0.62,
    keyPoints: [
      "Limited technical development",
      "Strong but largely speculative community",
      "Lacking significant utility growth",
      "Highly influenced by social media sentiment"
    ]
  }
};

export const getAIAnalysis = async (cryptoSymbol: string, marketData?: any): Promise<AIAnalysisResponse> => {
  try {
    const symbol = cryptoSymbol.toUpperCase();

    // Use mock data if flag is true and we have a mock response for this symbol
    if (isMockMode() && mockAnalysisResponses[symbol]) {
      console.log(`Using mock data for ${symbol}`);
      return mockAnalysisResponses[symbol];
    }

    // Make an actual API call to Groq
    console.log(`Calling Groq API for ${symbol} analysis`);

    let userPrompt = `Provide a detailed analysis of ${cryptoSymbol} current market position, technical analysis, and future outlook. Structure your response with clear points.`;

    // Inject live market data into the prompt if available
    if (marketData) {
      const price = marketData.quote?.USD?.price ? `$${marketData.quote.USD.price.toLocaleString()}` : "unknown";
      const change24h = marketData.quote?.USD?.percent_change_24h ? `${marketData.quote.USD.percent_change_24h.toFixed(2)}%` : "unknown";
      const volume = marketData.quote?.USD?.volume_24h ? `$${marketData.quote.USD.volume_24h.toLocaleString()}` : "unknown";

      userPrompt += `\n\nContext based on LIVE DATA:\n- Current Price: ${price}\n- 24h Change: ${change24h}\n- 24h Volume: ${volume}\n\nPlease analyze this specific data in your response.`;
    }

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a cryptocurrency analysis AI. Provide detailed, well-structured analysis of market trends and coin fundamentals. Include clear points about sentiment (bullish, bearish, neutral) and explain your confidence level in your analysis."
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
      },
      {
        headers: {
          "Authorization": `Bearer ${getApiKey()}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Extract the AI response (defensive checks)
    const aiResponse = response?.data?.choices?.[0]?.message?.content;
    console.log(`Received Groq API response for ${symbol}`, {
      status: response?.status,
      hasContent: Boolean(aiResponse),
    });
    if (!aiResponse) {
      console.error('Groq API response missing expected content', response?.data);
      throw new Error('Invalid response from Groq API');
    }

    // Process and structure the AI response
    const processedResponse: AIAnalysisResponse = {
      analysis: aiResponse,
      sentiment: determineSentiment(aiResponse),
      confidence: calculateConfidence(aiResponse),
      keyPoints: extractKeyPoints(aiResponse),
    };

    return processedResponse;
  } catch (error) {
    // Improved axios error logging to surface status and server message
    const err: any = error;
    if (err?.response) {
      console.error("Groq API Error:", {
        status: err.response.status,
        data: err.response.data,
      });
    } else {
      console.error("Error fetching AI analysis:", err?.message || err);
    }

    // Return a fallback response on error
    return {
      analysis: "Unable to generate analysis at this time. Please try again later.",
      sentiment: "neutral",
      confidence: 0,
      keyPoints: ["Analysis unavailable"]
    };
  }
};

// Chatbot function using Groq API
export const getChatbotResponse = async (message: string): Promise<string> => {
  try {
    // Use mock responses if flag is true
    if (isMockMode()) {
      console.log("Using mock chatbot response");
      // Mock responses for specific queries
      if (message.toLowerCase().includes("bitcoin") || message.toLowerCase().includes("btc")) {
        return "Bitcoin is showing strong momentum with key support at $58,000. Institutional interest remains high, and on-chain metrics suggest accumulation. Consider dollar-cost averaging if you're looking to build a position.";
      } else if (message.toLowerCase().includes("ethereum") || message.toLowerCase().includes("eth")) {
        return "Ethereum's network activity is growing with increased adoption of layer-2 solutions. The recent price action indicates consolidation before potential upward movement. The upcoming protocol upgrades should address scalability issues.";
      } else if (message.toLowerCase().includes("best") || message.toLowerCase().includes("recommend")) {
        return "Based on risk-reward profiles, consider allocating a portion of your portfolio to established cryptocurrencies like Bitcoin and Ethereum as a foundation. For higher growth potential with increased risk, research layer-1 protocols with growing ecosystems and real-world utility.";
      } else if (message.toLowerCase().includes("market")) {
        return "The current market sentiment is cautiously optimistic. Bitcoin dominance is at 43%, suggesting altcoins could perform well if market momentum continues. Always maintain a balanced portfolio and only invest what you can afford to lose.";
      }

      return "I'm your crypto AI assistant. I can help analyze market trends, provide insights on specific cryptocurrencies, or suggest investment strategies based on your goals and risk tolerance. What specific information are you looking for?";
    }

    // Make an actual API call to Groq
    console.log("Calling Groq API for chatbot response");
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a helpful cryptocurrency assistant. Provide concise, accurate information about cryptocurrencies, market trends, and investment strategies. Always remind users that your advice is not financial advice. Keep responses under 200 words."
          },
          {
            role: "user",
            content: message
          }
        ],
      },
      {
        headers: {
          "Authorization": `Bearer ${getApiKey()}`,
          "Content-Type": "application/json",
        },
      }
    );

    const content = response?.data?.choices?.[0]?.message?.content;
    console.log("Received Groq API response for chat", { status: response?.status, hasContent: Boolean(content) });
    if (!content) {
      console.error('Groq chat response missing content', response?.data);
      throw new Error('Invalid response from Groq chat API');
    }
    return content;
  } catch (error) {
    const err: any = error;
    if (err?.response) {
      console.error("Groq Chat API Error:", {
        status: err.response.status,
        data: err.response.data,
      });
    } else {
      console.error("Error fetching chatbot response:", err?.message || err);
    }
    return "I'm having trouble connecting to my knowledge base at the moment. Please try again later.";
  }
};

// Agentic AI: Response structure for tool calling
export interface AIAgentResponse {
  message: string;
  action?: {
    type: "buy" | "sell" | "analyze_portfolio";
    symbol?: string;
    amount?: number;
    reasoning?: string;
  };
}

import { fetchTopCryptos } from "./cryptoApi";

// Agentic AI: Main function to handle reasoning and tool calls
export const getAgentResponse = async (
  message: string, 
  portfolioData: { balance: number; assets: any[] }
): Promise<AIAgentResponse> => {
  try {
    const cryptos = await fetchTopCryptos(5);
    const marketContext = cryptos?.map(c => `${c.name}: $${c.quote.USD.price} (${c.quote.USD.percent_change_24h}% 24h)`).join(", ");

    if (isMockMode()) {
      const lowerMsg = message.toLowerCase();
      
      // Advanced mock agent logic
      if (lowerMsg.includes("buy") || lowerMsg.includes("invest")) {
        const symbol = lowerMsg.includes("btc") ? "BTC" : lowerMsg.includes("eth") ? "ETH" : "SOL";
        const price = cryptos?.find(c => c.symbol === symbol)?.quote.USD.price || 50000;
        
        return {
          message: `I've analyzed the current market for ${symbol}. It's currently trading at $${price.toLocaleString()}. Given your balance of $${portfolioData.balance.toLocaleString()}, I recommend opening a position.`,
          action: {
            type: "buy",
            symbol: symbol,
            amount: symbol === "BTC" ? 0.05 : 1,
            reasoning: `Market indicators for ${symbol} suggest an accumulation phase. Current price of $${price} is attractive for a long-term position.`
          }
        };
      }

      if (lowerMsg.includes("how much") || lowerMsg.includes("portfolio") || lowerMsg.includes("balance") || lowerMsg.includes("analyze")) {
        const totalValue = portfolioData.assets.reduce((acc, curr) => acc + (curr.amount * curr.avgPrice), portfolioData.balance);
        return {
          message: `Your total portfolio value is approximately $${totalValue.toLocaleString()}. You currently hold ${portfolioData.assets.length} assets. Market context: ${marketContext}.`,
          action: {
            type: "analyze_portfolio",
            reasoning: "User requested portfolio overview."
          }
        };
      }

      return {
        message: `I'm your Evo AI Agent. Current market snapshot: ${marketContext}. How can I help you manage your wealth today?`
      };
    }

    // Real API implementation with System Prompt for Tool Calling
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are the Evo AI Agent, a sophisticated crypto fund manager. 
            You have access to the user's LIVE portfolio:
            - Balance: $${portfolioData.balance}
            - Assets: ${JSON.stringify(portfolioData.assets)}
            - Market Snapshot: ${marketContext}

            Your goal is to assist the user in managing their wealth. 
            If the user wants to trade or needs a specific action, you MUST respond in JSON format:
            {
              "message": "Your natural language response here",
              "action": {
                "type": "buy" | "sell" | "analyze_portfolio",
                "symbol": "TICKER",
                "amount": number,
                "reasoning": "Brief explanation"
              }
            }
            If no action is needed, just return the JSON with only the "message" field.`
          },
          {
            role: "user",
            content: message
          }
        ],
        response_format: { type: "json_object" }
      },
      {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("GROQ_API_KEY") || ""}`,
          "Content-Type": "application/json",
        },
      }
    );

    const content = JSON.parse(response?.data?.choices?.[0]?.message?.content || "{}");
    return content as AIAgentResponse;
  } catch (error) {
    console.error("Agentic AI Error:", error);
    return {
      message: "I encountered an error while processing your request. Please try again."
    };
  }
};

// Real Market Insights data from API
export const getMarketInsights = async () => {
  const cryptos = await fetchTopCryptos(10);
  
  if (!cryptos) return null;

  const topGainer = [...cryptos].sort((a, b) => b.quote.USD.percent_change_24h - a.quote.USD.percent_change_24h)[0];
  const topLoser = [...cryptos].sort((a, b) => a.quote.USD.percent_change_24h - b.quote.USD.percent_change_24h)[0];

  return {
    marketOverview: {
      title: "Real-Time Market Pulse",
      content: `Global market cap is shifting. ${topGainer.name} is leading the rally with a ${topGainer.quote.USD.percent_change_24h.toFixed(2)}% gain, while ${topLoser.name} is seeing some correction.`
    },
    trendingTopics: [
      {
        title: `${topGainer.symbol} Momentum`,
        content: `${topGainer.name} price has reached $${topGainer.quote.USD.price.toLocaleString()}, signaling strong institutional interest.`
      },
      {
        title: "Volatility Alert",
        content: `Average market volatility is at ${Math.abs(topLoser.quote.USD.percent_change_24h).toFixed(1)}%. Traders should monitor stop-loss levels.`
      }
    ],
    topMovers: {
      gainers: cryptos.filter(c => c.quote.USD.percent_change_24h > 0).slice(0, 3).map(c => ({
        name: c.name,
        symbol: c.symbol,
        change: `+${c.quote.USD.percent_change_24h.toFixed(2)}%`
      })),
      losers: cryptos.filter(c => c.quote.USD.percent_change_24h < 0).slice(0, 3).map(c => ({
        name: c.name,
        symbol: c.symbol,
        change: `${c.quote.USD.percent_change_24h.toFixed(2)}%`
      }))
    },
    upcomingEvents: [
      {
        title: "Dynamic Price Discovery",
        date: "NOW",
        description: `Live streaming data for ${cryptos.length} primary assets is currently active.`
      }
    ]
  };
};

