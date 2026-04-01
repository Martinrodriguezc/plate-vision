import { useState } from "react";
import { View, Text, StyleSheet, Alert, Platform, Pressable } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { signInWithApple } from "../services/appleAuth";
import { Colors } from "../constants/Colors";

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithApple();
    } catch (error: any) {
      if (error.code === "ERR_REQUEST_CANCELED") return;
      Alert.alert("Error", error.message ?? "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const showDevButton = __DEV__;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>🏋️</Text>
        <Text style={styles.title}>Plate Vision</Text>
        <Text style={styles.subtitle}>
          Fotografía tu barra y calcula el peso al instante con IA
        </Text>
      </View>

      <View style={styles.features}>
        <Text style={styles.feature}>📸 Escanea discos con la cámara</Text>
        <Text style={styles.feature}>🤖 IA reconoce peso automáticamente</Text>
        <Text style={styles.feature}>📊 Historial de todos tus escaneos</Text>
      </View>

      <View style={styles.footer}>
        {Platform.OS === "ios" && !showDevButton ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
            }
            buttonStyle={
              AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
            }
            cornerRadius={12}
            style={styles.appleButton}
            onPress={handleSignIn}
          />
        ) : (
          <Pressable
            style={[styles.devButton, loading && styles.disabled]}
            onPress={handleSignIn}
            disabled={loading}
          >
            <Text style={styles.devButtonText}>
              {loading ? "Conectando..." : showDevButton ? "🔧 Dev Sign In" : " Sign in with Apple"}
            </Text>
          </Pressable>
        )}

        {showDevButton && (
          <Text style={styles.devNote}>
            Modo desarrollo — Apple Sign In requiere build nativo
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 24,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginTop: 80,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  features: {
    gap: 16,
  },
  feature: {
    fontSize: 18,
    color: Colors.text,
    textAlign: "center",
  },
  footer: {
    marginBottom: 48,
    alignItems: "center",
    gap: 12,
  },
  appleButton: {
    width: "100%",
    height: 56,
  },
  devButton: {
    width: "100%",
    height: 56,
    backgroundColor: "#fff",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  devButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
  devNote: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
});
