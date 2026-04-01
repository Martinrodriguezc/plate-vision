import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "../../../constants/Colors";
import { Typography } from "../../../constants/Typography";
import { Layout } from "../../../constants/Layout";
import { Button } from "../../../components/ui/Button";
import { useSubscription } from "../../../hooks/useSubscription";

export default function HomeScreen() {
  const router = useRouter();
  const { isPro, scansRemaining, loading } = useSubscription();

  const handleScan = () => {
    if (!isPro && scansRemaining <= 0) {
      router.push("/(auth)/paywall");
      return;
    }
    router.push("/(auth)/camera");
  };

  return (
    <View style={styles.container}>
      {/* Viewfinder icon */}
      <View style={styles.icon}>
        <View style={[styles.corner, styles.tl]} />
        <View style={[styles.cornerV, styles.tlV]} />
        <View style={[styles.corner, styles.tr]} />
        <View style={[styles.cornerV, styles.trV]} />
        <View style={[styles.corner, styles.bl]} />
        <View style={[styles.cornerV, styles.blV]} />
        <View style={[styles.corner, styles.br]} />
        <View style={[styles.cornerV, styles.brV]} />
        <View style={styles.centerDot} />
      </View>

      <Text style={styles.title}>ESCANEAR{"\n"}BARRA</Text>
      <View style={styles.underline} />
      <Text style={styles.subtitle}>
        Apunta tu cámara a la barra{"\n"}para calcular el peso total
      </Text>

      {/* Scan counter */}
      {!loading && !isPro && (
        <View style={styles.counterContainer}>
          <Text style={styles.counterNumber}>{scansRemaining}</Text>
          <Text style={styles.counterLabel}>ESCANEOS HOY</Text>
        </View>
      )}

      {isPro && (
        <View style={styles.proBadge}>
          <Text style={styles.proText}>PRO</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button
          title={!isPro && scansRemaining <= 0 ? "VER PLANES" : "INICIAR ESCANEO"}
          onPress={handleScan}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: Layout.spacing.lg,
  },
  icon: {
    width: 64,
    height: 64,
    marginBottom: 32,
  },
  corner: { position: "absolute", width: 16, height: 2, backgroundColor: Colors.accent },
  cornerV: { position: "absolute", width: 2, height: 16, backgroundColor: Colors.accent },
  tl: { top: 0, left: 0 },
  tlV: { top: 0, left: 0 },
  tr: { top: 0, right: 0 },
  trV: { top: 0, right: 0 },
  bl: { bottom: 0, left: 0 },
  blV: { bottom: 0, left: 0 },
  br: { bottom: 0, right: 0 },
  brV: { bottom: 0, right: 0 },
  centerDot: {
    position: "absolute",
    top: 30,
    left: 30,
    width: 4,
    height: 4,
    backgroundColor: Colors.accent,
  },
  title: {
    ...Typography.heading,
    fontSize: 36,
    textAlign: "center",
    lineHeight: 42,
  },
  underline: {
    width: 48,
    height: 3,
    backgroundColor: Colors.accent,
    marginTop: 16,
    marginBottom: 16,
  },
  subtitle: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: 24,
  },
  counterContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  counterNumber: {
    fontSize: 32,
    fontWeight: "900",
    color: Colors.accent,
  },
  counterLabel: {
    ...Typography.sectionLabel,
    fontSize: 10,
    marginTop: 2,
  },
  proBadge: {
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Layout.borderRadius.sharp,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 32,
  },
  proText: {
    ...Typography.sectionLabel,
    color: Colors.accent,
    fontSize: 14,
    letterSpacing: 4,
  },
  buttonContainer: {
    width: "100%",
    paddingHorizontal: Layout.spacing.xl,
  },
});
