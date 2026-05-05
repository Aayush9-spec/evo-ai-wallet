
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import SignupNow from "./pages/SignupNow";
import Dashboard from "./pages/Dashboard";
import Cryptocurrencies from "./pages/Markets/Cryptocurrencies";
import MarketInsights from "./pages/Markets/MarketInsights";
import AiAnalysis from "./pages/Markets/AiAnalysis";
import AiAssistant from "./pages/Markets/AiAssistant";
import { AuthProvider } from "./contexts/AuthContext";
import { PortfolioProvider } from "./contexts/PortfolioContext";
import { Web3Provider } from "./contexts/Web3Context";
import { NotificationProvider } from "./contexts/NotificationContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Web3Provider>
        <NotificationProvider>
          <PortfolioProvider>
            <ThemeProvider>
                <BrowserRouter>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <Routes>
                      <Route path="/" element={<Layout><Index /></Layout>} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/signup-now" element={<Layout><SignupNow /></Layout>} />
                      <Route path="/dashboard/*" element={<Dashboard />} />
                      <Route path="/markets" element={<Navigate to="/markets/cryptocurrencies" replace />} />
                      <Route path="/markets/cryptocurrencies" element={<Layout><Cryptocurrencies /></Layout>} />
                      <Route path="/markets/insights" element={<Layout><MarketInsights /></Layout>} />
                      <Route path="/markets/ai-analysis" element={<Layout><AiAnalysis /></Layout>} />
                      <Route path="/markets/ai-assistant" element={<Layout><AiAssistant /></Layout>} />
                      <Route path="/ai-analysis" element={<Layout><AiAnalysis /></Layout>} />
                      <Route path="/chatbot" element={<Layout><AiAssistant /></Layout>} />
                      <Route path="*" element={<Layout><NotFound /></Layout>} />
                    </Routes>
                  </TooltipProvider>
                </BrowserRouter>
            </ThemeProvider>
          </PortfolioProvider>
        </NotificationProvider>
      </Web3Provider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
