import { TextStyle } from "react-native";
import { Colors } from "./Colors";

export const Typography: Record<string, TextStyle> = {
  scoreboard: {
    fontSize: 64,
    fontWeight: "900",
    letterSpacing: -2,
    color: Colors.text,
  },
  heading: {
    fontSize: 28,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: -0.5,
    color: Colors.text,
  },
  subheading: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 3,
    color: Colors.textSecondary,
  },
  body: {
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  accentNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.accent,
  },
  button: {
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  caption: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textMuted,
  },
};
