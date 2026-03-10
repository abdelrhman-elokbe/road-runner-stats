import { useState, useCallback } from "react";
import FileUpload from "@/components/FileUpload";
import DataPreview from "@/components/DataPreview";
import StatCards from "@/components/StatCards";
import ProgressLog from "@/components/ProgressLog";
import { calculateDistances } from "@/lib/distance";
import type { CalculationResult, LogEntry } from "@/lib/distance";
import type { ParseResult } from "@/lib/fileParser";

const Index = () => {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [calcResult, setCalcResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addLog = useCallback((message: string) => {
    setLogs((prev) => [...prev, { timestamp: new Date(), message }]);
  }, []);

  const handleFileParsed = useCallback((result: ParseResult) => {
    setParseResult(result);
    setCalcResult(null);
    setError(null);
    setLogs([]);
    setProgress(0);
  }, []);

  const handleCalculate = useCallback(async () => {
    if (!parseResult) return;
    setIsCalculating(true);
    setCalcResult(null);
    setLogs([]);
    setProgress(0);

    try {
      const result = await calculateDistances(
        parseResult.coordinates,
        setProgress,
        addLog
      );
      setCalcResult(result);
    } catch (e: any) {
      addLog(`Error: ${e.message}`);
    } finally {
      setIsCalculating(false);
    }
  }, [parseResult, addLog]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <h1 className="font-slab text-lg font-bold text-foreground tracking-wide">
          Road Distance Calculator
        </h1>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Panel — Input Hopper */}
        <div className="lg:w-[40%] border-r border-border flex flex-col relative">
          <div className="flex-1 overflow-y-auto p-6 pb-20">
            <div className="mb-6">
              <p className="text-xs text-muted-foreground mb-3 uppercase tracking-widest">
                Input
              </p>
              <FileUpload
                onFileParsed={handleFileParsed}
                onError={(msg) => {
                  setError(msg);
                  setParseResult(null);
                }}
              />
            </div>

            {error && (
              <div className="border border-destructive p-3 text-xs text-destructive mb-4">
                {error}
              </div>
            )}

            {parseResult && <DataPreview data={parseResult} />}

            {/* Limitations */}
            <div className="mt-6 text-xs text-muted-foreground/60 space-y-1">
              <p>OSRM public server: best-effort, not for production use.</p>
              <p>Batches &gt;75 points: cross-batch pairs use Haversine x1.35.</p>
              <p>Log discloses calculation method for all pairs.</p>
            </div>
          </div>

          {/* Sticky Calculate Button */}
          <div className="sticky bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
            <button
              onClick={handleCalculate}
              disabled={!parseResult || isCalculating}
              className={`w-full py-3 text-sm font-mono font-semibold uppercase tracking-widest transition-colors ${
                parseResult && !isCalculating
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {isCalculating ? "Calculating..." : "Calculate"}
            </button>
          </div>
        </div>

        {/* Right Panel — Processing & Output Bay */}
        <div className="lg:w-[60%] flex flex-col overflow-y-auto p-6">
          <p className="text-xs text-muted-foreground mb-3 uppercase tracking-widest">
            Output
          </p>

          {calcResult && (
            <div className="mb-6">
              <StatCards result={calcResult} />
            </div>
          )}

          <div>
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">
              Log
            </p>
            <ProgressLog
              progress={progress}
              logs={logs}
              isCalculating={isCalculating}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
