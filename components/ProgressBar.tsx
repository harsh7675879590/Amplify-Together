import React from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

interface ProgressBarProps {
  percent: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percent,
  height = 8,
  color = colors.primary,
  backgroundColor = colors.slate200,
}) => {
  const clamped = Math.min(Math.max(percent, 0), 100);

  return (
    <View style={[styles.track, { height, backgroundColor, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clamped}%`,
            height,
            backgroundColor: clamped >= 100 ? colors.success : color,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: "100%",
    overflow: "hidden",
  },
  fill: {
    borderRadius: spacing.radiusSm,
  },
});
