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
      const result = await calculateDistances(parseResult.coordinates, setProgress, addLog);
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
      <header className="border-b border-border px-4 sm:px-6 py-4 bg-background">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🗺️</span>
          <div>
            <h1 className="text-lg font-bold text-foreground">Road Distance Calculator</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Upload coordinates, get real road distances via OSRM</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Panel */}
        <div className="lg:w-[40%] lg:border-r border-border flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-20">
            <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Upload</p>
            <FileUpload
              onFileParsed={handleFileParsed}
              onError={(msg) => { setError(msg); setParseResult(null); }}
            />

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive mt-4">
                {error}
              </div>
            )}

            {parseResult && (
              <div className="mt-4">
                <DataPreview data={parseResult} />
              </div>
            )}

            <div className="mt-6 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground space-y-1">
              <p>⚡ OSRM public server — best-effort, not for production.</p>
              <p>📊 Batches &gt;75 pts: cross-batch uses Haversine ×1.35.</p>
              <p>📋 Log always discloses which method was used.</p>
            </div>
          </div>

          {/* Sticky Calculate */}
          <div className="sticky bottom-0 p-4 bg-background border-t border-border">
            <button
              onClick={handleCalculate}
              disabled={!parseResult || isCalculating}
              className={`w-full py-3 rounded-lg text-sm font-semibold transition-all ${
                parseResult && !isCalculating
                  ? "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] shadow-sm"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {isCalculating ? "Calculating..." : "Calculate Distances"}
            </button>
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:w-[60%] p-4 sm:p-6 overflow-y-auto">
          <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Results</p>

          {calcResult && (
            <div className="mb-6">
              <StatCards result={calcResult} />
            </div>
          )}

          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Log</p>
          <ProgressLog progress={progress} logs={logs} isCalculating={isCalculating} />
        </div>
      </div>
    </div>
  );
};

export default Index;
