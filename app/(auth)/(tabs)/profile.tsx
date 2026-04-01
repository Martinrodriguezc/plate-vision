import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useAuth } from "../../../hooks/useAuth";
import { supabase } from "../../../services/supabase";
import { Colors } from "../../../constants/Colors";
import { Typography } from "../../../constants/Typography";
import { Layout } from "../../../constants/Layout";
import { GoldCard } from "../../../components/ui/GoldCard";
import { Button } from "../../../components/ui/Button";

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
  const name = displayName ?? "Usuario";

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.name}>{name.toUpperCase()}</Text>
      <Text style={styles.email}>{email}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>SUSCRIPCIÓN</Text>
        <View style={styles.labelUnderline} />
        <GoldCard accentBorder style={styles.card}>
          <Text style={styles.planTitle}>PLAN GRATUITO</Text>
          <Text style={styles.planSubtitle}>3 escaneos gratis por día</Text>
        </GoldCard>
      </View>

      <View style={styles.signOutContainer}>
        <Button title="CERRAR SESIÓN" onPress={handleSignOut} variant="danger" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    padding: Layout.spacing.lg,
    paddingTop: 32,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: Layout.borderRadius.card,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Layout.spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "900",
    color: Colors.background,
  },
  name: {
    ...Typography.heading,
    fontSize: 22,
    marginBottom: 4,
  },
  email: {
    ...Typography.caption,
    marginBottom: 32,
  },
  section: {
    width: "100%",
    marginBottom: 32,
  },
  sectionLabel: {
    ...Typography.sectionLabel,
    marginBottom: Layout.spacing.xs,
  },
  labelUnderline: {
    width: Layout.goldUnderline.width,
    height: Layout.goldUnderline.height,
    backgroundColor: Colors.accent,
    marginBottom: Layout.spacing.md,
  },
  card: {
    marginTop: 0,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  planSubtitle: {
    ...Typography.body,
  },
  signOutContainer: {
    marginTop: "auto",
    marginBottom: 32,
    width: "100%",
  },
});
