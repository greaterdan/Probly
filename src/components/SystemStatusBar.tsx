import { useState, useEffect } from "react";
import { LoginButton } from "./LoginButton";
import { CustodialWallet } from "./CustodialWallet";
import { getOrCreateWallet, getCustodialWallet, storeCustodialWallet } from "@/lib/wallet";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Bot, BarChart3, Users, Newspaper, Github, FileText, Mail, Copy, Check, Filter, Search, ChevronDown, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SystemStatusBarProps {
  onToggleWaitlist?: () => void;
  onTogglePerformance?: () => void;
  onToggleSummary?: () => void;
  onToggleNewsFeed?: () => void;
  isPerformanceOpen?: boolean;
  isSummaryOpen?: boolean;
  showNewsFeed?: boolean;
  showWaitlist?: boolean;
  selectedCategory?: string;
  setSelectedCategory?: (category: string) => void;
  filters?: {
    minVolume: string;
    maxVolume: string;
    minLiquidity: string;
    maxLiquidity: string;
    minPrice: string;
    maxPrice: string;
    minProbability: string;
    maxProbability: string;
    sortBy: 'volume' | 'liquidity' | 'price' | 'probability' | 'none';
    sortOrder: 'asc' | 'desc';
  };
  setFilters?: (filters: any) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  marketCategories?: string[];
  loadingMarkets?: boolean;
}

export const SystemStatusBar = ({ 
  onToggleWaitlist, 
  onTogglePerformance,
  showWaitlist, 
  onToggleSummary,
  onToggleNewsFeed,
  isPerformanceOpen = true,
  isSummaryOpen = true,
  showNewsFeed = false,
  selectedCategory = 'All Markets',
  setSelectedCategory,
  filters,
  setFilters,
  searchQuery = '',
  setSearchQuery,
  marketCategories = [],
  loadingMarkets = false,
}: SystemStatusBarProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [walletAddress, setWalletAddress] = useState<string | undefined>();
  const [custodialWallet, setCustodialWallet] = useState<{ publicKey: string; privateKey: string } | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  const devEmail = "dev@probly.tech";

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(devEmail);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy email:", err);
    }
  };

  useEffect(() => {
    // Check if user is already logged in (from localStorage or session)
    const storedEmail = localStorage.getItem('userEmail');
    const storedWallet = localStorage.getItem('walletAddress');
    
    if (storedEmail || storedWallet) {
      setIsLoggedIn(true);
      if (storedEmail) setUserEmail(storedEmail);
      if (storedWallet) setWalletAddress(storedWallet);
      
      // First, try to get existing custodial wallet from storage
      let wallet = getCustodialWallet();
      
      // If no custodial wallet exists, generate or retrieve one based on userId
      if (!wallet) {
      const userId = storedEmail || storedWallet || 'default';
        wallet = getOrCreateWallet(userId);
        // Store it as the main custodial wallet
        storeCustodialWallet(wallet);
      }
      
      setCustodialWallet({
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey,
      });
    } else {
      // Check if there's a stored custodial wallet even without login
      // (for backwards compatibility)
      const storedCustodialWallet = getCustodialWallet();
      if (storedCustodialWallet) {
        setCustodialWallet({
          publicKey: storedCustodialWallet.publicKey,
          privateKey: storedCustodialWallet.privateKey,
        });
      }
    }
  }, []);

  const handleLogin = (method: 'phantom' | 'gmail', data?: { address?: string; email?: string }) => {
    setIsLoggedIn(true);
    const userId = method === 'phantom' ? data?.address : data?.email || 'default';
    
    if (method === 'phantom' && data?.address) {
      setWalletAddress(data.address);
      localStorage.setItem('walletAddress', data.address);
    } else if (method === 'gmail' && data?.email) {
      setUserEmail(data.email);
      localStorage.setItem('userEmail', data.email);
    }
    
    // First, try to get existing custodial wallet from storage
    let wallet = getCustodialWallet();
    
    // If no custodial wallet exists, generate or retrieve one based on userId
    if (!wallet) {
      wallet = getOrCreateWallet(userId || 'default');
    }
    
    // Always store the custodial wallet for persistence
    storeCustodialWallet(wallet);
    
    setCustodialWallet({
      publicKey: wallet.publicKey,
      privateKey: wallet.privateKey,
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail(undefined);
    setWalletAddress(undefined);
    // Keep custodial wallet in storage even after logout
    // so user can still see their wallet balance if they return
    // Only clear if they explicitly want to clear everything
    setCustodialWallet(null);
    localStorage.removeItem('userEmail');
    localStorage.removeItem('walletAddress');
    // Note: We keep custodialWallet in localStorage for persistence
    // To fully clear, call clearCustodialWallet()
  };

  return (
    <div className="h-11 bg-bg-elevated border-b border-border flex items-center gap-2 px-4 py-2 relative" style={{ zIndex: 1000 }}>
      {/* Left side - empty */}
      <div className="flex items-center gap-2"></div>

      {/* Center - Dashboard Controls - Absolutely centered */}
      <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
        {/* Category Dropdown */}
        {setSelectedCategory && marketCategories.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors border border-border bg-background rounded-full h-7">
              {selectedCategory}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48 bg-background border-border z-50 rounded-xl">
              {marketCategories.map((category) => (
                <DropdownMenuItem
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`cursor-pointer ${selectedCategory === category ? 'bg-muted text-primary font-medium' : ''}`}
                >
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {/* Filter Button */}
        {setFilters && filters && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center gap-1.5 px-2.5 py-1 h-7 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Filter className="h-3.5 w-3.5" />
                <span>Filters</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="center" 
              className="w-[320px] max-h-[85vh] overflow-y-auto p-2"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <div className="space-y-2">
                {/* Volume Filters */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Volume</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <Input
                        type="number"
                        placeholder="Min $"
                        value={filters.minVolume}
                        onChange={(e) => setFilters({...filters, minVolume: e.target.value})}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Max $"
                        value={filters.maxVolume}
                        onChange={(e) => setFilters({...filters, maxVolume: e.target.value})}
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Liquidity Filters */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Liquidity</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <Input
                        type="number"
                        placeholder="Min $"
                        value={filters.minLiquidity}
                        onChange={(e) => setFilters({...filters, minLiquidity: e.target.value})}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Max $"
                        value={filters.maxLiquidity}
                        onChange={(e) => setFilters({...filters, maxLiquidity: e.target.value})}
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Price Filters */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Price</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        placeholder="Min 0.00"
                        value={filters.minPrice}
                        onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        placeholder="Max 1.00"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Probability Filters */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Probability</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        placeholder="Min %"
                        value={filters.minProbability}
                        onChange={(e) => setFilters({...filters, minProbability: e.target.value})}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        placeholder="Max %"
                        value={filters.maxProbability}
                        onChange={(e) => setFilters({...filters, maxProbability: e.target.value})}
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Sort Options */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Sort</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Select
                      value={filters.sortBy}
                      onValueChange={(value: any) => setFilters({...filters, sortBy: value})}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="volume">Volume</SelectItem>
                        <SelectItem value="liquidity">Liquidity</SelectItem>
                        <SelectItem value="price">Price</SelectItem>
                        <SelectItem value="probability">Probability</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={filters.sortOrder}
                      onValueChange={(value: any) => setFilters({...filters, sortOrder: value})}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Order" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Desc</SelectItem>
                        <SelectItem value="asc">Asc</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Action Button */}
                <div className="pt-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilters({
                        minVolume: '',
                        maxVolume: '',
                        minLiquidity: '',
                        maxLiquidity: '',
                        minPrice: '',
                        maxPrice: '',
                        minProbability: '',
                        maxProbability: '',
                        sortBy: 'none',
                        sortOrder: 'desc',
                      });
                    }}
                    className="w-full h-7 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {/* Search Bar */}
        {setSearchQuery && (
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 pl-9 pr-3 text-xs bg-background border-border focus:border-terminal-accent transition-colors rounded-full"
            />
          </div>
        )}
        
        {loadingMarkets && (
          <span className="text-[10px] text-muted-foreground font-mono">(Loading...)</span>
        )}
      </div>

      {/* Right side - Performance, Summary, News Feed, Build Agent, Wallet, Login */}
      <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onTogglePerformance}
            className={`h-7 w-7 p-0 border-border rounded-full transition-colors ${
              isPerformanceOpen 
                ? 'bg-terminal-accent/20 border-terminal-accent/50 text-terminal-accent hover:bg-terminal-accent/30' 
                : 'bg-background hover:bg-bg-elevated text-foreground hover:text-foreground'
            }`}
            title="Performance Index"
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleSummary}
            className={`h-7 w-7 p-0 border-border rounded-full transition-colors ${
            isSummaryOpen && !showNewsFeed && !showWaitlist
                ? 'bg-terminal-accent/20 border-terminal-accent/50 text-terminal-accent hover:bg-terminal-accent/30' 
                : 'bg-background hover:bg-bg-elevated text-foreground hover:text-foreground'
            }`}
            title="Summary"
          >
            <Users className="w-3.5 h-3.5" />
          </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleNewsFeed}
          className={`h-7 w-7 p-0 border-border rounded-full transition-colors ${
            showNewsFeed && isSummaryOpen
              ? 'bg-terminal-accent/20 border-terminal-accent/50 text-terminal-accent hover:bg-terminal-accent/30' 
              : 'bg-background hover:bg-bg-elevated text-foreground hover:text-foreground'
          }`}
          title="News Feed"
        >
          <Newspaper className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleWaitlist}
          className={`h-7 w-7 p-0 border-border rounded-full transition-colors ${
            showWaitlist && isSummaryOpen && !showNewsFeed
              ? 'border-terminal-accent bg-terminal-accent/20 text-terminal-accent hover:bg-terminal-accent/30'
              : 'bg-background hover:bg-bg-elevated text-foreground hover:text-foreground'
          }`}
          title="Join Waitlist"
        >
          <Bot className="w-3.5 h-3.5" />
        </Button>
        {custodialWallet && (
          <CustodialWallet
            walletAddress={custodialWallet.publicKey}
            privateKey={custodialWallet.privateKey}
          />
        )}
      <LoginButton
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLoggedIn={isLoggedIn}
        userEmail={userEmail}
        walletAddress={walletAddress}
      />
      </div>
    </div>
  );
};
