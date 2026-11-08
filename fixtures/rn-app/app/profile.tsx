import { Image, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "@/theme";

const modes = { dark: "#000000", light: "#ffffff" };

export default function Profile({ mode }: { mode: "dark" | "light" }) {
  return (
    <View style={styles.page}>
      <Image source={{ uri: "https://example.com/a.png" }} style={styles.avatar} />
      <Text style={{ color: colors.mode[mode], marginTop: spacing.sm }}>프로필</Text>
      <View style={{ borderWidth: 1, borderRadius: radius.lg, padding: 10, transform: [{ translateY: 4 }] }} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 16,
    backgroundColor: modes.light,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    tintColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
  },
});
