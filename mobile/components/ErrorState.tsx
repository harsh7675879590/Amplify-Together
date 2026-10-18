import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PrimaryButton } from "./PrimaryButton";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { spacing } from "../theme/spacing";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message = "We encountered an issue loading this content. Please check your connection and try again.",
  onRetry,
  retryLabel = "Try Again",
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Ionicons name="alert-circle-outline" size={36} color={colors.error} />
      </View>
      <Text style={[styles.title, typography.uiH2]}>{title}</Text>
      <Text style={[styles.message, typography.uiBody]}>{message}</Text>
      {onRetry && (
        <PrimaryButton
          label={retryLabel}
          onPress={onRetry}
          icon="reload"
          style={styles.retryButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.s32,
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginVertical: spacing.s16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.errorLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.s16,
  },
  title: {
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.s8,
  },
  message: {
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.s24,
    maxWidth: 320,
  },
  retryButton: {
    minWidth: 140,
  },
});
