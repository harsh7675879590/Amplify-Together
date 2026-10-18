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

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: "outline" | "ghost";
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  label,
  onPress,
  variant = "outline",
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const isOutline = variant === "outline";

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isOutline && styles.outlineButton,
        !isOutline && styles.ghostButton,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && (
            <Ionicons
              name={icon}
              size={18}
              color={colors.primary}
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
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  ghostButton: {
    backgroundColor: "transparent",
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
    color: colors.textPrimary,
    textAlign: "center",
  },
  disabled: {
    opacity: 0.4,
  },
});
