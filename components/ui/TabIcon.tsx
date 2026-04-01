import { View, StyleSheet } from "react-native";

type IconType = "scan" | "history" | "profile";

interface TabIconProps {
  type: IconType;
  color: string;
  size: number;
}

export function TabIcon({ type, color, size }: TabIconProps) {
  const s = size * 0.8;

  if (type === "scan") {
    // Viewfinder: 4 corner brackets
    const corner = s * 0.3;
    const thickness = 2;
    return (
      <View style={{ width: s, height: s }}>
        {/* Top-left */}
        <View style={[{ position: "absolute", top: 0, left: 0, width: corner, height: thickness, backgroundColor: color }]} />
        <View style={[{ position: "absolute", top: 0, left: 0, width: thickness, height: corner, backgroundColor: color }]} />
        {/* Top-right */}
        <View style={[{ position: "absolute", top: 0, right: 0, width: corner, height: thickness, backgroundColor: color }]} />
        <View style={[{ position: "absolute", top: 0, right: 0, width: thickness, height: corner, backgroundColor: color }]} />
        {/* Bottom-left */}
        <View style={[{ position: "absolute", bottom: 0, left: 0, width: corner, height: thickness, backgroundColor: color }]} />
        <View style={[{ position: "absolute", bottom: 0, left: 0, width: thickness, height: corner, backgroundColor: color }]} />
        {/* Bottom-right */}
        <View style={[{ position: "absolute", bottom: 0, right: 0, width: corner, height: thickness, backgroundColor: color }]} />
        <View style={[{ position: "absolute", bottom: 0, right: 0, width: thickness, height: corner, backgroundColor: color }]} />
        {/* Center dot */}
        <View style={{ position: "absolute", top: s / 2 - 2, left: s / 2 - 2, width: 4, height: 4, backgroundColor: color }} />
      </View>
    );
  }

  if (type === "history") {
    // 3 stacked lines
    const lineH = 2;
    const gap = 5;
    return (
      <View style={{ width: s, height: s, justifyContent: "center", alignItems: "center" }}>
        <View style={{ width: s * 0.8, height: lineH, backgroundColor: color, marginBottom: gap }} />
        <View style={{ width: s * 0.6, height: lineH, backgroundColor: color, marginBottom: gap }} />
        <View style={{ width: s * 0.4, height: lineH, backgroundColor: color }} />
      </View>
    );
  }

  // Profile: circle outline
  return (
    <View
      style={{
        width: s * 0.65,
        height: s * 0.65,
        borderRadius: s * 0.325,
        borderWidth: 2,
        borderColor: color,
      }}
    />
  );
}
