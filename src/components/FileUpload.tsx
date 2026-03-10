import { useCallback, useRef, useState } from "react";
import type { ParseResult } from "@/lib/fileParser";
import { parseFileData } from "@/lib/fileParser";

interface FileUploadProps {
  onFileParsed: (result: ParseResult) => void;
  onError: (msg: string) => void;
}

export default function FileUpload({ onFileParsed, onError }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = parseFileData(e.target!.result as ArrayBuffer, file.name);
          onFileParsed(result);
        } catch (err: any) {
          onError(err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [onFileParsed, onError]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all ${
        isDragging
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-border hover:border-primary/40 hover:bg-secondary/50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <div className="text-3xl mb-3">📂</div>
      <p className="text-foreground font-medium text-sm">
        Drag & drop your file here
      </p>
      <p className="text-muted-foreground text-xs mt-1">
        or click to browse — CSV or Excel (.xlsx)
      </p>
    </div>
  );
}
