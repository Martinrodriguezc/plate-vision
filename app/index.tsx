import { Redirect } from "expo-router";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { Colors } from "../constants/Colors";

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(auth)/(tabs)" />;
  }

  return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
