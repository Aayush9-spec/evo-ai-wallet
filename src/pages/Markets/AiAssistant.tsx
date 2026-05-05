import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, AlertCircle, RefreshCw, HelpCircle, Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { getChatbotResponse, getAgentResponse, AIAgentResponse, getMarketInsights } from "@/services/aiService";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { fetchTopCryptos } from "@/services/cryptoApi";
import { useWeb3 } from "@/contexts/Web3Context";
import { executeTrade } from "@/services/tradeExecutor";
import { ethers } from "ethers";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  action?: AIAgentResponse["action"];
}

interface Topic {
  title: string;
  examples: string[];
}

const AiAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content:
        "Hello! I'm your crypto investment assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  
  const { balance, assets, buyAsset, sellAsset } = usePortfolio();
  const { isConnected, signer, address } = useWeb3();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [marketData, setMarketData] = useState<any>(null);
  const [sentiment, setSentiment] = useState(50);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  
  const topics: Topic[] = [
    {
      title: "Portfolio Advice",
      examples: [
        "How should I balance my crypto portfolio?",
        "Is it a good time to invest in Bitcoin?",
        "What percentage of my portfolio should be in stablecoins?"
      ]
    },
    {
      title: "Market Analysis",
      examples: [
        "What's causing the current market volatility?",
        "How might interest rates affect crypto prices?",
        "Which sectors in crypto are seeing growth?"
      ]
    },
    {
      title: "Risk Management",
      examples: [
        "How can I reduce my risk exposure?",
        "What are good stop-loss strategies?",
        "How to protect against market downturns?"
      ]
    },
    {
      title: "Educational",
      examples: [
        "Explain DeFi investment opportunities",
        "What is yield farming?",
        "How do staking rewards work?"
      ]
    }
  ];
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    if (hasMounted && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    } else {
      setHasMounted(true);
    }
  }, [messages]);
  
  useEffect(() => {
    const loadMarketData = async () => {
      const insights = await getMarketInsights();
      setMarketData(insights);
      
      const cryptos = await fetchTopCryptos(10);
      if (cryptos) {
        const avgChange = cryptos.reduce((acc, c) => acc + c.quote.USD.percent_change_24h, 0) / cryptos.length;
        setSentiment(50 + (avgChange * 5)); // Map avg change to 0-100 scale
      }
    };
    loadMarketData();
    initializeSpeechRecognition();
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error('Error stopping speech recognition:', error);
        }
      }
    };
  }, []);
  
  const initializeSpeechRecognition = () => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.interimResults = false;
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('Speech recognized:', transcript);
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event);
        toast({
          title: "Speech Recognition Error",
          description: event.error === 'no-speech' 
            ? "No speech detected. Please try again." 
            : "Error recognizing speech. Please try again.",
          variant: "destructive"
        });
        setIsListening(false);
      };
    }
  };

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser.",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
      setIsListening(false);
    } else {
      try {
        initializeSpeechRecognition();
        recognitionRef.current.start();
        console.log('Speech recognition started');
        setIsListening(true);
      } catch (error) {
        console.error('Speech recognition start error', error);
        toast({
          title: "Error",
          description: "Could not start speech recognition.",
          variant: "destructive"
        });
        setIsListening(false);
      }
    }
  };
  
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      toast({
        title: "Processing",
        description: "Getting AI response...",
      });
      
      const agentData = await getAgentResponse(input, { balance, assets });
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: agentData.message,
        sender: "bot",
        timestamp: new Date(),
        action: agentData.action
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error getting chatbot response:", error);
      
      toast({
        title: "Error",
        description: "Unable to get a response. Please try again later.",
        variant: "destructive",
      });
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an issue processing your request. Please try again later.",
        sender: "bot",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const sendQuickMessage = (text: string) => {
    setInput(text);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">AI Investment Assistant</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <Tabs defaultValue="chat">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Bot className="h-6 w-6 mr-2 text-crypto-purple" />
                  <CardTitle>Investment Assistant</CardTitle>
                </div>
                <TabsList className="ml-auto">
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                  <TabsTrigger value="help">Help Topics</TabsTrigger>
                </TabsList>
              </div>
              <CardDescription className="mt-2">
                Ask me anything about cryptocurrency investments and strategy
              </CardDescription>
            </CardHeader>
            
            <Separator />
            
            <CardContent className="pt-6">
              <TabsContent value="chat" className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-4 h-[480px] overflow-hidden flex flex-col">
                  <ScrollArea className="flex-grow pr-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender === "user" ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-xl p-3 ${
                              message.sender === "user"
                                ? "bg-crypto-purple text-white rounded-tr-none"
                                : "bg-muted rounded-tl-none"
                            }`}
                          >
                            {message.content}
                            
                            {message.action && message.action.type !== "analyze_portfolio" && (
                              <div className="mt-3 p-3 bg-background/50 rounded-lg border border-border">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Proposed {message.action.type}
                                  </span>
                                  <Badge variant="outline" className="bg-crypto-purple/10 text-crypto-purple">
                                    {message.action.symbol}
                                  </Badge>
                                </div>
                                <p className="text-sm mb-3 text-foreground/80 italic">
                                  "{message.action.reasoning}"
                                </p>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    className="flex-1 bg-crypto-purple hover:bg-crypto-purple/90 h-8"
                                    onClick={() => {
                                      try {
                                        if (message.action?.type === "buy") {
                                          buyAsset(message.action.symbol!, message.action.symbol!, message.action.amount!, 65000, "#F7931A");
                                        } else {
                                          sellAsset(message.action.symbol!, message.action.amount!, 65000);
                                        }
                                        toast({ title: "Trade Executed", description: `Successfully ${message.action?.type}ed ${message.action?.amount} ${message.action?.symbol}` });
                                      } catch (e: any) {
                                        toast({ title: "Trade Failed", description: e.message, variant: "destructive" });
                                      }
                                    }}
                                  >
                                    Confirm {message.action.type === "buy" ? "Purchase" : "Sale"}
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-8">Dismiss</Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="max-w-[80%] rounded-xl rounded-tl-none bg-muted p-3">
                            <div className="flex items-center space-x-2">
                              <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse"></div>
                              <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                              <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask me about crypto investments..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button 
                    onClick={toggleSpeechRecognition} 
                    variant={isListening ? "destructive" : "outline"}
                    className={`${isListening ? 'bg-red-500 text-white' : ''}`}
                    disabled={isLoading} 
                    aria-label={isListening ? "Stop listening" : "Start voice input"}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={isLoading || !input.trim()}
                    className="bg-crypto-purple hover:bg-crypto-purple/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="help">
                <div className="space-y-6">
                  <Alert variant="default" className="bg-muted/50 border-muted">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>How can I help?</AlertTitle>
                    <AlertDescription>
                      Here are some topics I can assist you with. Click on any suggestion to start a conversation.
                    </AlertDescription>
                  </Alert>
                  
                  {topics.map((topic) => (
                    <div key={topic.title} className="space-y-3">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-crypto-purple" />
                        {topic.title}
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        {topic.examples.map((example) => (
                          <Button
                            key={example}
                            variant="outline"
                            className="justify-start h-auto py-3 text-left"
                            onClick={() => sendQuickMessage(example)}
                          >
                            {example}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-2">
                    <Button 
                      variant="ghost"
                      className="w-full flex items-center gap-2"
                      onClick={() => {
                        setMessages([{
                          id: "welcome",
                          content: "Hello! I'm your crypto investment assistant. How can I help you today?",
                          sender: "bot",
                          timestamp: new Date(),
                        }]);
                        toast({
                          title: "Conversation reset",
                          description: "Starting a fresh conversation",
                        });
                      }}
                    >
                      <RefreshCw className="h-4 w-4" /> Reset conversation
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
        
        <Card className="hud-panel border-accent/20">
          <CardHeader>
            <CardTitle className="text-accent neon-text">Market_Intelligence</CardTitle>
            <CardDescription className="text-[10px] font-mono tracking-widest">
              LIVE_SENTIMENT_ANALYSIS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xs font-mono mb-3 uppercase tracking-widest text-muted-foreground">Market_Bias</h3>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-destructive uppercase">Fear</span>
                <div className="w-2/3 h-1.5 bg-primary/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent transition-all duration-1000 shadow-[0_0_10px_rgba(6,182,212,0.5)]" 
                    style={{ width: `${sentiment}%` }}
                  ></div>
                </div>
                <span className="text-[10px] font-bold text-accent uppercase">Greed</span>
              </div>
            </div>
            
            <Separator className="bg-primary/10" />
            
            <div>
              <h3 className="text-xs font-mono mb-3 uppercase tracking-widest text-muted-foreground">Top_Movers</h3>
              <div className="space-y-3">
                {marketData?.topMovers.gainers.slice(0, 3).map((coin: any) => (
                  <div key={coin.symbol} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px] font-mono border-primary/20">{coin.symbol}</Badge>
                      <span className="text-xs font-medium group-hover:text-primary transition-colors">{coin.name}</span>
                    </div>
                    <Badge className="bg-accent/20 text-accent border-accent/30 text-[10px]">{coin.change}</Badge>
                  </div>
                ))}
                {marketData?.topMovers.losers.slice(0, 1).map((coin: any) => (
                  <div key={coin.symbol} className="flex items-center justify-between opacity-60">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px] font-mono">{coin.symbol}</Badge>
                      <span className="text-xs font-medium">{coin.name}</span>
                    </div>
                    <Badge variant="outline" className="text-destructive border-destructive/30 text-[10px]">{coin.change}</Badge>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator className="bg-primary/10" />
            
            <div>
              <h3 className="text-xs font-mono mb-3 uppercase tracking-widest text-muted-foreground">Neural_Insights</h3>
              <div className="space-y-4">
                {marketData?.trendingTopics.slice(0, 2).map((topic: any, i: number) => (
                  <div key={i} className="p-2 rounded bg-primary/5 border border-primary/10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-primary uppercase">{topic.title}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {topic.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full mt-4 text-[10px] font-mono tracking-[0.2em] border-primary/30 hover:bg-primary/10"
              onClick={() => sendQuickMessage("Provide a deep analysis of current market movers")}
            >
              GENERATE_QUANT_REPORT
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AiAssistant;
