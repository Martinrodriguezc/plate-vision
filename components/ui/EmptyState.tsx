import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/Colors";
import { Typography } from "../../constants/Typography";
import { Layout } from "../../constants/Layout";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <View style={styles.dash} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.underline} />
      <Text style={styles.subtitle}>{subtitle}</Text>
      {actionLabel && onAction && (
        <View style={styles.action}>
          <Button title={actionLabel} onPress={onAction} />
        </View>
      )}
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
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: Layout.borderRadius.card,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Layout.spacing.lg,
  },
  dash: {
    width: 20,
    height: 2,
    backgroundColor: Colors.textMuted,
  },
  title: {
    ...Typography.heading,
    fontSize: 22,
    textAlign: "center",
    marginBottom: Layout.spacing.sm,
  },
  underline: {
    width: Layout.goldUnderline.width,
    height: Layout.goldUnderline.height,
    backgroundColor: Colors.accent,
    marginBottom: Layout.spacing.md,
  },
  subtitle: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: Layout.spacing.xl,
  },
  action: {
    width: "100%",
    paddingHorizontal: Layout.spacing.xl,
  },
});
