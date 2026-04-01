import { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScanResult } from "../../types/scan";
import { saveScan } from "../../services/scans";
import { Colors } from "../../constants/Colors";
import { Typography } from "../../constants/Typography";
import { Layout } from "../../constants/Layout";
import { ScoreboardNumber } from "../../components/ui/ScoreboardNumber";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { GoldCard } from "../../components/ui/GoldCard";
import { DiscBadge } from "../../components/ui/DiscBadge";
import { GoldDivider } from "../../components/ui/GoldDivider";
import { Button } from "../../components/ui/Button";

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
    return null;
  }

  const [saving, setSaving] = useState(false);
  const isLowConfidence = result.confidence < 70;

  const handleSave = async () => {
    if (!imageUri) return;
    setSaving(true);
    const { success, error } = await saveScan(imageUri, result, result.unit);
    setSaving(false);

    if (success) {
      Alert.alert("Guardado", "Escaneo guardado en tu historial", [
        { text: "OK", onPress: () => router.replace("/(auth)/(tabs)/history") },
      ]);
    } else {
      Alert.alert("Error", error || "No se pudo guardar");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />

      <ScoreboardNumber
        value={result.totalWeight}
        unit={result.unit}
        label="PESO TOTAL"
      />

      {isLowConfidence && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            RESULTADO INCIERTO ({result.confidence}%) — VERIFICA MANUALMENTE
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <SectionHeader title="BARRA" />
        <GoldCard>
          <View style={styles.barRow}>
            <Text style={styles.barType}>{result.bar?.type}</Text>
            <Text style={styles.barWeight}>
              {result.bar?.weight} {result.unit}
            </Text>
          </View>
        </GoldCard>
      </View>

      <View style={styles.section}>
        <SectionHeader title="DISCOS DETECTADOS" />
        {result.discs?.map((disc, i) => (
          <DiscBadge
            key={i}
            color={disc.color}
            weight={disc.weight}
            quantity={disc.quantity}
            side={disc.side}
            unit={result.unit}
          />
        ))}
      </View>

      {result.notes ? (
        <View style={styles.section}>
          <SectionHeader title="NOTAS" />
          <Text style={styles.notesText}>{result.notes}</Text>
        </View>
      ) : null}

      <View style={styles.confidenceRow}>
        <Text style={styles.confidenceLabel}>CONFIANZA</Text>
        <Text
          style={[
            styles.confidenceValue,
            { color: isLowConfidence ? Colors.warning : Colors.success },
          ]}
        >
          {result.confidence}%
        </Text>
      </View>

      <GoldDivider />

      <View style={styles.actions}>
        <View style={styles.buttonWrapper}>
          <Button
            title="ESCANEAR OTRA"
            onPress={() => router.replace("/(auth)/camera")}
            variant="secondary"
          />
        </View>
        <View style={styles.buttonWrapper}>
          <Button
            title="GUARDAR"
            onPress={handleSave}
            loading={saving}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Layout.spacing.xxl },
  image: { width: "100%", height: 220 },
  warningBanner: {
    backgroundColor: Colors.accentMuted,
    marginHorizontal: Layout.spacing.md,
    padding: 12,
    borderRadius: Layout.borderRadius.card,
    borderLeftWidth: Layout.accentLineWidth,
    borderLeftColor: Colors.warning,
    marginBottom: Layout.spacing.md,
  },
  warningText: {
    ...Typography.sectionLabel,
    color: Colors.warning,
    fontSize: 11,
    letterSpacing: 1,
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
  notesText: {
    ...Typography.body,
    fontSize: 13,
  },
  confidenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Layout.spacing.md,
    marginBottom: 8,
  },
  confidenceLabel: {
    ...Typography.sectionLabel,
    fontSize: 11,
  },
  confidenceValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: Layout.spacing.md,
    gap: 12,
  },
  buttonWrapper: { flex: 1 },
});
