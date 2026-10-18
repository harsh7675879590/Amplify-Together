import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Share,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Campaign } from "../../lib/types";
import { api } from "../../lib/api";
import { ProgressBar } from "../../components/ProgressBar";
import { StatusBadge } from "../../components/StatusBadge";
import { Accordion } from "../../components/Accordion";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing } from "../../theme/spacing";

export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackSelected, setFeedbackSelected] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      api
        .getCampaignDetail(id)
        .then((data) => setCampaign(data))
        .catch((e) => console.warn("Failed to load campaign", e))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleShare = async () => {
    if (!campaign) return;
    try {
      await Share.share({
        title: campaign.title,
        message: `Help amplify this important message: "${campaign.title}" - Community-funded ad distribution on Amplify Together`,
      });
    } catch (e) {
      console.warn("Share failed", e);
    }
  };

  const handleFeedback = async (val: string) => {
    if (!campaign) return;
    setFeedbackSelected(val);
    try {
      await api.submitFeedback(campaign.id, { changed_mind: val });
    } catch (e) {
      console.warn("Feedback failed", e);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!campaign) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, typography.h2]}>Campaign not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backBtnText, typography.h3]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const percent = campaign.funding_goal > 0
    ? Math.round((campaign.amount_raised / campaign.funding_goal) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Floating App Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color={colors.slate900} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Ionicons name="share-outline" size={20} color={colors.slate900} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Cover Media */}
          {campaign.cover_image_url && (
            <Image
              source={{ uri: campaign.cover_image_url }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          )}

          {/* Article Header */}
          <View style={styles.articleHeader}>
            <View style={styles.metaRow}>
              <View style={styles.categoryPill}>
                <Text style={[styles.categoryText, typography.micro]}>
                  {campaign.category.toUpperCase()}
                </Text>
              </View>
              <StatusBadge status={campaign.status} />
            </View>

            <Text style={[styles.title, typography.hero]}>{campaign.title}</Text>

            <Text style={[styles.creatorLine, typography.caption]}>
              Published by <Text style={styles.boldText}>{campaign.creator_name}</Text>
            </Text>

            <Text style={[styles.summary, typography.bodyMedium]}>{campaign.summary}</Text>
          </View>

          {/* Funding Summary Card */}
          <View style={styles.fundingCard}>
            <View style={styles.fundingTop}>
              <View>
                <Text style={[styles.raisedAmount, typography.h1]}>
                  ${campaign.amount_raised.toLocaleString()}
                </Text>
                <Text style={[styles.goalAmount, typography.caption]}>
                  of ${campaign.funding_goal.toLocaleString()} goal ({percent}%)
                </Text>
              </View>
              <View style={styles.reachEstimateBadge}>
                <Ionicons name="people" size={16} color={colors.primary} />
                <Text style={[styles.reachBadgeText, typography.caption]}>
                  ~{campaign.estimated_reach_mid.toLocaleString()} reach
                </Text>
              </View>
            </View>
            <ProgressBar percent={percent} height={10} />
            <Text style={[styles.reachDisclaimer, typography.micro]}>
              *Backer contributions fund targeted advertising reach, not direct charitable donations.
            </Text>
          </View>

          {/* Editorial Story Blocks */}
          <View style={styles.storySection}>
            <Text style={[styles.storyHeading, typography.h2]}>The Story</Text>

            {(campaign.story || []).map((block, idx) => {
              if (block.type === "heading") {
                return (
                  <Text key={idx} style={[styles.storySubHeading, typography.h2]}>
                    {block.text}
                  </Text>
                );
              }
              if (block.type === "paragraph") {
                return (
                  <Text key={idx} style={[styles.storyParagraph, typography.body]}>
                    {block.text}
                  </Text>
                );
              }
              if (block.type === "stat") {
                return (
                  <View key={idx} style={styles.statCallout}>
                    <Text style={[styles.statValue, typography.hero]}>{block.value}</Text>
                    <Text style={[styles.statLabel, typography.caption]}>{block.label}</Text>
                  </View>
                );
              }
              if (block.type === "image" && block.url) {
                return (
                  <View key={idx} style={styles.storyImageWrap}>
                    <Image source={{ uri: block.url }} style={styles.storyImage} />
                    {block.caption && (
                      <Text style={[styles.storyCaption, typography.caption]}>
                        {block.caption} {block.credit && `(Photo: ${block.credit})`}
                      </Text>
                    )}
                  </View>
                );
              }
              return null;
            })}
          </View>

          {/* Public Supporting Sources Section (Mandatory Visible to Audiences) */}
          <View style={styles.sourcesSection}>
            <View style={styles.sourcesTitleRow}>
              <Ionicons name="library" size={18} color={colors.primary} />
              <Text style={[styles.sourcesTitle, typography.h2]}>Supporting Sources & Evidence</Text>
            </View>
            <Text style={[styles.sourcesSub, typography.caption]}>
              Publicly verifiable data, government records, and investigative research behind this message.
            </Text>

            {(campaign.sources && campaign.sources.length > 0) ? (
              campaign.sources.map((s, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.sourceCard}
                  onPress={() => s.url && Linking.openURL(s.url).catch(() => {})}
                  activeOpacity={0.7}
                >
                  <View style={styles.sourceNumber}>
                    <Text style={styles.sourceNumberText}>[{idx + 1}]</Text>
                  </View>
                  <View style={styles.sourceInfo}>
                    <Text style={[styles.sourceItemTitle, typography.h3]}>{s.title}</Text>
                    <Text style={[styles.sourceItemUrl, typography.micro]}>{s.url}</Text>
                  </View>
                  <Ionicons name="open-outline" size={16} color={colors.primary} />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={[styles.noSourcesText, typography.caption]}>
                Source citations verified during editorial review.
              </Text>
            )}
          </View>

          {/* Expandable Accordions */}
          <View style={styles.accordionsSection}>
            {/* Accordion 1: Use of Funds */}
            <Accordion title="How Contributions Are Allocated" iconName="cash-outline">
              <Text style={[styles.accordionBody, typography.body]}>
                This platform is <Text style={styles.boldText}>not a charity or donation site</Text>. Contributions directly purchase digital advertising placements on search and social channels to put this message in front of people outside the creator's network.
              </Text>
              <View style={styles.feeBreakdown}>
                <Text style={[styles.feeLine, typography.caption]}>
                  • <Text style={styles.boldText}>95%</Text> allocated directly to advertising budget
                </Text>
                <Text style={[styles.feeLine, typography.caption]}>
                  • <Text style={styles.boldText}>5%</Text> platform fee for moderation, verification, and ad delivery
                </Text>
                <Text style={[styles.feeLine, typography.caption]}>
                  • Unspent funds from completed ad runs are refunded or rolled into future distribution.
                </Text>
              </View>
            </Accordion>

            {/* Accordion 2: Audience & Distribution */}
            <Accordion title="Intended Audience & Targeting" iconName="navigate-outline">
              <Text style={[styles.accordionBody, typography.body]}>
                Targeting parameters are configured during campaign creation and finalized during review.
              </Text>
              <View style={styles.targetingBox}>
                <Text style={[styles.targetLabel, typography.caption]}>
                  <Text style={styles.boldText}>Locations:</Text> {(campaign.reach_settings?.locations || ["Regional Metros"]).join(", ")}
                </Text>
                <Text style={[styles.targetLabel, typography.caption]}>
                  <Text style={styles.boldText}>Channels:</Text> {(campaign.reach_settings?.channels || ["Social Media Feeds", "News Networks"]).join(", ")}
                </Text>
                <Text style={[styles.targetLabel, typography.caption]}>
                  <Text style={styles.boldText}>Duration:</Text> {campaign.reach_settings?.duration_days || 30} days
                </Text>
              </View>
            </Accordion>

            {/* Accordion 3: Review & Trust */}
            <Accordion title="Editorial Review & Trust" iconName="shield-checkmark-outline">
              <Text style={[styles.accordionBody, typography.body]}>
                Before any campaign opens for funding, human reviewers verify that supporting sources exist, claims are fact-checked, and ad copy adheres to truth-in-advertising guidelines.
              </Text>
            </Accordion>
          </View>

          {/* Reader Feedback Reaction */}
          <View style={styles.feedbackCard}>
            <Text style={[styles.feedbackTitle, typography.h3]}>Did this message inform or change your perspective?</Text>
            <View style={styles.feedbackBtnRow}>
              {["No", "Somewhat", "Yes"].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.feedbackBtn,
                    feedbackSelected === option && styles.feedbackBtnSelected,
                  ]}
                  onPress={() => handleFeedback(option)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.feedbackBtnText,
                      typography.h3,
                      feedbackSelected === option && styles.feedbackBtnTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {feedbackSelected && (
              <Text style={[styles.feedbackThanks, typography.caption]}>
                Thank you! Your feedback helps evaluate message impact.
              </Text>
            )}
          </View>
        </ScrollView>

        {/* Sticky Bottom Backing Bar */}
        <View style={styles.stickyBottomBar}>
          <View style={styles.bottomBarLeft}>
            <Text style={[styles.bottomRaised, typography.h3]}>
              ${campaign.amount_raised.toLocaleString()}
            </Text>
            <Text style={[styles.bottomGoal, typography.micro]}>
              {percent}% of ${campaign.funding_goal.toLocaleString()}
            </Text>
          </View>

          {campaign.status === "completed" ? (
            <TouchableOpacity
              style={[styles.bottomCtaBtn, styles.reportBtn]}
              onPress={() => router.push(`/report/${campaign.id}`)}
              activeOpacity={0.8}
            >
              <Ionicons name="bar-chart" size={18} color={colors.slate900} />
              <Text style={[styles.bottomCtaText, typography.h3, { color: colors.slate900 }]}>
                View Report
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.bottomCtaBtn}
              onPress={() => router.push(`/back/${campaign.id}`)}
              activeOpacity={0.8}
            >
              <Text style={[styles.bottomCtaText, typography.h3]}>Back This Campaign</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: colors.slate50,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  errorText: {
    color: colors.slate800,
    marginBottom: spacing.md,
  },
  backBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: spacing.radiusMd,
  },
  backBtnText: {
    color: colors.white,
  },
  topBar: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // room for sticky bottom bar
  },
  coverImage: {
    width: "100%",
    height: 250,
    backgroundColor: colors.slate200,
  },
  articleHeader: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  categoryPill: {
    backgroundColor: colors.slate100,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: spacing.radiusSm,
  },
  categoryText: {
    color: colors.slate700,
    fontWeight: "700",
  },
  title: {
    color: colors.slate900,
    marginBottom: spacing.xs,
  },
  creatorLine: {
    color: colors.slate500,
    marginBottom: spacing.md,
  },
  boldText: {
    fontWeight: "700",
    color: colors.slate800,
  },
  summary: {
    color: colors.slate700,
    fontStyle: "italic",
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    paddingLeft: spacing.md,
  },
  fundingCard: {
    margin: spacing.lg,
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  fundingTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  raisedAmount: {
    color: colors.slate900,
  },
  goalAmount: {
    color: colors.slate500,
  },
  reachEstimateBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: spacing.radiusFull,
    gap: 4,
  },
  reachBadgeText: {
    color: colors.primary,
    fontWeight: "700",
  },
  reachDisclaimer: {
    color: colors.slate400,
    marginTop: spacing.sm,
  },
  storySection: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.xl,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  storyHeading: {
    color: colors.slate900,
    marginBottom: spacing.lg,
  },
  storySubHeading: {
    color: colors.slate900,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  storyParagraph: {
    color: colors.slate700,
    marginBottom: spacing.md,
  },
  statCallout: {
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: spacing.radiusMd,
    padding: spacing.lg,
    alignItems: "center",
    marginVertical: spacing.md,
  },
  statValue: {
    color: colors.primary,
  },
  statLabel: {
    color: colors.slate600,
    marginTop: 4,
  },
  storyImageWrap: {
    marginVertical: spacing.md,
  },
  storyImage: {
    width: "100%",
    height: 200,
    borderRadius: spacing.radiusMd,
    backgroundColor: colors.slate200,
  },
  storyCaption: {
    color: colors.slate500,
    marginTop: 6,
    fontStyle: "italic",
  },
  sourcesSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  sourcesTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 4,
  },
  sourcesTitle: {
    color: colors.slate900,
  },
  sourcesSub: {
    color: colors.slate500,
    marginBottom: spacing.md,
  },
  sourceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: spacing.radiusMd,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  sourceNumber: {
    marginRight: spacing.sm,
  },
  sourceNumberText: {
    color: colors.primary,
    fontWeight: "700",
  },
  sourceInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  sourceItemTitle: {
    color: colors.slate900,
  },
  sourceItemUrl: {
    color: colors.slate500,
    marginTop: 2,
  },
  noSourcesText: {
    color: colors.slate400,
    fontStyle: "italic",
  },
  accordionsSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  accordionBody: {
    color: colors.slate700,
    marginBottom: spacing.sm,
  },
  feeBreakdown: {
    gap: 4,
  },
  feeLine: {
    color: colors.slate600,
  },
  targetingBox: {
    gap: 4,
    marginTop: spacing.xs,
  },
  targetLabel: {
    color: colors.slate600,
  },
  feedbackCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: "center",
  },
  feedbackTitle: {
    color: colors.slate900,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  feedbackBtnRow: {
    flexDirection: "row",
    gap: spacing.sm,
    width: "100%",
  },
  feedbackBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.slate100,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  feedbackBtnSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  feedbackBtnText: {
    color: colors.slate700,
  },
  feedbackBtnTextSelected: {
    color: colors.white,
  },
  feedbackThanks: {
    color: colors.successDark,
    marginTop: spacing.sm,
  },
  stickyBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.slate200,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 8,
  },
  bottomBarLeft: {
    flex: 1,
  },
  bottomRaised: {
    color: colors.slate900,
  },
  bottomGoal: {
    color: colors.slate500,
  },
  bottomCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: 13,
    borderRadius: spacing.radiusMd,
    gap: 6,
  },
  reportBtn: {
    backgroundColor: colors.slate100,
    borderWidth: 1,
    borderColor: colors.slate300,
  },
  bottomCtaText: {
    color: colors.white,
  },
});
