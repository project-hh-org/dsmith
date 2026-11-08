import { StyleSheet, Switch, Text, View } from "react-native";
import { colors, spacing } from "@/theme";

export default function Settings({ enabled, dark }: { enabled: boolean; dark: boolean }) {
  return (
    <View style={[styles.container, enabled && { backgroundColor: "#ecfdf5" }, dark ? { opacity: 0.8 } : { opacity: 1 }]}>
      <Text style={{ color: "#0f172a", fontSize: 18 }}>설정</Text>
      <Switch value={enabled} />
      <View style={StyleSheet.compose(styles.divider, { marginTop: 10 })} />
      <View style={styles.hairline} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.background,
    gap: 14,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  hairline: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#d4d4d8",
  },
});
