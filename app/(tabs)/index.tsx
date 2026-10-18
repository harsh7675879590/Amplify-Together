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
import { Campaign } from "../../lib/types";
import { api } from "../../lib/api";
import { CampaignCard } from "../../components/CampaignCard";
import { SkeletonCard } from "../../components/SkeletonCard";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing } from "../../theme/spacing";

export default function HomeScreen() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [featured, setFeatured] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [estimateDollars, setEstimateDollars] = useState(25);

  const loadData = async () => {
    try {
      const [allCamps, featCamps] = await Promise.all([
        api.getCampaigns(),
        api.getFeaturedCampaigns(),
      ]);
      setCampaigns(allCamps);
      setFeatured(featCamps);
    } catch (e) {
      console.warn("Failed to fetch campaigns", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const estimatedPeople = estimateDollars * 120;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Brand Header */}
        <View style={styles.topHeader}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Ionicons name="megaphone" size={20} color={colors.white} />
            </View>
            <Text style={[styles.brandTitle, typography.h2]}>Amplify Together</Text>
          </View>
          <View style={styles.demoTag}>
            <Text style={[styles.demoTagText, typography.micro]}>DEMO PROTOTYPE</Text>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroCard}>
          <View style={styles.heroPill}>
            <Ionicons name="sparkles" size={12} color={colors.primary} />
            <Text style={[styles.heroPillText, typography.micro]}>
              COMMUNITY-FUNDED MESSAGE AMPLIFICATION
            </Text>
          </View>

          <Text style={[styles.heroHeading, typography.hero]}>
            Deliver important messages beyond your feed.
          </Text>

          <Text style={[styles.heroSub, typography.body]}>
            This is <Text style={styles.boldText}>not a donation platform</Text>. Backers pool
            funds to pay for targeted advertising, putting evidence and stories in front of new audiences.
          </Text>

          {/* Interactive Reach Estimator */}
          <View style={styles.estimatorBox}>
            <Text style={[styles.estimatorLabel, typography.caption]}>
              Illustrative reach estimate:
            </Text>
            <View style={styles.reachResultRow}>
              <Text style={[styles.dollarAmount, typography.h1]}>${estimateDollars}</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.slate400} />
              <View style={styles.peopleCountWrap}>
                <Text style={[styles.peopleCount, typography.h1]}>
                  ~{estimatedPeople.toLocaleString()}
                </Text>
                <Text style={[styles.peopleUnit, typography.caption]}>people reached</Text>
              </View>
            </View>

            {/* Quick Presets */}
            <View style={styles.presetsRow}>
              {[10, 25, 50, 100].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[
                    styles.presetBtn,
                    estimateDollars === amt && styles.presetBtnActive,
                  ]}
                  onPress={() => setEstimateDollars(amt)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.presetBtnText,
                      typography.caption,
                      estimateDollars === amt && styles.presetBtnTextActive,
                    ]}
                  >
                    ${amt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.estimatorDisclaimer, typography.micro]}>
              *Illustrative estimate (~120 people/$1). Actual delivery varies by platform auctions.
            </Text>
          </View>

          {/* Hero CTAs */}
          <View style={styles.heroButtonsRow}>
            <TouchableOpacity
              style={styles.primaryHeroBtn}
              onPress={() => router.push("/(tabs)/explore")}
              activeOpacity={0.8}
            >
              <Text style={[styles.primaryHeroBtnText, typography.h3]}>Explore Campaigns</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryHeroBtn}
              onPress={() => router.push("/(tabs)/create")}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryHeroBtnText, typography.h3]}>Start Campaign</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* How It Works Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, typography.h2]}>How It Works</Text>
          <Text style={[styles.sectionSubtitle, typography.caption]}>
            Transparent, community-governed message distribution
          </Text>
        </View>

        <View style={styles.howItWorksCard}>
          <View style={styles.stepRow}>
            <View style={[styles.stepNumberBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.stepNumberText, { color: colors.primary }]}>1</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={[styles.stepTitle, typography.h3]}>Create</Text>
              <Text style={[styles.stepDesc, typography.caption]}>
                Creators craft an editorial story with verifiable evidence, sources, and ad creatives.
              </Text>
            </View>
          </View>

          <View style={styles.stepDivider} />

          <View style={styles.stepRow}>
            <View style={[styles.stepNumberBadge, { backgroundColor: colors.amberLight }]}>
              <Text style={[styles.stepNumberText, { color: colors.amberDark }]}>2</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={[styles.stepTitle, typography.h3]}>Review</Text>
              <Text style={[styles.stepDesc, typography.caption]}>
                Platform reviewers inspect sources, verify claims, and validate ad targeting.
              </Text>
            </View>
          </View>

          <View style={styles.stepDivider} />

          <View style={styles.stepRow}>
            <View style={[styles.stepNumberBadge, { backgroundColor: colors.successLight }]}>
              <Text style={[styles.stepNumberText, { color: colors.successDark }]}>3</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={[styles.stepTitle, typography.h3]}>Amplify</Text>
              <Text style={[styles.stepDesc, typography.caption]}>
                Backers pool micro-contributions. Once funded, ads run and transparent reports are published.
              </Text>
            </View>
          </View>
        </View>

        {/* Campaign Feed Section */}
        <View style={styles.feedHeaderRow}>
          <View>
            <Text style={[styles.sectionTitle, typography.h2]}>Active Campaigns</Text>
            <Text style={[styles.sectionSubtitle, typography.caption]}>
              Community messages awaiting or undergoing amplification
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/explore")}
            activeOpacity={0.7}
          >
            <Text style={[styles.seeAllText, typography.caption]}>See all ({campaigns.length})</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          campaigns.map((camp) => (
            <CampaignCard key={camp.id} campaign={camp} />
          ))
        )}

        {/* Footer Disclaimer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, typography.caption]}>
            Campaign Amplification Platform Demo • Built for mobile evaluation
          </Text>
          <Text style={[styles.footerSub, typography.micro]}>
            Contributions fund distribution costs, not the cause or creator directly.
          </Text>
        </View>
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
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  brandTitle: {
    color: colors.slate900,
  },
  demoTag: {
    backgroundColor: colors.slate200,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: spacing.radiusSm,
  },
  demoTagText: {
    color: colors.slate700,
    fontWeight: "700",
  },
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    shadowColor: colors.slate900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: spacing.radiusFull,
    alignSelf: "flex-start",
    marginBottom: spacing.md,
    gap: 4,
  },
  heroPillText: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
  heroHeading: {
    color: colors.slate900,
    marginBottom: spacing.sm,
  },
  heroSub: {
    color: colors.slate600,
    marginBottom: spacing.lg,
  },
  boldText: {
    fontWeight: "700",
    color: colors.slate900,
  },
  estimatorBox: {
    backgroundColor: colors.slate50,
    borderRadius: spacing.radiusMd,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.slate200,
    marginBottom: spacing.lg,
  },
  estimatorLabel: {
    color: colors.slate500,
    marginBottom: spacing.xs,
  },
  reachResultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  dollarAmount: {
    color: colors.slate900,
  },
  peopleCountWrap: {
    alignItems: "flex-end",
  },
  peopleCount: {
    color: colors.primary,
  },
  peopleUnit: {
    color: colors.slate500,
  },
  presetsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    borderColor: colors.slate300,
  },
  presetBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetBtnText: {
    color: colors.slate700,
    fontWeight: "600",
  },
  presetBtnTextActive: {
    color: colors.white,
  },
  estimatorDisclaimer: {
    color: colors.slate400,
    marginTop: 4,
  },
  heroButtonsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  primaryHeroBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: spacing.radiusMd,
    alignItems: "center",
  },
  primaryHeroBtnText: {
    color: colors.white,
  },
  secondaryHeroBtn: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate300,
    paddingVertical: 13,
    borderRadius: spacing.radiusMd,
    alignItems: "center",
  },
  secondaryHeroBtnText: {
    color: colors.slate800,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.slate900,
  },
  sectionSubtitle: {
    color: colors.slate500,
    marginTop: 2,
  },
  howItWorksCard: {
    backgroundColor: colors.white,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  stepNumberText: {
    fontWeight: "800",
    fontSize: 14,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    color: colors.slate900,
    marginBottom: 2,
  },
  stepDesc: {
    color: colors.slate600,
  },
  stepDivider: {
    height: 1,
    backgroundColor: colors.slate100,
    marginVertical: spacing.md,
    marginLeft: 42,
  },
  feedHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  seeAllText: {
    color: colors.primary,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.slate200,
  },
  footerText: {
    color: colors.slate500,
    textAlign: "center",
  },
  footerSub: {
    color: colors.slate400,
    textAlign: "center",
    marginTop: 4,
  },
});
