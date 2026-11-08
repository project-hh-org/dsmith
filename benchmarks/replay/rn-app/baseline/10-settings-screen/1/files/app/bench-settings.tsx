import { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";

export default function BenchSettings() {
  const [push, setPush] = useState(true);
  const [sound, setSound] = useState(false);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text style={styles.section}>알림</Text>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>푸시 알림</Text>
        <Switch value={push} onValueChange={setPush} trackColor={{ true: "#2563eb", false: "#d4d4d8" }} />
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>소리</Text>
        <Switch value={sound} onValueChange={setSound} />
      </View>
      <Text style={[styles.section, { marginTop: 24 }]}>계정</Text>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>로그아웃</Text>
        <Text style={{ color: "#dc2626", fontSize: 14 }}>›</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f4f4f5",
  },
  section: {
    fontSize: 13,
    fontWeight: "600",
    color: "#71717a",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
  },
  rowLabel: {
    fontSize: 16,
    color: "#18181b",
  },
});
