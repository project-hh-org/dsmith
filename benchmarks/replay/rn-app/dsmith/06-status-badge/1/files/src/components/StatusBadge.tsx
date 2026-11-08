import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../theme";

type Status = "success" | "warning" | "danger" | "default";

export function StatusBadge({ status, label }: { status: Status; label: string }) {
  return (
    <View style={[styles.badge, styles[status]]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
  },
  label: {
    ...typography.caption,
    color: colors.surface,
  },
  success: { backgroundColor: colors.primary },
  warning: { backgroundColor: colors.warning },
  danger: { backgroundColor: colors.danger },
  default: { backgroundColor: colors.muted },
});
