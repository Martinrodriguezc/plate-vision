import { supabase } from "./supabase";
import { imageToBase64, compressImage } from "../utils/image";
import { ScanResult } from "../types/scan";
import { Config } from "../constants/Config";
import Constants from "expo-constants";

interface AnalyzeResponse extends ScanResult {
  notes?: string;
}

interface AnalyzeError {
  error: string;
  message: string;
}

export type AnalyzeResult =
  | { success: true; data: AnalyzeResponse }
  | { success: false; error: string };

export async function analyzePlate(
  imageUri: string,
  unit: "kg" | "lbs" = "kg"
): Promise<AnalyzeResult> {
  try {
    const compressedUri = await compressImage(imageUri);
    const base64 = await imageToBase64(compressedUri);

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      return { success: false, error: "No hay sesión activa" };
    }

    const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      Config.API_TIMEOUT_MS
    );

    const response = await fetch(
      `${supabaseUrl}/functions/v1/analyze-plate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({ image_base64: base64, unit }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        success: false,
        error: `Error del servidor (${response.status})`,
      };
    }

    const result = await response.json();

    if (result.error) {
      return {
        success: false,
        error: (result as AnalyzeError).message || result.error,
      };
    }

    return { success: true, data: result as AnalyzeResponse };
  } catch (error: any) {
    if (error.name === "AbortError") {
      return {
        success: false,
        error: "El análisis tardó demasiado. Intenta con una foto más clara.",
      };
    }
    return {
      success: false,
      error: error.message || "Error al analizar la imagen",
    };
  }
}
