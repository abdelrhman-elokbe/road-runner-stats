import { motion } from "framer-motion";
import type { CalculationResult } from "@/lib/distance";

interface StatCardsProps {
  result: CalculationResult;
}

const cards = [
  { key: "average", label: "Average Distance", unit: "km", color: "border-stat-amber", bg: "bg-stat-amber/10", text: "text-stat-amber", delay: 0 },
  { key: "median", label: "Median Distance", unit: "km", color: "border-stat-cyan", bg: "bg-stat-cyan/10", text: "text-stat-cyan", delay: 0.05 },
  { key: "max", label: "Max Distance", unit: "km", color: "border-stat-magenta", bg: "bg-stat-magenta/10", text: "text-stat-magenta", delay: 0.1 },
  { key: "pairsCalculated", label: "Pairs Calculated", unit: "", color: "border-stat-mint", bg: "bg-stat-mint/10", text: "text-stat-mint", delay: 0.15 },
] as const;

export default function StatCards({ result }: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => {
        const value =
          card.key === "pairsCalculated"
            ? result.pairsCalculated.toLocaleString()
            : result[card.key].toFixed(2);

        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: card.delay, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={`${card.bg} border-l-4 ${card.color} rounded-lg p-4`}
          >
            <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.text}`}>
              {value}
              {card.unit && (
                <span className="text-sm text-muted-foreground ml-1 font-normal">{card.unit}</span>
              )}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
