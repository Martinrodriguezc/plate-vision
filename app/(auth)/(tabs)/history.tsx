import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Scan } from "../../../types/scan";
import { getScans, getScanImageUrl } from "../../../services/scans";
import { Colors } from "../../../constants/Colors";
import { Typography } from "../../../constants/Typography";
import { Layout } from "../../../constants/Layout";
import { EmptyState } from "../../../components/ui/EmptyState";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ScanItem({ scan, onPress }: { scan: Scan; onPress: () => void }) {
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    getScanImageUrl(scan.image_url).then(setImageUrl);
  }, [scan.image_url]);

  return (
    <Pressable style={styles.scanItem} onPress={onPress}>
      <View style={styles.accentLine} />
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]} />
      )}
      <View style={styles.scanInfo}>
        <Text style={styles.scanWeight}>
          {scan.total_weight}
          <Text style={styles.scanUnit}> {scan.unit}</Text>
        </Text>
        <Text style={styles.scanDate}>{formatDate(scan.created_at)}</Text>
      </View>
      <View style={styles.chevron}>
        <View style={styles.chevronLine1} />
        <View style={styles.chevronLine2} />
      </View>
    </Pressable>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadScans = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const { data } = await getScans();
      setScans(data);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadScans(); }, []));

  if (loading && scans.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (scans.length === 0) {
    return (
      <EmptyState
        title="SIN ESCANEOS"
        subtitle="Escanea tu primera barra y aparecerá aquí"
        actionLabel="INICIAR ESCANEO"
        onAction={() => router.push("/(auth)/camera")}
      />
    );
  }

  return (
    <FlatList
      data={scans}
      keyExtractor={(item) => item.id}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadScans(true)}
          tintColor={Colors.accent}
        />
      }
      renderItem={({ item }) => (
        <ScanItem
          scan={item}
          onPress={() =>
            router.push({
              pathname: "/(auth)/detail",
              params: { scanId: item.id, scanJson: JSON.stringify(item) },
            })
          }
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: Colors.background },
  listContent: { padding: Layout.spacing.md, gap: 6 },
  scanItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  accentLine: {
    width: Layout.accentLineWidth,
    alignSelf: "stretch",
    backgroundColor: Colors.accent,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: Layout.borderRadius.sharp,
    marginLeft: 12,
    marginVertical: 12,
  },
  thumbnailPlaceholder: {
    backgroundColor: Colors.border,
  },
  scanInfo: {
    flex: 1,
    marginLeft: 12,
  },
  scanWeight: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.text,
  },
  scanUnit: {
    fontSize: 14,
    fontWeight: "400",
    color: Colors.textSecondary,
  },
  scanDate: {
    ...Typography.caption,
    marginTop: 2,
  },
  chevron: {
    width: 20,
    height: 20,
    marginRight: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  chevronLine1: {
    width: 8,
    height: 2,
    backgroundColor: Colors.textMuted,
    transform: [{ rotate: "45deg" }, { translateY: -2 }],
  },
  chevronLine2: {
    width: 8,
    height: 2,
    backgroundColor: Colors.textMuted,
    transform: [{ rotate: "-45deg" }, { translateY: 2 }],
  },
  center: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
