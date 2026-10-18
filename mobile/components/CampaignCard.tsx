import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Campaign } from "../types";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { spacing } from "../theme/spacing";

interface CampaignCardProps {
  campaign: Campaign;
  variant?: "feed" | "compact";
  onPress?: () => void;
  style?: ViewStyle;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  variant = "feed",
  onPress,
  style,
}) => {
  const router = useRouter();

  const handleCardPress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/campaign/${campaign.id}`);
    }
  };

  const handleActionPress = () => {
    if (campaign.status === "completed") {
      router.push(`/report/${campaign.id}`);
    } else {
      router.push(`/back/${campaign.id}`);
    }
  };

  const fundingGoal = campaign.fundingGoal || campaign.funding_goal || 0;
  const amountRaised = campaign.amountRaised || campaign.amount_raised || 0;
  const percent =
    campaign.percentFunded || campaign.percent_funded ||
    (fundingGoal > 0 ? Math.round((amountRaised / fundingGoal) * 100) : 0);

  const coverUrl = campaign.coverImageUrl || campaign.cover_image_url;
  const creator = campaign.creatorName || campaign.creator_name || "Community Creator";
  const reachText =
    campaign.estimatedReachRange ||
    campaign.estimated_reach_range ||
    (campaign.estimatedReachMid
      ? `${campaign.estimatedReachMid.toLocaleString()} people`
      : campaign.estimated_reach_mid
      ? `${campaign.estimated_reach_mid.toLocaleString()} people`
      : "10,000+ people");

  // COMPACT VARIANT
  if (variant === "compact") {
    return (
      <TouchableOpacity
        style={[styles.compactCard, style]}
        onPress={handleCardPress}
        activeOpacity={0.88}
      >
        <View style={styles.compactRow}>
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              style={styles.compactImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.compactImage, styles.placeholderCompact]}>
              <Ionicons name="megaphone-outline" size={24} color={colors.textMuted} />
            </View>
          )}

          <View style={styles.compactContent}>
            <View style={styles.compactHeaderRow}>
              <Text style={[styles.compactCategory, typography.uiMicro]}>
                {campaign.category.toUpperCase()}
              </Text>
              <StatusBadge status={campaign.status} />
            </View>

            <Text style={[styles.compactTitle, typography.uiH3]} numberOfLines={2}>
              {campaign.title}
            </Text>

            <View style={styles.compactProgressRow}>
              <View style={styles.compactProgressWrap}>
                <ProgressBar percent={percent} height={5} />
              </View>
              <Text style={[styles.compactPercentText, typography.uiMicro]}>
                {percent}%
              </Text>
            </View>

            <View style={styles.reachRow}>
              <Ionicons name="people-outline" size={13} color={colors.primary} />
              <Text style={[styles.compactReach, typography.uiMicro]}>
                Reach: <Text style={styles.reachHighlight}>{reachText}</Text>
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // FEED VARIANT (EDITORIAL COVER)
  return (
    <TouchableOpacity
      style={[styles.feedCard, style]}
      onPress={handleCardPress}
      activeOpacity={0.92}
    >
      {/* Cover Image */}
      <View style={styles.imageContainer}>
        {coverUrl ? (
          <Image
            source={{ uri: coverUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <Ionicons name="megaphone-outline" size={36} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.badgeOverlay}>
          <StatusBadge status={campaign.status} />
        </View>
        <View style={styles.categoryBadge}>
          <Text style={[styles.categoryText, typography.uiMicro]}>
            {campaign.category.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, typography.storyH2]} numberOfLines={2}>
          {campaign.title}
        </Text>

        <Text style={[styles.creator, typography.uiCaption]}>
          Amplified by <Text style={styles.creatorBold}>{creator}</Text>
        </Text>

        <Text style={[styles.summary, typography.storyBody]} numberOfLines={2}>
          {campaign.summary}
        </Text>

        {/* Progress & Funding Section */}
        <View style={styles.fundingSection}>
          <View style={styles.fundingRow}>
            <Text style={[styles.raisedText, typography.uiH2]}>
              ${amountRaised.toLocaleString()}
            </Text>
            <Text style={[styles.goalText, typography.uiCaption]}>
              of ${fundingGoal.toLocaleString()} ad budget ({percent}%)
            </Text>
          </View>

          <ProgressBar percent={percent} />

          {/* Reach Estimate */}
          <View style={styles.reachRow}>
            <Ionicons name="people-outline" size={15} color={colors.primary} />
            <Text style={[styles.reachText, typography.uiCaption]}>
              Est. audience reach: <Text style={styles.reachHighlight}>{reachText}</Text>
            </Text>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={[
            styles.ctaButton,
            campaign.status === "completed" && styles.reportCtaButton,
          ]}
          onPress={handleActionPress}
          activeOpacity={0.8}
        >
          <Text style={[styles.ctaButtonText, typography.uiH3]}>
            {campaign.status === "completed" ? "View Distribution Report" : "Back This Campaign"}
          </Text>
          <Ionicons
            name={campaign.status === "completed" ? "bar-chart-outline" : "arrow-forward"}
            size={16}
            color={campaign.status === "completed" ? colors.textPrimary : colors.white}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  feedCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusCard, // 20px
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: "hidden",
    marginBottom: spacing.s24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  compactCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusInput, // 12px
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.s12,
    marginBottom: spacing.s12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  compactRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  compactImage: {
    width: 84,
    height: 84,
    borderRadius: spacing.radiusSm,
    backgroundColor: colors.slate100,
  },
  placeholderCompact: {
    alignItems: "center",
    justifyContent: "center",
  },
  compactContent: {
    flex: 1,
    marginLeft: spacing.s12,
  },
  compactHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.s4,
  },
  compactCategory: {
    color: colors.primary,
    fontWeight: "700",
  },
  compactTitle: {
    color: colors.textPrimary,
    marginBottom: spacing.s4,
  },
  compactProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s8,
    marginBottom: spacing.s4,
  },
  compactProgressWrap: {
    flex: 1,
  },
  compactPercentText: {
    color: colors.textSecondary,
    fontWeight: "700",
  },
  compactReach: {
    color: colors.textMuted,
    marginLeft: 4,
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
    top: spacing.s12,
    right: spacing.s12,
  },
  categoryBadge: {
    position: "absolute",
    bottom: spacing.s12,
    left: spacing.s12,
    backgroundColor: "rgba(17, 24, 39, 0.85)",
    paddingHorizontal: spacing.s8,
    paddingVertical: 3,
    borderRadius: spacing.radiusSm,
  },
  categoryText: {
    color: colors.white,
    letterSpacing: 0.5,
  },
  content: {
    padding: spacing.s16,
  },
  title: {
    color: colors.textPrimary,
    marginBottom: spacing.s4,
  },
  creator: {
    color: colors.textMuted,
    marginBottom: spacing.s8,
  },
  creatorBold: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  summary: {
    color: colors.textSecondary,
    marginBottom: spacing.s16,
  },
  fundingSection: {
    backgroundColor: colors.slate50,
    padding: spacing.s12,
    borderRadius: spacing.radiusInput,
    marginBottom: spacing.s16,
  },
  fundingRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: spacing.s4,
  },
  raisedText: {
    color: colors.textPrimary,
  },
  goalText: {
    color: colors.textMuted,
  },
  reachRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.s8,
  },
  reachText: {
    color: colors.textSecondary,
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
    minHeight: spacing.minTouchTarget,
    paddingVertical: spacing.s12,
    borderRadius: spacing.radiusInput,
    gap: spacing.s8,
  },
  reportCtaButton: {
    backgroundColor: colors.slate100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ctaButtonText: {
    color: colors.white,
  },
});
