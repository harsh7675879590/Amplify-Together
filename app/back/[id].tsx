import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Share,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Campaign, ContributionQuote, Contribution } from "../../lib/types";
import { api } from "../../lib/api";
import { Header } from "../../components/Header";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing } from "../../theme/spacing";

const PRESET_AMOUNTS = [25, 50, 100, 250];

const TEST_CARDS = [
  { label: "Card •••• 4242 (Simulate Succeeded)", number: "4242", outcome: "succeeded" },
  { label: "Card •••• 0001 (Simulate Pending)", number: "0001", outcome: "pending" },
  { label: "Card •••• 0002 (Simulate Declined)", number: "0002", outcome: "failed" },
];

export default function BackCampaignScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [amount, setAmount] = useState("50");
  const [quote, setQuote] = useState<ContributionQuote | null>(null);
  const [selectedCard, setSelectedCard] = useState("4242");
  const [isPublic, setIsPublic] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [step, setStep] = useState<"amount" | "checkout" | "result">("amount");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Contribution | null>(null);

  useEffect(() => {
    if (id) {
      api.getCampaignDetail(id).then(setCampaign).catch(console.warn);
    }
  }, [id]);

  useEffect(() => {
    const num = parseFloat(amount);
    if (id && num > 0) {
      const timer = setTimeout(() => {
        api.getQuote(id, num).then(setQuote).catch(console.warn);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [id, amount]);

  const handleProceedToCheckout = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) return;
    setStep("checkout");
  };

  const handlePay = async (action: "pay" | "cancel" = "pay") => {
    if (!id) return;
    try {
      setIsProcessing(true);
      const res = await api.contribute(id, {
        amount: parseFloat(amount),
        guest_email: guestEmail.trim() || undefined,
        is_public: isPublic,
        display_name: isPublic ? (displayName.trim() || "Public Backer") : undefined,
        card_number: selectedCard,
        action: action,
      });
      setResult(res);
      setStep("result");
    } catch (e: any) {
      console.warn("Contribution failed", e);
      setResult({
        id: "err",
        campaign_id: id,
        amount: parseFloat(amount),
        platform_fee: 0,
        processing_fee: 0,
        total: parseFloat(amount),
        status: "failed",
        is_public: false,
        reach_estimate_mid: 0,
        created_at: new Date().toISOString(),
        message: e.message || "Contribution rejected",
      });
      setStep("result");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async () => {
    if (!campaign) return;
    try {
      await Share.share({
        message: `I just backed the campaign "${campaign.title}" to expand its reach. Support community message amplification on Amplify Together!`,
      });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={step === "result" ? "Confirmation" : "Back Campaign"}
        showBack={step !== "result"}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Campaign Mini Header */}
        {campaign && (
          <View style={styles.campaignSummaryCard}>
            <Text style={[styles.campaignCategory, typography.micro]}>
              {campaign.category.toUpperCase()}
            </Text>
            <Text style={[styles.campaignTitle, typography.h2]} numberOfLines={2}>
              {campaign.title}
            </Text>
            <Text style={[styles.campaignCreator, typography.caption]}>
              Creator: {campaign.creator_name}
            </Text>
          </View>
        )}

        {/* STEP 1: Choose Amount & Live Reach */}
        {step === "amount" && (
          <View style={styles.stepSection}>
            <Text style={[styles.sectionHeading, typography.h2]}>1. Choose Contribution Amount</Text>
            <Text style={[styles.sectionSub, typography.body]}>
              Select or type the advertising amount you wish to pool toward this message.
            </Text>

            {/* Presets */}
            <View style={styles.presetsGrid}>
              {PRESET_AMOUNTS.map((val) => {
                const isSelected = amount === String(val);
                return (
                  <TouchableOpacity
                    key={val}
                    style={[styles.presetCard, isSelected && styles.presetCardSelected]}
                    onPress={() => setAmount(String(val))}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.presetDollar, typography.h1, isSelected && styles.presetDollarActive]}>
                      ${val}
                    </Text>
                    <Text style={[styles.presetReach, typography.micro, isSelected && styles.presetReachActive]}>
                      ~{(val * 120).toLocaleString()} reach
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Amount Input */}
            <View style={styles.customAmountBox}>
              <Text style={[styles.customLabel, typography.caption]}>Or enter a custom amount ($):</Text>
              <View style={styles.inputWrap}>
                <Text style={[styles.dollarSign, typography.h2]}>$</Text>
                <TextInput
                  style={[styles.amountInput, typography.h1]}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="50"
                  placeholderTextColor={colors.slate400}
                />
              </View>
            </View>

            {/* Dynamic Live Reach Preview */}
            {quote && (
              <View style={styles.reachPreviewCard}>
                <View style={styles.reachTop}>
                  <Ionicons name="sparkles" size={18} color={colors.primary} />
                  <Text style={[styles.reachTitle, typography.h3]}>Estimated Audience Reach</Text>
                </View>
                <Text style={[styles.reachRange, typography.hero]}>
                  {quote.reach_estimate.formatted_range}
                </Text>
                <Text style={[styles.reachSub, typography.caption]}>
                  Your ${quote.amount} contribution puts this message in front of an estimated{" "}
                  <Text style={styles.boldText}>~{quote.reach_estimate.mid.toLocaleString()} people</Text> outside the creator's social bubble.
                </Text>
              </View>
            )}

            {/* Itemized Fee Quote Table */}
            {quote && (
              <View style={styles.quoteCard}>
                <Text style={[styles.quoteCardTitle, typography.h3]}>Transparent Fee Breakdown</Text>

                <View style={styles.quoteRow}>
                  <Text style={[styles.quoteLabel, typography.body]}>Advertising Contribution</Text>
                  <Text style={[styles.quoteVal, typography.body]}>${quote.amount.toFixed(2)}</Text>
                </View>

                <View style={styles.quoteRow}>
                  <Text style={[styles.quoteLabel, typography.caption]}>Platform Fee (5% included)</Text>
                  <Text style={[styles.quoteVal, typography.caption]}>${quote.platform_fee.toFixed(2)}</Text>
                </View>

                <View style={styles.quoteRow}>
                  <Text style={[styles.quoteLabel, typography.caption]}>Payment Processing ({quote.processing_fee_formula})</Text>
                  <Text style={[styles.quoteVal, typography.caption]}>+${quote.processing_fee.toFixed(2)}</Text>
                </View>

                <View style={styles.quoteDivider} />

                <View style={styles.quoteTotalRow}>
                  <View>
                    <Text style={[styles.quoteTotalLabel, typography.h2]}>Total Charged</Text>
                    <Text style={[styles.quoteAvailableText, typography.micro]}>
                      ${quote.available_for_ads.toFixed(2)} goes directly to ad inventory
                    </Text>
                  </View>
                  <Text style={[styles.quoteTotalVal, typography.hero]}>${quote.total_charged.toFixed(2)}</Text>
                </View>
              </View>
            )}

            {/* Critical Amplification Notice */}
            <View style={styles.notDonationCard}>
              <Ionicons name="information-circle" size={20} color={colors.amberDark} />
              <View style={styles.notDonationTextWrap}>
                <Text style={[styles.notDonationTitle, typography.h3]}>Not a Charitable Donation</Text>
                <Text style={[styles.notDonationBody, typography.caption]}>
                  Your contribution pays for distributing and advertising the campaign message. It does not fund the person, cause, or organization directly.
                </Text>
              </View>
            </View>

            {/* Next Button */}
            <TouchableOpacity
              style={[styles.primaryActionBtn, (!amount || parseFloat(amount) <= 0) && styles.btnDisabled]}
              onPress={handleProceedToCheckout}
              disabled={!amount || parseFloat(amount) <= 0}
              activeOpacity={0.8}
            >
              <Text style={[styles.btnText, typography.h3]}>Continue to Checkout</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: Simulated Checkout */}
        {step === "checkout" && quote && (
          <View style={styles.stepSection}>
            <View style={styles.simulatedBanner}>
              <Ionicons name="construct" size={16} color={colors.primary} />
              <Text style={[styles.simulatedText, typography.micro]}>
                SIMULATED CHECKOUT • NO REAL MONEY MOVED
              </Text>
            </View>

            <Text style={[styles.sectionHeading, typography.h2]}>2. Review & Payment</Text>
            <Text style={[styles.sectionSub, typography.body]}>
              Select a test card to demonstrate transaction outcomes:
            </Text>

            {/* Test Cards Selector */}
            <View style={styles.cardsList}>
              {TEST_CARDS.map((tc) => {
                const isSelected = selectedCard === tc.number;
                return (
                  <TouchableOpacity
                    key={tc.number}
                    style={[styles.cardItem, isSelected && styles.cardItemSelected]}
                    onPress={() => setSelectedCard(tc.number)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isSelected ? "radio-button-on" : "radio-button-off"}
                      size={20}
                      color={isSelected ? colors.primary : colors.slate400}
                    />
                    <View style={styles.cardInfo}>
                      <Text style={[styles.cardLabel, typography.bodyMedium, isSelected && styles.cardLabelActive]}>
                        {tc.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Backer Privacy Options */}
            <View style={styles.privacyCard}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setIsPublic(!isPublic)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isPublic ? "checkbox" : "square-outline"}
                  size={22}
                  color={isPublic ? colors.primary : colors.slate400}
                />
                <Text style={[styles.checkboxLabel, typography.body]}>
                  Display my contribution publicly (Off by default for privacy)
                </Text>
              </TouchableOpacity>

              {isPublic && (
                <TextInput
                  style={[styles.textInput, typography.body]}
                  placeholder="Display name (optional)"
                  placeholderTextColor={colors.slate400}
                  value={displayName}
                  onChangeText={setDisplayName}
                />
              )}

              <TextInput
                style={[styles.textInput, typography.body, { marginTop: spacing.sm }]}
                placeholder="Email for digital receipt (optional for guests)"
                placeholderTextColor={colors.slate400}
                keyboardType="email-address"
                value={guestEmail}
                onChangeText={setGuestEmail}
              />
            </View>

            {/* Payment Summary Box */}
            <View style={styles.paySummaryBox}>
              <View style={styles.payRow}>
                <Text style={[styles.payLabel, typography.body]}>Total Payment:</Text>
                <Text style={[styles.payTotal, typography.h1]}>${quote.total_charged.toFixed(2)}</Text>
              </View>
              <Text style={[styles.payReachNote, typography.caption]}>
                Generates ~{quote.reach_estimate.mid.toLocaleString()} ad impressions outside network
              </Text>
            </View>

            {/* Payment Actions */}
            <View style={styles.checkoutActionCol}>
              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={() => handlePay("pay")}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                {isProcessing ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="lock-closed" size={18} color={colors.white} />
                    <Text style={[styles.btnText, typography.h3]}>
                      Pay ${quote.total_charged.toFixed(2)} (Simulated)
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => handlePay("cancel")}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                <Text style={[styles.cancelBtnText, typography.caption]}>
                  Simulate User Cancellation
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 3: Transaction Outcome & Confirmation */}
        {step === "result" && result && (
          <View style={styles.resultSection}>
            {/* Outcome Icon */}
            <View
              style={[
                styles.resultCircle,
                result.status === "succeeded" && styles.circleSuccess,
                result.status === "pending" && styles.circlePending,
                result.status === "failed" && styles.circleFailed,
                result.status === "cancelled" && styles.circleCancelled,
              ]}
            >
              <Ionicons
                name={
                  result.status === "succeeded"
                    ? "checkmark"
                    : result.status === "pending"
                    ? "time"
                    : result.status === "cancelled"
                    ? "close"
                    : "alert"
                }
                size={40}
                color={colors.white}
              />
            </View>

            <Text style={[styles.resultTitle, typography.hero]}>
              {result.status === "succeeded"
                ? "Contribution Successful!"
                : result.status === "pending"
                ? "Payment Pending Authorization"
                : result.status === "cancelled"
                ? "Contribution Cancelled"
                : "Payment Declined"}
            </Text>

            <Text style={[styles.resultMessage, typography.body]}>
              {result.message}
            </Text>

            {/* Receipt Summary Card */}
            <View style={styles.receiptCard}>
              <Text style={[styles.receiptCardHeading, typography.h3]}>Transaction Receipt</Text>
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, typography.caption]}>Receipt ID:</Text>
                <Text style={[styles.receiptVal, typography.caption]}>{result.id}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, typography.caption]}>Campaign:</Text>
                <Text style={[styles.receiptVal, typography.caption]} numberOfLines={1}>{result.campaign_title}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, typography.caption]}>Contribution Amount:</Text>
                <Text style={[styles.receiptVal, typography.caption]}>${result.amount.toFixed(2)}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, typography.caption]}>Processing Fee:</Text>
                <Text style={[styles.receiptVal, typography.caption]}>${result.processing_fee.toFixed(2)}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, typography.caption]}>Total Paid:</Text>
                <Text style={[styles.receiptVal, typography.h3]}>${result.total.toFixed(2)}</Text>
              </View>
              {result.status === "succeeded" && (
                <View style={styles.receiptReachBadge}>
                  <Ionicons name="people" size={16} color={colors.primary} />
                  <Text style={[styles.receiptReachText, typography.caption]}>
                    Amplified reach: ~{result.reach_estimate_mid.toLocaleString()} people
                  </Text>
                </View>
              )}
            </View>

            {/* Post Outcome Actions */}
            <View style={styles.resultActionsCol}>
              {result.status === "succeeded" && (
                <TouchableOpacity
                  style={styles.shareBtn}
                  onPress={handleShare}
                  activeOpacity={0.8}
                >
                  <Ionicons name="share-social" size={18} color={colors.white} />
                  <Text style={[styles.shareBtnText, typography.h3]}>Share Campaign</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => router.push("/(tabs)/explore")}
                activeOpacity={0.8}
              >
                <Text style={[styles.doneBtnText, typography.h3]}>Explore More Campaigns</Text>
              </TouchableOpacity>
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
  },
  campaignSummaryCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.lg,
  },
  campaignCategory: {
    color: colors.primary,
    fontWeight: "700",
    marginBottom: 4,
  },
  campaignTitle: {
    color: colors.slate900,
    marginBottom: 4,
  },
  campaignCreator: {
    color: colors.slate500,
  },
  stepSection: {
    gap: spacing.md,
  },
  sectionHeading: {
    color: colors.slate900,
  },
  sectionSub: {
    color: colors.slate600,
  },
  presetsGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  presetCard: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: 4,
    borderRadius: spacing.radiusMd,
    borderWidth: 1.5,
    borderColor: colors.slate300,
    alignItems: "center",
  },
  presetCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  presetDollar: {
    color: colors.slate900,
  },
  presetDollarActive: {
    color: colors.primary,
  },
  presetReach: {
    color: colors.slate500,
    marginTop: 2,
  },
  presetReachActive: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
  customAmountBox: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  customLabel: {
    color: colors.slate500,
    marginBottom: spacing.xs,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  dollarSign: {
    color: colors.slate500,
    marginRight: spacing.xs,
  },
  amountInput: {
    flex: 1,
    color: colors.slate900,
    paddingVertical: 4,
  },
  reachPreviewCard: {
    backgroundColor: "#F0F4FF",
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: spacing.radiusLg,
    padding: spacing.lg,
  },
  reachTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  reachTitle: {
    color: colors.primaryDark,
  },
  reachRange: {
    color: colors.primary,
    marginBottom: 4,
  },
  reachSub: {
    color: colors.slate700,
  },
  boldText: {
    fontWeight: "700",
    color: colors.slate900,
  },
  quoteCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 8,
  },
  quoteCardTitle: {
    color: colors.slate900,
    marginBottom: 4,
  },
  quoteRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quoteLabel: {
    color: colors.slate600,
  },
  quoteVal: {
    color: colors.slate800,
  },
  quoteDivider: {
    height: 1,
    backgroundColor: colors.slate200,
    marginVertical: 4,
  },
  quoteTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 4,
  },
  quoteTotalLabel: {
    color: colors.slate900,
  },
  quoteAvailableText: {
    color: colors.successDark,
    marginTop: 2,
  },
  quoteTotalVal: {
    color: colors.slate900,
  },
  notDonationCard: {
    flexDirection: "row",
    backgroundColor: colors.amberLight,
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  notDonationTextWrap: {
    flex: 1,
  },
  notDonationTitle: {
    color: colors.amberDark,
    marginBottom: 2,
  },
  notDonationBody: {
    color: colors.slate800,
  },
  primaryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: spacing.radiusMd,
    gap: 8,
    marginTop: spacing.md,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: colors.white,
  },
  simulatedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
    paddingVertical: 6,
    borderRadius: spacing.radiusSm,
    gap: 6,
    marginBottom: spacing.xs,
  },
  simulatedText: {
    color: colors.primary,
    fontWeight: "800",
  },
  cardsList: {
    gap: spacing.sm,
  },
  cardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
    borderWidth: 1.5,
    borderColor: colors.slate200,
    gap: spacing.sm,
  },
  cardItemSelected: {
    borderColor: colors.primary,
    backgroundColor: "#F8FAFF",
  },
  cardInfo: {
    flex: 1,
  },
  cardLabel: {
    color: colors.slate700,
  },
  cardLabelActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  privacyCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginTop: spacing.xs,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  checkboxLabel: {
    color: colors.slate700,
    flex: 1,
  },
  textInput: {
    backgroundColor: colors.slate100,
    borderRadius: spacing.radiusSm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    color: colors.slate900,
  },
  paySummaryBox: {
    backgroundColor: colors.slate100,
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
    marginVertical: spacing.xs,
  },
  payRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  payLabel: {
    color: colors.slate600,
  },
  payTotal: {
    color: colors.slate900,
  },
  payReachNote: {
    color: colors.primaryDark,
    marginTop: 4,
    fontWeight: "600",
  },
  checkoutActionCol: {
    gap: spacing.sm,
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  cancelBtnText: {
    color: colors.slate500,
  },
  resultSection: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  resultCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  circleSuccess: {
    backgroundColor: colors.success,
  },
  circlePending: {
    backgroundColor: colors.amber,
  },
  circleFailed: {
    backgroundColor: colors.error,
  },
  circleCancelled: {
    backgroundColor: colors.slate500,
  },
  resultTitle: {
    color: colors.slate900,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  resultMessage: {
    color: colors.slate600,
    textAlign: "center",
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  receiptCard: {
    width: "100%",
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.xl,
    gap: 8,
  },
  receiptCardHeading: {
    color: colors.slate900,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
    paddingBottom: spacing.xs,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  receiptLabel: {
    color: colors.slate500,
  },
  receiptVal: {
    color: colors.slate800,
    fontWeight: "600",
  },
  receiptReachBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primaryLight,
    padding: spacing.sm,
    borderRadius: spacing.radiusSm,
    marginTop: spacing.xs,
  },
  receiptReachText: {
    color: colors.primary,
    fontWeight: "700",
  },
  resultActionsCol: {
    width: "100%",
    gap: spacing.md,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: spacing.radiusMd,
    gap: spacing.sm,
  },
  shareBtnText: {
    color: colors.white,
  },
  doneBtn: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate300,
    paddingVertical: 14,
    borderRadius: spacing.radiusMd,
    alignItems: "center",
  },
  doneBtnText: {
    color: colors.slate800,
  },
});
