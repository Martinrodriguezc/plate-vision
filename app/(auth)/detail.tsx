import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Scan } from "../../types/scan";
import { deleteScan, getScanImageUrl } from "../../services/scans";
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

export default function DetailScreen() {
  const { scanJson } = useLocalSearchParams<{ scanJson: string }>();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");

  let scan: Scan;
  try {
    scan = JSON.parse(scanJson || "{}");
  } catch {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error al cargar el escaneo</Text>
      </View>
    );
  }

  const result = scan.result_json;

  useEffect(() => {
    getScanImageUrl(scan.image_url).then(setImageUrl);
  }, [scan.image_url]);

  const handleDelete = () => {
    Alert.alert(
      "Eliminar escaneo",
      "¿Estás seguro? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            const { success, error } = await deleteScan(
              scan.id,
              scan.image_url
            );
            setDeleting(false);
            if (success) {
              router.back();
            } else {
              Alert.alert("Error", error || "No se pudo eliminar");
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      )}

      {/* Peso total */}
      <View style={styles.totalSection}>
        <Text style={styles.totalLabel}>Peso Total</Text>
        <Text style={styles.totalWeight}>
          {scan.total_weight}
          <Text style={styles.totalUnit}> {scan.unit}</Text>
        </Text>
        <Text style={styles.dateText}>{formatDate(scan.created_at)}</Text>
      </View>

      {/* Barra */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Barra</Text>
        <View style={styles.card}>
          <Text style={styles.cardText}>{result?.bar?.type}</Text>
          <Text style={styles.cardWeight}>
            {result?.bar?.weight} {scan.unit}
          </Text>
        </View>
      </View>

      {/* Discos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Discos</Text>
        {result?.discs?.map((disc, index) => (
          <View key={index} style={styles.discRow}>
            <View
              style={[
                styles.discDot,
                { backgroundColor: getDiscColor(disc.color) },
              ]}
            />
            <Text style={styles.discInfo}>
              {disc.color} — {disc.weight} {scan.unit}
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

      {scan.manually_corrected && (
        <Text style={styles.correctedBadge}>✏️ Corregido manualmente</Text>
      )}

      {/* Eliminar */}
      <Pressable
        style={[styles.deleteButton, deleting && styles.disabled]}
        onPress={handleDelete}
        disabled={deleting}
      >
        {deleting ? (
          <ActivityIndicator color={Colors.error} />
        ) : (
          <Text style={styles.deleteText}>🗑️  Eliminar escaneo</Text>
        )}
      </Pressable>
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
  imagePlaceholder: {
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
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
  dateText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
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
  correctedBadge: {
    color: Colors.warning,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  deleteButton: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error,
    alignItems: "center",
  },
  deleteText: {
    color: Colors.error,
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
