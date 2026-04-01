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

function ScanItem({
  scan,
  onPress,
}: {
  scan: Scan;
  onPress: () => void;
}) {
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    getScanImageUrl(scan.image_url).then(setImageUrl);
  }, [scan.image_url]);

  return (
    <Pressable style={styles.scanItem} onPress={onPress}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
          <Text style={styles.thumbnailEmoji}>🏋️</Text>
        </View>
      )}
      <View style={styles.scanInfo}>
        <Text style={styles.scanWeight}>
          {scan.total_weight} {scan.unit}
        </Text>
        <Text style={styles.scanDate}>{formatDate(scan.created_at)}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
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
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadScans();
    }, [])
  );

  if (loading && scans.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (scans.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emoji}>📋</Text>
        <Text style={styles.title}>Sin escaneos aún</Text>
        <Text style={styles.subtitle}>
          Escanea tu primera barra y aparecerá aquí
        </Text>
        <Pressable
          style={styles.button}
          onPress={() => router.push("/(auth)/camera")}
        >
          <Text style={styles.buttonText}>📸  Escanear ahora</Text>
        </Pressable>
      </View>
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
          tintColor={Colors.primary}
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
  list: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: 16,
    gap: 8,
  },
  scanItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  thumbnailPlaceholder: {
    backgroundColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailEmoji: {
    fontSize: 24,
  },
  scanInfo: {
    flex: 1,
    marginLeft: 12,
  },
  scanWeight: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },
  scanDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: Colors.textSecondary,
    paddingLeft: 8,
  },
  // Empty state
  center: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
