export interface Disc {
  color: string;
  weight: number;
  quantity: number;
  side: "left" | "right" | "both";
}

export interface ScanResult {
  bar: {
    type: string;
    weight: number;
  };
  discs: Disc[];
  totalWeight: number;
  confidence: number;
  unit: "kg" | "lbs";
}

export interface Scan {
  id: string;
  user_id: string;
  image_url: string;
  result_json: ScanResult;
  total_weight: number;
  unit: "kg" | "lbs";
  manually_corrected: boolean;
  created_at: string;
}
