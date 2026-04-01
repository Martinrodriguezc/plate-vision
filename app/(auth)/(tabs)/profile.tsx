import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../../hooks/useAuth";
import { useSubscription } from "../../../hooks/useSubscription";
import { supabase } from "../../../services/supabase";
import { restorePurchases, getManagementUrl } from "../../../services/purchases";
import { Colors } from "../../../constants/Colors";
import { Typography } from "../../../constants/Typography";
import { Layout } from "../../../constants/Layout";
import { GoldCard } from "../../../components/ui/GoldCard";
import { Button } from "../../../components/ui/Button";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { isPro, scansRemaining, scansTotal, refresh } = useSubscription();
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

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

  const handleRestore = async () => {
    setRestoring(true);
    const { success, isPro: restored, error } = await restorePurchases();
    setRestoring(false);

    if (success) {
      await refresh();
      Alert.alert(
        restored ? "Compras restauradas" : "Sin compras",
        restored
          ? "Tu suscripción Pro ha sido restaurada"
          : "No se encontraron compras anteriores"
      );
    } else {
      Alert.alert("Error", error || "No se pudieron restaurar las compras");
    }
  };

  const handleManage = async () => {
    const url = await getManagementUrl();
    if (url) {
      Linking.openURL(url);
    } else {
      Linking.openURL("https://apps.apple.com/account/subscriptions");
    }
  };

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
        <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.name}>{name.toUpperCase()}</Text>
      <Text style={styles.email}>{email}</Text>

      {/* Subscription */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>SUSCRIPCIÓN</Text>
        <View style={styles.labelUnderline} />

        {isPro ? (
          <GoldCard accentBorder>
            <View style={styles.planRow}>
              <Text style={styles.planTitle}>PLAN PRO</Text>
              <View style={styles.proBadge}>
                <Text style={styles.proText}>PRO</Text>
              </View>
            </View>
            <Text style={styles.planSubtitle}>Escaneos ilimitados</Text>
          </GoldCard>
        ) : (
          <GoldCard>
            <Text style={styles.planTitle}>PLAN GRATUITO</Text>
            <Text style={styles.planSubtitle}>
              {scansRemaining} de {scansTotal} escaneos restantes hoy
            </Text>
          </GoldCard>
        )}
      </View>

      {/* Actions */}
      <View style={styles.section}>
        {!isPro && (
          <View style={styles.actionRow}>
            <Button
              title="OBTENER PRO"
              onPress={() => router.push("/(auth)/paywall")}
            />
          </View>
        )}

        {isPro && (
          <View style={styles.actionRow}>
            <Button
              title="GESTIONAR SUSCRIPCIÓN"
              onPress={handleManage}
              variant="secondary"
            />
          </View>
        )}

        <View style={styles.actionRow}>
          <Button
            title="RESTAURAR COMPRAS"
            onPress={handleRestore}
            variant="secondary"
            loading={restoring}
          />
        </View>
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
    marginBottom: 24,
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
  planRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  proBadge: {
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Layout.borderRadius.sharp,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  proText: {
    fontSize: 11,
    fontWeight: "900",
    color: Colors.accent,
    letterSpacing: 2,
  },
  actionRow: {
    marginBottom: 8,
  },
  signOutContainer: {
    marginTop: "auto",
    marginBottom: 32,
    width: "100%",
  },
});
