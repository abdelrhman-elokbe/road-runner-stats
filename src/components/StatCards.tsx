import { motion } from "framer-motion";
import type { CalculationResult } from "@/lib/distance";

interface StatCardsProps {
  result: CalculationResult;
}

const cards = [
  { key: "average", label: "Average Distance", unit: "km", colorClass: "bg-stat-amber", delay: 0 },
  { key: "median", label: "Median Distance", unit: "km", colorClass: "bg-stat-cyan", delay: 0.05 },
  { key: "max", label: "Max Distance", unit: "km", colorClass: "bg-stat-magenta", delay: 0.1 },
  { key: "pairsCalculated", label: "Pairs Calculated", unit: "", colorClass: "bg-stat-mint", delay: 0.15 },
] as const;

export default function StatCards({ result }: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-px bg-border">
      {cards.map((card) => {
        const value =
          card.key === "pairsCalculated"
            ? result.pairsCalculated.toLocaleString()
            : result[card.key].toFixed(2);

        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: card.delay,
              duration: 0.05,
              ease: "linear",
            }}
            className="bg-card relative overflow-hidden"
          >
            <div className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
              <p className="font-slab text-2xl font-bold text-foreground">
                {value}
                {card.unit && (
                  <span className="text-sm text-muted-foreground ml-1">{card.unit}</span>
                )}
              </p>
            </div>
            <motion.div
              className={`h-[2px] ${card.colorClass} absolute bottom-0 left-0`}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{
                delay: card.delay + 0.05,
                duration: 0.2,
                ease: "linear",
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
