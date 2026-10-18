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
import { Campaign } from "../../types";
import { api } from "../../lib/api";
import { estimateReach } from "../../lib/reach";
import { CampaignCard } from "../../components/CampaignCard";
import { FeaturedCarousel } from "../../components/FeaturedCarousel";
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
  const [estimateDollars, setEstimateDollars] = useState(10);

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

  // Pure calculated reach from config
  const currentReach = estimateReach(estimateDollars);

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
              <Ionicons name="megaphone" size={18} color={colors.white} />
            </View>
            <Text style={[styles.brandTitle, typography.uiH2]}>Amplify Together</Text>
          </View>
          <View style={styles.demoTag}>
            <Text style={[styles.demoTagText, typography.uiMicro]}>PROTOTYPE</Text>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroCard}>
          <View style={styles.heroPill}>
            <Ionicons name="sparkles" size={12} color={colors.primary} />
            <Text style={[styles.heroPillText, typography.uiMicro]}>
              COMMUNITY-FUNDED MESSAGE AMPLIFICATION
            </Text>
          </View>

          <Text style={[styles.heroHeading, typography.storyHero]}>
            Helping important messages travel beyond creators' existing networks.
          </Text>

          <Text style={[styles.heroSub, typography.storyBody]}>
            Backers pool contributions toward transparent advertising distribution, delivering vital stories to audiences beyond traditional algorithms.
          </Text>

          {/* Illustrative Reach Line Computed From Config */}
          <View style={styles.estimatorBox}>
            <View style={styles.estimatorTopRow}>
              <Text style={[styles.estimatorLabel, typography.uiCaption]}>
                Illustrative reach from config:
              </Text>
              <View style={styles.guaranteeTag}>
                <Ionicons name="information-circle-outline" size={12} color={colors.amberDark} />
                <Text style={[styles.guaranteeTagText, typography.uiMicro]}>
                  Estimate, not a guarantee
                </Text>
              </View>
            </View>

            <View style={styles.reachResultRow}>
              <Text style={[styles.illustrativeLine, typography.storyH2]}>
                ${estimateDollars} could reach about{" "}
                <Text style={styles.reachHighlight}>
                  {currentReach.low.toLocaleString()}–{currentReach.high.toLocaleString()} people
                </Text>
              </Text>
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
                      typography.uiCaption,
                      estimateDollars === amt && styles.presetBtnTextActive,
                    ]}
                  >
                    ${amt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.estimatorDisclaimer, typography.uiMicro]}>
              {currentReach.disclaimer}
            </Text>
          </View>

          {/* Hero CTAs */}
          <View style={styles.heroButtonsRow}>
            <TouchableOpacity
              style={styles.primaryHeroBtn}
              onPress={() => router.push("/(tabs)/explore")}
              activeOpacity={0.8}
            >
              <Text style={[styles.primaryHeroBtnText, typography.uiH3]}>Explore Campaigns</Text>
              <Ionicons name="compass-outline" size={18} color={colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryHeroBtn}
              onPress={() => router.push("/(tabs)/create")}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryHeroBtnText, typography.uiH3]}>Start a Campaign</Text>
              <Ionicons name="add-circle-outline" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Featured Campaigns Horizontal Carousel */}
        {featured.length > 0 && (
          <FeaturedCarousel
            campaigns={featured}
            title="Featured Campaigns"
            subtitle="Curated messages undergoing community-backed distribution"
          />
        )}

        {/* How It Works Section */}
        <View style={styles.howItWorksSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.howBadge}>
              <Ionicons name="git-network-outline" size={13} color={colors.primary} />
              <Text style={[styles.howBadgeText, typography.uiMicro]}>THE AMPLIFY LIFECYCLE</Text>
            </View>
            <Text style={[styles.sectionTitle, typography.uiH2]}>How It Works</Text>
            <Text style={[styles.sectionSubtitle, typography.uiCaption]}>
              Three simple steps to fund and distribute verified public interest messages
            </Text>
          </View>

          <View style={styles.howItWorksCard}>
            {/* Step 1: Create */}
            <View style={styles.stepRow}>
              <View style={[styles.stepNumberBadge, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="create-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.stepInfo}>
                <View style={styles.stepTitleRow}>
                  <Text style={[styles.stepNumberLabel, typography.uiMicro]}>STEP 1</Text>
                  <Text style={[styles.stepTitle, typography.uiH3]}>Create</Text>
                </View>
                <Text style={[styles.stepDesc, typography.storyBody]}>
                  Creators draft an evidence-backed message with verified citations, story blocks, and targeted reach criteria.
                </Text>
              </View>
            </View>

            <View style={styles.stepConnector} />

            {/* Step 2: Review */}
            <View style={styles.stepRow}>
              <View style={[styles.stepNumberBadge, { backgroundColor: colors.amberLight }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.amberDark} />
              </View>
              <View style={styles.stepInfo}>
                <View style={styles.stepTitleRow}>
                  <Text style={[styles.stepNumberLabel, typography.uiMicro]}>STEP 2</Text>
                  <Text style={[styles.stepTitle, typography.uiH3]}>Review</Text>
                </View>
                <Text style={[styles.stepDesc, typography.storyBody]}>
                  Platform moderators verify source citations and claims to maintain community trust before backing opens.
                </Text>
              </View>
            </View>

            <View style={styles.stepConnector} />

            {/* Step 3: Amplify */}
            <View style={styles.stepRow}>
              <View style={[styles.stepNumberBadge, { backgroundColor: colors.successLight }]}>
                <Ionicons name="megaphone-outline" size={18} color={colors.successDark} />
              </View>
              <View style={styles.stepInfo}>
                <View style={styles.stepTitleRow}>
                  <Text style={[styles.stepNumberLabel, typography.uiMicro]}>STEP 3</Text>
                  <Text style={[styles.stepTitle, typography.uiH3]}>Amplify</Text>
                </View>
                <Text style={[styles.stepDesc, typography.storyBody]}>
                  Backers pool micro-contributions toward ad costs, delivering the message to thousands outside the echo chamber.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Campaign Feed Section */}
        <View style={styles.feedHeaderRow}>
          <View>
            <Text style={[styles.sectionTitle, typography.uiH2]}>Active Campaigns</Text>
            <Text style={[styles.sectionSubtitle, typography.uiCaption]}>
              Community messages awaiting or undergoing amplification
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/explore")}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.seeAllText, typography.uiCaption]}>See all ({campaigns.length})</Text>
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

        {/* Footer with Demo Data Note & Platform Links */}
        <View style={styles.footer}>
          <View style={styles.footerTag}>
            <Ionicons name="construct-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.footerDemoNotice, typography.uiMicro]}>
              DEMO DATA NOTE
            </Text>
          </View>
          <Text style={[styles.footerText, typography.uiCaption]}>
            Demo data: All campaigns, metrics, and transactions shown are for evaluation and simulation purposes.
          </Text>
          <Text style={[styles.footerSub, typography.uiMicro]}>
            This is not a donation platform. Contributions fund distribution costs, not the cause or creator directly.
          </Text>

          {/* Secondary Info Page Links */}
          <View style={styles.footerLinksGrid}>
            <TouchableOpacity onPress={() => router.push("/info/about" as any)}>
              <Text style={[styles.footerLinkText, typography.uiCaption]}>About</Text>
            </TouchableOpacity>
            <Text style={styles.footerLinkDot}>•</Text>
            <TouchableOpacity onPress={() => router.push("/info/how-it-works" as any)}>
              <Text style={[styles.footerLinkText, typography.uiCaption]}>How It Works</Text>
            </TouchableOpacity>
            <Text style={styles.footerLinkDot}>•</Text>
            <TouchableOpacity onPress={() => router.push("/info/faqs" as any)}>
              <Text style={[styles.footerLinkText, typography.uiCaption]}>FAQs</Text>
            </TouchableOpacity>
            <Text style={styles.footerLinkDot}>•</Text>
            <TouchableOpacity onPress={() => router.push("/info/terms" as any)}>
              <Text style={[styles.footerLinkText, typography.uiCaption]}>Terms</Text>
            </TouchableOpacity>
            <Text style={styles.footerLinkDot}>•</Text>
            <TouchableOpacity onPress={() => router.push("/info/privacy" as any)}>
              <Text style={[styles.footerLinkText, typography.uiCaption]}>Privacy</Text>
            </TouchableOpacity>
            <Text style={styles.footerLinkDot}>•</Text>
            <TouchableOpacity onPress={() => router.push("/info/guidelines" as any)}>
              <Text style={[styles.footerLinkText, typography.uiCaption]}>Guidelines</Text>
            </TouchableOpacity>
            <Text style={styles.footerLinkDot}>•</Text>
            <TouchableOpacity onPress={() => router.push("/info/partners" as any)}>
              <Text style={[styles.footerLinkText, typography.uiCaption]}>Partners</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  },
  contentContainer: {
    paddingHorizontal: spacing.s20,
    paddingTop: spacing.s16,
    paddingBottom: spacing.s48,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.s16,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: spacing.radiusSm,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.s8,
  },
  brandTitle: {
    color: colors.textPrimary,
  },
  demoTag: {
    backgroundColor: colors.surfaceNeutral,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.s8,
    paddingVertical: 3,
    borderRadius: spacing.radiusSm,
  },
  demoTagText: {
    color: colors.textSecondary,
    fontWeight: "700",
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.s24,
    marginBottom: spacing.s24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.s10,
    paddingVertical: 4,
    borderRadius: spacing.radiusFull,
    alignSelf: "flex-start",
    marginBottom: spacing.s12,
    gap: 4,
  },
  heroPillText: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
  heroHeading: {
    color: colors.textPrimary,
    marginBottom: spacing.s12,
  },
  heroSub: {
    color: colors.textSecondary,
    marginBottom: spacing.s16,
    lineHeight: 24,
  },
  estimatorBox: {
    backgroundColor: colors.surfaceNeutral,
    borderRadius: spacing.radiusInput,
    padding: spacing.s16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.s20,
  },
  estimatorTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.s8,
    flexWrap: "wrap",
    gap: 4,
  },
  estimatorLabel: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  guaranteeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.amberLight,
    paddingHorizontal: spacing.s8,
    paddingVertical: 2,
    borderRadius: spacing.radiusFull,
  },
  guaranteeTagText: {
    color: colors.amberDark,
    fontWeight: "700",
  },
  reachResultRow: {
    marginBottom: spacing.s12,
  },
  illustrativeLine: {
    color: colors.textPrimary,
    fontSize: 18,
    lineHeight: 26,
  },
  reachHighlight: {
    color: colors.primary,
    fontWeight: "700",
  },
  presetsRow: {
    flexDirection: "row",
    gap: spacing.s8,
    marginBottom: spacing.s8,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    minHeight: 38,
  },
  presetBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetBtnText: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  presetBtnTextActive: {
    color: colors.white,
  },
  estimatorDisclaimer: {
    color: colors.textMuted,
    lineHeight: 16,
    marginTop: 4,
  },
  heroButtonsRow: {
    flexDirection: "row",
    gap: spacing.s12,
  },
  primaryHeroBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.s12,
    borderRadius: spacing.radiusInput,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: spacing.minTouchTarget,
  },
  primaryHeroBtnText: {
    color: colors.white,
  },
  secondaryHeroBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.slate300,
    paddingVertical: spacing.s12,
    borderRadius: spacing.radiusInput,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: spacing.minTouchTarget,
  },
  secondaryHeroBtnText: {
    color: colors.textPrimary,
  },
  howItWorksSection: {
    marginBottom: spacing.s24,
  },
  sectionHeader: {
    marginBottom: spacing.s12,
  },
  howBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: spacing.s4,
  },
  howBadgeText: {
    color: colors.primary,
    fontWeight: "700",
  },
  sectionTitle: {
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  howItWorksCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.s20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.s16,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s8,
    marginBottom: spacing.s4,
  },
  stepNumberLabel: {
    color: colors.textMuted,
    fontWeight: "700",
  },
  stepTitle: {
    color: colors.textPrimary,
  },
  stepDesc: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  stepConnector: {
    width: 2,
    height: 20,
    backgroundColor: colors.cardBorder,
    marginLeft: 17,
    marginVertical: 4,
  },
  feedHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: spacing.s16,
  },
  seeAllText: {
    color: colors.primary,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    marginTop: spacing.s24,
    paddingVertical: spacing.s20,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    gap: 4,
  },
  footerTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  footerDemoNotice: {
    color: colors.textMuted,
    fontWeight: "700",
  },
  footerText: {
    color: colors.textSecondary,
    textAlign: "center",
  },
  footerSub: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 2,
  },
  footerLinksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 8,
  },
  footerLinkText: {
    color: colors.primary,
    fontWeight: "600",
  },
  footerLinkDot: {
    color: colors.textMuted,
  },
});
