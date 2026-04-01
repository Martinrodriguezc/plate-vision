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
import { analyzePlate } from "../../services/analyze";
import { Colors } from "../../constants/Colors";

export default function PreviewScreen() {
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!uri) return;
    try {
      setAnalyzing(true);
      const result = await analyzePlate(uri);

      if (!result.success) {
        Alert.alert("Error", result.error, [
          { text: "Reintentar", onPress: handleAnalyze },
          { text: "Volver", onPress: () => router.back() },
        ]);
        return;
      }

      router.replace({
        pathname: "/(auth)/result",
        params: {
          imageUri: uri,
          resultJson: JSON.stringify(result.data),
        },
      });
    } catch (error: any) {
      Alert.alert("Error", "No se pudo analizar la imagen");
    } finally {
      setAnalyzing(false);
    }
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
          <Text style={styles.loadingText}>Analizando discos...</Text>
          <Text style={styles.loadingSubtext}>
            La IA está reconociendo los pesos
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.back()}
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
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  loadingSubtext: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
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
