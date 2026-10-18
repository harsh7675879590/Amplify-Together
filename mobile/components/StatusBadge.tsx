import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { CampaignStatus } from "../lib/types";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { spacing } from "../theme/spacing";

interface StatusBadgeProps {
  status: CampaignStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let label = status.replace(/_/g, " ").toUpperCase();
  let bg = colors.slate100;
  let text = colors.slate700;

  switch (status) {
    case "available_for_funding":
      label = "BACKING OPEN";
      bg = colors.amberLight;
      text = colors.amberDark;
      break;
    case "goal_reached":
      label = "GOAL REACHED";
      bg = colors.successLight;
      text = colors.successDark;
      break;
    case "distribution_prep":
      label = "PREPARING ADS";
      bg = colors.primaryLight;
      text = colors.primaryDark;
      break;
    case "promoting":
      label = "PROMOTING LIVE";
      bg = "#F3E8FF";
      text = "#6B21A8";
      break;
    case "completed":
      label = "AMPLIFICATION COMPLETE";
      bg = colors.successLight;
      text = colors.successDark;
      break;
    case "submitted":
      label = "IN REVIEW";
      bg = "#DBEAFE";
      text = "#1E40AF";
      break;
    case "changes_requested":
      label = "EDITS REQUESTED";
      bg = colors.warningLight;
      text = colors.warning;
      break;
    default:
      break;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, typography.micro, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: spacing.radiusSm,
    alignSelf: "flex-start",
  },
  text: {
    letterSpacing: 0.5,
  },
});
