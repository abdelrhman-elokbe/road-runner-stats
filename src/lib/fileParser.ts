import * as XLSX from "xlsx";
import type { Coordinate } from "./distance";

const LAT_NAMES = ["lat", "latitude", "order_address_latitude"];
const LNG_NAMES = ["lng", "lon", "longitude", "order_address_longitude"];

function findColumn(headers: string[], candidates: string[]): number {
  const lower = headers.map((h) => h.trim().toLowerCase());
  for (const c of candidates) {
    const idx = lower.indexOf(c);
    if (idx !== -1) return idx;
  }
  return -1;
}

export interface ParseResult {
  coordinates: Coordinate[];
  headers: string[];
  preview: string[][]; // first 6 rows
  totalRows: number;
}

export function parseFileData(data: ArrayBuffer, fileName: string): ParseResult {
  const isCSV = fileName.toLowerCase().endsWith(".csv");
  
  let wb: XLSX.WorkBook;
  if (isCSV) {
    const text = new TextDecoder().decode(data);
    wb = XLSX.read(text, { type: "string" });
  } else {
    wb = XLSX.read(data, { type: "array" });
  }

  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];

  if (rows.length < 2) throw new Error("File must have a header row and at least one data row");

  const headers = rows[0].map(String);
  const latIdx = findColumn(headers, LAT_NAMES);
  const lngIdx = findColumn(headers, LNG_NAMES);

  if (latIdx === -1 || lngIdx === -1) {
    throw new Error(
      `Could not find lat/lng columns. Expected one of: ${LAT_NAMES.join(", ")} and ${LNG_NAMES.join(", ")}`
    );
  }

  const coordinates: Coordinate[] = [];
  for (let i = 1; i < rows.length; i++) {
    const lat = parseFloat(String(rows[i][latIdx]));
    const lng = parseFloat(String(rows[i][lngIdx]));
    if (!isNaN(lat) && !isNaN(lng)) {
      coordinates.push({ lat, lng });
    }
  }

  if (coordinates.length < 2) throw new Error("Need at least 2 valid coordinate points");

  const preview = rows.slice(1, 7).map((r) => r.map(String));

  return { coordinates, headers, preview, totalRows: rows.length - 1 };
}
