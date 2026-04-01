import { Tabs } from "expo-router";
import { Colors } from "../../../constants/Colors";
import { TabIcon } from "../../../components/ui/TabIcon";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: "800",
          fontSize: 14,
          letterSpacing: 2,
          textTransform: "uppercase",
        },
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopWidth: 2,
          borderTopColor: Colors.accent,
          height: 88,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontWeight: "800",
          fontSize: 10,
          letterSpacing: 1,
          textTransform: "uppercase",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Escanear",
          tabBarIcon: ({ color, size }) => (
            <TabIcon type="scan" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Historial",
          tabBarIcon: ({ color, size }) => (
            <TabIcon type="history" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <TabIcon type="profile" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
