import { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { compressImage } from "../../utils/image";
import { Colors } from "../../constants/Colors";

export default function PreviewScreen() {
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!uri) return;
    try {
      setAnalyzing(true);
      const compressedUri = await compressImage(uri);

      // TODO Fase 3: enviar a Claude Vision via Edge Function
      Alert.alert(
        "Imagen lista",
        "La imagen fue comprimida. La integración con IA se implementará en Fase 3.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert("Error", "No se pudo procesar la imagen");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRetake = () => {
    router.back();
  };

  if (!uri) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No se recibió imagen</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri }} style={styles.image} resizeMode="contain" />

      {analyzing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Comprimiendo imagen...</Text>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable
          style={styles.secondaryButton}
          onPress={handleRetake}
          disabled={analyzing}
        >
          <Text style={styles.secondaryText}>🔄  Retomar</Text>
        </Pressable>

        <Pressable
          style={[styles.primaryButton, analyzing && styles.disabled]}
          onPress={handleAnalyze}
          disabled={analyzing}
        >
          <Text style={styles.primaryText}>🤖  Analizar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  image: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
  },
  actions: {
    flexDirection: "row",
    padding: 24,
    paddingBottom: 48,
    gap: 16,
    backgroundColor: Colors.background,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  secondaryText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
  center: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: Colors.error,
    fontSize: 16,
  },
});
