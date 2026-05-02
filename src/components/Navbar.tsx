
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Menu, X, ChevronDown, Diamond, BarChartHorizontal, 
  MessageSquareText, Brain, LogOut, User, Settings, 
  Search, Bell, CreditCard, LayoutDashboard, History,
  TrendingUp, Globe, Zap
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, logOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    await logOut();
    navigate("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // For now, redirect to markets with the search query
      navigate(`/markets/cryptocurrencies?search=${searchQuery}`);
      setSearchQuery("");
      if (isMenuOpen) setIsMenuOpen(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;
  const isMarketsActive = location.pathname.startsWith("/markets");

  return (
    <nav className="bg-background/80 border-b border-border sticky top-0 z-50 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 shrink-0 group">
            <div className="w-10 h-10 bg-crypto-purple rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
              <Diamond size={24} className="text-white" />
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:inline-block">EVO AI</span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search coins, analysis..."
                className="pl-10 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-crypto-purple"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            <Link 
              to="/dashboard" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/dashboard") 
                  ? "bg-muted text-primary" 
                  : "text-muted-foreground hover:text-primary hover:bg-muted/50"
              }`}
            >
              Dashboard
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isMarketsActive 
                      ? "bg-muted text-primary" 
                      : "text-muted-foreground hover:text-primary hover:bg-muted/50"
                  }`}
                >
                  <span>Markets</span>
                  <ChevronDown size={14} className="ml-1 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 p-2">
                <DropdownMenuLabel className="text-xs uppercase text-muted-foreground font-semibold px-2 py-1.5">
                  Market Explorer
                </DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link to="/markets/cryptocurrencies" className="flex items-start p-2 cursor-pointer">
                    <div className="bg-blue-500/10 p-1.5 rounded-lg mr-3">
                      <TrendingUp size={16} className="text-blue-500" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Cryptocurrencies</div>
                      <div className="text-xs text-muted-foreground">Live prices and trading</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/markets/insights" className="flex items-start p-2 cursor-pointer">
                    <div className="bg-orange-500/10 p-1.5 rounded-lg mr-3">
                      <Globe size={16} className="text-orange-500" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Market Insights</div>
                      <div className="text-xs text-muted-foreground">Global news and trends</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuLabel className="text-xs uppercase text-muted-foreground font-semibold px-2 py-1.5">
                  AI Intelligence
                </DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link to="/markets/ai-analysis" className="flex items-start p-2 cursor-pointer">
                    <div className="bg-purple-500/10 p-1.5 rounded-lg mr-3">
                      <Zap size={16} className="text-purple-500" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Deep AI Analysis</div>
                      <div className="text-xs text-muted-foreground">Predictive market sentiment</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link 
              to="/markets/ai-assistant" 
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/markets/ai-assistant") 
                  ? "bg-muted text-primary" 
                  : "text-muted-foreground hover:text-primary hover:bg-muted/50"
              }`}
            >
              <MessageSquareText size={16} className="mr-2 opacity-70" />
              AI Assistant
            </Link>
          </div>

          {/* Right Section: Theme, Alerts, Profile */}
          <div className="flex items-center space-x-2 ml-4">
            <ThemeToggle />
            
            {user ? (
              <>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary rounded-full hidden sm:flex">
                  <Bell size={20} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-crypto-red rounded-full border-2 border-background"></span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden border border-border">
                      <div className="bg-crypto-purple w-full h-full flex items-center justify-center text-white font-bold">
                        {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-1">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="flex items-center cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard/transactions" className="flex items-center cursor-pointer">
                        <History className="mr-2 h-4 w-4" />
                        <span>History</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard/settings" className="flex items-center cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-crypto-red focus:text-crypto-red cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Link to="/dashboard" className="hidden xl:block">
                  <Button className="bg-crypto-purple hover:bg-crypto-deep-purple text-white shadow-lg shadow-crypto-purple/20">
                    My Assets
                  </Button>
                </Link>
              </>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-crypto-purple hover:bg-crypto-deep-purple text-white shadow-lg shadow-crypto-purple/20">
                    Start Trading
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={toggleMenu}
              className="lg:hidden p-2 text-foreground focus:outline-none focus:ring-2 focus:ring-crypto-purple rounded-md"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border animate-fade-in space-y-4">
            <form onSubmit={handleSearch} className="relative px-2">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search market..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            <div className="space-y-1">
              <Link
                to="/dashboard"
                className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                  isActive("/dashboard") ? "bg-muted text-primary" : "hover:bg-muted"
                }`}
                onClick={toggleMenu}
              >
                <LayoutDashboard className="mr-3 h-5 w-5 opacity-70" />
                Dashboard
              </Link>
              
              <div className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">Markets</div>
              
              <Link
                to="/markets/cryptocurrencies"
                className="flex items-center px-4 py-3 hover:bg-muted rounded-md transition-colors"
                onClick={toggleMenu}
              >
                <TrendingUp className="mr-3 h-5 w-5 text-blue-500 opacity-70" />
                Cryptocurrencies
              </Link>
              <Link
                to="/markets/insights"
                className="flex items-center px-4 py-3 hover:bg-muted rounded-md transition-colors"
                onClick={toggleMenu}
              >
                <Globe className="mr-3 h-5 w-5 text-orange-500 opacity-70" />
                Market Insights
              </Link>
              <Link
                to="/markets/ai-analysis"
                className="flex items-center px-4 py-3 hover:bg-muted rounded-md transition-colors"
                onClick={toggleMenu}
              >
                <Zap className="mr-3 h-5 w-5 text-purple-500 opacity-70" />
                AI Analysis
              </Link>
              <Link
                to="/markets/ai-assistant"
                className="flex items-center px-4 py-3 hover:bg-muted rounded-md transition-colors"
                onClick={toggleMenu}
              >
                <MessageSquareText className="mr-3 h-5 w-5 opacity-70" />
                AI Assistant
              </Link>
            </div>

            <div className="pt-4 border-t border-border px-2">
              {user ? (
                <div className="space-y-2">
                  <div className="px-2 py-3 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-crypto-purple rounded-full flex items-center justify-center text-white font-bold">
                      {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <div className="font-medium">{user.displayName || "User"}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[180px]">{user.email}</div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full justify-start h-11" onClick={() => { handleLogout(); toggleMenu(); }}>
                    <LogOut className="mr-3 h-5 w-5" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/login" onClick={toggleMenu}>
                    <Button variant="outline" className="w-full">Log in</Button>
                  </Link>
                  <Link to="/signup" onClick={toggleMenu}>
                    <Button className="bg-crypto-purple text-white w-full">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
