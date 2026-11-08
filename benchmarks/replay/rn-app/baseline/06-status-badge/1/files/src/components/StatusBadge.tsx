import { StyleSheet, Text, View } from "react-native";

type Status = "success" | "warning" | "danger" | "default";

export function StatusBadge({ status, label }: { status: Status; label: string }) {
  return (
    <View style={[styles.badge, styles[status]]}>
      <Text style={[styles.label, { color: "#ffffff" }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
  success: { backgroundColor: "#16a34a" },
  warning: { backgroundColor: "#f59e0b" },
  danger: { backgroundColor: "#dc2626" },
  default: { backgroundColor: "#71717a" },
});
