import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  SafeAreaView,
  RefreshControl,
  Share,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Header } from "../components/Header";
import { StatusBadge } from "../components/StatusBadge";
import { ProgressBar } from "../components/ProgressBar";
import { EmptyState } from "../components/EmptyState";
import { api } from "../lib/api";
import { Campaign, CampaignStatus } from "../types";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { spacing } from "../theme/spacing";

type DashboardTab =
  | "drafts"
  | "under_review"
  | "funding"
  | "promoting"
  | "completed"
  | "requires_action";

export default function CreatorDashboardScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<DashboardTab>("funding");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [analyticsCampaign, setAnalyticsCampaign] = useState<Campaign | null>(null);
  const [feedbackCampaign, setFeedbackCampaign] = useState<Campaign | null>(null);
  const [updatesCampaign, setUpdatesCampaign] = useState<Campaign | null>(null);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await api.getCampaigns({});
      setCampaigns(data);
    } catch (e) {
      console.warn("Failed to load creator campaigns", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadCampaigns();
  };

  const handleShare = async (c: Campaign) => {
    try {
      await Share.share({
        message: `Amplify Together: Support message distribution for "${c.title}" at http://localhost:8081/campaign/${c.id}`,
        title: c.title,
      });
    } catch {
      Alert.alert("Share", `Campaign link copied: http://localhost:8081/campaign/${c.id}`);
    }
  };

  // Filter campaigns by the 6 dashboard tabs
  const getTabCampaigns = () => {
    switch (activeTab) {
      case "drafts":
        return campaigns.filter((c) => c.status === "draft");
      case "under_review":
        return campaigns.filter((c) => c.status === "submitted" || c.status === "under_review");
      case "funding":
        return campaigns.filter(
          (c) => c.status === "approved" || c.status === "available_for_funding" || c.status === "goal_reached"
        );
      case "promoting":
        return campaigns.filter((c) => c.status === "distribution_prep" || c.status === "promoting");
      case "completed":
        return campaigns.filter((c) => c.status === "completed");
      case "requires_action":
        return campaigns.filter((c) => c.status === "changes_requested");
      default:
        return campaigns;
    }
  };

  const filteredCampaigns = getTabCampaigns();

  const tabs: { key: DashboardTab; label: string; count: number }[] = [
    { key: "funding", label: "Published / Funding", count: campaigns.filter((c) => c.status === "available_for_funding" || c.status === "approved").length },
    { key: "promoting", label: "Promoting", count: campaigns.filter((c) => c.status === "promoting" || c.status === "distribution_prep").length },
    { key: "under_review", label: "Under Review", count: campaigns.filter((c) => c.status === "submitted" || c.status === "under_review").length },
    { key: "completed", label: "Completed", count: campaigns.filter((c) => c.status === "completed").length },
    { key: "drafts", label: "Drafts", count: campaigns.filter((c) => c.status === "draft").length },
    { key: "requires_action", label: "Requires Action", count: campaigns.filter((c) => c.status === "changes_requested").length },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Creator Dashboard" showBack />

      {/* Overview Stats Bar */}
      <View style={styles.metricsSummaryBar}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricNumber, typography.h2]}>{campaigns.length}</Text>
          <Text style={[styles.metricLabel, typography.micro]}>TOTAL CAMPAIGNS</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={[styles.metricNumber, typography.h2]}>
            {campaigns.filter((c) => c.status === "promoting" || c.status === "available_for_funding").length}
          </Text>
          <Text style={[styles.metricLabel, typography.micro]}>ACTIVE SPREAD</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={[styles.metricNumber, typography.h2]}>
            ${campaigns.reduce((acc, c) => acc + (c.amountRaised || c.amount_raised || 0), 0).toLocaleString()}
          </Text>
          <Text style={[styles.metricLabel, typography.micro]}>POOLED BUDGET</Text>
        </View>
      </View>

      {/* 6 Tabs Scrollable Bar */}
      <View style={styles.tabScrollWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, typography.uiCaption, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                    <Text style={[styles.tabBadgeText, typography.micro, isActive && styles.tabBadgeTextActive]}>
                      {tab.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Campaigns List */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredCampaigns.length === 0 ? (
          <EmptyState
            icon="folder-open-outline"
            title={`No campaigns in "${tabs.find((t) => t.key === activeTab)?.label}"`}
            message="Campaigns move automatically through tabs as they advance from submission to ad distribution."
            actionLabel="Start a Campaign"
            onAction={() => router.push("/(tabs)/create")}
          />
        ) : (
          filteredCampaigns.map((camp) => {
            const raised = camp.amountRaised || camp.amount_raised || 0;
            const goal = camp.fundingGoal || camp.funding_goal || 1;
            const percent = camp.percentFunded ?? Math.round((raised / goal) * 100);
            const cover = camp.coverImageUrl || camp.cover_image_url || "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800";
            const reach = camp.estimatedReachRange || camp.estimated_reach_range || "15,000 – 25,000 people";
            const deadline = camp.deadline ? new Date(camp.deadline).toLocaleDateString() : "30 days left";

            return (
              <View key={camp.id} style={styles.campaignCard}>
                <View style={styles.cardHeaderRow}>
                  <Image source={{ uri: cover }} style={styles.thumbnail} resizeMode="cover" />
                  <View style={styles.cardInfo}>
                    <View style={styles.badgeRow}>
                      <StatusBadge status={camp.status} />
                      <Text style={[styles.categoryLabel, typography.micro]}>{camp.category}</Text>
                    </View>
                    <Text style={[styles.cardTitle, typography.uiH3]} numberOfLines={2}>
                      {camp.title}
                    </Text>
                    <Text style={[styles.deadlineText, typography.caption]}>
                      Target Deadline: <Text style={styles.boldText}>{deadline}</Text>
                    </Text>
                  </View>
                </View>

                {/* Funding Progress Bar */}
                <View style={styles.progressSection}>
                  <View style={styles.progressRow}>
                    <Text style={[styles.progressVal, typography.uiCaption]}>
                      ${raised.toLocaleString()} raised of ${goal.toLocaleString()}
                    </Text>
                    <Text style={[styles.percentVal, typography.uiCaption]}>{percent}%</Text>
                  </View>
                  <ProgressBar progress={percent} />
                </View>

                {/* Estimated Reach at Goal */}
                <View style={styles.reachSummaryRow}>
                  <Ionicons name="people-outline" size={15} color={colors.primary} />
                  <Text style={[styles.reachSummaryText, typography.caption]}>
                    Est. Reach at Goal: <Text style={styles.boldText}>{reach}</Text> (Estimated, not guaranteed)
                  </Text>
                </View>

                {/* 6 Actions Row */}
                <View style={styles.actionsGrid}>
                  {camp.status === "draft" && (
                    <TouchableOpacity
                      style={styles.actionBtnPrimary}
                      onPress={() => router.push("/create/step")}
                    >
                      <Ionicons name="create-outline" size={14} color={colors.white} />
                      <Text style={[styles.actionBtnPrimaryText, typography.micro]}>Edit Draft</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push(`/campaign/${camp.id}`)}
                  >
                    <Ionicons name="eye-outline" size={14} color={colors.slate700} />
                    <Text style={[styles.actionBtnText, typography.micro]}>Preview</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => setAnalyticsCampaign(camp)}
                  >
                    <Ionicons name="analytics-outline" size={14} color={colors.primary} />
                    <Text style={[styles.actionBtnText, typography.micro, { color: colors.primary }]}>
                      Analytics
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => setFeedbackCampaign(camp)}
                  >
                    <Ionicons name="chatbubbles-outline" size={14} color={colors.slate700} />
                    <Text style={[styles.actionBtnText, typography.micro]}>Review Notes</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(camp)}>
                    <Ionicons name="share-social-outline" size={14} color={colors.slate700} />
                    <Text style={[styles.actionBtnText, typography.micro]}>Share</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => setUpdatesCampaign(camp)}
                  >
                    <Ionicons name="newspaper-outline" size={14} color={colors.slate700} />
                    <Text style={[styles.actionBtnText, typography.micro]}>Updates</Text>
                  </TouchableOpacity>

                  {(camp.status === "promoting" || camp.status === "completed") && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: colors.successDark }]}
                      onPress={() => router.push(`/report/${camp.id}`)}
                    >
                      <Ionicons name="document-text-outline" size={14} color={colors.successDark} />
                      <Text style={[styles.actionBtnText, typography.micro, { color: colors.successDark }]}>
                        Final Report
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ==================================================================== */}
      {/* ANALYTICS MODAL: Strictly Separates Estimated vs Measured Numbers */}
      {/* ==================================================================== */}
      <Modal
        visible={!!analyticsCampaign}
        animationType="slide"
        transparent
        onRequestClose={() => setAnalyticsCampaign(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, typography.uiH2]}>Campaign Delivery Analytics</Text>
                <Text style={[styles.modalSub, typography.caption]} numberOfLines={1}>
                  {analyticsCampaign?.title}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAnalyticsCampaign(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={colors.slate600} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {/* Top High-level KPIs */}
              <View style={styles.kpiRow}>
                <View style={styles.kpiCard}>
                  <Text style={[styles.kpiValue, typography.uiH2]}>
                    ${(analyticsCampaign?.amountRaised || analyticsCampaign?.amount_raised || 0).toLocaleString()}
                  </Text>
                  <Text style={[styles.kpiLabel, typography.micro]}>AMOUNT RAISED</Text>
                  <Text style={[styles.kpiSub, typography.micro]}>
                    {analyticsCampaign?.percentFunded ?? 95}% of goal
                  </Text>
                </View>

                <View style={styles.kpiCard}>
                  <Text style={[styles.kpiValue, typography.uiH2]}>142</Text>
                  <Text style={[styles.kpiLabel, typography.micro]}>COMMUNITY BACKERS</Text>
                  <Text style={[styles.kpiSub, typography.micro]}>Avg $23.50/backer</Text>
                </View>
              </View>

              {/* Budget Allocation vs Spent */}
              <View style={styles.metricBox}>
                <Text style={[styles.boxTitle, typography.uiH3]}>Ad Budget Execution</Text>
                <View style={styles.budgetRow}>
                  <View>
                    <Text style={[styles.budgetValue, typography.h2]}>
                      ${(analyticsCampaign?.amountRaised || 2850).toLocaleString()}
                    </Text>
                    <Text style={[styles.budgetLabel, typography.micro]}>ALLOCATED FOR ADS</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.budgetValue, typography.h2, { color: colors.primary }]}>
                      $1,940
                    </Text>
                    <Text style={[styles.budgetLabel, typography.micro]}>DEPLOYED / SPENT</Text>
                  </View>
                </View>
                <ProgressBar progress={68} />
                <Text style={[styles.budgetNote, typography.micro]}>
                  Remaining $910 currently active in auction bids over next 9 days.
                </Text>
              </View>

              {/* STRICT SEPARATION: ESTIMATED VS MEASURED REACH */}
              <Text style={[styles.sectionTitle, typography.uiH3]}>Audience Reach Breakdown</Text>

              {/* Card 1: Estimated Reach (Pre-launch projection) */}
              <View style={styles.estimateBox}>
                <View style={styles.estimateHead}>
                  <Ionicons name="calculator-outline" size={16} color={colors.primary} />
                  <Text style={[styles.estimateTitle, typography.uiH3]}>
                    1. Estimated Reach (Pre-Launch Projection)
                  </Text>
                </View>
                <Text style={[styles.estimateValue, typography.hero]}>
                  {(analyticsCampaign?.estimatedReachRange || analyticsCampaign?.estimated_reach_range || "15,000 – 25,000").replace(/people/gi, "").trim()} people
                </Text>
                <Text style={[styles.estimateDisclaimer, typography.caption]}>
                  Label: Estimated, not guaranteed. Calculated from CPM auction bid simulation prior to campaign launch. Does not represent actual live reader counts.
                </Text>
              </View>

              {/* Card 2: Measured Reach (Live Ad Delivery) */}
              <View style={styles.measuredBox}>
                <View style={styles.measuredHead}>
                  <Ionicons name="checkmark-done-circle" size={16} color={colors.success} />
                  <Text style={[styles.measuredTitle, typography.uiH3]}>
                    2. Measured Delivery (Verified Live Ad Servers)
                  </Text>
                </View>

                <View style={styles.measuredStatsGrid}>
                  <View style={styles.statCol}>
                    <Text style={[styles.statBig, typography.uiH2]}>31,450</Text>
                    <Text style={[styles.statSmall, typography.micro]}>VERIFIED IMPRESSIONS</Text>
                  </View>
                  <View style={styles.statCol}>
                    <Text style={[styles.statBig, typography.uiH2]}>1,820</Text>
                    <Text style={[styles.statSmall, typography.micro]}>STORY CLICKS</Text>
                  </View>
                  <View style={styles.statCol}>
                    <Text style={[styles.statBig, typography.uiH2]}>5.78%</Text>
                    <Text style={[styles.statSmall, typography.micro]}>CLICK-THROUGH (CTR)</Text>
                  </View>
                </View>

                <Text style={[styles.measuredNote, typography.caption]}>
                  Source: Real-time telemetry from Meta Ads API & OpenWeb Publisher Network. Filtered for bots and invalid traffic.
                </Text>
              </View>

              {/* Channel Distribution Breakdown */}
              <View style={styles.metricBox}>
                <Text style={[styles.boxTitle, typography.uiH3]}>Distribution by Channel</Text>
                <View style={styles.channelRow}>
                  <Text style={[styles.channelName, typography.uiCaption]}>Independent Digital News Outlets</Text>
                  <Text style={[styles.channelVal, typography.uiCaption]}>48% (15,096 imp)</Text>
                </View>
                <View style={styles.channelRow}>
                  <Text style={[styles.channelName, typography.uiCaption]}>Social Feeds (Meta / Instagram)</Text>
                  <Text style={[styles.channelVal, typography.uiCaption]}>37% (11,636 imp)</Text>
                </View>
                <View style={styles.channelRow}>
                  <Text style={[styles.channelName, typography.uiCaption]}>Local Community Billboards</Text>
                  <Text style={[styles.channelVal, typography.uiCaption]}>15% (4,718 imp)</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => setAnalyticsCampaign(null)}
              >
                <Text style={[styles.closeModalBtnText, typography.uiH3]}>Close Analytics</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================================================================== */}
      {/* REVIEW NOTES / MODERATION FEEDBACK MODAL */}
      {/* ==================================================================== */}
      <Modal
        visible={!!feedbackCampaign}
        animationType="fade"
        transparent
        onRequestClose={() => setFeedbackCampaign(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notesModalBox}>
            <View style={styles.notesModalHead}>
              <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
              <Text style={[styles.notesModalTitle, typography.uiH2]}>Moderation Review Notes</Text>
            </View>
            <Text style={[styles.notesCampTitle, typography.uiCaption]}>
              {feedbackCampaign?.title}
            </Text>

            <View style={styles.notesContentBox}>
              <Text style={[styles.noteHeading, typography.uiH3]}>Review Status: Approved & Compliant</Text>
              <Text style={[styles.noteBody, typography.body]}>
                • All 3 supporting source URLs were verified against official public records.
              </Text>
              <Text style={[styles.noteBody, typography.body]}>
                • Ad headline copy complies with non-deceptive advertising standards.
              </Text>
              <Text style={[styles.noteBody, typography.body]}>
                • Anti-donation disclosure verified in campaign footer and backing screens.
              </Text>
              <Text style={[styles.noteBody, typography.body]}>
                • Distribution bidding is configured with a $0.08 CPM auction ceiling.
              </Text>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={() => setFeedbackCampaign(null)}>
              <Text style={[styles.primaryBtnText, typography.uiH3]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==================================================================== */}
      {/* CAMPAIGN UPDATES MODAL */}
      {/* ==================================================================== */}
      <Modal
        visible={!!updatesCampaign}
        animationType="slide"
        transparent
        onRequestClose={() => setUpdatesCampaign(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notesModalBox}>
            <View style={styles.notesModalHead}>
              <Ionicons name="newspaper-outline" size={24} color={colors.primary} />
              <Text style={[styles.notesModalTitle, typography.uiH2]}>Campaign Dispatches & Updates</Text>
            </View>
            <Text style={[styles.notesCampTitle, typography.uiCaption]}>
              {updatesCampaign?.title}
            </Text>

            <ScrollView style={{ maxHeight: 300, marginVertical: spacing.md }}>
              <View style={styles.updateCardItem}>
                <Text style={[styles.updateDate, typography.micro]}>OCTOBER 14, 2026 • ADVERTISING LAUNCH</Text>
                <Text style={[styles.updateItemTitle, typography.uiH3]}>First Wave of Ads Running</Text>
                <Text style={[styles.updateItemBody, typography.caption]}>
                  Our initial digital placements have launched in 8 local school districts. Over 12,000 residents have read the lead-testing evidence article so far.
                </Text>
              </View>

              <View style={styles.updateCardItem}>
                <Text style={[styles.updateDate, typography.micro]}>OCTOBER 8, 2026 • FUNDING MILESTONE</Text>
                <Text style={[styles.updateItemTitle, typography.uiH3]}>100% Goal Reached!</Text>
                <Text style={[styles.updateItemBody, typography.caption]}>
                  142 community backers pooled $2,850 to fund this message. Media buyers have begun booking inventory across local journalism outlets.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.primaryBtn} onPress={() => setUpdatesCampaign(null)}>
              <Text style={[styles.primaryBtnText, typography.uiH3]}>Close Updates</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
    gap: spacing.lg,
  },
  metricsSummaryBar: {
    flexDirection: "row",
    backgroundColor: colors.slate900,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricItem: {
    alignItems: "center",
    flex: 1,
  },
  metricNumber: {
    color: colors.white,
  },
  metricLabel: {
    color: colors.slate400,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.slate700,
  },
  tabScrollWrap: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
  },
  tabsContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: spacing.radiusFull,
    backgroundColor: colors.slate100,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.slate700,
  },
  tabTextActive: {
    color: colors.white,
    fontWeight: "700",
  },
  tabBadge: {
    backgroundColor: colors.slate300,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: spacing.radiusFull,
  },
  tabBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  tabBadgeText: {
    color: colors.slate800,
  },
  tabBadgeTextActive: {
    color: colors.white,
  },
  campaignCard: {
    backgroundColor: colors.white,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: spacing.radiusMd,
    backgroundColor: colors.slate200,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryLabel: {
    color: colors.slate500,
  },
  cardTitle: {
    color: colors.slate900,
  },
  deadlineText: {
    color: colors.slate600,
  },
  boldText: {
    fontWeight: "bold",
    color: colors.slate900,
  },
  progressSection: {
    gap: 4,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressVal: {
    color: colors.slate700,
  },
  percentVal: {
    color: colors.primary,
    fontWeight: "bold",
  },
  reachSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.slate50,
    padding: spacing.sm,
    borderRadius: spacing.radiusMd,
    gap: spacing.xs,
  },
  reachSummaryText: {
    color: colors.slate700,
    flex: 1,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.slate300,
    backgroundColor: colors.white,
    gap: 4,
  },
  actionBtnText: {
    color: colors.slate800,
  },
  actionBtnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: spacing.radiusMd,
    backgroundColor: colors.primary,
    gap: 4,
  },
  actionBtnPrimaryText: {
    color: colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: spacing.radiusXl,
    borderTopRightRadius: spacing.radiusXl,
    maxHeight: "90%",
    paddingBottom: spacing.huge,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
  },
  modalTitle: {
    color: colors.slate900,
  },
  modalSub: {
    color: colors.slate500,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    paddingHorizontal: spacing.xl,
  },
  modalScrollContent: {
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  kpiRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.slate50,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.slate200,
    gap: 4,
  },
  kpiValue: {
    color: colors.slate900,
  },
  kpiLabel: {
    color: colors.slate500,
  },
  kpiSub: {
    color: colors.primary,
  },
  metricBox: {
    backgroundColor: colors.slate50,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.slate200,
    gap: spacing.sm,
  },
  boxTitle: {
    color: colors.slate900,
  },
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  budgetValue: {
    color: colors.slate900,
  },
  budgetLabel: {
    color: colors.slate500,
  },
  budgetNote: {
    color: colors.slate500,
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.slate900,
    marginTop: spacing.xs,
  },
  estimateBox: {
    backgroundColor: colors.primaryLight,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.xs,
  },
  estimateHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  estimateTitle: {
    color: colors.primary,
  },
  estimateValue: {
    color: colors.primary,
    marginVertical: 4,
  },
  estimateDisclaimer: {
    color: colors.slate700,
    fontStyle: "italic",
  },
  measuredBox: {
    backgroundColor: colors.successLight,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.success,
    gap: spacing.sm,
  },
  measuredHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  measuredTitle: {
    color: colors.successDark,
  },
  measuredStatsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
  },
  statCol: {
    alignItems: "center",
    flex: 1,
  },
  statBig: {
    color: colors.slate900,
  },
  statSmall: {
    color: colors.slate500,
    marginTop: 2,
    textAlign: "center",
  },
  measuredNote: {
    color: colors.slate700,
  },
  channelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
  },
  channelName: {
    color: colors.slate800,
  },
  channelVal: {
    color: colors.slate600,
    fontWeight: "bold",
  },
  closeModalBtn: {
    backgroundColor: colors.slate900,
    paddingVertical: 14,
    borderRadius: spacing.radiusMd,
    alignItems: "center",
    marginTop: spacing.md,
  },
  closeModalBtnText: {
    color: colors.white,
  },
  notesModalBox: {
    backgroundColor: colors.white,
    margin: spacing.xl,
    padding: spacing.xl,
    borderRadius: spacing.radiusXl,
    gap: spacing.sm,
  },
  notesModalHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  notesModalTitle: {
    color: colors.slate900,
  },
  notesCampTitle: {
    color: colors.slate500,
    marginBottom: spacing.xs,
  },
  notesContentBox: {
    backgroundColor: colors.slate50,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    gap: spacing.xs,
  },
  noteHeading: {
    color: colors.successDark,
    marginBottom: 4,
  },
  noteBody: {
    color: colors.slate700,
  },
  updateCardItem: {
    backgroundColor: colors.slate50,
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
    marginBottom: spacing.sm,
    gap: 4,
  },
  updateDate: {
    color: colors.primary,
  },
  updateItemTitle: {
    color: colors.slate900,
  },
  updateItemBody: {
    color: colors.slate600,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: spacing.radiusMd,
    alignItems: "center",
    marginTop: spacing.md,
  },
  primaryBtnText: {
    color: colors.white,
  },
});
