import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const CHUNK_SIZE = 2000;

/**
 * SecureStore tiene un limite de ~2048 bytes por item.
 * Partimos valores grandes en chunks.
 */
const LargeSecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    const value = await SecureStore.getItemAsync(key);
    if (value) return value;

    // Intentar leer chunks
    const chunks: string[] = [];
    let index = 0;
    while (true) {
      const chunk = await SecureStore.getItemAsync(`${key}_chunk_${index}`);
      if (!chunk) break;
      chunks.push(chunk);
      index++;
    }
    return chunks.length > 0 ? chunks.join("") : null;
  },

  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      // Limpiar chunks viejos si existian
      await cleanChunks(key);
      return;
    }

    // Guardar en chunks
    const chunks = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }

    for (let i = 0; i < chunks.length; i++) {
      await SecureStore.setItemAsync(`${key}_chunk_${i}`, chunks[i]);
    }

    // Limpiar el item original si existia
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}

    // Limpiar chunks sobrantes de un valor anterior mas largo
    let cleanIndex = chunks.length;
    while (true) {
      const old = await SecureStore.getItemAsync(`${key}_chunk_${cleanIndex}`);
      if (!old) break;
      await SecureStore.deleteItemAsync(`${key}_chunk_${cleanIndex}`);
      cleanIndex++;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}
    await cleanChunks(key);
  },
};

async function cleanChunks(key: string) {
  let index = 0;
  while (true) {
    const chunkKey = `${key}_chunk_${index}`;
    const chunk = await SecureStore.getItemAsync(chunkKey);
    if (!chunk) break;
    await SecureStore.deleteItemAsync(chunkKey);
    index++;
  }
}

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl ?? "";
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey ?? "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: LargeSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
