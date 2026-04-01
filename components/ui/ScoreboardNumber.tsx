import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/Colors";
import { Typography } from "../../constants/Typography";

interface ScoreboardNumberProps {
  value: number;
  unit: string;
  label?: string;
}

export function ScoreboardNumber({ value, unit, label }: ScoreboardNumberProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        <Text style={styles.number}>{value}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
      <View style={styles.underline} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 24,
  },
  label: {
    ...Typography.sectionLabel,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  number: {
    ...Typography.scoreboard,
  },
  unit: {
    fontSize: 24,
    fontWeight: "400",
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  underline: {
    width: 48,
    height: 3,
    backgroundColor: Colors.accent,
    marginTop: 12,
  },
});
