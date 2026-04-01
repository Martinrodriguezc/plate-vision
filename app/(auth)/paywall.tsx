import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { PurchasesPackage } from "react-native-purchases";
import { getOfferings, purchasePackage } from "../../services/purchases";
import { useSubscription } from "../../hooks/useSubscription";
import { Colors } from "../../constants/Colors";
import { Typography } from "../../constants/Typography";
import { Layout } from "../../constants/Layout";
import { Button } from "../../components/ui/Button";
import { GoldCard } from "../../components/ui/GoldCard";

function FeatureItem({ text }: { text: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.checkmark}>
        <View style={styles.checkLine1} />
        <View style={styles.checkLine2} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

export default function PaywallScreen() {
  const router = useRouter();
  const { refresh } = useSubscription();
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [loadingOffering, setLoadingOffering] = useState(true);

  useEffect(() => {
    getOfferings().then((p) => {
      setPkg(p);
      setLoadingOffering(false);
    });
  }, []);

  const handlePurchase = async () => {
    if (!pkg) return;
    setPurchasing(true);
    const { success, error } = await purchasePackage(pkg);
    setPurchasing(false);

    if (success) {
      await refresh();
      Alert.alert("Bienvenido a Pro", "Escaneos ilimitados desbloqueados", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } else if (error) {
      Alert.alert("Error", error);
    }
  };

  const priceLabel = pkg?.product?.priceString ?? "...";

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>PLATE VISION</Text>
        <Text style={styles.titleAccent}>PRO</Text>
        <View style={styles.underline} />
      </View>

      {/* Features */}
      <View style={styles.features}>
        <FeatureItem text="Escaneos ilimitados por día" />
        <FeatureItem text="Historial completo sin límites" />
        <FeatureItem text="Análisis prioritario" />
        <FeatureItem text="Soporte para kg y lbs" />
      </View>

      {/* Price card */}
      <GoldCard accentBorder style={styles.priceCard}>
        <Text style={styles.priceLabel}>SUSCRIPCIÓN MENSUAL</Text>
        <Text style={styles.price}>{priceLabel}</Text>
        <Text style={styles.priceNote}>Cancela cuando quieras</Text>
      </GoldCard>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title={loadingOffering ? "CARGANDO..." : "SUSCRIBIRME"}
          onPress={handlePurchase}
          loading={purchasing}
          disabled={!pkg || loadingOffering}
        />
        <View style={styles.spacer} />
        <Button
          title="AHORA NO"
          onPress={() => router.back()}
          variant="secondary"
        />
      </View>

      <Text style={styles.disclaimer}>
        El pago se cargará a tu cuenta de Apple. La suscripción se renueva
        automáticamente a menos que la canceles al menos 24 horas antes del
        fin del período actual.
      </Text>
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
    marginTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: Colors.text,
    letterSpacing: 6,
  },
  titleAccent: {
    fontSize: 48,
    fontWeight: "900",
    color: Colors.accent,
    letterSpacing: 12,
    marginTop: -4,
  },
  underline: {
    width: 48,
    height: 3,
    backgroundColor: Colors.accent,
    marginTop: 16,
  },
  features: {
    gap: 16,
    paddingHorizontal: Layout.spacing.sm,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  checkmark: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  checkLine1: {
    position: "absolute",
    width: 6,
    height: 2,
    backgroundColor: Colors.accent,
    transform: [{ rotate: "45deg" }, { translateX: -2 }],
  },
  checkLine2: {
    position: "absolute",
    width: 12,
    height: 2,
    backgroundColor: Colors.accent,
    transform: [{ rotate: "-45deg" }, { translateX: 2 }],
  },
  featureText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text,
  },
  priceCard: {
    alignItems: "center",
    paddingVertical: Layout.spacing.lg,
  },
  priceLabel: {
    ...Typography.sectionLabel,
    marginBottom: 8,
  },
  price: {
    fontSize: 36,
    fontWeight: "900",
    color: Colors.accent,
    marginBottom: 4,
  },
  priceNote: {
    ...Typography.caption,
  },
  actions: {
    gap: 0,
  },
  spacer: { height: 10 },
  disclaimer: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 16,
  },
});
