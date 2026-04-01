import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/Colors";
import { Typography } from "../../constants/Typography";
import { Layout } from "../../constants/Layout";

interface SectionHeaderProps {
  title: string;
}

export function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{title}</Text>
      <View style={styles.underline} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.sm,
  },
  label: {
    ...Typography.sectionLabel,
    marginBottom: Layout.spacing.xs,
  },
  underline: {
    width: Layout.goldUnderline.width,
    height: Layout.goldUnderline.height,
    backgroundColor: Colors.accent,
  },
});
