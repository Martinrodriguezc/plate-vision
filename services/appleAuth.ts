import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { supabase } from "./supabase";

export async function signInWithApple() {
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

  // Actualizar nombre si Apple lo devuelve (solo en primer login)
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
