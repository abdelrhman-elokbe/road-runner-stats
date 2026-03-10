import { motion } from "framer-motion";
import type { CalculationResult } from "@/lib/distance";

interface StatCardsProps {
  result: CalculationResult;
}

const cards = [
  { key: "average", label: "Average Distance", unit: "km", emoji: "📍", gradient: "from-orange-400 to-amber-500", delay: 0 },
  { key: "median", label: "Median Distance", unit: "km", emoji: "📊", gradient: "from-blue-400 to-indigo-500", delay: 0.08 },
  { key: "max", label: "Max Distance", unit: "km", emoji: "🚀", gradient: "from-pink-400 to-rose-500", delay: 0.16 },
  { key: "pairsCalculated", label: "Pairs Calculated", unit: "", emoji: "✅", gradient: "from-emerald-400 to-green-500", delay: 0.24 },
] as const;

export default function StatCards({ result }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {cards.map((card) => {
        const value =
          card.key === "pairsCalculated"
            ? result.pairsCalculated.toLocaleString()
            : result[card.key].toFixed(2);

        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: card.delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-2xl bg-background border border-border p-5 group hover:shadow-lg transition-shadow"
          >
            {/* Gradient accent bar at top */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />
            
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-2">{card.label}</p>
                <p className="text-3xl font-extrabold text-foreground tracking-tight">
                  {value}
                  {card.unit && (
                    <span className="text-base text-muted-foreground ml-1.5 font-medium">{card.unit}</span>
                  )}
                </p>
              </div>
              <span className="text-2xl">{card.emoji}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
