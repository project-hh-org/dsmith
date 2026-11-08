import { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { colors, spacing, typography } from "@/theme";

export default function BenchSettings() {
  const [push, setPush] = useState(true);
  const [sound, setSound] = useState(false);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: spacing.md, paddingBottom: 32 }}>
      <Text style={styles.section}>알림</Text>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>푸시 알림</Text>
        <Switch value={push} onValueChange={setPush} trackColor={{ true: colors.primary, false: colors.border }} />
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>소리</Text>
        <Switch value={sound} onValueChange={setSound} />
      </View>
      <Text style={[styles.section, { marginTop: spacing.lg }]}>계정</Text>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>로그아웃</Text>
        <Text style={{ color: colors.danger, ...typography.body }}>›</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    ...typography.body,
    color: colors.text,
  },
});
