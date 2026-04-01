import { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScanResult } from "../../types/scan";
import { Colors } from "../../constants/Colors";

const DISC_COLORS: Record<string, string> = {
  rojo: "#e74c3c",
  azul: "#3498db",
  amarillo: "#f1c40f",
  verde: "#2ecc71",
  blanco: "#ecf0f1",
  negro: "#2c3e50",
  red: "#e74c3c",
  blue: "#3498db",
  yellow: "#f1c40f",
  green: "#2ecc71",
  white: "#ecf0f1",
  black: "#2c3e50",
};

function getDiscColor(color: string): string {
  const lower = color.toLowerCase();
  for (const [key, value] of Object.entries(DISC_COLORS)) {
    if (lower.includes(key)) return value;
  }
  return Colors.textSecondary;
}

export default function ResultScreen() {
  const { imageUri, resultJson } = useLocalSearchParams<{
    imageUri: string;
    resultJson: string;
  }>();
  const router = useRouter();

  let result: ScanResult & { notes?: string };
  try {
    result = JSON.parse(resultJson || "{}");
  } catch {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error al cargar resultados</Text>
      </View>
    );
  }

  const isLowConfidence = result.confidence < 70;

  const handleSave = () => {
    // TODO Fase 4: guardar en Supabase
    Alert.alert("Guardado", "El escaneo se guardará en Fase 4", [
      { text: "OK", onPress: () => router.replace("/(auth)/(tabs)") },
    ]);
  };

  const handleNewScan = () => {
    router.replace("/(auth)/camera");
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Imagen */}
      <Image
        source={{ uri: imageUri }}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Peso total */}
      <View style={styles.totalSection}>
        <Text style={styles.totalLabel}>Peso Total</Text>
        <Text style={styles.totalWeight}>
          {result.totalWeight}
          <Text style={styles.totalUnit}> {result.unit}</Text>
        </Text>
      </View>

      {/* Confianza */}
      {isLowConfidence && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            ⚠️ Resultado incierto ({result.confidence}% confianza). Verifica
            manualmente.
          </Text>
        </View>
      )}

      {/* Barra */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Barra</Text>
        <View style={styles.card}>
          <Text style={styles.cardText}>{result.bar?.type}</Text>
          <Text style={styles.cardWeight}>
            {result.bar?.weight} {result.unit}
          </Text>
        </View>
      </View>

      {/* Discos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Discos detectados</Text>
        {result.discs?.map((disc, index) => (
          <View key={index} style={styles.discRow}>
            <View
              style={[
                styles.discDot,
                { backgroundColor: getDiscColor(disc.color) },
              ]}
            />
            <Text style={styles.discInfo}>
              {disc.color} — {disc.weight} {result.unit}
            </Text>
            <Text style={styles.discQuantity}>×{disc.quantity}</Text>
            <Text style={styles.discSide}>
              {disc.side === "both"
                ? "ambos"
                : disc.side === "left"
                  ? "izq"
                  : "der"}
            </Text>
          </View>
        ))}
      </View>

      {/* Notas */}
      {result.notes ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas</Text>
          <Text style={styles.notesText}>{result.notes}</Text>
        </View>
      ) : null}

      {/* Confianza */}
      <View style={styles.confidenceRow}>
        <Text style={styles.confidenceLabel}>Confianza del análisis</Text>
        <Text
          style={[
            styles.confidenceValue,
            { color: isLowConfidence ? Colors.warning : Colors.success },
          ]}
        >
          {result.confidence}%
        </Text>
      </View>

      {/* Acciones */}
      <View style={styles.actions}>
        <Pressable style={styles.secondaryButton} onPress={handleNewScan}>
          <Text style={styles.secondaryText}>📸  Escanear otra</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={handleSave}>
          <Text style={styles.primaryText}>💾  Guardar</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 48,
  },
  image: {
    width: "100%",
    height: 250,
  },
  totalSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 4,
  },
  totalWeight: {
    fontSize: 56,
    fontWeight: "800",
    color: Colors.text,
  },
  totalUnit: {
    fontSize: 24,
    fontWeight: "400",
    color: Colors.textSecondary,
  },
  warningBanner: {
    backgroundColor: "rgba(251,191,36,0.15)",
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    color: Colors.warning,
    fontSize: 14,
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardText: {
    color: Colors.text,
    fontSize: 16,
  },
  cardWeight: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: "700",
  },
  discRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  discDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  discInfo: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
  },
  discQuantity: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "700",
    marginRight: 12,
  },
  discSide: {
    color: Colors.textSecondary,
    fontSize: 13,
    width: 40,
    textAlign: "right",
  },
  notesText: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  confidenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  confidenceLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  confidenceValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
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
