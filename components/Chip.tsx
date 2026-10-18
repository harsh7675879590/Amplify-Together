import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { spacing } from "../theme/spacing";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  count?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  icon,
  count,
  style,
  textStyle,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected ? styles.chipSelected : styles.chipUnselected,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.contentRow}>
        {icon && (
          <Ionicons
            name={icon}
            size={14}
            color={selected ? colors.white : colors.textSecondary}
            style={styles.icon}
          />
        )}
        <Text
          style={[
            styles.label,
            typography.uiCaption,
            selected ? styles.labelSelected : styles.labelUnselected,
            textStyle,
          ]}
        >
          {label}
        </Text>
        {typeof count === "number" && (
          <View
            style={[
              styles.countBadge,
              selected ? styles.countBadgeSelected : styles.countBadgeUnselected,
            ]}
          >
            <Text
              style={[
                styles.countText,
                typography.uiMicro,
                selected ? styles.countTextSelected : styles.countTextUnselected,
              ]}
            >
              {count}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    paddingHorizontal: spacing.s16,
    paddingVertical: spacing.s8,
    borderRadius: spacing.radiusFull, // Pill 9999
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginRight: spacing.s8,
    marginBottom: spacing.s8,
  },
  chipUnselected: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: spacing.s4,
  },
  label: {
    fontWeight: "600",
  },
  labelUnselected: {
    color: colors.textSecondary,
  },
  labelSelected: {
    color: colors.white,
  },
  countBadge: {
    marginLeft: spacing.s8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: spacing.radiusFull,
  },
  countBadgeUnselected: {
    backgroundColor: colors.primaryLight,
  },
  countBadgeSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  countText: {
    fontSize: 11,
    fontWeight: "700",
  },
  countTextUnselected: {
    color: colors.primary,
  },
  countTextSelected: {
    color: colors.white,
  },
});
