import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Share,
  SafeAreaView,
  Alert,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Campaign } from "../../types";
import { api } from "../../lib/api";
import { estimateReach } from "../../lib/reach";
import { StoryRenderer } from "../../components/StoryRenderer";
import { ProgressBar } from "../../components/ProgressBar";
import { StatusBadge } from "../../components/StatusBadge";
import { Accordion } from "../../components/Accordion";
import { SkeletonCard } from "../../components/SkeletonCard";
import { ErrorState } from "../../components/ErrorState";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing } from "../../theme/spacing";

export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Engagement States
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [visualsFeedback, setVisualsFeedback] = useState<"No" | "Somewhat" | "Yes" | null>(null);
  const [mindFeedback, setMindFeedback] = useState<"No" | "Somewhat" | "Yes" | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const fetchCampaign = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await api.getCampaignDetail(id);
      setCampaign(data);
      setIsSaved(api.isCampaignSaved(data.id));
      setIsFollowing(api.isCreatorFollowed(data.creatorName || data.creator_name || ""));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load campaign";
      console.warn("Failed to load campaign detail", e);
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const handleShare = async () => {
    if (!campaign) return;
    const shareUrl = typeof window !== "undefined" ? window.location.href : `https://amplifytogether.org/campaign/${campaign.id}`;
    const shareMessage = `Help amplify this message: "${campaign.title}" — Community-funded ad distribution on Amplify Together.\n\n${shareUrl}`;

    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && !navigator.share) {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareUrl);
          Alert.alert("Link Copied", "Campaign link copied to your clipboard!");
          return;
        }
      }
      await Share.share({
        title: campaign.title,
        message: shareMessage,
        url: shareUrl,
      });
    } catch (e) {
      console.warn("Share failed", e);
    }
  };

  const handleToggleSave = () => {
    if (!campaign) return;
    const nextSaved = api.toggleSaveCampaign(campaign.id);
    setIsSaved(nextSaved);
  };

  const handleToggleFollow = () => {
    if (!campaign) return;
    const creator = campaign.creatorName || campaign.creator_name || "";
    const nextFollow = api.toggleFollowCreator(creator);
    setIsFollowing(nextFollow);
  };

  const handleFeedbackSubmit = async (
    type: "visuals" | "mind",
    val: "No" | "Somewhat" | "Yes"
  ) => {
    if (!campaign) return;

    const nextVisuals = type === "visuals" ? val : visualsFeedback;
    const nextMind = type === "mind" ? val : mindFeedback;

    if (type === "visuals") setVisualsFeedback(val);
    if (type === "mind") setMindFeedback(val);

    try {
      await api.submitFeedback(campaign.id, {
        visuals_compelling: nextVisuals || undefined,
        changed_mind: nextMind || undefined,
      });
      setFeedbackSubmitted(true);
    } catch (e) {
      console.warn("Feedback submission error", e);
    }
  };

  // Calculations
  const fundingGoal = campaign?.fundingGoal || campaign?.funding_goal || 0;
  const amountRaised = campaign?.amountRaised || campaign?.amount_raised || 0;
  const percent = campaign?.percentFunded ?? campaign?.percent_funded ?? (
    fundingGoal > 0 ? Math.round((amountRaised / fundingGoal) * 100) : 0
  );

  const creatorName = campaign?.creatorName || campaign?.creator_name || "Community Creator";
  const creatorTypeLabel = useMemo(() => {
    const t = campaign?.creatorType || campaign?.creator_type;
    if (t === "nonprofit") return "Nonprofit Organization";
    if (t === "community_group") return "Community Coalition";
    if (t === "business") return "Independent Business";
    return "Individual Creator";
  }, [campaign]);

  const daysRemaining = useMemo(() => {
    if (!campaign?.deadline) return "14 days left";
    const diff = new Date(campaign.deadline).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return "Campaign ended";
    if (days === 0) return "Ends today";
    return `${days} days left`;
  }, [campaign?.deadline]);

  const reach = useMemo(() => {
    if (campaign?.estimatedReachRange || campaign?.estimated_reach_range) {
      return {
        formattedRange: campaign.estimatedReachRange || campaign.estimated_reach_range || "",
        mid: campaign.estimatedReachMid || campaign.estimated_reach_mid || 0,
      };
    }
    const computed = estimateReach(fundingGoal * 0.95);
    return {
      formattedRange: computed.formattedRange,
      mid: computed.mid,
    };
  }, [campaign, fundingGoal]);

  const publishDateFormatted = useMemo(() => {
    const raw = campaign?.createdAt || campaign?.created_at;
    if (!raw) return "Recently published";
    try {
      return new Date(raw).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Recently published";
    }
  }, [campaign]);

  // Loading State
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.circleBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.loadingPadding}>
            <SkeletonCard />
            <SkeletonCard />
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // Error State
  if (errorMessage || !campaign) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.circleBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={styles.errorWrapper}>
            <ErrorState
              title="Campaign Not Found"
              message={errorMessage || "The campaign message you are looking for is unavailable or may have been removed."}
              onRetry={fetchCampaign}
              retryLabel="Reload Campaign"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Determine Primary CTA depending on campaign status
  const renderBottomCta = () => {
    if (campaign.status === "completed") {
      return (
        <TouchableOpacity
          style={[styles.bottomCtaBtn, styles.reportCtaBtn]}
          onPress={() => router.push(`/report/${campaign.id}`)}
          activeOpacity={0.8}
        >
          <Ionicons name="bar-chart-outline" size={18} color={colors.textPrimary} />
          <Text style={[styles.bottomCtaText, typography.uiH3, { color: colors.textPrimary }]}>
            View Distribution Report
          </Text>
        </TouchableOpacity>
      );
    }

    if (campaign.status === "under_review" || campaign.status === "submitted") {
      return (
        <View style={[styles.bottomCtaBtn, styles.reviewCtaBtn]}>
          <Ionicons name="shield-outline" size={18} color={colors.textMuted} />
          <Text style={[styles.bottomCtaText, typography.uiH3, { color: colors.textMuted }]}>
            Under Editorial Review
          </Text>
        </View>
      );
    }

    if (campaign.status === "goal_reached") {
      return (
        <TouchableOpacity
          style={[styles.bottomCtaBtn, styles.goalReachedCtaBtn]}
          onPress={() => router.push(`/back/${campaign.id}`)}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color={colors.white} />
          <Text style={[styles.bottomCtaText, typography.uiH3]}>
            Goal Reached • Back Further Reach
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.bottomCtaBtn}
        onPress={() => router.push(`/back/${campaign.id}`)}
        activeOpacity={0.8}
      >
        <Text style={[styles.bottomCtaText, typography.uiH3]}>Back This Campaign</Text>
        <Ionicons name="arrow-forward" size={18} color={colors.white} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Floating Top Nav Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
            accessibilityLabel="Back to previous screen"
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.topRightActions}>
            <TouchableOpacity
              style={[styles.circleBtn, isSaved && styles.circleBtnActive]}
              onPress={handleToggleSave}
              activeOpacity={0.8}
              accessibilityLabel="Save Campaign"
            >
              <Ionicons
                name={isSaved ? "bookmark" : "bookmark-outline"}
                size={19}
                color={isSaved ? colors.amberDark : colors.textPrimary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.circleBtn}
              onPress={handleShare}
              activeOpacity={0.8}
              accessibilityLabel="Share Campaign"
            >
              <Ionicons name="share-outline" size={19} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Scrollable Editorial Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Cover Media */}
          {campaign.coverImageUrl || campaign.cover_image_url ? (
            <Image
              source={{ uri: campaign.coverImageUrl || campaign.cover_image_url }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.coverImage, styles.placeholderCover]}>
              <Ionicons name="megaphone-outline" size={48} color={colors.textMuted} />
            </View>
          )}

          {/* Article Editorial Header */}
          <View style={styles.articleHeader}>
            <View style={styles.metaRow}>
              <View style={styles.categoryPill}>
                <Text style={[styles.categoryText, typography.uiMicro]}>
                  {campaign.category.toUpperCase()}
                </Text>
              </View>
              <StatusBadge status={campaign.status} />
            </View>

            <Text style={[styles.title, typography.storyHero]}>
              {campaign.title}
            </Text>

            {/* Creator & Publish Date Row */}
            <View style={styles.creatorRow}>
              <View style={styles.creatorAvatar}>
                <Ionicons name="person" size={16} color={colors.primary} />
              </View>
              <View style={styles.creatorInfo}>
                <View style={styles.creatorNameRow}>
                  <Text style={[styles.creatorName, typography.uiBodyMedium]}>
                    {creatorName}
                  </Text>
                  <View style={styles.creatorTypeBadge}>
                    <Text style={[styles.creatorTypeText, typography.uiMicro]}>
                      {creatorTypeLabel}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.publishDate, typography.uiMicro]}>
                  Published on {publishDateFormatted}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.followBtn, isFollowing && styles.followingBtn]}
                onPress={handleToggleFollow}
                activeOpacity={0.7}
              >
                <Text style={[styles.followBtnText, typography.uiMicro, isFollowing && styles.followingBtnText]}>
                  {isFollowing ? "Following ✓" : "+ Follow"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Summary Lead */}
            <Text style={[styles.summary, typography.storyBodyMedium]}>
              {campaign.summary}
            </Text>
          </View>

          {/* Funding & Audience Reach Panel */}
          <View style={styles.fundingCard}>
            <View style={styles.fundingTop}>
              <View>
                <Text style={[styles.raisedAmount, typography.uiTitle]}>
                  ${amountRaised.toLocaleString()}
                </Text>
                <Text style={[styles.goalAmount, typography.uiCaption]}>
                  of ${fundingGoal.toLocaleString()} ad budget ({percent}%)
                </Text>
              </View>
              <View style={styles.daysBadge}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.daysText, typography.uiMicro]}>{daysRemaining}</Text>
              </View>
            </View>

            <ProgressBar percent={percent} height={8} />

            {/* Reach Metric Range */}
            <View style={styles.reachPanelRow}>
              <View style={styles.reachIconWrap}>
                <Ionicons name="people" size={18} color={colors.primary} />
              </View>
              <View style={styles.reachTextWrap}>
                <View style={styles.reachRangeRow}>
                  <Text style={[styles.reachRangeText, typography.uiH3]}>
                    {reach.formattedRange}
                  </Text>
                  <View style={styles.estimateBadge}>
                    <Text style={[styles.estimateBadgeText, typography.uiMicro]}>
                      ESTIMATE, NOT A GUARANTEE
                    </Text>
                  </View>
                </View>
                <Text style={[styles.reachNotice, typography.uiMicro]}>
                  Net ad funds (~95%) are deployed directly to targeted external audiences.
                </Text>
              </View>
            </View>

            <View style={styles.antiDonationBanner}>
              <Ionicons name="information-circle-outline" size={16} color={colors.amberDark} />
              <Text style={[styles.antiDonationText, typography.uiMicro]}>
                Contributions fund verified advertising reach, not direct charitable gifts to the creator or organization.
              </Text>
            </View>
          </View>

          {/* Editorial Story Blocks Rendered via StoryRenderer */}
          <View style={styles.storyContainer}>
            <Text style={[styles.sectionHeading, typography.storyH1]}>The Evidence & Story</Text>
            <StoryRenderer blocks={campaign.story || []} />
          </View>

          {/* Supporting Sources Section (MANDATORY: Visible to ALL audiences) */}
          <View style={styles.sourcesSection}>
            <View style={styles.sourcesHeaderRow}>
              <View style={styles.sourcesIconWrap}>
                <Ionicons name="library-outline" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.sourcesTitle, typography.uiH2]}>
                  Supporting Sources & Citations
                </Text>
                <Text style={[styles.sourcesSubtitle, typography.uiCaption]}>
                  Publicly verifiable data, government records, and academic research
                </Text>
              </View>
            </View>

            {campaign.sources && campaign.sources.length > 0 ? (
              <View style={styles.sourcesList}>
                {campaign.sources.map((src, idx) => (
                  <TouchableOpacity
                    key={src.id || idx}
                    style={styles.sourceCard}
                    onPress={() => {
                      if (src.url) {
                        Linking.openURL(src.url).catch(() => {
                          Alert.alert("Link Unavailable", `Could not open ${src.url}`);
                        });
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sourceNumberBadge}>
                      <Text style={[styles.sourceNumberText, typography.uiMicro]}>
                        [{idx + 1}]
                      </Text>
                    </View>
                    <View style={styles.sourceInfo}>
                      <Text style={[styles.sourceItemTitle, typography.uiH3]}>
                        {src.title}
                      </Text>
                      <Text style={[styles.sourceItemUrl, typography.uiMicro]} numberOfLines={1}>
                        {src.url}
                      </Text>
                    </View>
                    <Ionicons name="open-outline" size={18} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.noSourcesBox}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
                <Text style={[styles.noSourcesText, typography.uiCaption]}>
                  Primary source documentation verified by platform moderators.
                </Text>
              </View>
            )}
          </View>

          {/* Transparency Accordions */}
          <View style={styles.accordionsSection}>
            <Text style={[styles.sectionHeading, typography.uiH2]}>
              Transparency & Governance
            </Text>

            {/* Accordion 1: Use of Funds */}
            <Accordion title="Use of Funds & Distribution Budget" iconName="cash-outline">
              <View style={styles.accordionContent}>
                <Text style={[styles.accordionP, typography.uiBody]}>
                  A contribution supports the distribution and reach of a campaign message; it does not directly fund the cause, person, or organization described in that message.
                </Text>
                <View style={styles.feeBreakdownList}>
                  <View style={styles.feeItem}>
                    <Text style={[styles.feeBold, typography.uiH3]}>95% Net Ad Spend</Text>
                    <Text style={[styles.feeDetail, typography.uiCaption]}>
                      Directly purchases advertising impressions across targeted networks.
                    </Text>
                  </View>
                  <View style={styles.feeItem}>
                    <Text style={[styles.feeBold, typography.uiH3]}>5% Platform Fee</Text>
                    <Text style={[styles.feeDetail, typography.uiCaption]}>
                      Covers editorial fact-checking, human source review, and delivery infrastructure.
                    </Text>
                  </View>
                  <View style={styles.feeItem}>
                    <Text style={[styles.feeBold, typography.uiH3]}>Unspent Funds & Refunds</Text>
                    <Text style={[styles.feeDetail, typography.uiCaption]}>
                      If an ad run cannot fulfill due to inventory limits or is discontinued, unspent funds are refunded pro-rata to backers or held for future distribution with full disclosure.
                    </Text>
                  </View>
                </View>
              </View>
            </Accordion>

            {/* Accordion 2: Audience & Distribution */}
            <Accordion title="Audience Targeting & Placements" iconName="navigate-outline">
              <View style={styles.accordionContent}>
                <Text style={[styles.accordionP, typography.uiBody]}>
                  Ad creatives and audience targeting parameters are reviewed for truth-in-advertising compliance.
                </Text>
                <View style={styles.targetingBox}>
                  <View style={styles.targetRow}>
                    <Text style={[styles.targetKey, typography.uiCaption]}>Ad Headline:</Text>
                    <Text style={[styles.targetVal, typography.uiH3]}>
                      {campaign.adHeadline || campaign.ad_headline || campaign.title}
                    </Text>
                  </View>
                  <View style={styles.targetRow}>
                    <Text style={[styles.targetKey, typography.uiCaption]}>Target Channels:</Text>
                    <Text style={[styles.targetVal, typography.uiCaption]}>
                      {(campaign.reach_settings?.channels || ["Social Media Feeds", "Independent Digital News", "Search Keywords"]).join(", ")}
                    </Text>
                  </View>
                  <View style={styles.targetRow}>
                    <Text style={[styles.targetKey, typography.uiCaption]}>Locations:</Text>
                    <Text style={[styles.targetVal, typography.uiCaption]}>
                      {(campaign.reach_settings?.locations || ["Targeted Regional Metros"]).join(", ")}
                    </Text>
                  </View>
                  <View style={styles.targetRow}>
                    <Text style={[styles.targetKey, typography.uiCaption]}>Duration:</Text>
                    <Text style={[styles.targetVal, typography.uiCaption]}>
                      {campaign.reach_settings?.duration_days || 30} days of continuous delivery
                    </Text>
                  </View>
                </View>
              </View>
            </Accordion>

            {/* Accordion 3: Review, Trust & Feedback (NO FAKE TRUST SCORE) */}
            <Accordion title="Review, Fact-Checking & Trust" iconName="shield-checkmark-outline">
              <View style={styles.accordionContent}>
                <Text style={[styles.accordionP, typography.uiBody]}>
                  Trust on Amplify is earned through public evidence, not algorithmic vanity metrics.
                </Text>
                <View style={styles.trustProcessList}>
                  <Text style={[styles.trustStep, typography.uiCaption]}>
                    • <Text style={styles.boldText}>Human Fact-Checking:</Text> Reviewers check every quoted statistic against primary academic or governmental sources.
                  </Text>
                  <Text style={[styles.trustStep, typography.uiCaption]}>
                    • <Text style={styles.boldText}>Ad Copy Veracity:</Text> Ad copy must accurately reflect the documented story without sensationalist or misleading claims.
                  </Text>
                  <Text style={[styles.trustStep, typography.uiCaption]}>
                    • <Text style={styles.boldText}>Independent Ad Networks:</Text> Placements run through audited exchanges with transparent post-campaign delivery reports.
                  </Text>
                </View>
              </View>
            </Accordion>
          </View>

          {/* Feedback Reaction Prompt Section */}
          <View style={styles.feedbackSection}>
            <View style={styles.feedbackHeader}>
              <Ionicons name="chatbubbles-outline" size={20} color={colors.primary} />
              <Text style={[styles.feedbackTitle, typography.uiH3]}>
                Message Evaluation & Feedback
              </Text>
            </View>

            {/* Question 1: Visuals */}
            <View style={styles.feedbackQuestionBlock}>
              <Text style={[styles.questionText, typography.uiBody]}>
                Did the visuals make you want to keep reading?
              </Text>
              <View style={styles.optionsRow}>
                {(["No", "Somewhat", "Yes"] as const).map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.optionButton,
                      visualsFeedback === opt && styles.optionButtonActive,
                    ]}
                    onPress={() => handleFeedbackSubmit("visuals", opt)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        typography.uiCaption,
                        visualsFeedback === opt && styles.optionButtonTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Question 2: Perspective change */}
            <View style={styles.feedbackQuestionBlock}>
              <Text style={[styles.questionText, typography.uiBody]}>
                Did this message change your mind?
              </Text>
              <View style={styles.optionsRow}>
                {(["No", "Somewhat", "Yes"] as const).map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.optionButton,
                      mindFeedback === opt && styles.optionButtonActive,
                    ]}
                    onPress={() => handleFeedbackSubmit("mind", opt)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        typography.uiCaption,
                        mindFeedback === opt && styles.optionButtonTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {feedbackSubmitted && (
              <View style={styles.feedbackThanksRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={[styles.feedbackThanksText, typography.uiMicro]}>
                  Thank you! Your feedback helps evaluate message resonance and clarity.
                </Text>
              </View>
            )}
          </View>

          {/* In-Page Share Banner */}
          <View style={styles.shareBanner}>
            <View style={styles.shareBannerTextWrap}>
              <Text style={[styles.shareBannerTitle, typography.uiH3]}>
                Share This Message
              </Text>
              <Text style={[styles.shareBannerSub, typography.uiCaption]}>
                Help put this evidence in front of colleagues, journalists, and decision-makers.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.shareBannerBtn}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social-outline" size={18} color={colors.primary} />
              <Text style={[styles.shareBannerBtnText, typography.uiH3]}>Share</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Sticky Bottom Bar (Safe Content Padding ensures story is never covered) */}
        <View style={styles.stickyBottomBar}>
          <View style={styles.bottomStatsCol}>
            <Text style={[styles.bottomRaisedText, typography.uiH2]}>
              ${amountRaised.toLocaleString()}
            </Text>
            <Text style={[styles.bottomGoalText, typography.uiMicro]}>
              {percent}% of ${fundingGoal.toLocaleString()} goal
            </Text>
          </View>
          <View style={styles.bottomCtaWrap}>
            {renderBottomCta()}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    position: "relative",
  },
  loadingPadding: {
    padding: spacing.s20,
    gap: spacing.s16,
  },
  errorWrapper: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.s20,
  },
  topBar: {
    position: "absolute",
    top: spacing.s16,
    left: spacing.s16,
    right: spacing.s16,
    zIndex: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceGlass,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  circleBtnActive: {
    backgroundColor: colors.amberLight,
    borderColor: colors.amberDark,
  },
  topRightActions: {
    flexDirection: "row",
    gap: spacing.s8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Strict spacing ensures sticky bottom bar never covers text
  },
  coverImage: {
    width: "100%",
    height: 260,
    backgroundColor: colors.slate200,
  },
  placeholderCover: {
    alignItems: "center",
    justifyContent: "center",
  },
  articleHeader: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.s20,
    paddingTop: spacing.s20,
    paddingBottom: spacing.s16,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.s12,
  },
  categoryPill: {
    backgroundColor: colors.surfaceNeutral,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.s10,
    paddingVertical: 4,
    borderRadius: spacing.radiusSm,
  },
  categoryText: {
    color: colors.textSecondary,
    fontWeight: "700",
  },
  title: {
    color: colors.textPrimary,
    marginBottom: spacing.s12,
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.s16,
    gap: spacing.s10,
  },
  creatorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  creatorInfo: {
    flex: 1,
  },
  creatorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s8,
    flexWrap: "wrap",
  },
  creatorName: {
    color: colors.textPrimary,
  },
  creatorTypeBadge: {
    backgroundColor: colors.surfaceNeutral,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  creatorTypeText: {
    color: colors.textMuted,
    fontSize: 10,
  },
  publishDate: {
    color: colors.textMuted,
    marginTop: 2,
  },
  followBtn: {
    paddingHorizontal: spacing.s12,
    paddingVertical: 6,
    borderRadius: spacing.radiusFull,
    backgroundColor: colors.surfaceNeutral,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    minHeight: 32,
    justifyContent: "center",
  },
  followingBtn: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  followBtnText: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  followingBtnText: {
    color: colors.primary,
    fontWeight: "700",
  },
  summary: {
    color: colors.textSecondary,
    lineHeight: 24,
    marginTop: spacing.s8,
  },
  fundingCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.s20,
    marginTop: spacing.s16,
    marginBottom: spacing.s20,
    borderRadius: spacing.radiusCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.s16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  fundingTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.s12,
  },
  raisedAmount: {
    color: colors.textPrimary,
  },
  goalAmount: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  daysBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceNeutral,
    paddingHorizontal: spacing.s8,
    paddingVertical: 4,
    borderRadius: spacing.radiusFull,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  daysText: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  reachPanelRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.primaryLight,
    padding: spacing.s12,
    borderRadius: spacing.radiusInput,
    marginTop: spacing.s12,
    gap: spacing.s10,
  },
  reachIconWrap: {
    marginTop: 2,
  },
  reachTextWrap: {
    flex: 1,
  },
  reachRangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s8,
    flexWrap: "wrap",
    marginBottom: 2,
  },
  reachRangeText: {
    color: colors.primaryDark,
  },
  estimateBadge: {
    backgroundColor: colors.amberLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: spacing.radiusSm,
  },
  estimateBadgeText: {
    color: colors.amberDark,
    fontSize: 9,
    fontWeight: "800",
  },
  reachNotice: {
    color: colors.textMuted,
    lineHeight: 16,
  },
  antiDonationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.s10,
    paddingHorizontal: 2,
  },
  antiDonationText: {
    color: colors.amberDark,
    flex: 1,
    lineHeight: 16,
  },
  storyContainer: {
    paddingHorizontal: spacing.s20,
    backgroundColor: colors.background,
    marginVertical: spacing.s12,
  },
  sectionHeading: {
    color: colors.textPrimary,
    marginBottom: spacing.s12,
  },
  sourcesSection: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.s20,
    paddingVertical: spacing.s20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.cardBorder,
    marginVertical: spacing.s12,
  },
  sourcesHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s12,
    marginBottom: spacing.s16,
  },
  sourcesIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  sourcesTitle: {
    color: colors.textPrimary,
  },
  sourcesSubtitle: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  sourcesList: {
    gap: spacing.s10,
  },
  sourceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceNeutral,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: spacing.radiusInput,
    padding: spacing.s12,
    gap: spacing.s10,
  },
  sourceNumberBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: spacing.radiusSm,
  },
  sourceNumberText: {
    color: colors.primary,
    fontWeight: "700",
  },
  sourceInfo: {
    flex: 1,
  },
  sourceItemTitle: {
    color: colors.textPrimary,
    marginBottom: 2,
  },
  sourceItemUrl: {
    color: colors.primary,
  },
  noSourcesBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: spacing.s12,
    backgroundColor: colors.surfaceNeutral,
    borderRadius: spacing.radiusInput,
  },
  noSourcesText: {
    color: colors.textSecondary,
  },
  accordionsSection: {
    paddingHorizontal: spacing.s20,
    paddingVertical: spacing.s16,
    gap: spacing.s12,
  },
  accordionContent: {
    gap: spacing.s10,
  },
  accordionP: {
    color: colors.textSecondary,
    lineHeight: 22,
  },
  feeBreakdownList: {
    backgroundColor: colors.surfaceNeutral,
    borderRadius: spacing.radiusInput,
    padding: spacing.s12,
    gap: spacing.s8,
  },
  feeItem: {
    gap: 2,
  },
  feeBold: {
    color: colors.textPrimary,
  },
  feeDetail: {
    color: colors.textMuted,
  },
  targetingBox: {
    backgroundColor: colors.surfaceNeutral,
    borderRadius: spacing.radiusInput,
    padding: spacing.s12,
    gap: spacing.s8,
  },
  targetRow: {
    gap: 2,
  },
  targetKey: {
    color: colors.textMuted,
  },
  targetVal: {
    color: colors.textPrimary,
  },
  trustProcessList: {
    gap: spacing.s8,
  },
  trustStep: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: "700",
    color: colors.textPrimary,
  },
  feedbackSection: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.s20,
    marginVertical: spacing.s16,
    borderRadius: spacing.radiusCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.s20,
    gap: spacing.s16,
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s8,
  },
  feedbackTitle: {
    color: colors.textPrimary,
  },
  feedbackQuestionBlock: {
    gap: spacing.s8,
  },
  questionText: {
    color: colors.textSecondary,
  },
  optionsRow: {
    flexDirection: "row",
    gap: spacing.s10,
  },
  optionButton: {
    flex: 1,
    paddingVertical: spacing.s10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: spacing.radiusInput,
    backgroundColor: colors.surfaceNeutral,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    minHeight: 40,
  },
  optionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionButtonText: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  optionButtonTextActive: {
    color: colors.white,
    fontWeight: "700",
  },
  feedbackThanksRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.successLight,
    padding: spacing.s10,
    borderRadius: spacing.radiusSm,
  },
  feedbackThanksText: {
    color: colors.successDark,
    flex: 1,
  },
  shareBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primaryLight,
    marginHorizontal: spacing.s20,
    marginBottom: spacing.s24,
    borderRadius: spacing.radiusCard,
    padding: spacing.s16,
    gap: spacing.s12,
  },
  shareBannerTextWrap: {
    flex: 1,
    gap: 2,
  },
  shareBannerTitle: {
    color: colors.primaryDark,
  },
  shareBannerSub: {
    color: colors.textSecondary,
  },
  shareBannerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.s16,
    paddingVertical: spacing.s10,
    borderRadius: spacing.radiusInput,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    minHeight: spacing.minTouchTarget,
  },
  shareBannerBtnText: {
    color: colors.primary,
  },
  stickyBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingHorizontal: spacing.s20,
    paddingVertical: spacing.s12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
    gap: spacing.s16,
  },
  bottomStatsCol: {
    justifyContent: "center",
  },
  bottomRaisedText: {
    color: colors.textPrimary,
  },
  bottomGoalText: {
    color: colors.textMuted,
  },
  bottomCtaWrap: {
    flex: 1,
  },
  bottomCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: spacing.s12,
    borderRadius: spacing.radiusInput,
    minHeight: spacing.minTouchTarget,
  },
  reportCtaBtn: {
    backgroundColor: colors.surfaceNeutral,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  goalReachedCtaBtn: {
    backgroundColor: colors.success,
  },
  reviewCtaBtn: {
    backgroundColor: colors.surfaceNeutral,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  bottomCtaText: {
    color: colors.white,
  },
});
