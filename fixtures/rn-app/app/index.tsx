import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Card } from "@/components/ui";
import { colors, spacing, typography } from "@/theme";

export default function Home() {
  return (
    <ScrollView contentContainerStyle={{ padding: 20, backgroundColor: "#f8fafc" }}>
      <Text style={styles.title}>홈</Text>
      <Card>
        <Text style={styles.caption}>오늘의 요약</Text>
        <View style={[styles.row, { gap: 6 }]}>
          <Button label="시작" onPress={() => {}} />
        </View>
      </Card>
      <View style={styles.banner} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  caption: {
    ...typography.caption,
    color: "#475569",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  banner: {
    height: 48,
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
});
