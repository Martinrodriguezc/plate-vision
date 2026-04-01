import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/Colors";
import { Layout } from "../../constants/Layout";

const DISC_COLORS: Record<string, string> = {
  rojo: "#DC2626",
  azul: "#2563EB",
  amarillo: "#D4A017",
  verde: "#16A34A",
  blanco: "#E5E5E5",
  negro: "#404040",
  red: "#DC2626",
  blue: "#2563EB",
  yellow: "#D4A017",
  green: "#16A34A",
  white: "#E5E5E5",
  black: "#404040",
};

function getColor(color: string): string {
  const lower = color.toLowerCase();
  for (const [key, value] of Object.entries(DISC_COLORS)) {
    if (lower.includes(key)) return value;
  }
  return Colors.textSecondary;
}

interface DiscBadgeProps {
  color: string;
  weight: number;
  quantity: number;
  side: string;
  unit: string;
}

export function DiscBadge({ color, weight, quantity, side, unit }: DiscBadgeProps) {
  const sideLabel = side === "both" ? "AMB" : side === "left" ? "IZQ" : "DER";

  return (
    <View style={styles.row}>
      <View style={[styles.swatch, { backgroundColor: getColor(color) }]} />
      <Text style={styles.colorName}>{color}</Text>
      <Text style={styles.weight}>
        {weight} {unit}
      </Text>
      <Text style={styles.quantity}>x{quantity}</Text>
      <Text style={styles.side}>{sideLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 4,
  },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: Layout.borderRadius.sharp,
    marginRight: 12,
  },
  colorName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
    textTransform: "capitalize",
  },
  weight: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.accent,
    marginRight: 12,
  },
  quantity: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginRight: 12,
  },
  side: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
    width: 28,
    textAlign: "right",
  },
});
