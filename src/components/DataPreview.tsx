import type { ParseResult } from "@/lib/fileParser";

interface DataPreviewProps {
  data: ParseResult;
}

export default function DataPreview({ data }: DataPreviewProps) {
  const totalPairs = (data.coordinates.length * (data.coordinates.length - 1)) / 2;

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-2.5 bg-secondary/50 flex justify-between text-xs text-muted-foreground font-medium">
        <span>✅ {data.coordinates.length} valid points from {data.totalRows} rows</span>
        <span>{totalPairs.toLocaleString()} pairs</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              {data.headers.map((h, i) => (
                <th key={i} className="p-2.5 text-left text-muted-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.preview.map((row, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-secondary/20">
                {row.map((cell, j) => (
                  <td key={j} className="p-2.5 text-foreground">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.totalRows > 6 && (
        <div className="p-2 text-xs text-muted-foreground text-center bg-secondary/20">
          + {data.totalRows - 6} more rows
        </div>
      )}
    </div>
  );
}
