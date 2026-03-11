export interface Coordinate {
  lat: number;
  lng: number;
}

export interface CalculationResult {
  average: number;
  median: number;
  max: number;
  pairsCalculated: number;
  distances: number[];
}

export type LogEntry = {
  timestamp: Date;
  message: string;
};

const OSRM_PRIMARY = "https://router.project-osrm.org/table/v1/driving";
const OSRM_FALLBACK = "https://routing.openstreetmap.de/routed-car/table/v1/driving";
const BATCH_SIZE = 75;

function haversine(a: Coordinate, b: Coordinate): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * 1.35;
}

function computeStats(distances: number[]): CalculationResult {
  const sorted = [...distances].sort((a, b) => a - b);
  const sum = sorted.reduce((s, d) => s + d, 0);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

  return {
    average: sum / sorted.length,
    median,
    max: sorted[sorted.length - 1],
    pairsCalculated: sorted.length,
    distances: sorted,
  };
}

async function fetchOSRM(
  coords: Coordinate[],
  log: (msg: string) => void
): Promise<number[][] | null> {
  const coordStr = coords.map((c) => `${c.lng},${c.lat}`).join(";");

  for (const baseUrl of [OSRM_PRIMARY, OSRM_FALLBACK]) {
    try {
      const url = `${baseUrl}/${coordStr}?annotations=distance`;
      log(`Requesting OSRM: ${baseUrl === OSRM_PRIMARY ? "primary" : "fallback"} endpoint (${coords.length} points)`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.code !== "Ok") throw new Error(`OSRM error: ${data.code}`);
      log(`OSRM ${baseUrl === OSRM_PRIMARY ? "primary" : "fallback"}: success`);
      return data.distances;
    } catch (e: any) {
      log(`OSRM ${baseUrl === OSRM_PRIMARY ? "primary" : "fallback"} failed: ${e.message}`);
    }
  }
  return null;
}

async function fetchOSRMCrossBatch(
  sourcePts: Coordinate[],
  destPts: Coordinate[],
  log: (msg: string) => void
): Promise<number[][] | null> {
  const allCoords = [...sourcePts, ...destPts];
  const coordStr = allCoords.map((c) => `${c.lng},${c.lat}`).join(";");
  const sourceIndices = sourcePts.map((_, i) => i).join(";");
  const destIndices = destPts.map((_, i) => i + sourcePts.length).join(";");

  for (const baseUrl of [OSRM_PRIMARY, OSRM_FALLBACK]) {
    try {
      const url = `${baseUrl}/${coordStr}?annotations=distance&sources=${sourceIndices}&destinations=${destIndices}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.code !== "Ok") throw new Error(`OSRM error: ${data.code}`);
      return data.distances; // [sourcePts.length][destPts.length]
    } catch (e: any) {
      log(`OSRM cross-batch failed (${baseUrl === OSRM_PRIMARY ? "primary" : "fallback"}): ${e.message}`);
    }
  }
  return null;
}

export async function calculateDistances(
  points: Coordinate[],
  onProgress: (pct: number) => void,
  onLog: (msg: string) => void
): Promise<CalculationResult> {
  const n = points.length;
  const totalPairs = (n * (n - 1)) / 2;
  onLog(`Starting calculation: ${n} points, ${totalPairs} unique pairs`);

  const allDistances: number[] = [];

  if (n <= BATCH_SIZE) {
    // Single batch — try OSRM
    const matrix = await fetchOSRM(points, onLog);
    if (matrix) {
      onLog("Using OSRM road distances for all pairs");
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          allDistances.push(matrix[i][j] / 1000); // meters to km
        }
      }
    } else {
      onLog("OSRM unavailable — using Haversine x1.35 for all pairs");
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          allDistances.push(haversine(points[i], points[j]));
        }
        onProgress(((i + 1) / n) * 100);
      }
    }
    onProgress(100);
  } else {
    // Multiple batches
    const batches: Coordinate[][] = [];
    for (let i = 0; i < n; i += BATCH_SIZE) {
      batches.push(points.slice(i, i + BATCH_SIZE));
    }
    onLog(`Split into ${batches.length} batches of up to ${BATCH_SIZE} points`);

    const batchMatrices: (number[][] | null)[] = [];
    for (let b = 0; b < batches.length; b++) {
      onLog(`Processing batch ${b + 1}/${batches.length} (${batches[b].length} points)`);
      const matrix = await fetchOSRM(batches[b], onLog);
      batchMatrices.push(matrix);
      onProgress(((b + 1) / batches.length) * 50);
    }

    // Intra-batch distances
    let processed = 0;
    for (let b = 0; b < batches.length; b++) {
      const batch = batches[b];
      const matrix = batchMatrices[b];
      for (let i = 0; i < batch.length; i++) {
        for (let j = i + 1; j < batch.length; j++) {
          if (matrix) {
            allDistances.push(matrix[i][j] / 1000);
          } else {
            allDistances.push(haversine(batch[i], batch[j]));
          }
          processed++;
        }
      }
      onLog(
        `Batch ${b + 1} intra-distances: ${matrix ? "OSRM" : "Haversine x1.35"}`
      );
    }

    // Cross-batch distances (OSRM with sources/destinations)
    const crossBatchTotal = batches.length * (batches.length - 1) / 2;
    let crossDone = 0;
    for (let b1 = 0; b1 < batches.length; b1++) {
      for (let b2 = b1 + 1; b2 < batches.length; b2++) {
        const src = batches[b1];
        const dst = batches[b2];

        // Split into sub-requests if combined size > BATCH_SIZE
        const maxSrc = Math.min(src.length, Math.floor(BATCH_SIZE / 2));
        const maxDst = BATCH_SIZE - maxSrc;

        let usedOSRM = true;
        for (let si = 0; si < src.length; si += maxSrc) {
          const srcChunk = src.slice(si, si + maxSrc);
          for (let di = 0; di < dst.length; di += maxDst) {
            const dstChunk = dst.slice(di, di + maxDst);
            const matrix = await fetchOSRMCrossBatch(srcChunk, dstChunk, onLog);
            if (matrix) {
              for (let i = 0; i < srcChunk.length; i++) {
                for (let j = 0; j < dstChunk.length; j++) {
                  allDistances.push(matrix[i][j] / 1000);
                  processed++;
                }
              }
            } else {
              usedOSRM = false;
              for (const p1 of srcChunk) {
                for (const p2 of dstChunk) {
                  allDistances.push(haversine(p1, p2));
                  processed++;
                }
              }
            }
          }
        }
        crossDone++;
        onLog(`Cross-batch ${b1 + 1}×${b2 + 1}: ${usedOSRM ? "OSRM" : "Haversine x1.35 fallback"}`);
        onProgress(50 + (crossDone / crossBatchTotal) * 50);
      }
    onProgress(100);
  }

  const result = computeStats(allDistances);
  onLog(`Calculation complete: avg=${result.average.toFixed(2)}km, median=${result.median.toFixed(2)}km, max=${result.max.toFixed(2)}km, pairs=${result.pairsCalculated}`);
  return result;
}
