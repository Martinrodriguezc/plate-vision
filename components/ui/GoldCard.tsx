import { View, StyleSheet, type ViewProps } from "react-native";
import { Colors } from "../../constants/Colors";
import { Layout } from "../../constants/Layout";

interface GoldCardProps extends ViewProps {
  accentBorder?: boolean;
}

export function GoldCard({
  accentBorder = false,
  style,
  children,
  ...props
}: GoldCardProps) {
  return (
    <View
      style={[
        styles.card,
        accentBorder && styles.accentBorder,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Layout.spacing.md,
  },
  accentBorder: {
    borderLeftWidth: Layout.accentLineWidth,
    borderLeftColor: Colors.accent,
  },
});
