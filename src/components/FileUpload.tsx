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
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`border border-dashed p-8 text-center cursor-pointer transition-colors ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/30 hover:border-primary/50"
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
      <p className="text-muted-foreground text-sm">
        Drag file here or click to browse
      </p>
      <p className="text-muted-foreground/50 text-xs mt-2">
        CSV or Excel (.xlsx) with lat/lng columns
      </p>
    </div>
  );
}
