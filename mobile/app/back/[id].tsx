import React, { useEffect, useState, useMemo } from "react";
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
  Switch,
  Alert,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Campaign, Contribution } from "../../types";
import { api } from "../../lib/api";
import { calculateFees } from "../../lib/fees";
import { estimateReach } from "../../lib/reach";
import { ProgressBar } from "../../components/ProgressBar";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing } from "../../theme/spacing";

const PRESET_AMOUNTS = [5, 10, 25, 50, 100];

const TEST_CARDS = [
  { label: "Card •••• 4242 (Simulate Success)", number: "4242", outcome: "succeeded" },
  { label: "Card •••• 0002 (Simulate Card Declined)", number: "0002", outcome: "failed" },
  { label: "Card •••• 0001 (Simulate Authorization Pending)", number: "0001", outcome: "pending" },
];

type BackingStep = "choose" | "review" | "checkout" | "result";

export default function BackCampaignScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  // Form & Wizard State
  const [step, setStep] = useState<BackingStep>("choose");
  const [selectedAmount, setSelectedAmount] = useState<number>(25);
  const [customAmountText, setCustomAmountText] = useState<string>("25");
  const [acknowledgedTerms, setAcknowledgedTerms] = useState<boolean>(false);
  const [guestEmail, setGuestEmail] = useState<string>("");
  const [isPublicName, setIsPublicName] = useState<boolean>(false); // Defaults to PRIVATE
  const [displayName, setDisplayName] = useState<string>("");
  const [selectedCard, setSelectedCard] = useState<string>("4242");

  // Processing & Result State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<Contribution | null>(null);
  const [resultOutcome, setResultOutcome] = useState<Contribution["status"]>("succeeded");
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      api
        .getCampaignDetail(id)
        .then((data) => setCampaign(data))
        .catch(console.warn)
        .finally(() => setLoading(false));
    }
  }, [id]);

  // Handle preset or custom amount change
  const handleSelectPreset = (val: number) => {
    setSelectedAmount(val);
    setCustomAmountText(String(val));
  };

  const handleCustomAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    setCustomAmountText(cleaned);
    const parsed = parseInt(cleaned, 10);
    if (!isNaN(parsed)) {
      setSelectedAmount(parsed);
    } else {
      setSelectedAmount(0);
    }
  };

  // Live pure financial calculations
  const fees = useMemo(() => {
    return calculateFees(selectedAmount);
  }, [selectedAmount]);

  // Live reach estimation
  const reach = useMemo(() => {
    return estimateReach(fees.availableForAds);
  }, [fees.availableForAds]);

  const isValidAmount = selectedAmount >= 5 && selectedAmount <= 5000;

  // Validation message
  const amountValidationMessage = useMemo(() => {
    if (!customAmountText || selectedAmount === 0) return "Please enter a contribution amount.";
    if (selectedAmount < 5) return "Minimum contribution amount is $5.00.";
    if (selectedAmount > 5000) return "Maximum contribution per transaction is $5,000.00.";
    return null;
  }, [selectedAmount, customAmountText]);

  // Campaign progress values
  const currentFundingGoal = campaign?.fundingGoal || campaign?.funding_goal || 0;
  const currentAmountRaised = campaign?.amountRaised || campaign?.amount_raised || 0;
  const currentPercent = currentFundingGoal > 0 ? Math.round((currentAmountRaised / currentFundingGoal) * 100) : 0;

  // Updated progress after contribution
  const updatedAmountRaised = currentAmountRaised + selectedAmount;
  const updatedPercent = currentFundingGoal > 0 ? Math.round((updatedAmountRaised / currentFundingGoal) * 100) : 0;

  // Execution Handlers
  const handleProceedToReview = () => {
    if (!isValidAmount) return;
    setStep("review");
  };

  const handleProceedToCheckout = () => {
    if (!acknowledgedTerms) return;
    setStep("checkout");
  };

  const handleCompletePayment = async (action: "pay" | "cancel" = "pay") => {
    if (!id || !campaign) return;

    if (action === "cancel") {
      setResultOutcome("cancelled");
      setResult({
        id: `cancelled-${Date.now()}`,
        campaignId: id,
        campaignTitle: campaign.title,
        amount: selectedAmount,
        platformFee: fees.platformFee,
        processingFee: fees.processingFee,
        platform_fee: fees.platformFee,
        processing_fee: fees.processingFee,
        total: fees.totalCharged,
        status: "cancelled",
        isPublic: false,
        reachEstimateMid: 0,
        reach_estimate_mid: 0,
        createdAt: new Date().toISOString(),
        message: "Contribution checkout was cancelled by the user. No funds were debited.",
      });
      setStep("result");
      return;
    }

    try {
      setIsProcessing(true);
      const res = await api.contribute(id, {
        amount: selectedAmount,
        guestEmail: guestEmail.trim() || undefined,
        guest_email: guestEmail.trim() || undefined,
        isPublic: isPublicName,
        displayName: isPublicName ? displayName.trim() || "Public Backer" : undefined,
        cardNumber: selectedCard,
        action: "pay",
      });

      setResult(res);
      setResultOutcome(res.status);
      setStep("result");

      // Update campaign in local state so confirmation immediately shows new progress
      if (res.status === "succeeded") {
        setCampaign((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            amountRaised: prev.amountRaised + selectedAmount,
            amount_raised: prev.amountRaised + selectedAmount,
            percentFunded: updatedPercent,
            percent_funded: updatedPercent,
          };
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Contribution processing failed";
      console.warn("Contribution failed", e);
      setResultOutcome("failed");
      setResult({
        id: `err-${Date.now()}`,
        campaignId: id,
        campaignTitle: campaign.title,
        amount: selectedAmount,
        platformFee: fees.platformFee,
        processingFee: fees.processingFee,
        platform_fee: fees.platformFee,
        processing_fee: fees.processingFee,
        total: fees.totalCharged,
        status: "failed",
        isPublic: false,
        reachEstimateMid: 0,
        reach_estimate_mid: 0,
        createdAt: new Date().toISOString(),
        message: msg,
      });
      setStep("result");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async () => {
    if (!campaign) return;
    const url = typeof window !== "undefined" ? window.location.origin : "https://amplifytogether.org";
    const msg = `I just backed the campaign "${campaign.title}" to expand its reach. Support community message amplification on Amplify Together!\n\n${url}/campaign/${campaign.id}`;
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && !navigator.share) {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(msg);
          Alert.alert("Link Copied", "Share text copied to clipboard!");
          return;
        }
      }
      await Share.share({ message: msg });
    } catch (e) {
      console.warn("Share failed", e);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, typography.uiBody]}>Loading contribution details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!campaign) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={[styles.errorTitle, typography.uiH2]}>Campaign Not Found</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
            <Text style={[styles.primaryBtnText, typography.uiH3]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Step Header */}
        <View style={styles.stepHeader}>
          <TouchableOpacity
            style={styles.backArrowBtn}
            onPress={() => {
              if (step === "review") setStep("choose");
              else if (step === "checkout") setStep("review");
              else router.back();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerBreadcrumb, typography.uiMicro]}>
              {step === "choose"
                ? "STEP 1 OF 3 • CHOOSE AMOUNT"
                : step === "review"
                ? "STEP 2 OF 3 • REVIEW & POLICY"
                : step === "checkout"
                ? "STEP 3 OF 3 • SIMULATED CHECKOUT"
                : "TRANSACTION SUMMARY"}
            </Text>
            <Text style={[styles.headerTitle, typography.uiH3]} numberOfLines={1}>
              Backing: {campaign.title}
            </Text>
          </View>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* STEP 1: CHOOSE CONTRIBUTION */}
          {step === "choose" && (
            <View style={styles.stepCard}>
              <View style={styles.stepTitleRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={[styles.stepNumberText, typography.uiMicro]}>1</Text>
                </View>
                <Text style={[styles.stepHeading, typography.uiH2]}>Choose Contribution Amount</Text>
              </View>
              <Text style={[styles.stepDescription, typography.uiBody]}>
                Contributions directly fund targeted digital advertising to expand this message beyond the creator's network.
              </Text>

              {/* Preset Amounts */}
              <View style={styles.presetsGrid}>
                {PRESET_AMOUNTS.map((amt) => {
                  const isSelected = selectedAmount === amt && customAmountText === String(amt);
                  return (
                    <TouchableOpacity
                      key={amt}
                      style={[styles.presetCard, isSelected && styles.presetCardSelected]}
                      onPress={() => handleSelectPreset(amt)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.presetDollar, typography.uiH2, isSelected && styles.presetTextActive]}>
                        ${amt}
                      </Text>
                      <Text style={[styles.presetReach, typography.uiMicro, isSelected && styles.presetReachActive]}>
                        ~{(amt * 120).toLocaleString()} reach
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom Amount Field */}
              <View style={styles.customAmountSection}>
                <Text style={[styles.inputLabel, typography.uiCaption]}>Or enter a custom amount ($USD):</Text>
                <View style={[styles.amountInputRow, !isValidAmount && styles.amountInputError]}>
                  <Text style={[styles.currencySymbol, typography.uiH1]}>$</Text>
                  <TextInput
                    style={[styles.amountTextInput, typography.uiH1]}
                    keyboardType="number-pad"
                    value={customAmountText}
                    onChangeText={handleCustomAmountChange}
                    placeholder="25"
                    placeholderTextColor={colors.textMuted}
                    maxLength={5}
                  />
                </View>
                {amountValidationMessage ? (
                  <Text style={[styles.validationText, typography.uiMicro]}>{amountValidationMessage}</Text>
                ) : (
                  <Text style={[styles.helperText, typography.uiMicro]}>Min: $5.00 • Max: $5,000.00</Text>
                )}
              </View>

              {/* Live Reach Calculator Box */}
              <View style={styles.liveReachCard}>
                <View style={styles.liveReachTop}>
                  <Ionicons name="sparkles" size={16} color={colors.primary} />
                  <Text style={[styles.liveReachLabel, typography.uiCaption]}>
                    Estimated Audience Reach
                  </Text>
                  <View style={styles.estimatePill}>
                    <Text style={[styles.estimatePillText, typography.uiMicro]}>
                      ESTIMATED, NOT GUARANTEED
                    </Text>
                  </View>
                </View>

                <Text style={[styles.liveReachRange, typography.storyH2]}>
                  {isValidAmount ? reach.formattedRange : "0 people"}
                </Text>

                <Text style={[styles.liveReachSub, typography.uiMicro]}>
                  Your ${isValidAmount ? selectedAmount : 0} contribution will place this evidence in front of an estimated ~{isValidAmount ? reach.mid.toLocaleString() : 0} verified citizens in target districts.
                </Text>
              </View>

              {/* Anti-Donation Trust Reminder */}
              <View style={styles.antiDonationCallout}>
                <Ionicons name="information-circle-outline" size={18} color={colors.amberDark} />
                <Text style={[styles.antiDonationCopy, typography.uiMicro]}>
                  This is not a donation to the organization or cause. 100% of net backing directly purchases external digital ad inventory.
                </Text>
              </View>

              {/* Step 1 Actions */}
              <TouchableOpacity
                style={[styles.primaryBtn, !isValidAmount && styles.btnDisabled]}
                onPress={handleProceedToReview}
                disabled={!isValidAmount}
                activeOpacity={0.8}
              >
                <Text style={[styles.primaryBtnText, typography.uiH3]}>Continue to Review</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.white} />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: REVIEW & TERMS */}
          {step === "review" && (
            <View style={styles.stepCard}>
              <View style={styles.stepTitleRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={[styles.stepNumberText, typography.uiMicro]}>2</Text>
                </View>
                <Text style={[styles.stepHeading, typography.uiH2]}>Review Contribution & Policy</Text>
              </View>

              {/* Transparent Fee Breakdown */}
              <View style={styles.reviewTableCard}>
                <Text style={[styles.tableTitle, typography.uiH3]}>Itemized Financial Breakdown</Text>

                <View style={styles.tableRow}>
                  <Text style={[styles.tableLabel, typography.uiBody]}>Advertising Contribution</Text>
                  <Text style={[styles.tableVal, typography.uiH3]}>${fees.amount.toFixed(2)}</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={[styles.tableSubLabel, typography.uiCaption]}>Platform Review & Verification (5%)</Text>
                  <Text style={[styles.tableSubVal, typography.uiCaption]}>${fees.platformFee.toFixed(2)}</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={[styles.tableSubLabel, typography.uiCaption]}>Card Processing ({fees.processingFeeFormula})</Text>
                  <Text style={[styles.tableSubVal, typography.uiCaption]}>+${fees.processingFee.toFixed(2)}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.totalRow}>
                  <View>
                    <Text style={[styles.totalLabel, typography.uiH2]}>Total Payment</Text>
                    <Text style={[styles.availableLabel, typography.uiMicro]}>
                      ${fees.availableForAds.toFixed(2)} deployed to ad impressions
                    </Text>
                  </View>
                  <Text style={[styles.totalVal, typography.uiTitle]}>
                    ${fees.totalCharged.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Funding Progress Preview */}
              <View style={styles.progressPreviewCard}>
                <View style={styles.progressTopRow}>
                  <Text style={[styles.progressTitle, typography.uiCaption]}>Current Funding Progress</Text>
                  <Text style={[styles.progressStats, typography.uiH3]}>
                    ${currentAmountRaised.toLocaleString()} / ${currentFundingGoal.toLocaleString()} ({currentPercent}%)
                  </Text>
                </View>
                <ProgressBar percent={currentPercent} height={8} />
                <Text style={[styles.progressAfterText, typography.uiMicro]}>
                  After your backing: <Text style={styles.boldText}>${updatedAmountRaised.toLocaleString()} ({updatedPercent}%)</Text>
                </Text>
              </View>

              {/* Mandatory Policy Box */}
              <View style={styles.policyBox}>
                <View style={styles.policyHeader}>
                  <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
                  <Text style={[styles.policyTitle, typography.uiH3]}>Distribution & Refund Policy</Text>
                </View>
                <Text style={[styles.policyText, typography.uiCaption]}>
                  • 95% of contribution purchases distribution via independent ad exchanges.
                </Text>
                <Text style={[styles.policyText, typography.uiCaption]}>
                  • Unspent funds from discontinued or under-delivered runs are refunded pro-rata.
                </Text>
                <View style={styles.strictWarningCallout}>
                  <Text style={[styles.strictWarningText, typography.uiBodyMedium]}>
                    "Your contribution pays for promoting this message. It is not a donation to the cause."
                  </Text>
                </View>
              </View>

              {/* Required Acknowledgment Checkbox */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setAcknowledgedTerms(!acknowledgedTerms)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, acknowledgedTerms && styles.checkboxActive]}>
                  {acknowledgedTerms && <Ionicons name="checkmark" size={16} color={colors.white} />}
                </View>
                <Text style={[styles.checkboxLabel, typography.uiCaption]}>
                  I acknowledge that my contribution funds advertising distribution and audience reach, not a direct charitable gift to the cause.
                </Text>
              </TouchableOpacity>

              {/* Step 2 Actions */}
              <View style={styles.actionButtonGroup}>
                <TouchableOpacity
                  style={[styles.primaryBtn, !acknowledgedTerms && styles.btnDisabled]}
                  onPress={handleProceedToCheckout}
                  disabled={!acknowledgedTerms}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.primaryBtnText, typography.uiH3]}>Continue to Checkout</Text>
                  <Ionicons name="arrow-forward" size={18} color={colors.white} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => setStep("choose")}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.secondaryBtnText, typography.uiH3]}>Change Amount</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3: SIMULATED CHECKOUT */}
          {step === "checkout" && (
            <View style={styles.stepCard}>
              <View style={styles.simulatedNoticeBadge}>
                <Ionicons name="terminal-outline" size={16} color={colors.primary} />
                <Text style={[styles.simulatedNoticeText, typography.uiMicro]}>
                  SIMULATED CHECKOUT — NO REAL PAYMENT REQUIRED
                </Text>
              </View>

              <View style={styles.stepTitleRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={[styles.stepNumberText, typography.uiMicro]}>3</Text>
                </View>
                <Text style={[styles.stepHeading, typography.uiH2]}>Checkout (Guest Mode)</Text>
              </View>
              <Text style={[styles.stepDescription, typography.uiBody]}>
                No account or sensitive financial details are required.
              </Text>

              {/* Guest Email Field (Optional for receipt) */}
              <View style={styles.fieldBlock}>
                <Text style={[styles.inputLabel, typography.uiCaption]}>
                  Receipt Email <Text style={styles.optionalText}>(Optional)</Text>
                </Text>
                <TextInput
                  style={[styles.standardInput, typography.uiBody]}
                  placeholder="name@example.com (for distribution receipt)"
                  placeholderTextColor={colors.textMuted}
                  value={guestEmail}
                  onChangeText={setGuestEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Backer Name Visibility (Defaults to PRIVATE) */}
              <View style={styles.visibilityBox}>
                <View style={styles.visibilityTextWrap}>
                  <Text style={[styles.visibilityTitle, typography.uiH3]}>Public Supporter Visibility</Text>
                  <Text style={[styles.visibilityDesc, typography.uiMicro]}>
                    Default is private. Enable to show your name on the supporters list.
                  </Text>
                </View>
                <Switch
                  value={isPublicName}
                  onValueChange={setIsPublicName}
                  trackColor={{ false: colors.slate300, true: colors.primary }}
                  thumbColor={colors.white}
                />
              </View>

              {isPublicName && (
                <View style={styles.fieldBlock}>
                  <Text style={[styles.inputLabel, typography.uiCaption]}>Public Display Name</Text>
                  <TextInput
                    style={[styles.standardInput, typography.uiBody]}
                    placeholder="e.g. Alex Citizen or Civic Advocate"
                    placeholderTextColor={colors.textMuted}
                    value={displayName}
                    onChangeText={setDisplayName}
                  />
                </View>
              )}

              {/* Test Card Selector */}
              <View style={styles.cardsSection}>
                <Text style={[styles.inputLabel, typography.uiCaption]}>Select Simulation Test Card:</Text>
                <View style={styles.cardOptionsList}>
                  {TEST_CARDS.map((card) => {
                    const isSelected = selectedCard === card.number;
                    return (
                      <TouchableOpacity
                        key={card.number}
                        style={[styles.cardOption, isSelected && styles.cardOptionSelected]}
                        onPress={() => setSelectedCard(card.number)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={isSelected ? "radio-button-on" : "radio-button-off"}
                          size={18}
                          color={isSelected ? colors.primary : colors.textMuted}
                        />
                        <View style={styles.cardOptionTextWrap}>
                          <Text style={[styles.cardOptionLabel, typography.uiBodyMedium, isSelected && styles.boldText]}>
                            {card.label}
                          </Text>
                          <Text style={[styles.cardOutcomeTag, typography.uiMicro]}>
                            Expected outcome: {card.outcome.toUpperCase()}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Step 3 Actions */}
              <View style={styles.actionButtonGroup}>
                <TouchableOpacity
                  style={[styles.primaryBtn, isProcessing && styles.btnDisabled]}
                  onPress={() => handleCompletePayment("pay")}
                  disabled={isProcessing}
                  activeOpacity={0.8}
                >
                  {isProcessing ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <>
                      <Text style={[styles.primaryBtnText, typography.uiH3]}>
                        Authorize ${fees.totalCharged.toFixed(2)} (Simulated)
                      </Text>
                      <Ionicons name="lock-closed" size={16} color={colors.white} />
                    </>
                  )}
                </TouchableOpacity>

                {/* Visible Cancel Option */}
                <TouchableOpacity
                  style={styles.cancelLinkBtn}
                  onPress={() => handleCompletePayment("cancel")}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelLinkText, typography.uiCaption]}>Cancel and Return to Campaign</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 4: RESULT SCREENS (ALL 4 OUTCOMES) */}
          {step === "result" && result && (
            <View style={styles.resultContainer}>
              {/* OUTCOME 1: SUCCEEDED */}
              {resultOutcome === "succeeded" && (
                <View style={styles.successResultCard}>
                  <View style={styles.successIconCircle}>
                    <Ionicons name="checkmark-circle" size={48} color={colors.success} />
                  </View>
                  <Text style={[styles.resultTitle, typography.storyHero]}>Contribution Confirmed!</Text>
                  <Text style={[styles.resultSubtitle, typography.uiBody]}>
                    Thank you! Your simulated contribution of <Text style={styles.boldText}>${result.amount.toFixed(2)}</Text> has been allocated to advertise this message.
                  </Text>

                  {/* Updated Campaign Progress Box */}
                  <View style={styles.updatedProgressCard}>
                    <View style={styles.progressTopRow}>
                      <Text style={[styles.progressTitle, typography.uiCaption]}>Campaign Distribution Goal</Text>
                      <Text style={[styles.progressStats, typography.uiH3]}>
                        ${updatedAmountRaised.toLocaleString()} / ${currentFundingGoal.toLocaleString()} ({updatedPercent}%)
                      </Text>
                    </View>
                    <ProgressBar percent={updatedPercent} height={10} />
                    <View style={styles.reachRow}>
                      <Ionicons name="people" size={16} color={colors.primary} />
                      <Text style={[styles.reachText, typography.uiMicro]}>
                        Estimated Reach at this tier: <Text style={styles.boldText}>~{result.reachEstimateMid.toLocaleString()} people</Text>
                      </Text>
                    </View>
                  </View>

                  {/* Viewable Receipt Toggle */}
                  <TouchableOpacity
                    style={styles.receiptToggleBtn}
                    onPress={() => setShowReceiptModal(!showReceiptModal)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="receipt-outline" size={18} color={colors.primary} />
                    <Text style={[styles.receiptToggleText, typography.uiH3]}>
                      {showReceiptModal ? "Hide Transaction Receipt" : "View Transaction Receipt"}
                    </Text>
                    <Ionicons name={showReceiptModal ? "chevron-up" : "chevron-down"} size={18} color={colors.primary} />
                  </TouchableOpacity>

                  {showReceiptModal && (
                    <View style={styles.receiptCard}>
                      <Text style={[styles.receiptHeader, typography.uiH3]}>Official Contribution Receipt</Text>
                      <View style={styles.receiptRow}>
                        <Text style={[styles.receiptKey, typography.uiCaption]}>Receipt Ref:</Text>
                        <Text style={[styles.receiptVal, typography.uiMicro]}>{result.id}</Text>
                      </View>
                      <View style={styles.receiptRow}>
                        <Text style={[styles.receiptKey, typography.uiCaption]}>Campaign Title:</Text>
                        <Text style={[styles.receiptVal, typography.uiMicro]} numberOfLines={2}>
                          {result.campaignTitle}
                        </Text>
                      </View>
                      <View style={styles.receiptRow}>
                        <Text style={[styles.receiptKey, typography.uiCaption]}>Contribution Amount:</Text>
                        <Text style={[styles.receiptVal, typography.uiCaption]}>${result.amount.toFixed(2)}</Text>
                      </View>
                      <View style={styles.receiptRow}>
                        <Text style={[styles.receiptKey, typography.uiCaption]}>Platform Review Fee (5%):</Text>
                        <Text style={[styles.receiptVal, typography.uiCaption]}>${result.platformFee.toFixed(2)}</Text>
                      </View>
                      <View style={styles.receiptRow}>
                        <Text style={[styles.receiptKey, typography.uiCaption]}>Payment Processing Fee:</Text>
                        <Text style={[styles.receiptVal, typography.uiCaption]}>${result.processingFee.toFixed(2)}</Text>
                      </View>
                      <View style={styles.receiptRow}>
                        <Text style={[styles.receiptKey, typography.uiCaption]}>Total Charged:</Text>
                        <Text style={[styles.receiptVal, typography.uiH3]}>${result.total.toFixed(2)}</Text>
                      </View>
                      <View style={styles.receiptRow}>
                        <Text style={[styles.receiptKey, typography.uiCaption]}>Backer Privacy:</Text>
                        <Text style={[styles.receiptVal, typography.uiCaption]}>
                          {result.isPublic ? `Public (${result.displayName})` : "Private Backer"}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Actions: Share & Follow Campaign */}
                  <View style={styles.resultActions}>
                    <TouchableOpacity style={styles.shareActionBtn} onPress={handleShare} activeOpacity={0.8}>
                      <Ionicons name="share-social" size={18} color={colors.white} />
                      <Text style={[styles.shareActionBtnText, typography.uiH3]}>Share This Campaign</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.followActionBtn}
                      onPress={() => router.push("/(tabs)/activity")}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="notifications-outline" size={18} color={colors.primary} />
                      <Text style={[styles.followActionBtnText, typography.uiH3]}>
                        Follow in Activity Tab
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.doneBtn}
                      onPress={() => router.push(`/campaign/${campaign.id}`)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.doneBtnText, typography.uiCaption]}>Return to Campaign Story</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* OUTCOME 2: PENDING */}
              {resultOutcome === "pending" && (
                <View style={styles.pendingResultCard}>
                  <View style={styles.pendingIconCircle}>
                    <Ionicons name="time" size={48} color={colors.amberDark} />
                  </View>
                  <Text style={[styles.resultTitle, typography.storyH2]}>Payment Authorization Pending</Text>
                  <Text style={[styles.resultSubtitle, typography.uiBody]}>
                    Your simulated payment authorization is pending settlement. Once cleared by the test network, your contribution will be deployed to distribution.
                  </Text>
                  <View style={styles.resultActions}>
                    <TouchableOpacity
                      style={styles.primaryBtn}
                      onPress={() => router.push("/(tabs)/activity")}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.primaryBtnText, typography.uiH3]}>View Status in Activity</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.secondaryBtn}
                      onPress={() => router.push(`/campaign/${campaign.id}`)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.secondaryBtnText, typography.uiH3]}>Return to Campaign</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* OUTCOME 3: FAILED */}
              {resultOutcome === "failed" && (
                <View style={styles.failedResultCard}>
                  <View style={styles.failedIconCircle}>
                    <Ionicons name="alert-circle" size={48} color={colors.error} />
                  </View>
                  <Text style={[styles.resultTitle, typography.storyH2]}>Payment Declined</Text>
                  <Text style={[styles.resultSubtitle, typography.uiBody]}>
                    {result.message || "The simulation card was declined by the issuing institution (Card •••• 0002). No funds were transferred."}
                  </Text>
                  <View style={styles.resultActions}>
                    <TouchableOpacity
                      style={styles.primaryBtn}
                      onPress={() => {
                        setSelectedCard("4242");
                        setStep("checkout");
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="refresh" size={18} color={colors.white} />
                      <Text style={[styles.primaryBtnText, typography.uiH3]}>Try Again with Test Card 4242</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.secondaryBtn}
                      onPress={() => router.push(`/campaign/${campaign.id}`)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.secondaryBtnText, typography.uiH3]}>Return to Campaign</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* OUTCOME 4: CANCELLED */}
              {resultOutcome === "cancelled" && (
                <View style={styles.cancelledResultCard}>
                  <View style={styles.cancelledIconCircle}>
                    <Ionicons name="close-circle" size={48} color={colors.textMuted} />
                  </View>
                  <Text style={[styles.resultTitle, typography.storyH2]}>Contribution Cancelled</Text>
                  <Text style={[styles.resultSubtitle, typography.uiBody]}>
                    You cancelled the checkout process. No payment was simulated and your card was not charged.
                  </Text>
                  <View style={styles.resultActions}>
                    <TouchableOpacity
                      style={styles.primaryBtn}
                      onPress={() => setStep("choose")}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.primaryBtnText, typography.uiH3]}>Start Over</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.secondaryBtn}
                      onPress={() => router.push(`/campaign/${campaign.id}`)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.secondaryBtnText, typography.uiH3]}>Return to Campaign</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.s12,
  },
  loadingText: {
    color: colors.textSecondary,
  },
  errorWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.s20,
    gap: spacing.s12,
  },
  errorTitle: {
    color: colors.textPrimary,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.s20,
    paddingVertical: spacing.s12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    gap: spacing.s12,
  },
  backArrowBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceNeutral,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerBreadcrumb: {
    color: colors.primary,
    fontWeight: "700",
  },
  headerTitle: {
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.s20,
    paddingBottom: spacing.s48,
  },
  stepCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.s20,
    gap: spacing.s16,
  },
  stepTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s10,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    color: colors.white,
    fontWeight: "800",
  },
  stepHeading: {
    color: colors.textPrimary,
  },
  stepDescription: {
    color: colors.textSecondary,
    lineHeight: 22,
  },
  presetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.s8,
  },
  presetCard: {
    flex: 1,
    minWidth: "28%",
    backgroundColor: colors.surfaceNeutral,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: spacing.radiusInput,
    paddingVertical: spacing.s12,
    paddingHorizontal: spacing.s8,
    alignItems: "center",
    justifyContent: "center",
  },
  presetCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetDollar: {
    color: colors.textPrimary,
  },
  presetTextActive: {
    color: colors.white,
  },
  presetReach: {
    color: colors.textMuted,
    marginTop: 2,
  },
  presetReachActive: {
    color: colors.white,
    opacity: 0.9,
  },
  customAmountSection: {
    gap: spacing.s6,
  },
  inputLabel: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  optionalText: {
    color: colors.textMuted,
    fontWeight: "400",
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceNeutral,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: spacing.radiusInput,
    paddingHorizontal: spacing.s16,
    height: 52,
  },
  amountInputError: {
    borderColor: colors.error,
  },
  currencySymbol: {
    color: colors.textPrimary,
    marginRight: 4,
  },
  amountTextInput: {
    flex: 1,
    color: colors.textPrimary,
  },
  validationText: {
    color: colors.error,
    fontWeight: "600",
  },
  helperText: {
    color: colors.textMuted,
  },
  liveReachCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: spacing.radiusInput,
    padding: spacing.s16,
    gap: spacing.s6,
  },
  liveReachTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s6,
    flexWrap: "wrap",
  },
  liveReachLabel: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
  estimatePill: {
    backgroundColor: colors.amberLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: spacing.radiusSm,
  },
  estimatePillText: {
    color: colors.amberDark,
    fontSize: 9,
    fontWeight: "800",
  },
  liveReachRange: {
    color: colors.primaryDark,
  },
  liveReachSub: {
    color: colors.textSecondary,
    lineHeight: 16,
  },
  antiDonationCallout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.s8,
    backgroundColor: colors.amberLight,
    padding: spacing.s12,
    borderRadius: spacing.radiusInput,
  },
  antiDonationCopy: {
    color: colors.amberDark,
    flex: 1,
    lineHeight: 18,
    fontWeight: "500",
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: spacing.s12,
    borderRadius: spacing.radiusInput,
    minHeight: spacing.minTouchTarget,
  },
  primaryBtnText: {
    color: colors.white,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  secondaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.s12,
    borderRadius: spacing.radiusInput,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    minHeight: spacing.minTouchTarget,
  },
  secondaryBtnText: {
    color: colors.textPrimary,
  },
  actionButtonGroup: {
    gap: spacing.s10,
    marginTop: spacing.s8,
  },
  reviewTableCard: {
    backgroundColor: colors.surfaceNeutral,
    borderRadius: spacing.radiusInput,
    padding: spacing.s16,
    gap: spacing.s8,
  },
  tableTitle: {
    color: colors.textPrimary,
    marginBottom: spacing.s4,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tableLabel: {
    color: colors.textPrimary,
  },
  tableVal: {
    color: colors.textPrimary,
  },
  tableSubLabel: {
    color: colors.textSecondary,
  },
  tableSubVal: {
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginVertical: spacing.s4,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    color: colors.textPrimary,
  },
  availableLabel: {
    color: colors.primary,
    fontWeight: "600",
  },
  totalVal: {
    color: colors.primary,
  },
  progressPreviewCard: {
    backgroundColor: colors.surfaceNeutral,
    borderRadius: spacing.radiusInput,
    padding: spacing.s16,
    gap: spacing.s8,
  },
  progressTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressTitle: {
    color: colors.textSecondary,
  },
  progressStats: {
    color: colors.textPrimary,
  },
  progressAfterText: {
    color: colors.textSecondary,
  },
  boldText: {
    fontWeight: "700",
    color: colors.textPrimary,
  },
  policyBox: {
    backgroundColor: colors.surfaceNeutral,
    borderRadius: spacing.radiusInput,
    padding: spacing.s16,
    gap: spacing.s6,
  },
  policyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s6,
    marginBottom: 2,
  },
  policyTitle: {
    color: colors.textPrimary,
  },
  policyText: {
    color: colors.textSecondary,
    lineHeight: 18,
  },
  strictWarningCallout: {
    backgroundColor: colors.amberLight,
    padding: spacing.s10,
    borderRadius: spacing.radiusSm,
    marginTop: spacing.s4,
  },
  strictWarningText: {
    color: colors.amberDark,
    textAlign: "center",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.s10,
    paddingVertical: spacing.s4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
  },
  checkboxLabel: {
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  simulatedNoticeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.s10,
    paddingVertical: 4,
    borderRadius: spacing.radiusFull,
    alignSelf: "flex-start",
  },
  simulatedNoticeText: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
  fieldBlock: {
    gap: spacing.s6,
  },
  standardInput: {
    backgroundColor: colors.surfaceNeutral,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: spacing.radiusInput,
    paddingHorizontal: spacing.s14,
    height: 48,
    color: colors.textPrimary,
  },
  visibilityBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceNeutral,
    borderRadius: spacing.radiusInput,
    padding: spacing.s14,
  },
  visibilityTextWrap: {
    flex: 1,
    marginRight: spacing.s10,
  },
  visibilityTitle: {
    color: colors.textPrimary,
  },
  visibilityDesc: {
    color: colors.textMuted,
    marginTop: 2,
  },
  cardsSection: {
    gap: spacing.s8,
  },
  cardOptionsList: {
    gap: spacing.s8,
  },
  cardOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s10,
    backgroundColor: colors.surfaceNeutral,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: spacing.radiusInput,
    padding: spacing.s12,
  },
  cardOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  cardOptionTextWrap: {
    flex: 1,
  },
  cardOptionLabel: {
    color: colors.textPrimary,
  },
  cardOutcomeTag: {
    color: colors.textMuted,
    marginTop: 2,
  },
  cancelLinkBtn: {
    alignItems: "center",
    paddingVertical: spacing.s8,
  },
  cancelLinkText: {
    color: colors.textMuted,
    textDecorationLine: "underline",
  },
  resultContainer: {
    gap: spacing.s16,
  },
  successResultCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.s20,
    alignItems: "center",
    gap: spacing.s12,
  },
  successIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.successLight,
    alignItems: "center",
    justifyContent: "center",
  },
  pendingResultCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.s20,
    alignItems: "center",
    gap: spacing.s12,
  },
  pendingIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.amberLight,
    alignItems: "center",
    justifyContent: "center",
  },
  failedResultCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.s20,
    alignItems: "center",
    gap: spacing.s12,
  },
  failedIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.errorLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelledResultCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.s20,
    alignItems: "center",
    gap: spacing.s12,
  },
  cancelledIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.surfaceNeutral,
    alignItems: "center",
    justifyContent: "center",
  },
  resultTitle: {
    color: colors.textPrimary,
    textAlign: "center",
  },
  resultSubtitle: {
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  updatedProgressCard: {
    width: "100%",
    backgroundColor: colors.surfaceNeutral,
    borderRadius: spacing.radiusInput,
    padding: spacing.s16,
    gap: spacing.s8,
  },
  reachRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  reachText: {
    color: colors.textSecondary,
  },
  receiptToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.s8,
  },
  receiptToggleText: {
    color: colors.primary,
  },
  receiptCard: {
    width: "100%",
    backgroundColor: colors.surfaceNeutral,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: spacing.radiusInput,
    padding: spacing.s14,
    gap: spacing.s6,
  },
  receiptHeader: {
    color: colors.textPrimary,
    marginBottom: spacing.s4,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  receiptKey: {
    color: colors.textMuted,
  },
  receiptVal: {
    color: colors.textPrimary,
    maxWidth: "60%",
    textAlign: "right",
  },
  resultActions: {
    width: "100%",
    gap: spacing.s10,
    marginTop: spacing.s8,
  },
  shareActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: spacing.s12,
    borderRadius: spacing.radiusInput,
    minHeight: spacing.minTouchTarget,
  },
  shareActionBtnText: {
    color: colors.white,
  },
  followActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: spacing.s12,
    borderRadius: spacing.radiusInput,
    minHeight: spacing.minTouchTarget,
  },
  followActionBtnText: {
    color: colors.primary,
  },
  doneBtn: {
    alignItems: "center",
    paddingVertical: spacing.s8,
  },
  doneBtnText: {
    color: colors.textSecondary,
    textDecorationLine: "underline",
  },
});
