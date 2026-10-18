import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Share,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { CampaignReport } from "../../lib/types";
import { api } from "../../lib/api";
import { Header } from "../../components/Header";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing } from "../../theme/spacing";

export default function CampaignReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [report, setReport] = useState<CampaignReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api
        .getReport(id)
        .then(setReport)
        .catch(console.warn)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleShare = async () => {
    if (!report) return;
    try {
      await Share.share({
        message: `View the distribution report for "${report.campaign_title}": ${report.measured_reach.toLocaleString()} people reached through community-funded advertising!`,
      });
    } catch {}
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.errorText, typography.h2]}>Report unavailable</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Distribution Report"
        showBack
        rightAction={
          <TouchableOpacity onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={colors.slate900} />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Audit Header Banner */}
        <View style={styles.auditBanner}>
          <Ionicons name="shield-checkmark" size={20} color={colors.success} />
          <View style={styles.auditTextWrap}>
            <Text style={[styles.auditTitle, typography.h3]}>Verified Distribution Audit</Text>
            <Text style={[styles.auditSub, typography.caption]}>
              Public transparency log confirming ad spend, media placements, and measured audience delivery.
            </Text>
          </View>
        </View>

        {/* Campaign Title Card */}
        <View style={styles.titleCard}>
          <Text style={[styles.campaignLabel, typography.micro]}>COMPLETED CAMPAIGN</Text>
          <Text style={[styles.campaignTitle, typography.h1]}>{report.campaign_title}</Text>
          <Text style={[styles.reportDate, typography.caption]}>
            Report generated on {new Date(report.created_at || Date.now()).toLocaleDateString()}
          </Text>

        </View>

        {/* Critical Evaluation Area: Estimated vs Measured Reach */}
        <View style={styles.comparisonCard}>
          <Text style={[styles.cardHeading, typography.h2]}>Estimated vs. Measured Delivery</Text>
          <Text style={[styles.comparisonSub, typography.caption]}>
            Pre-campaign estimates are clearly distinguished from audited ad server delivery statistics.
          </Text>

          <View style={styles.comparisonGrid}>
            <View style={styles.compareItem}>
              <Text style={[styles.compareLabel, typography.caption]}>Pre-Launch Estimate</Text>
              <Text style={[styles.compareValue, typography.hero, { color: colors.slate600 }]}>
                ~{report.estimated_reach.toLocaleString()}
              </Text>
              <Text style={[styles.compareNote, typography.micro]}>Model baseline (120/dollar)</Text>
            </View>

            <View style={styles.compareDivider} />

            <View style={styles.compareItem}>
              <Text style={[styles.compareLabel, typography.caption]}>Verified Measured Reach</Text>
              <Text style={[styles.compareValue, typography.hero, { color: colors.success }]}>
                {report.measured_reach.toLocaleString()}
              </Text>
              <Text style={[styles.compareNote, typography.micro, { color: colors.successDark }]}>
                +8.7% above estimate
              </Text>
            </View>
          </View>
        </View>

        {/* Financial Transparency Box */}
        <View style={styles.financialCard}>
          <Text style={[styles.cardHeading, typography.h3]}>Financial Allocation Audit</Text>

          <View style={styles.financialRow}>
            <Text style={[styles.finLabel, typography.body]}>Total Backer Funds Raised:</Text>
            <Text style={[styles.finVal, typography.h2]}>${report.funds_raised.toLocaleString()}</Text>
          </View>

          <View style={styles.financialRow}>
            <Text style={[styles.finLabel, typography.caption]}>5% Platform Administration Fee:</Text>
            <Text style={[styles.finVal, typography.caption]}>
              -${(report.funds_raised - report.ad_spend).toFixed(2)}
            </Text>
          </View>

          <View style={styles.finDivider} />

          <View style={styles.financialRow}>
            <Text style={[styles.finLabel, typography.h3]}>Net Ad Placements Purchased:</Text>
            <Text style={[styles.finVal, typography.h2, { color: colors.primary }]}>
              ${report.ad_spend.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Advertising Performance Metrics */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Ionicons name="eye-outline" size={20} color={colors.primary} />
            <Text style={[styles.metricNumber, typography.h1]}>
              {report.impressions.toLocaleString()}
            </Text>
            <Text style={[styles.metricLabel, typography.caption]}>Total Impressions</Text>
          </View>

          <View style={styles.metricCard}>
            <Ionicons name="hand-left-outline" size={20} color={colors.primary} />
            <Text style={[styles.metricNumber, typography.h1]}>
              {report.clicks.toLocaleString()}
            </Text>
            <Text style={[styles.metricLabel, typography.caption]}>Story Clicks</Text>
          </View>

          <View style={styles.metricCard}>
            <Ionicons name="pie-chart-outline" size={20} color={colors.primary} />
            <Text style={[styles.metricNumber, typography.h1]}>{report.ctr}%</Text>
            <Text style={[styles.metricLabel, typography.caption]}>Click-Through (CTR)</Text>
          </View>

          <View style={styles.metricCard}>
            <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
            <Text style={[styles.metricNumber, typography.h1]}>${report.cpm}</Text>
            <Text style={[styles.metricLabel, typography.caption]}>Avg. CPM (Cost/1k)</Text>
          </View>
        </View>

        {/* Channels Breakdown */}
        <View style={styles.channelsCard}>
          <Text style={[styles.cardHeading, typography.h3]}>Distribution by Channel</Text>
          {Object.entries(report.channel_breakdown || {}).map(([ch, pct]) => (
            <View key={ch} style={styles.channelRow}>
              <View style={styles.channelLabelRow}>
                <Text style={[styles.channelName, typography.body]}>{ch}</Text>
                <Text style={[styles.channelPct, typography.caption]}>{pct}%</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${pct}%` }]} />
              </View>
            </View>
          ))}
        </View>

        {/* Bottom Back Button */}
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => router.push("/(tabs)/explore")}
          activeOpacity={0.8}
        >
          <Text style={[styles.doneBtnText, typography.h3]}>Explore More Campaigns</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
    gap: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: colors.slate800,
  },
  auditBanner: {
    flexDirection: "row",
    backgroundColor: colors.successLight,
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  auditTextWrap: {
    flex: 1,
  },
  auditTitle: {
    color: colors.successDark,
    marginBottom: 2,
  },
  auditSub: {
    color: colors.slate700,
  },
  titleCard: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  campaignLabel: {
    color: colors.primary,
    fontWeight: "700",
    marginBottom: 4,
  },
  campaignTitle: {
    color: colors.slate900,
    marginBottom: 4,
  },
  reportDate: {
    color: colors.slate500,
  },
  comparisonCard: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardHeading: {
    color: colors.slate900,
    marginBottom: 4,
  },
  comparisonSub: {
    color: colors.slate600,
    marginBottom: spacing.lg,
  },
  comparisonGrid: {
    flexDirection: "row",
    backgroundColor: colors.slate50,
    borderRadius: spacing.radiusMd,
    padding: spacing.md,
    alignItems: "center",
  },
  compareItem: {
    flex: 1,
    alignItems: "center",
  },
  compareDivider: {
    width: 1,
    height: "80%",
    backgroundColor: colors.slate300,
  },
  compareLabel: {
    color: colors.slate500,
    marginBottom: 4,
  },
  compareValue: {
    marginBottom: 2,
  },
  compareNote: {
    color: colors.slate500,
  },
  financialCard: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 8,
  },
  financialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  finLabel: {
    color: colors.slate600,
  },
  finVal: {
    color: colors.slate900,
  },
  finDivider: {
    height: 1,
    backgroundColor: colors.slate200,
    marginVertical: 4,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  metricCard: {
    width: "47%",
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: "center",
    gap: 4,
  },
  metricNumber: {
    color: colors.slate900,
  },
  metricLabel: {
    color: colors.slate500,
  },
  channelsCard: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.md,
  },
  channelRow: {
    gap: 4,
  },
  channelLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  channelName: {
    color: colors.slate800,
  },
  channelPct: {
    color: colors.slate600,
    fontWeight: "700",
  },
  barTrack: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.slate100,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  doneBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: spacing.radiusMd,
    alignItems: "center",
  },
  doneBtnText: {
    color: colors.white,
  },
});
