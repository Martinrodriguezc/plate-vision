import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import { supabase } from "./supabase";

const DEV_MODE = __DEV__;

/**
 * En desarrollo (Expo Go), Apple Sign In no funciona porque requiere
 * un build nativo. Usamos email/password como bypass.
 */
export async function signInWithApple() {
  if (DEV_MODE && Platform.OS !== "ios") {
    return devSignIn();
  }

  // Verificar si Apple Auth esta disponible (no lo esta en Expo Go)
  const isAvailable = await AppleAuthentication.isAvailableAsync();
  if (!isAvailable) {
    return devSignIn();
  }

  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!credential.identityToken) {
    throw new Error("No se recibió token de Apple");
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
    nonce: rawNonce,
  });

  if (error) throw error;

  if (credential.fullName?.givenName) {
    const displayName = [
      credential.fullName.givenName,
      credential.fullName.familyName,
    ]
      .filter(Boolean)
      .join(" ");

    await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", data.user.id);
  }

  return data;
}

/**
 * Bypass para desarrollo: login con email/password de test.
 * Crea la cuenta si no existe.
 */
async function devSignIn() {
  const email = "dev@platevision.test";
  const password = "devpassword123";

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error?.message?.includes("Invalid login")) {
    // Crear cuenta de desarrollo
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      { email, password, options: { data: { full_name: "Dev User" } } }
    );
    if (signUpError) throw signUpError;
    return signUpData;
  }

  if (error) throw error;
  return data;
}
