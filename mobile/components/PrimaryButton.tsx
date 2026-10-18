import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { spacing } from "../theme/spacing";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "accent";
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onPress,
  variant = "primary",
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const isAccent = variant === "accent";
  const bg = isAccent ? colors.accent : colors.primary;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: bg },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && (
            <Ionicons
              name={icon}
              size={18}
              color={colors.white}
              style={styles.icon}
            />
          )}
          <Text style={[styles.text, typography.uiH3, textStyle]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: spacing.minTouchTarget, // 44px
    paddingHorizontal: spacing.s24,
    paddingVertical: spacing.s12,
    borderRadius: spacing.radiusInput,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: spacing.s8,
  },
  text: {
    color: colors.white,
    textAlign: "center",
  },
  disabled: {
    opacity: 0.5,
  },
});
