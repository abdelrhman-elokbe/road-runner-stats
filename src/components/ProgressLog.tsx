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
    <div className="border border-border">
      {/* Progress bar */}
      {isCalculating && (
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%`, transitionDuration: "100ms" }}
          />
        </div>
      )}

      {/* Log */}
      <div className="h-48 overflow-y-auto p-3 text-xs">
        {logs.length === 0 ? (
          <p className="text-muted-foreground">Waiting for calculation...</p>
        ) : (
          logs.map((entry, i) => (
            <div key={i} className="flex gap-3 mb-1">
              <span className="text-muted-foreground shrink-0">
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
