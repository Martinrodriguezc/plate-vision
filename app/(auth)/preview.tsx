import { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { analyzePlate } from "../../services/analyze";
import { Colors } from "../../constants/Colors";
import { Typography } from "../../constants/Typography";
import { Layout } from "../../constants/Layout";
import { Button } from "../../components/ui/Button";

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
    } catch {
      Alert.alert("Error", "No se pudo analizar la imagen");
    } finally {
      setAnalyzing(false);
    }
  };

  if (!uri) return null;

  return (
    <View style={styles.container}>
      <Image source={{ uri }} style={styles.image} resizeMode="contain" />

      {analyzing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingTitle}>ANALIZANDO</Text>
          <Text style={styles.loadingSubtitle}>
            Reconociendo discos y calculando peso
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <View style={styles.buttonWrapper}>
          <Button
            title="RETOMAR"
            onPress={() => router.back()}
            variant="secondary"
            disabled={analyzing}
          />
        </View>
        <View style={styles.buttonWrapper}>
          <Button
            title="ANALIZAR"
            onPress={handleAnalyze}
            loading={analyzing}
            disabled={analyzing}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  image: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,10,10,0.9)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingTitle: {
    ...Typography.sectionLabel,
    color: Colors.accent,
    marginTop: 8,
  },
  loadingSubtitle: {
    ...Typography.body,
    fontSize: 13,
  },
  actions: {
    flexDirection: "row",
    padding: Layout.spacing.md,
    paddingBottom: Layout.spacing.xxl,
    gap: 12,
    backgroundColor: Colors.background,
  },
  buttonWrapper: { flex: 1 },
});
