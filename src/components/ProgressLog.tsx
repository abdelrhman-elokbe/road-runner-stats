import { useEffect, useRef } from "react";

interface ProgressLogProps {
  progress: number;
  logs: { timestamp: Date; message: string }[];
  isCalculating: boolean;
}

export default function ProgressLog({ progress, logs, isCalculating }: ProgressLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "instant" as ScrollBehavior });
  }, [logs]);

  return (
    <div className="rounded-2xl border border-border bg-background overflow-hidden">
      {isCalculating && (
        <div className="h-1.5 bg-muted">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full transition-all"
            style={{ width: `${progress}%`, transitionDuration: "150ms" }}
          />
        </div>
      )}
      <div className="h-48 overflow-y-auto p-4 text-xs font-mono">
        {logs.length === 0 ? (
          <p className="text-muted-foreground">Waiting for calculation...</p>
        ) : (
          logs.map((entry, i) => (
            <div key={i} className="flex gap-3 mb-1.5">
              <span className="text-muted-foreground/50 shrink-0">
                {entry.timestamp.toLocaleTimeString("en-US", { hour12: false })}
              </span>
              <span className="text-foreground">{entry.message}</span>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
