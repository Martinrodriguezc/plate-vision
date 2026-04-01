import { supabase } from "./supabase";
import { Scan, ScanResult } from "../types/scan";
import * as FileSystem from "expo-file-system";
import { decode } from "base-64";

export async function saveScan(
  imageUri: string,
  result: ScanResult,
  unit: "kg" | "lbs" = "kg",
  manuallyCorrected = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No hay sesión activa" };

    const scanId = crypto.randomUUID();
    const imagePath = `${user.id}/${scanId}.jpg`;

    // Subir imagen a Storage
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const { error: uploadError } = await supabase.storage
      .from("scans")
      .upload(imagePath, Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)), {
        contentType: "image/jpeg",
      });

    if (uploadError) {
      return { success: false, error: "Error al subir la imagen" };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("scans").getPublicUrl(imagePath);

    // Guardar registro en DB
    const { error: insertError } = await supabase.from("scans").insert({
      id: scanId,
      user_id: user.id,
      image_url: imagePath,
      result_json: result,
      total_weight: result.totalWeight,
      unit,
      manually_corrected: manuallyCorrected,
    });

    if (insertError) {
      // Limpiar imagen si falla el insert
      await supabase.storage.from("scans").remove([imagePath]);
      return { success: false, error: "Error al guardar el escaneo" };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error inesperado" };
  }
}

export async function getScans(
  limit = 20,
  offset = 0
): Promise<{ data: Scan[]; hasMore: boolean }> {
  const { data, error } = await supabase
    .from("scans")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit);

  if (error) throw error;

  return {
    data: (data as Scan[]) ?? [],
    hasMore: (data?.length ?? 0) > limit,
  };
}

export async function getScanImageUrl(imagePath: string): Promise<string> {
  const { data } = await supabase.storage
    .from("scans")
    .createSignedUrl(imagePath, 3600);

  return data?.signedUrl ?? "";
}

export async function deleteScan(
  scanId: string,
  imagePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error: deleteError } = await supabase
      .from("scans")
      .delete()
      .eq("id", scanId);

    if (deleteError) {
      return { success: false, error: "Error al eliminar el escaneo" };
    }

    await supabase.storage.from("scans").remove([imagePath]);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error inesperado" };
  }
}
