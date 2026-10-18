import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { spacing } from "../theme/spacing";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss: () => void;
  style?: ViewStyle;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = "info",
  duration = 3500,
  onDismiss,
  style,
}) => {
  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onDismiss]);

  if (!visible) return null;

  const config = {
    success: {
      icon: "checkmark-circle" as keyof typeof Ionicons.glyphMap,
      color: colors.success,
      bg: colors.successLight,
      border: colors.success,
    },
    error: {
      icon: "alert-circle" as keyof typeof Ionicons.glyphMap,
      color: colors.error,
      bg: colors.errorLight,
      border: colors.error,
    },
    warning: {
      icon: "warning" as keyof typeof Ionicons.glyphMap,
      color: colors.warning,
      bg: colors.warningLight,
      border: colors.warning,
    },
    info: {
      icon: "information-circle" as keyof typeof Ionicons.glyphMap,
      color: colors.primary,
      bg: colors.primaryLight,
      border: colors.primary,
    },
  }[type];

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.toastBox,
          { backgroundColor: config.bg, borderColor: config.border },
        ]}
      >
        <Ionicons name={config.icon} size={20} color={config.color} />
        <Text style={[styles.message, typography.uiH3, { color: colors.textPrimary }]}>
          {message}
        </Text>
        <TouchableOpacity
          onPress={onDismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: spacing.s16,
    right: spacing.s16,
    zIndex: 9999,
    alignItems: "center",
  },
  toastBox: {
    width: "100%",
    maxWidth: 480,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.s16,
    paddingVertical: spacing.s12,
    borderRadius: spacing.radiusInput,
    borderWidth: 1,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    gap: spacing.s12,
  },
  message: {
    flex: 1,
  },
});
