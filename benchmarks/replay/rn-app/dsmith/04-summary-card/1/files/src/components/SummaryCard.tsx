import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../theme";
import { Card } from "./ui";

export function SummaryCard({ title, body, tags }: { title: string; body: string; tags: [string, string, string] }) {
  return (
    <Card>
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
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  tags: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  chipLabel: {
    ...typography.caption,
    color: colors.text,
  },
});
