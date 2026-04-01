import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../constants/Colors";

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Plate Vision</Text>
      <Text style={styles.subtitle}>
        Fotografía tu barra y calcula el peso al instante
      </Text>
      {/* Sign in with Apple se implementará en Fase 1 */}
      <View style={styles.buttonPlaceholder}>
        <Text style={styles.buttonText}>Sign in with Apple (próximamente)</Text>
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
    padding: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 48,
  },
  buttonPlaceholder: {
    backgroundColor: Colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  buttonText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
});
