import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { useAuth } from "../../../hooks/useAuth";
import { supabase } from "../../../services/supabase";
import { Colors } from "../../../constants/Colors";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name);
      });
  }, [user]);

  const handleSignOut = () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Cerrar sesión", style: "destructive", onPress: signOut },
    ]);
  };

  const email = user?.email ?? "Email oculto (Apple)";
  const name = displayName ?? "Usuario Apple";

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.email}>{email}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mi suscripción</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Plan Gratuito</Text>
          <Text style={styles.cardSubtitle}>
            3 escaneos gratis por día
          </Text>
        </View>
      </View>

      <Pressable style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    padding: 24,
    paddingTop: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  section: {
    width: "100%",
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  signOutButton: {
    marginTop: "auto",
    marginBottom: 32,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  signOutText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: "600",
  },
});
