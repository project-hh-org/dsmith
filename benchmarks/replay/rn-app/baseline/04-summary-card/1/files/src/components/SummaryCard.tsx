import { StyleSheet, Text, View } from "react-native";

export function SummaryCard({ title, body, tags }: { title: string; body: string; tags: [string, string, string] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body} numberOfLines={2}>
        {body}
      </Text>
      <View style={styles.tags}>
        {tags.map((tag) => (
          <View key={tag} style={styles.chip}>
            <Text style={styles.chipLabel}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#18181b",
  },
  body: {
    fontSize: 14,
    color: "#71717a",
  },
  tags: {
    flexDirection: "row",
    gap: 6,
  },
  chip: {
    backgroundColor: "#e4e4e7",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipLabel: {
    fontSize: 12,
    color: "#18181b",
  },
});
