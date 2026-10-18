import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Campaign } from "../lib/types";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { spacing } from "../theme/spacing";

interface CampaignCardProps {
  campaign: Campaign;
  onPress?: () => void;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onPress }) => {
  const router = useRouter();

  const handleCardPress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/campaign/${campaign.id}`);
    }
  };

  const handleBackPress = (e: any) => {
    e.stopPropagation();
    if (campaign.status === "completed") {
      router.push(`/report/${campaign.id}`);
    } else {
      router.push(`/back/${campaign.id}`);
    }
  };

  const percent = campaign.funding_goal > 0
    ? Math.round((campaign.amount_raised / campaign.funding_goal) * 100)
    : 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleCardPress}
      activeOpacity={0.92}
    >
      {/* Cover Image */}
      <View style={styles.imageContainer}>
        {campaign.cover_image_url ? (
          <Image
            source={{ uri: campaign.cover_image_url }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <Ionicons name="megaphone-outline" size={36} color={colors.slate400} />
          </View>
        )}
        <View style={styles.badgeOverlay}>
          <StatusBadge status={campaign.status} />
        </View>
        <View style={styles.categoryBadge}>
          <Text style={[styles.categoryText, typography.micro]}>{campaign.category.toUpperCase()}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, typography.h2]} numberOfLines={2}>
          {campaign.title}
        </Text>

        <Text style={[styles.creator, typography.caption]}>
          By <Text style={styles.creatorBold}>{campaign.creator_name}</Text>
        </Text>

        <Text style={[styles.summary, typography.body]} numberOfLines={2}>
          {campaign.summary}
        </Text>

        {/* Progress & Funding Section */}
        <View style={styles.fundingSection}>
          <View style={styles.fundingRow}>
            <Text style={[styles.raisedText, typography.h3]}>
              ${campaign.amount_raised.toLocaleString()}
            </Text>
            <Text style={[styles.goalText, typography.caption]}>
              of ${campaign.funding_goal.toLocaleString()} goal ({percent}%)
            </Text>
          </View>

          <ProgressBar percent={percent} />

          {/* Reach Estimate */}
          <View style={styles.reachRow}>
            <Ionicons name="people-outline" size={15} color={colors.primary} />
            <Text style={[styles.reachText, typography.caption]}>
              Est. reach: <Text style={styles.reachHighlight}>{campaign.estimated_reach_range || `${campaign.estimated_reach_mid.toLocaleString()} people`}</Text>
            </Text>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={[
            styles.ctaButton,
            campaign.status === "completed" && styles.reportCtaButton,
          ]}
          onPress={handleBackPress}
          activeOpacity={0.8}
        >
          <Text style={[styles.ctaButtonText, typography.h3]}>
            {campaign.status === "completed" ? "View Distribution Report" : "Back This Campaign"}
          </Text>
          <Ionicons
            name={campaign.status === "completed" ? "bar-chart-outline" : "arrow-forward"}
            size={16}
            color={campaign.status === "completed" ? colors.slate800 : colors.white}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
    shadowColor: colors.slate900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  imageContainer: {
    width: "100%",
    height: 190,
    position: "relative",
    backgroundColor: colors.slate100,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    alignItems: "center",
    justifyContent: "center",
  },
  badgeOverlay: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
  },
  categoryBadge: {
    position: "absolute",
    bottom: spacing.md,
    left: spacing.md,
    backgroundColor: "rgba(15, 23, 42, 0.82)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: spacing.radiusSm,
  },
  categoryText: {
    color: colors.white,
    letterSpacing: 0.5,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    color: colors.slate900,
    marginBottom: spacing.xs,
  },
  creator: {
    color: colors.slate500,
    marginBottom: spacing.sm,
  },
  creatorBold: {
    color: colors.slate700,
    fontWeight: "600",
  },
  summary: {
    color: colors.slate600,
    marginBottom: spacing.md,
  },
  fundingSection: {
    backgroundColor: colors.slate50,
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
    marginBottom: spacing.md,
  },
  fundingRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  raisedText: {
    color: colors.slate900,
  },
  goalText: {
    color: colors.slate500,
  },
  reachRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  reachText: {
    color: colors.slate600,
    marginLeft: 6,
  },
  reachHighlight: {
    fontWeight: "700",
    color: colors.primary,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: spacing.radiusMd,
    gap: 6,
  },
  reportCtaButton: {
    backgroundColor: colors.slate100,
    borderWidth: 1,
    borderColor: colors.slate300,
  },
  ctaButtonText: {
    color: colors.white,
  },
});
