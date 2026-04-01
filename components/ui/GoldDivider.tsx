import { View, StyleSheet } from "react-native";
import { Colors } from "../../constants/Colors";

export function GoldDivider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
    marginHorizontal: 16,
  },
});
