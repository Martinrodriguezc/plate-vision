import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../hooks/useAuth";
import { SubscriptionProvider } from "../hooks/useSubscription";

export default function RootLayout() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <StatusBar style="light" />
        <Slot />
      </SubscriptionProvider>
    </AuthProvider>
  );
}
