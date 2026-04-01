import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Scan } from "../../types/scan";
import { deleteScan, getScanImageUrl } from "../../services/scans";
import { Colors } from "../../constants/Colors";
import { Typography } from "../../constants/Typography";
import { Layout } from "../../constants/Layout";
import { ScoreboardNumber } from "../../components/ui/ScoreboardNumber";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { GoldCard } from "../../components/ui/GoldCard";
import { DiscBadge } from "../../components/ui/DiscBadge";
import { GoldDivider } from "../../components/ui/GoldDivider";
import { Button } from "../../components/ui/Button";

export default function DetailScreen() {
  const { scanJson } = useLocalSearchParams<{ scanJson: string }>();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");

  let scan: Scan;
  try {
    scan = JSON.parse(scanJson || "{}");
  } catch {
    return null;
  }

  const result = scan.result_json;

  useEffect(() => {
    getScanImageUrl(scan.image_url).then(setImageUrl);
  }, [scan.image_url]);

  const handleDelete = () => {
    Alert.alert(
      "Eliminar escaneo",
      "Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            const { success, error } = await deleteScan(scan.id, scan.image_url);
            setDeleting(false);
            if (success) router.back();
            else Alert.alert("Error", error || "No se pudo eliminar");
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      )}

      <ScoreboardNumber
        value={scan.total_weight}
        unit={scan.unit}
        label="PESO TOTAL"
      />

      <Text style={styles.dateText}>{formatDate(scan.created_at)}</Text>

      <View style={styles.section}>
        <SectionHeader title="BARRA" />
        <GoldCard>
          <View style={styles.barRow}>
            <Text style={styles.barType}>{result?.bar?.type}</Text>
            <Text style={styles.barWeight}>
              {result?.bar?.weight} {scan.unit}
            </Text>
          </View>
        </GoldCard>
      </View>

      <View style={styles.section}>
        <SectionHeader title="DISCOS" />
        {result?.discs?.map((disc, i) => (
          <DiscBadge
            key={i}
            color={disc.color}
            weight={disc.weight}
            quantity={disc.quantity}
            side={disc.side}
            unit={scan.unit}
          />
        ))}
      </View>

      {scan.manually_corrected && (
        <GoldCard accentBorder style={styles.correctedCard}>
          <Text style={styles.correctedText}>CORREGIDO MANUALMENTE</Text>
        </GoldCard>
      )}

      <GoldDivider />

      <View style={styles.deleteContainer}>
        <Button
          title="ELIMINAR ESCANEO"
          onPress={handleDelete}
          variant="danger"
          loading={deleting}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Layout.spacing.xxl },
  image: { width: "100%", height: 220 },
  imagePlaceholder: {
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  dateText: {
    ...Typography.caption,
    textAlign: "center",
    marginBottom: Layout.spacing.md,
  },
  section: {
    paddingHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  barRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  barType: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.text,
  },
  barWeight: {
    ...Typography.accentNumber,
  },
  correctedCard: {
    marginHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  correctedText: {
    ...Typography.sectionLabel,
    color: Colors.warning,
    fontSize: 11,
  },
  deleteContainer: {
    paddingHorizontal: Layout.spacing.md,
  },
});
