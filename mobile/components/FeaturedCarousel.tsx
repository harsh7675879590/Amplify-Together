import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Campaign } from "../types";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { spacing } from "../theme/spacing";

interface FeaturedCarouselProps {
  campaigns: Campaign[];
  title?: string;
  subtitle?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = Math.min(Math.round(SCREEN_WIDTH * 0.82), 340);

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({
  campaigns,
  title = "Featured Campaigns",
  subtitle = "High-impact verified messages gaining strong community momentum",
}) => {
  const router = useRouter();

  if (!campaigns || campaigns.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <View style={styles.badgeRow}>
            <View style={styles.featuredBadge}>
              <Ionicons name="flash" size={12} color={colors.amberDark} />
              <Text style={[styles.featuredBadgeText, typography.uiMicro]}>FEATURED</Text>
            </View>
          </View>
          <Text style={[styles.title, typography.uiH2]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, typography.uiCaption]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>

      {/* Horizontal Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToAlignment="start"
      >
        {campaigns.map((camp) => {
          const fundingGoal = camp.fundingGoal || camp.funding_goal || 0;
          const amountRaised = camp.amountRaised || camp.amount_raised || 0;
          const percent =
            camp.percentFunded ?? camp.percent_funded ??
            (fundingGoal > 0 ? Math.round((amountRaised / fundingGoal) * 100) : 0);

          const coverUrl = camp.coverImageUrl || camp.cover_image_url;
          const creator = camp.creatorName || camp.creator_name || "Community Creator";
          const reachText =
            camp.estimatedReachRange ||
            camp.estimated_reach_range ||
            (camp.estimatedReachMid
              ? `${camp.estimatedReachMid.toLocaleString()} people`
              : camp.estimated_reach_mid
              ? `${camp.estimated_reach_mid.toLocaleString()} people`
              : "10,000+ people");

          return (
            <TouchableOpacity
              key={camp.id}
              style={[styles.card, { width: CARD_WIDTH }]}
              onPress={() => router.push(`/campaign/${camp.id}`)}
              activeOpacity={0.9}
            >
              {/* Cover Image */}
              <View style={styles.imageWrap}>
                {coverUrl ? (
                  <Image source={{ uri: coverUrl }} style={styles.image} resizeMode="cover" />
                ) : (
                  <View style={[styles.image, styles.placeholderImage]}>
                    <Ionicons name="megaphone-outline" size={32} color={colors.textMuted} />
                  </View>
                )}
                <View style={styles.badgeOverlay}>
                  <StatusBadge status={camp.status} />
                </View>
                <View style={styles.categoryPill}>
                  <Text style={[styles.categoryText, typography.uiMicro]}>
                    {camp.category.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Card Body */}
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, typography.storyH2]} numberOfLines={2}>
                  {camp.title}
                </Text>

                <Text style={[styles.creatorText, typography.uiCaption]} numberOfLines={1}>
                  Amplified by <Text style={styles.creatorName}>{creator}</Text>
                </Text>

                <Text style={[styles.cardSummary, typography.storyBody]} numberOfLines={2}>
                  {camp.summary}
                </Text>

                {/* Progress */}
                <View style={styles.progressSection}>
                  <View style={styles.progressRow}>
                    <Text style={[styles.raisedText, typography.uiH3]}>
                      ${amountRaised.toLocaleString()}
                    </Text>
                    <Text style={[styles.goalText, typography.uiMicro]}>
                      of ${fundingGoal.toLocaleString()} ({percent}%)
                    </Text>
                  </View>
                  <ProgressBar percent={percent} height={6} />
                </View>

                {/* Reach Metric */}
                <View style={styles.reachRow}>
                  <Ionicons name="people-outline" size={14} color={colors.primary} />
                  <Text style={[styles.reachText, typography.uiMicro]}>
                    Est. audience: <Text style={styles.reachBold}>{reachText}</Text>
                  </Text>
                </View>

                {/* Back Button */}
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.push(`/back/${camp.id}`)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.backButtonText, typography.uiH3]}>Back This Campaign</Text>
                  <Ionicons name="arrow-forward" size={15} color={colors.white} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.s16,
  },
  headerRow: {
    paddingHorizontal: spacing.s20,
    marginBottom: spacing.s12,
  },
  headerTextWrap: {
    gap: 2,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: spacing.s4,
  },
  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.amberLight,
    paddingHorizontal: spacing.s8,
    paddingVertical: 3,
    borderRadius: spacing.radiusFull,
  },
  featuredBadgeText: {
    color: colors.amberDark,
    fontWeight: "700",
  },
  title: {
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: spacing.s20,
    gap: spacing.s16,
    paddingBottom: spacing.s8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: "hidden",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  imageWrap: {
    width: "100%",
    height: 160,
    position: "relative",
    backgroundColor: colors.slate200,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.slate100,
  },
  badgeOverlay: {
    position: "absolute",
    top: spacing.s12,
    right: spacing.s12,
  },
  categoryPill: {
    position: "absolute",
    bottom: spacing.s12,
    left: spacing.s12,
    backgroundColor: colors.surfaceGlass,
    paddingHorizontal: spacing.s8,
    paddingVertical: 3,
    borderRadius: spacing.radiusSm,
  },
  categoryText: {
    color: colors.textPrimary,
    fontWeight: "700",
  },
  cardBody: {
    padding: spacing.s16,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    lineHeight: 24,
    marginBottom: spacing.s4,
  },
  creatorText: {
    color: colors.textMuted,
    marginBottom: spacing.s8,
  },
  creatorName: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  cardSummary: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.s12,
  },
  progressSection: {
    marginBottom: spacing.s12,
  },
  progressRow: {
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
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.s8,
    paddingVertical: 4,
    borderRadius: spacing.radiusSm,
    marginBottom: spacing.s12,
  },
  reachText: {
    color: colors.primaryDark,
  },
  reachBold: {
    fontWeight: "700",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: spacing.s10,
    borderRadius: spacing.radiusInput,
    minHeight: spacing.minTouchTarget,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 14,
  },
});
