import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "../../../constants/Colors";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🏋️</Text>
      <Text style={styles.title}>Plate Vision</Text>
      <Text style={styles.subtitle}>
        Toma una foto de tu barra de pesas para calcular el peso total
      </Text>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/(auth)/camera")}
      >
        <Text style={styles.buttonText}>📸  Escanear barra</Text>
      </Pressable>
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
  emoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
});
