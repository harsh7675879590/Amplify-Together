import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Campaign, Contribution } from "../../lib/types";
import { api } from "../../lib/api";
import { StatusBadge } from "../../components/StatusBadge";
import { ProgressBar } from "../../components/ProgressBar";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing } from "../../theme/spacing";

export default function ProfileScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"created" | "backed" | "history">("created");
  const [createdCampaigns, setCreatedCampaigns] = useState<Campaign[]>([]);
  const [backedList, setBackedList] = useState<Contribution[]>([]);
  const [reviewerMode, setReviewerMode] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allCamps, contribs, queue] = await Promise.all([
        api.getCampaigns({ status: undefined }),
        api.getMyContributions().catch(() => []),
        api.getReviewQueue().catch(() => []),
      ]);
      setCreatedCampaigns(
        allCamps.filter((c: any) => {
          const name = c.creator_name || c.creatorName || "";
          return (
            name.includes("Maya") ||
            name.includes("Safe Schools") ||
            name.includes("Cascadia")
          );
        })
      );

      setReviewQueue(queue);
      setBackedList(contribs);
    } catch (e) {
      console.warn("Failed to load profile data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [reviewerMode]);

  const handleApprove = async (campId: string) => {
    try {
      await api.approveCampaign(campId);
      Alert.alert("Approved", "Campaign verified and opened for public funding!");
      loadData();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleAdvance = async (campId: string) => {
    try {
      const res = await api.advanceDemoStage(campId);
      Alert.alert("Stage Advanced", `Campaign lifecycle transitioned from ${res.old_status} to ${res.new_status}!`);
      loadData();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>ML</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, typography.h2]}>Maya Lin</Text>
            <Text style={[styles.userEmail, typography.caption]}>maya.lin@civicnet.org</Text>
            <View style={styles.roleBadgeRow}>
              <View style={styles.roleBadge}>
                <Text style={[styles.roleBadgeText, typography.micro]}>CREATOR & BACKER</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Reviewer / Admin Demo Mode Toggle */}
        <View style={styles.reviewerToggleCard}>
          <View style={styles.reviewerToggleTextWrap}>
            <View style={styles.reviewerTitleRow}>
              <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
              <Text style={[styles.reviewerTitle, typography.h3]}>Reviewer / Admin Mode</Text>
            </View>
            <Text style={[styles.reviewerSub, typography.caption]}>
              Inspect review queue, approve submissions, and test lifecycle states.
            </Text>
          </View>
          <Switch
            value={reviewerMode}
            onValueChange={setReviewerMode}
            trackColor={{ false: colors.slate300, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>

        {/* If Reviewer Mode is active, show the Review Queue */}
        {reviewerMode && (
          <View style={styles.adminSection}>
            <View style={styles.adminHeader}>
              <Text style={[styles.adminSectionTitle, typography.h2]}>Review & Moderation Queue</Text>
              <Text style={[styles.adminSectionSub, typography.caption]}>
                Audit fact-checking, claims, ad copy, and targeting before opening public backing.
              </Text>
            </View>

            {reviewQueue.length === 0 ? (
              <View style={styles.emptyQueueBox}>
                <Ionicons name="checkmark-done-circle" size={32} color={colors.success} />
                <Text style={[styles.emptyQueueText, typography.body]}>
                  Review queue is clean! No campaigns pending review.
                </Text>
              </View>
            ) : (
              reviewQueue.map((c) => (
                <View key={c.id} style={styles.queueCard}>
                  <View style={styles.queueHeader}>
                    <Text style={[styles.queueTitle, typography.h3]}>{c.title}</Text>
                    <StatusBadge status={c.status} />
                  </View>
                  <Text style={[styles.queueCreator, typography.caption]}>
                    Submitted by: {c.creator_name} ({c.category})
                  </Text>
                  <Text style={[styles.queueSummary, typography.body]} numberOfLines={2}>
                    {c.summary}
                  </Text>

                  {/* Sources inspection */}
                  <View style={styles.sourcesBox}>
                    <Text style={[styles.sourcesHeader, typography.micro]}>
                      VERIFIABLE SOURCES ({c.sources?.length || 0}):
                    </Text>
                    {(c.sources || []).map((s, idx) => (
                      <Text key={idx} style={[styles.sourceItemText, typography.caption]} numberOfLines={1}>
                        • {s.title} ({s.url})
                      </Text>
                    ))}
                  </View>

                  {/* Review Actions */}
                  <View style={styles.adminActionRow}>
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => handleApprove(c.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark" size={16} color={colors.white} />
                      <Text style={[styles.approveBtnText, typography.micro]}>Approve & Open Funding</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.advanceBtn}
                      onPress={() => handleAdvance(c.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="play-forward" size={16} color={colors.slate800} />
                      <Text style={[styles.advanceBtnText, typography.micro]}>Advance Stage</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Standard Profile Navigation Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "created" && styles.tabButtonActive]}
            onPress={() => setActiveTab("created")}
          >
            <Text
              style={[
                styles.tabButtonText,
                typography.h3,
                activeTab === "created" && styles.tabButtonTextActive,
              ]}
            >
              Created ({createdCampaigns.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === "backed" && styles.tabButtonActive]}
            onPress={() => setActiveTab("backed")}
          >
            <Text
              style={[
                styles.tabButtonText,
                typography.h3,
                activeTab === "backed" && styles.tabButtonTextActive,
              ]}
            >
              Backed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === "history" && styles.tabButtonActive]}
            onPress={() => setActiveTab("history")}
          >
            <Text
              style={[
                styles.tabButtonText,
                typography.h3,
                activeTab === "history" && styles.tabButtonTextActive,
              ]}
            >
              Payments
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Created Campaigns */}
        {activeTab === "created" && (
          <View style={styles.tabContent}>
            {createdCampaigns.map((camp) => {
              const percent = camp.funding_goal > 0
                ? Math.round((camp.amount_raised / camp.funding_goal) * 100)
                : 0;

              return (
                <TouchableOpacity
                  key={camp.id}
                  style={styles.createdCard}
                  onPress={() => router.push(`/campaign/${camp.id}`)}
                  activeOpacity={0.88}
                >
                  <View style={styles.cardTopRow}>
                    <Text style={[styles.campTitle, typography.h3]} numberOfLines={1}>
                      {camp.title}
                    </Text>
                    <StatusBadge status={camp.status} />
                  </View>

                  <Text style={[styles.campSummary, typography.body]} numberOfLines={2}>
                    {camp.summary}
                  </Text>

                  <View style={styles.cardStatsRow}>
                    <Text style={[styles.statsMoney, typography.caption]}>
                      ${camp.amount_raised.toLocaleString()} raised of ${camp.funding_goal.toLocaleString()}
                    </Text>
                    <Text style={[styles.statsPercent, typography.micro]}>{percent}%</Text>
                  </View>

                  <ProgressBar percent={percent} height={6} />

                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.viewDetailsBtn}
                      onPress={() => router.push(`/campaign/${camp.id}`)}
                    >
                      <Text style={[styles.viewDetailsText, typography.micro]}>View Page</Text>
                    </TouchableOpacity>

                    {camp.status === "completed" && (
                      <TouchableOpacity
                        style={styles.viewReportBtn}
                        onPress={() => router.push(`/report/${camp.id}`)}
                      >
                        <Text style={[styles.viewReportText, typography.micro]}>Distribution Report</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Tab 2: Backed Campaigns */}
        {activeTab === "backed" && (
          <View style={styles.tabContent}>
            <View style={styles.backedSummaryBox}>
              <View style={styles.backedStat}>
                <Text style={[styles.backedStatNumber, typography.h1]}>$150</Text>
                <Text style={[styles.backedStatLabel, typography.caption]}>Total Backed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.backedStat}>
                <Text style={[styles.backedStatNumber, typography.h1]}>~17,100</Text>
                <Text style={[styles.backedStatLabel, typography.caption]}>People Reached</Text>
              </View>
            </View>

            {/* Backed Item 1 */}
            <View style={styles.backedItemCard}>
              <View style={styles.backedHeader}>
                <Text style={[styles.backedCampaignTitle, typography.h3]}>
                  Clean drinking water in every public school
                </Text>
                <Text style={[styles.backedAmount, typography.h2]}>$100</Text>
              </View>
              <Text style={[styles.backedNotice, typography.caption]}>
                Funded ~11,400 ad impressions in Tri-County School District.
              </Text>
              <View style={styles.privacyTag}>
                <Ionicons name="lock-closed" size={12} color={colors.slate500} />
                <Text style={[styles.privacyTagText, typography.micro]}>Anonymous Contribution</Text>
              </View>
            </View>

            {/* Backed Item 2 */}
            <View style={styles.backedItemCard}>
              <View style={styles.backedHeader}>
                <Text style={[styles.backedCampaignTitle, typography.h3]}>
                  Redraw the bus network around where people work
                </Text>
                <Text style={[styles.backedAmount, typography.h2]}>$50</Text>
              </View>
              <Text style={[styles.backedNotice, typography.caption]}>
                Funded ~5,700 ad impressions in Eastside Commuter Corridor.
              </Text>
              <View style={styles.privacyTag}>
                <Ionicons name="lock-closed" size={12} color={colors.slate500} />
                <Text style={[styles.privacyTagText, typography.micro]}>Anonymous Contribution</Text>
              </View>
            </View>
          </View>
        )}

        {/* Tab 3: Payment History */}
        {activeTab === "history" && (
          <View style={styles.tabContent}>
            <View style={styles.receiptCard}>
              <View style={styles.receiptTopRow}>
                <View>
                  <Text style={[styles.receiptMerchant, typography.h3]}>Amplify Together Distribution</Text>
                  <Text style={[styles.receiptDate, typography.caption]}>March 14, 2025 • Card ending 4242</Text>
                </View>
                <Text style={[styles.receiptTotal, typography.h2]}>$103.20</Text>
              </View>

              <View style={styles.receiptLine}>
                <Text style={[styles.lineLabel, typography.caption]}>Contribution for message distribution</Text>
                <Text style={[styles.lineVal, typography.caption]}>$100.00</Text>
              </View>
              <View style={styles.receiptLine}>
                <Text style={[styles.lineLabel, typography.caption]}>Card processing fee (2.9% + $0.30)</Text>
                <Text style={[styles.lineVal, typography.caption]}>$3.20</Text>
              </View>
              <View style={styles.receiptStatusPill}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={[styles.receiptStatusText, typography.micro]}>SUCCEEDED • RECEIPT #AMP-84920</Text>
              </View>
            </View>

            <View style={styles.receiptCard}>
              <View style={styles.receiptTopRow}>
                <View>
                  <Text style={[styles.receiptMerchant, typography.h3]}>Amplify Together Distribution</Text>
                  <Text style={[styles.receiptDate, typography.caption]}>March 12, 2025 • Card ending 4242</Text>
                </View>
                <Text style={[styles.receiptTotal, typography.h2]}>$51.75</Text>
              </View>

              <View style={styles.receiptLine}>
                <Text style={[styles.lineLabel, typography.caption]}>Contribution for message distribution</Text>
                <Text style={[styles.lineVal, typography.caption]}>$50.00</Text>
              </View>
              <View style={styles.receiptLine}>
                <Text style={[styles.lineLabel, typography.caption]}>Card processing fee (2.9% + $0.30)</Text>
                <Text style={[styles.lineVal, typography.caption]}>$1.75</Text>
              </View>
              <View style={styles.receiptStatusPill}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={[styles.receiptStatusText, typography.micro]}>SUCCEEDED • RECEIPT #AMP-84919</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.slate50,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  avatarText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "700",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: colors.slate900,
  },
  userEmail: {
    color: colors.slate500,
    marginBottom: 4,
  },
  roleBadgeRow: {
    flexDirection: "row",
  },
  roleBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    color: colors.primary,
    fontWeight: "700",
  },
  reviewerToggleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1.5,
    borderColor: colors.slate300,
    marginBottom: spacing.lg,
  },
  reviewerToggleTextWrap: {
    flex: 1,
    marginRight: spacing.md,
  },
  reviewerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  reviewerTitle: {
    color: colors.slate900,
  },
  reviewerSub: {
    color: colors.slate500,
  },
  adminSection: {
    backgroundColor: "#F8FAFF",
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: spacing.radiusLg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  adminHeader: {
    marginBottom: spacing.md,
  },
  adminSectionTitle: {
    color: colors.primaryDark,
  },
  adminSectionSub: {
    color: colors.slate600,
    marginTop: 2,
  },
  emptyQueueBox: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  emptyQueueText: {
    color: colors.slate600,
    textAlign: "center",
  },
  queueCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.slate200,
    marginBottom: spacing.md,
  },
  queueHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  queueTitle: {
    color: colors.slate900,
    flex: 1,
    marginRight: spacing.sm,
  },
  queueCreator: {
    color: colors.slate500,
    marginBottom: spacing.xs,
  },
  queueSummary: {
    color: colors.slate600,
    marginBottom: spacing.sm,
  },
  sourcesBox: {
    backgroundColor: colors.slate50,
    padding: spacing.sm,
    borderRadius: spacing.radiusSm,
    marginBottom: spacing.md,
  },
  sourcesHeader: {
    color: colors.slate500,
    marginBottom: 2,
  },
  sourceItemText: {
    color: colors.primary,
  },
  adminActionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  approveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 9,
    borderRadius: spacing.radiusSm,
    gap: 4,
  },
  approveBtnText: {
    color: colors.white,
    fontWeight: "700",
  },
  advanceBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.slate100,
    borderWidth: 1,
    borderColor: colors.slate300,
    paddingVertical: 9,
    borderRadius: spacing.radiusSm,
    gap: 4,
  },
  advanceBtnText: {
    color: colors.slate800,
    fontWeight: "700",
  },
  tabsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
    marginBottom: spacing.lg,
  },
  tabButton: {
    paddingVertical: spacing.md,
    marginRight: spacing.xl,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabButtonText: {
    color: colors.slate500,
  },
  tabButtonTextActive: {
    color: colors.primary,
  },
  tabContent: {
    gap: spacing.md,
  },
  createdCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  campTitle: {
    color: colors.slate900,
    flex: 1,
    marginRight: spacing.sm,
  },
  campSummary: {
    color: colors.slate600,
    marginBottom: spacing.md,
  },
  cardStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  statsMoney: {
    color: colors.slate700,
    fontWeight: "600",
  },
  statsPercent: {
    color: colors.primary,
    fontWeight: "700",
  },
  cardActionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  viewDetailsBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.slate100,
    borderRadius: spacing.radiusSm,
  },
  viewDetailsText: {
    color: colors.slate700,
  },
  viewReportBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.successLight,
    borderRadius: spacing.radiusSm,
  },
  viewReportText: {
    color: colors.successDark,
  },
  backedSummaryBox: {
    flexDirection: "row",
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.md,
  },
  backedStat: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.slate200,
  },
  backedStatNumber: {
    color: colors.primary,
  },
  backedStatLabel: {
    color: colors.slate500,
    marginTop: 2,
  },
  backedItemCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  backedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xs,
  },
  backedCampaignTitle: {
    color: colors.slate900,
    flex: 1,
    marginRight: spacing.md,
  },
  backedAmount: {
    color: colors.primary,
  },
  backedNotice: {
    color: colors.slate600,
    marginBottom: spacing.sm,
  },
  privacyTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  privacyTagText: {
    color: colors.slate500,
  },
  receiptCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.md,
  },
  receiptTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
    paddingBottom: spacing.sm,
  },
  receiptMerchant: {
    color: colors.slate900,
  },
  receiptDate: {
    color: colors.slate500,
  },
  receiptTotal: {
    color: colors.slate900,
  },
  receiptLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  lineLabel: {
    color: colors.slate600,
  },
  lineVal: {
    color: colors.slate800,
    fontWeight: "600",
  },
  receiptStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: spacing.md,
    alignSelf: "flex-start",
  },
  receiptStatusText: {
    color: colors.successDark,
  },
});
