import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { PredictionBubbleField } from "@/components/PredictionBubbleField";
import { PredictionNodeData } from "@/components/PredictionNode";

const Landing = () => {
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState<PredictionNodeData[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch predictions for frosted bubbles
  useEffect(() => {
    const loadPredictions = async () => {
      try {
        const { API_BASE_URL } = await import('@/lib/apiConfig');
        const response = await fetch(`${API_BASE_URL}/api/predictions`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.predictions)) {
            // Limit to first 50 for performance
            setPredictions(data.predictions.slice(0, 50));
          }
        }
      } catch (error) {
        console.error('Failed to fetch predictions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadPredictions();
  }, []);

  const handleEnterApp = () => {
    // Store flag to trigger animations in Index page
    sessionStorage.setItem('fromLanding', 'true');
    navigate("/app");
  };

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      {/* Frosted Bubbles Background */}
      <div className="absolute inset-0">
        {!loading && predictions.length > 0 && (
          <PredictionBubbleField
            markets={predictions}
            frosted={true}
            isTransitioning={false}
            isResizing={false}
          />
        )}
      </div>

      {/* Enter App Button - Top Right Corner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="absolute top-6 right-6 z-50"
      >
        <Button
          onClick={handleEnterApp}
          className="flex items-center gap-2 px-6 py-2.5 bg-terminal-accent hover:bg-terminal-accent/90 text-background font-medium rounded-lg transition-colors shadow-lg"
        >
          Enter App
          <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>

      {/* Main Content - Probly Text */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="absolute inset-0 flex items-center justify-center z-40"
      >
        <h1 className="text-8xl md:text-9xl font-bold text-foreground tracking-tight">
          Probly
        </h1>
      </motion.div>
    </div>
  );
};

export default Landing;
