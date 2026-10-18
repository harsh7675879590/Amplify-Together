import React from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

export const SkeletonCard: React.FC = () => {
  return (
    <View style={styles.card}>
      <View style={styles.imagePlaceholder} />
      <View style={styles.content}>
        <View style={styles.badgeLine} />
        <View style={styles.titleLine} />
        <View style={[styles.titleLine, { width: "70%" }]} />
        <View style={styles.bodyLine} />
        <View style={styles.progressBox} />
        <View style={styles.buttonPlaceholder} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  imagePlaceholder: {
    width: "100%",
    height: 180,
    backgroundColor: colors.slate200,
  },
  content: {
    padding: spacing.lg,
  },
  badgeLine: {
    width: 80,
    height: 14,
    borderRadius: 4,
    backgroundColor: colors.slate200,
    marginBottom: spacing.sm,
  },
  titleLine: {
    width: "100%",
    height: 18,
    borderRadius: 4,
    backgroundColor: colors.slate200,
    marginBottom: spacing.xs,
  },
  bodyLine: {
    width: "90%",
    height: 14,
    borderRadius: 4,
    backgroundColor: colors.slate100,
    marginVertical: spacing.sm,
  },
  progressBox: {
    width: "100%",
    height: 48,
    borderRadius: spacing.radiusMd,
    backgroundColor: colors.slate100,
    marginBottom: spacing.md,
  },
  buttonPlaceholder: {
    width: "100%",
    height: 44,
    borderRadius: spacing.radiusMd,
    backgroundColor: colors.slate200,
  },
});
