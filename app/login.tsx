import { useState } from "react";
import { View, Text, StyleSheet, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";
import { signInWithApple } from "../services/appleAuth";
import { Colors } from "../constants/Colors";
import { Typography } from "../constants/Typography";
import { Layout } from "../constants/Layout";

function FeatureRow({ text }: { text: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureBullet} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithApple();
      router.replace("/(auth)/(tabs)");
    } catch (error: any) {
      if (error.code === "ERR_REQUEST_CANCELED") return;
      Alert.alert("Error", error.message ?? "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>PLATE</Text>
        <Text style={styles.titleAccent}>VISION</Text>
        <View style={styles.titleUnderline} />
        <Text style={styles.subtitle}>
          Fotografía tu barra y calcula{"\n"}el peso al instante con IA
        </Text>
      </View>

      <View style={styles.features}>
        <FeatureRow text="Escanea discos con la cámara" />
        <FeatureRow text="IA reconoce peso automáticamente" />
        <FeatureRow text="Historial de todos tus escaneos" />
      </View>

      <View style={styles.footer}>
        {Platform.OS === "ios" ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={Layout.borderRadius.sharp}
            style={styles.appleButton}
            onPress={handleAppleSignIn}
          />
        ) : (
          <Text style={styles.platformNote}>
            Solo disponible en iOS
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
    padding: Layout.spacing.lg,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginTop: 100,
  },
  title: {
    fontSize: 48,
    fontWeight: "900",
    color: Colors.text,
    letterSpacing: 8,
  },
  titleAccent: {
    fontSize: 48,
    fontWeight: "900",
    color: Colors.accent,
    letterSpacing: 8,
    marginTop: -8,
  },
  titleUnderline: {
    width: 48,
    height: 3,
    backgroundColor: Colors.accent,
    marginTop: 16,
    marginBottom: 24,
  },
  subtitle: {
    ...Typography.body,
    textAlign: "center",
    lineHeight: 24,
  },
  features: {
    gap: 16,
    paddingHorizontal: Layout.spacing.lg,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  featureBullet: {
    width: 8,
    height: 8,
    backgroundColor: Colors.accent,
  },
  featureText: {
    ...Typography.body,
    color: Colors.text,
    fontSize: 16,
  },
  footer: {
    marginBottom: Layout.spacing.xxl,
    alignItems: "center",
  },
  appleButton: {
    width: "100%",
    height: 56,
  },
  platformNote: {
    ...Typography.caption,
  },
});
