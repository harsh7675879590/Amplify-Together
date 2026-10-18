import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Modal,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { NotificationItem, Campaign } from "../../types";
import { api } from "../../lib/api";
import { EmptyState } from "../../components/EmptyState";
import { ProgressBar } from "../../components/ProgressBar";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing } from "../../theme/spacing";

export default function ActivityScreen() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [followedCampaigns, setFollowedCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "milestones" | "reports">("all");

  // Notification Settings Modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [prefMilestones, setPrefMilestones] = useState(true);
  const [prefApprovals, setPrefApprovals] = useState(true);
  const [prefContributions, setPrefContributions] = useState(true);
  const [prefDistribution, setPrefDistribution] = useState(true);
  const [prefSecurity, setPrefSecurity] = useState(true);

  const loadActivity = async () => {
    try {
      setLoading(true);
      const [notifs, allCamps] = await Promise.all([
        api.getActivity(),
        api.getCampaigns({}),
      ]);
      setNotifications(notifs);
      // Select 2 followed campaigns for demo
      setFollowedCampaigns(allCamps.slice(0, 2));
    } catch (e) {
      console.warn("Failed to load activity", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadActivity();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadActivity();
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.markActivityRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (e) {
      console.warn("Failed to mark read", e);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "milestone":
        return { name: "trending-up" as const, color: colors.amberDark, bg: colors.amberLight };
      case "promotion":
        return { name: "megaphone" as const, color: colors.primary, bg: colors.primaryLight };
      case "report":
      case "completed":
        return { name: "bar-chart" as const, color: colors.successDark, bg: colors.successLight };
      case "submission":
      case "approval":
        return { name: "checkmark-circle" as const, color: colors.primary, bg: colors.primaryLight };
      case "security":
        return { name: "shield-checkmark" as const, color: colors.slate800, bg: colors.slate200 };
      default:
        return { name: "notifications" as const, color: colors.slate600, bg: colors.slate100 };
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filteredNotifs = notifications.filter((n) => {
    if (activeFilter === "unread") return !n.is_read;
    if (activeFilter === "milestones") return n.type === "milestone";
    if (activeFilter === "reports") return n.type === "report" || n.type === "promotion" || n.type === "completed";
    return true;
  });

  // Group notifications into Today vs Earlier
  const today = new Date().toDateString();
  const todayNotifs = filteredNotifs.filter((n) => {
    const d = new Date(n.created_at || n.createdAt || Date.now()).toDateString();
    return d === today;
  });
  const earlierNotifs = filteredNotifs.filter((n) => {
    const d = new Date(n.created_at || n.createdAt || Date.now()).toDateString();
    return d !== today;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={[styles.title, typography.uiH1]}>Activity</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={[styles.unreadBadgeText, typography.micro]}>{unreadCount} NEW</Text>
                </View>
              )}
            </View>

            <View style={styles.headerRightActions}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
                  <Text style={[styles.markAllBtnText, typography.micro]}>Mark all as read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowSettingsModal(true)} style={styles.settingsIconBtn}>
                <Ionicons name="options-outline" size={22} color={colors.slate700} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.subtitle, typography.caption]}>
            Followed messages, review decisions, and live ad delivery milestones.
          </Text>

          {/* Filter Pills */}
          <View style={styles.filterRow}>
            {[
              { key: "all", label: "All Updates" },
              { key: "unread", label: "Unread" },
              { key: "milestones", label: "Milestones" },
              { key: "reports", label: "Reports" },
            ].map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterBtn, activeFilter === f.key && styles.filterBtnActive]}
                onPress={() => setActiveFilter(f.key as any)}
              >
                <Text
                  style={[
                    styles.filterBtnText,
                    typography.uiCaption,
                    activeFilter === f.key && styles.filterBtnTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Followed Campaigns Section with Live Funding Progress */}
          {followedCampaigns.length > 0 && (
            <View style={styles.followedSection}>
              <View style={styles.followedHeaderRow}>
                <Ionicons name="heart" size={16} color={colors.primary} />
                <Text style={[styles.followedHeaderTitle, typography.uiH3]}>Followed Campaigns (Live Progress)</Text>
              </View>

              <View style={styles.followedList}>
                {followedCampaigns.map((camp) => {
                  const raised = camp.amountRaised || camp.amount_raised || 0;
                  const goal = camp.fundingGoal || camp.funding_goal || 1;
                  const percent = camp.percentFunded ?? Math.round((raised / goal) * 100);

                  return (
                    <TouchableOpacity
                      key={camp.id}
                      style={styles.followedCard}
                      onPress={() => router.push(`/campaign/${camp.id}`)}
                      activeOpacity={0.88}
                    >
                      <View style={styles.followedTop}>
                        <Text style={[styles.followedTitle, typography.uiH3]} numberOfLines={1}>
                          {camp.title}
                        </Text>
                        <Text style={[styles.followedPercent, typography.micro]}>{percent}%</Text>
                      </View>
                      <ProgressBar progress={percent} />
                      <View style={styles.followedBottom}>
                        <Text style={[styles.followedAmount, typography.caption]}>
                          ${raised.toLocaleString()} / ${goal.toLocaleString()}
                        </Text>
                        <Text style={[styles.followedLink, typography.micro]}>View Story ➔</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Group 1: Today */}
          {todayNotifs.length > 0 && (
            <View style={styles.groupSection}>
              <Text style={[styles.groupHeader, typography.micro]}>TODAY</Text>
              {todayNotifs.map((item) => renderNotificationCard(item))}
            </View>
          )}

          {/* Group 2: Earlier */}
          {earlierNotifs.length > 0 && (
            <View style={styles.groupSection}>
              <Text style={[styles.groupHeader, typography.micro]}>EARLIER</Text>
              {earlierNotifs.map((item) => renderNotificationCard(item))}
            </View>
          )}

          {/* Empty State */}
          {filteredNotifs.length === 0 && (
            <EmptyState
              icon="notifications-off-outline"
              title="No notifications in this filter"
              message="When your followed campaigns achieve milestones or publish distribution telemetry, you will see alerts here."
            />
          )}
        </ScrollView>
      </View>

      {/* ==================================================================== */}
      {/* NOTIFICATION SETTINGS MODAL */}
      {/* ==================================================================== */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, typography.uiH2]}>Notification Preferences</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <Ionicons name="close" size={24} color={colors.slate600} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSub, typography.caption]}>
              Choose which campaign milestones and distribution events trigger high-priority alerts.
            </Text>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleTitle, typography.uiH3]}>Funding Milestones</Text>
                <Text style={[styles.toggleDesc, typography.caption]}>
                  Alerts when followed campaigns reach 25%, 50%, and 100% of their goal.
                </Text>
              </View>
              <Switch
                value={prefMilestones}
                onValueChange={setPrefMilestones}
                trackColor={{ false: colors.slate300, true: colors.primary }}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleTitle, typography.uiH3]}>Moderation & Review Decisions</Text>
                <Text style={[styles.toggleDesc, typography.caption]}>
                  Status updates for campaigns submitted for reviewer audit.
                </Text>
              </View>
              <Switch
                value={prefApprovals}
                onValueChange={setPrefApprovals}
                trackColor={{ false: colors.slate300, true: colors.primary }}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleTitle, typography.uiH3]}>Backer Receipts & Contributions</Text>
                <Text style={[styles.toggleDesc, typography.caption]}>
                  Confirmations and transaction receipts for pooled advertising funds.
                </Text>
              </View>
              <Switch
                value={prefContributions}
                onValueChange={setPrefContributions}
                trackColor={{ false: colors.slate300, true: colors.primary }}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleTitle, typography.uiH3]}>Ad Distribution & Final Reports</Text>
                <Text style={[styles.toggleDesc, typography.caption]}>
                  Alerts when advertising launches in public feeds and final reports publish.
                </Text>
              </View>
              <Switch
                value={prefDistribution}
                onValueChange={setPrefDistribution}
                trackColor={{ false: colors.slate300, true: colors.primary }}
              />
            </View>

            <TouchableOpacity
              style={styles.savePrefsBtn}
              onPress={() => setShowSettingsModal(false)}
            >
              <Text style={[styles.savePrefsBtnText, typography.uiH3]}>Save Preferences</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );

  function renderNotificationCard(item: NotificationItem) {
    const iconMeta = getNotificationIcon(item.type);
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.notifCard, !item.is_read && styles.notifCardUnread]}
        onPress={() => {
          handleMarkRead(item.id);
          const campId = item.campaign_id || item.campaignId;
          if (campId) {
            if (item.type === "report" || item.type === "completed") {
              router.push(`/report/${campId}`);
            } else {
              router.push(`/campaign/${campId}`);
            }
          }
        }}
        activeOpacity={0.88}
      >
        <View style={[styles.iconBox, { backgroundColor: iconMeta.bg }]}>
          <Ionicons name={iconMeta.name} size={20} color={iconMeta.color} />
        </View>

        <View style={styles.notifTextWrap}>
          <View style={styles.titleRow}>
            <Text style={[styles.notifTitle, typography.uiH3]}>{item.title}</Text>
            {!item.is_read && <View style={styles.unreadDot} />}
          </View>
          <Text style={[styles.notifBody, typography.body]}>{item.body}</Text>
          <View style={styles.cardFooter}>
            <Text style={[styles.timeText, typography.micro]}>
              {new Date(item.created_at || item.createdAt || Date.now()).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </Text>
            {(item.campaign_id || item.campaignId) && (
              <Text style={[styles.viewLink, typography.micro]}>View details ➔</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }
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
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: colors.slate900,
  },
  unreadBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: spacing.radiusFull,
  },
  unreadBadgeText: {
    color: colors.primary,
    fontWeight: "700",
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  markAllBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  markAllBtnText: {
    color: colors.primary,
  },
  settingsIconBtn: {
    padding: 4,
  },
  subtitle: {
    color: colors.slate500,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  filterBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: spacing.radiusFull,
    backgroundColor: colors.slate100,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
  },
  filterBtnText: {
    color: colors.slate700,
  },
  filterBtnTextActive: {
    color: colors.white,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
    gap: spacing.lg,
  },
  followedSection: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.sm,
  },
  followedHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 4,
  },
  followedHeaderTitle: {
    color: colors.slate900,
  },
  followedList: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  followedCard: {
    backgroundColor: colors.slate50,
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
    gap: 6,
  },
  followedTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  followedTitle: {
    color: colors.slate900,
    flex: 1,
    marginRight: spacing.sm,
  },
  followedPercent: {
    color: colors.primary,
    fontWeight: "bold",
  },
  followedBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  followedAmount: {
    color: colors.slate600,
  },
  followedLink: {
    color: colors.primary,
  },
  groupSection: {
    gap: spacing.sm,
  },
  groupHeader: {
    color: colors.slate500,
    marginLeft: 4,
  },
  notifCard: {
    flexDirection: "row",
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.md,
  },
  notifCardUnread: {
    borderColor: colors.primary,
    backgroundColor: "#F8FAFC",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  notifTextWrap: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notifTitle: {
    color: colors.slate900,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 6,
  },
  notifBody: {
    color: colors.slate600,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  timeText: {
    color: colors.slate400,
  },
  viewLink: {
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: colors.white,
    borderTopLeftRadius: spacing.radiusXl,
    borderTopRightRadius: spacing.radiusXl,
    padding: spacing.xl,
    paddingBottom: spacing.huge,
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    color: colors.slate900,
  },
  modalSub: {
    color: colors.slate600,
    marginBottom: spacing.xs,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
    gap: spacing.md,
  },
  toggleTitle: {
    color: colors.slate900,
  },
  toggleDesc: {
    color: colors.slate500,
    marginTop: 2,
  },
  savePrefsBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: spacing.radiusMd,
    alignItems: "center",
    marginTop: spacing.md,
  },
  savePrefsBtnText: {
    color: colors.white,
  },
});
