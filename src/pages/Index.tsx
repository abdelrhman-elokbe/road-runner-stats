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
    <div className="min-h-screen flex flex-col bg-secondary/30">
      {/* Header */}
      <header className="bg-background border-b border-border px-4 sm:px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-xl">
            🗺️
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground tracking-tight">Road Distance Calculator</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Upload coordinates · Get real road distances via OSRM</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full">
        {/* Left Panel */}
        <div className="lg:w-[42%] flex flex-col bg-background lg:border-r border-border">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-20 space-y-5">
            <div>
              <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
                Upload your file
              </p>
              <FileUpload
                onFileParsed={handleFileParsed}
                onError={(msg) => { setError(msg); setParseResult(null); }}
              />
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            {parseResult && (
              <div>
                <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
                  Preview
                </p>
                <DataPreview data={parseResult} />
              </div>
            )}

            <div className="rounded-xl bg-secondary p-4 text-xs text-muted-foreground space-y-1.5">
              <p className="font-semibold text-foreground/70 text-[11px] uppercase tracking-wider mb-2">Limitations</p>
              <p>⚡ OSRM public server — best-effort.</p>
              <p>📊 Batches &gt;75 pts: cross-batch uses Haversine ×1.35.</p>
              <p>📋 Log always discloses which method was used.</p>
            </div>
          </div>

          {/* Sticky Calculate */}
          <div className="sticky bottom-0 p-4 sm:p-6 bg-background border-t border-border">
            <button
              onClick={handleCalculate}
              disabled={!parseResult || isCalculating}
              className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${
                parseResult && !isCalculating
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-primary-foreground hover:shadow-lg hover:shadow-orange-500/20 active:scale-[0.98]"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {isCalculating ? "⏳ Calculating..." : "🚀 Calculate Distances"}
            </button>
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:w-[58%] p-4 sm:p-6 overflow-y-auto space-y-5">
          <div>
            <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
              Results
            </p>

            {calcResult ? (
              <StatCards result={calcResult} />
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-border bg-background p-10 text-center">
                <p className="text-3xl mb-2">📈</p>
                <p className="text-sm text-muted-foreground">Results will appear here after calculation</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">4</span>
              Activity Log
            </p>
            <ProgressLog progress={progress} logs={logs} isCalculating={isCalculating} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
