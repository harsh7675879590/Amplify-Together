import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrimaryButton } from "./PrimaryButton";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { spacing } from "../theme/spacing";

interface StickyBottomBarProps {
  primaryLabel: string;
  onPrimaryPress: () => void;
  primaryLoading?: boolean;
  primaryDisabled?: boolean;
  statLabel?: string;
  statValue?: string;
  subStat?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const StickyBottomBar: React.FC<StickyBottomBarProps> = ({
  primaryLabel,
  onPrimaryPress,
  primaryLoading = false,
  primaryDisabled = false,
  statLabel,
  statValue,
  subStat,
  children,
  style,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: Math.max(insets.bottom, spacing.s16) },
        style,
      ]}
    >
      {children ? (
        children
      ) : (
        <View style={styles.contentRow}>
          {(statValue || statLabel) && (
            <View style={styles.statsContainer}>
              {statLabel && (
                <Text style={[styles.statLabel, typography.uiMicro]}>
                  {statLabel}
                </Text>
              )}
              {statValue && (
                <Text style={[styles.statValue, typography.uiH2]}>
                  {statValue}
                </Text>
              )}
              {subStat && (
                <Text style={[styles.subStat, typography.uiMicro]}>
                  {subStat}
                </Text>
              )}
            </View>
          )}

          <View style={styles.buttonContainer}>
            <PrimaryButton
              label={primaryLabel}
              onPress={onPrimaryPress}
              loading={primaryLoading}
              disabled={primaryDisabled}
              variant="accent"
              style={styles.button}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.s12,
    paddingHorizontal: spacing.s16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 8,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statsContainer: {
    flex: 1,
    paddingRight: spacing.s16,
  },
  statLabel: {
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  statValue: {
    color: colors.textPrimary,
  },
  subStat: {
    color: colors.primary,
    fontWeight: "700",
  },
  buttonContainer: {
    flexShrink: 0,
    minWidth: 160,
  },
  button: {
    minHeight: spacing.minTouchTarget,
  },
});
