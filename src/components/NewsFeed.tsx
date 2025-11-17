import { motion } from "framer-motion";
import { Newspaper, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  category: string;
  url?: string;
  imageUrl?: string;
  description?: string;
  publishedAt?: string;
}

interface NewsAPIArticle {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsAPIArticle[];
}

// Format relative time
const formatTime = (publishedAt: string): string => {
  const published = new Date(publishedAt);
  const now = new Date();
  const diffMs = now.getTime() - published.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return published.toLocaleDateString();
};

export const NewsFeed = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedSource, setSelectedSource] = useState<'all' | 'newsapi' | 'newsdata' | 'gnews'>('all');

  // Fetch news from server proxy (which caches and respects rate limits)
  const fetchNews = async (source: 'all' | 'newsapi' | 'newsdata' | 'gnews' = selectedSource) => {
    try {
      setLoading(true);
      
      console.log(`📰 Fetching news from server (source: ${source})...`);
      
      // Use server proxy to avoid CORS and respect rate limits
      const response = await fetch(`http://localhost:3002/api/news?source=${source}`);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data: NewsAPIResponse = await response.json();
      
      if (data.status === 'ok' && data.articles) {
        // Transform articles to NewsItem format
        const transformedArticles: NewsItem[] = data.articles
          .filter(article => article.title && article.title !== '[Removed]') // Filter out removed articles
          .slice(0, 50) // Limit to 50 most recent articles
          .map((article, index) => {
            // Determine category from title/description
            const content = `${article.title} ${article.description || ''}`.toLowerCase();
            let category = 'News';
            
            if (content.includes('election') || content.includes('politic') || content.includes('president')) {
              category = 'Politics';
            } else if (content.includes('crypto') || content.includes('bitcoin') || content.includes('ethereum')) {
              category = 'Crypto';
            } else if (content.includes('stock') || content.includes('market') || content.includes('dow') || content.includes('s&p')) {
              category = 'Markets';
            } else if (content.includes('economy') || content.includes('fed') || content.includes('inflation')) {
              category = 'Economics';
            } else if (content.includes('ai') || content.includes('technology') || content.includes('tech')) {
              category = 'Technology';
            } else if (content.includes('sport') || content.includes('game')) {
              category = 'Sports';
            } else if (content.includes('climate') || content.includes('weather')) {
              category = 'Climate';
            }
            
            return {
              id: article.url || `news-${index}`,
              title: article.title,
              source: article.source?.name || 'Unknown',
              time: formatTime(article.publishedAt),
              category,
              url: article.url,
              imageUrl: article.urlToImage || undefined,
              description: article.description || undefined,
              publishedAt: article.publishedAt,
            };
          });

        // Sort by published date (newest first)
        transformedArticles.sort((a, b) => {
          const timeA = new Date(a.publishedAt || 0).getTime();
          const timeB = new Date(b.publishedAt || 0).getTime();
          return timeB - timeA;
        });

        setNews(transformedArticles);
        setLastUpdate(new Date());
        console.log(`✅ Loaded ${transformedArticles.length} news articles from ${source}`);
      } else {
        console.error('❌ News API returned error:', data);
      }
    } catch (error) {
      console.error('❌ Error fetching news:', error);
      // Keep existing news on error
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and refetch when source changes
  useEffect(() => {
    fetchNews(selectedSource);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSource]);

  // Update every 1 minute - server handles caching (5 min cache) so we can poll frequently
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNews(selectedSource);
    }, 60 * 1000); // 1 minute (server caches for 5 minutes)

    return () => clearInterval(interval);
  }, [selectedSource]);
  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-bg-elevated flex-shrink-0">
        <div className="h-10 px-4 flex items-center justify-between">
          <span className="text-xs text-terminal-accent font-mono leading-none flex items-center gap-2">
            <Newspaper className="w-3 h-3" />
            &gt; NEWS FEED
          </span>
          <div className="flex items-center gap-2">
            <motion.div
              className="w-2 h-2 rounded-full bg-trade-yes"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [1, 0.7, 1],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-[10px] text-muted-foreground font-mono">LIVE</span>
          </div>
        </div>
        {/* Source Selector Tabs */}
        <div className="px-4 pb-2">
          <Tabs value={selectedSource} onValueChange={(value) => setSelectedSource(value as 'all' | 'newsapi' | 'newsdata' | 'gnews')}>
            <TabsList className="h-7 bg-muted/50">
              <TabsTrigger 
                value="all" 
                className="text-[10px] px-2 py-1 h-6 data-[state=active]:bg-terminal-accent/20 data-[state=active]:text-terminal-accent"
              >
                All Sources
              </TabsTrigger>
              <TabsTrigger 
                value="newsapi" 
                className="text-[10px] px-2 py-1 h-6 data-[state=active]:bg-terminal-accent/20 data-[state=active]:text-terminal-accent"
              >
                NewsAPI
              </TabsTrigger>
              <TabsTrigger 
                value="newsdata" 
                className="text-[10px] px-2 py-1 h-6 data-[state=active]:bg-terminal-accent/20 data-[state=active]:text-terminal-accent"
              >
                NewsData.io
              </TabsTrigger>
              <TabsTrigger 
                value="gnews" 
                className="text-[10px] px-2 py-1 h-6 data-[state=active]:bg-terminal-accent/20 data-[state=active]:text-terminal-accent"
              >
                GNews
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* News Feed */}
      <div className="flex-1 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {loading && news.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-terminal-accent border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <span className="text-xs text-muted-foreground font-mono">Loading news...</span>
            </div>
          </div>
        ) : news.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-xs text-muted-foreground font-mono">No news available</span>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {news.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-bg-elevated border border-border rounded-lg p-3 hover:border-terminal-accent/50 transition-colors cursor-pointer group"
                onClick={() => {
                  if (item.url) {
                    window.open(item.url, '_blank', 'noopener,noreferrer');
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Image */}
                  {item.imageUrl && (
                    <div className="flex-shrink-0 w-20 h-20 rounded overflow-visible border border-border group/image relative z-10">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover rounded transition-all duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      {/* Large preview on hover */}
                      <div className="absolute top-0 left-full ml-3 w-80 h-56 rounded-lg overflow-hidden border-2 border-terminal-accent shadow-2xl bg-background opacity-0 invisible group-hover/image:opacity-100 group-hover/image:visible transition-all duration-300 z-50 pointer-events-none">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] text-terminal-accent font-mono uppercase tracking-wider px-2 py-0.5 bg-terminal-accent/10 rounded">
                        {item.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {item.time}
                      </span>
                    </div>
                    <h3 className="text-xs font-medium text-foreground leading-snug group-hover:text-terminal-accent transition-colors mb-1">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2 mb-1.5">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-muted-foreground font-mono">
                        {item.source}
                      </span>
                      {item.url && (
                        <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

