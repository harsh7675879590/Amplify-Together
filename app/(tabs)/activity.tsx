import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { NotificationItem } from "../../lib/types";
import { api } from "../../lib/api";
import { EmptyState } from "../../components/EmptyState";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing } from "../../theme/spacing";

export default function ActivityScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  const loadActivity = async () => {
    try {
      setLoading(true);
      const data = await api.getActivity();
      setNotifications(data);
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
      default:
        return { name: "notifications" as const, color: colors.slate600, bg: colors.slate100 };
    }
  };

  const filteredNotifs = notifications.filter((n) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "milestones") return n.type === "milestone";
    if (activeFilter === "promotions") return n.type === "promotion" || n.type === "report";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Text style={[styles.title, typography.h1]}>Activity</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={[styles.unreadBadgeText, typography.micro]}>
                  {unreadCount} NEW
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.subtitle, typography.caption]}>
            Milestones, reviews, and ad distribution updates
          </Text>

          {/* Filter Pills */}
          <View style={styles.filterRow}>
            {[
              { key: "all", label: "All Updates" },
              { key: "milestones", label: "Funding Milestones" },
              { key: "promotions", label: "Ad Delivery & Reports" },
            ].map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterBtn, activeFilter === f.key && styles.filterBtnActive]}
                onPress={() => setActiveFilter(f.key)}
              >
                <Text
                  style={[
                    styles.filterBtnText,
                    typography.caption,
                    activeFilter === f.key && styles.filterBtnTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notifications List */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredNotifs.length === 0 ? (
            <EmptyState
              icon="notifications-off-outline"
              title="No notifications yet"
              message="When your campaigns reach funding milestones or begin advertising distribution, updates will appear here."
            />
          ) : (
            filteredNotifs.map((item) => {
              const iconMeta = getNotificationIcon(item.type);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.notifCard, !item.is_read && styles.notifCardUnread]}
                  onPress={() => {
                    handleMarkRead(item.id);
                    if (item.campaign_id) {
                      if (item.type === "report") {
                        router.push(`/report/${item.campaign_id}`);
                      } else {
                        router.push(`/campaign/${item.campaign_id}`);
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
                      <Text style={[styles.notifTitle, typography.h3]}>{item.title}</Text>
                      {!item.is_read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={[styles.notifBody, typography.body]}>{item.body}</Text>
                    <View style={styles.cardFooter}>
                      <Text style={[styles.timeText, typography.micro]}>
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                      {item.campaign_id && (
                        <Text style={[styles.viewLink, typography.micro]}>
                          View details ➔
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
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
    gap: spacing.sm,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: spacing.radiusFull,
    backgroundColor: colors.slate100,
  },
  filterBtnActive: {
    backgroundColor: colors.slate900,
  },
  filterBtnText: {
    color: colors.slate600,
    fontWeight: "600",
  },
  filterBtnTextActive: {
    color: colors.white,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
  },
  notifCard: {
    flexDirection: "row",
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.md,
    alignItems: "flex-start",
  },
  notifCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    backgroundColor: "#F8FAFF",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  notifTextWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
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
    marginLeft: spacing.xs,
  },
  notifBody: {
    color: colors.slate600,
    marginBottom: spacing.sm,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeText: {
    color: colors.slate400,
  },
  viewLink: {
    color: colors.primary,
    fontWeight: "700",
  },
});
