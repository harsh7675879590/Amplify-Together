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
  TextInput,
  Modal,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Campaign, Contribution } from "../../types";
import { api } from "../../lib/api";
import { StatusBadge } from "../../components/StatusBadge";
import { ProgressBar } from "../../components/ProgressBar";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing } from "../../theme/spacing";

export default function ProfileScreen() {
  const router = useRouter();

  // Authentication State (Guest vs Signed-In)
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "register">("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  // Tabs
  const [activeTab, setActiveTab] = useState<"created" | "backed" | "saved" | "payments" | "settings">("created");
  const [createdCampaigns, setCreatedCampaigns] = useState<Campaign[]>([]);
  const [backedList, setBackedList] = useState<Contribution[]>([]);
  const [savedCampaigns, setSavedCampaigns] = useState<Campaign[]>([]);
  const [reviewerMode, setReviewerMode] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<Contribution | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allCamps, contribs, queue] = await Promise.all([
        api.getCampaigns({ status: undefined }),
        api.getMyContributions().catch(() => []),
        api.getReviewQueue().catch(() => []),
      ]);
      setCreatedCampaigns(allCamps);
      setReviewQueue(queue);
      setBackedList(contribs);
      setSavedCampaigns(allCamps.slice(0, 3));
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
      Alert.alert("Stage Advanced", `Campaign transitioned to ${res.new_status}!`);
      loadData();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleAuthSubmit = () => {
    if (!authEmail.trim() || !authPassword.trim()) {
      Alert.alert("Incomplete", "Please enter an email and password.");
      return;
    }
    setIsAuthenticated(true);
    setShowAuthModal(false);
    Alert.alert("Success", authMode === "signin" ? "Signed in successfully!" : "Account created successfully!");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    Alert.alert("Guest Mode", "You are now browsing in guest mode. Your actions remain functional.");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* User Card: Authenticated vs Guest State */}
        {isAuthenticated ? (
          <View style={styles.userCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>ML</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, typography.uiH2]}>Maya Lin</Text>
              <Text style={[styles.userEmail, typography.caption]}>maya.lin@civicnet.org</Text>
              <View style={styles.roleBadgeRow}>
                <View style={styles.roleBadge}>
                  <Text style={[styles.roleBadgeText, typography.micro]}>CREATOR & BACKER</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                  <Text style={[styles.logoutBtnText, typography.micro]}>Switch to Guest</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.guestCard}>
            <View style={styles.guestIconBox}>
              <Ionicons name="person-outline" size={28} color={colors.primary} />
            </View>
            <View style={styles.guestTextWrap}>
              <Text style={[styles.guestTitle, typography.uiH2]}>Browsing as Guest</Text>
              <Text style={[styles.guestSub, typography.caption]}>
                You can browse and back campaigns anonymously. Sign in or register to sync your drafts and receipts.
              </Text>
              <TouchableOpacity
                style={styles.signInBtn}
                onPress={() => setShowAuthModal(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="log-in-outline" size={16} color={colors.white} />
                <Text style={[styles.signInBtnText, typography.uiH3]}>Sign In or Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Creator Dashboard Callout Banner */}
        <TouchableOpacity
          style={styles.dashboardCallout}
          onPress={() => router.push("/dashboard")}
          activeOpacity={0.88}
        >
          <View style={styles.calloutIcon}>
            <Ionicons name="grid-outline" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.calloutHeaderRow}>
              <Text style={[styles.calloutTitle, typography.uiH3]}>Creator Dashboard</Text>
              <View style={styles.calloutBadge}>
                <Text style={[styles.calloutBadgeText, typography.micro]}>6 LIFECYCLE TABS</Text>
              </View>
            </View>
            <Text style={[styles.calloutSub, typography.caption]}>
              Manage drafts, monitor under-review status, view live telemetry, and review moderation notes.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.slate400} />
        </TouchableOpacity>

        {/* Profile Navigation Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "created" && styles.tabButtonActive]}
            onPress={() => setActiveTab("created")}
          >
            <Text style={[styles.tabButtonText, typography.uiCaption, activeTab === "created" && styles.tabButtonTextActive]}>
              Created ({createdCampaigns.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === "backed" && styles.tabButtonActive]}
            onPress={() => setActiveTab("backed")}
          >
            <Text style={[styles.tabButtonText, typography.uiCaption, activeTab === "backed" && styles.tabButtonTextActive]}>
              Backed ({backedList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === "saved" && styles.tabButtonActive]}
            onPress={() => setActiveTab("saved")}
          >
            <Text style={[styles.tabButtonText, typography.uiCaption, activeTab === "saved" && styles.tabButtonTextActive]}>
              Saved ({savedCampaigns.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === "payments" && styles.tabButtonActive]}
            onPress={() => setActiveTab("payments")}
          >
            <Text style={[styles.tabButtonText, typography.uiCaption, activeTab === "payments" && styles.tabButtonTextActive]}>
              Receipts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === "settings" && styles.tabButtonActive]}
            onPress={() => setActiveTab("settings")}
          >
            <Text style={[styles.tabButtonText, typography.uiCaption, activeTab === "settings" && styles.tabButtonTextActive]}>
              Settings
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: CREATED CAMPAIGNS */}
        {activeTab === "created" && (
          <View style={styles.tabContent}>
            {createdCampaigns.map((camp) => {
              const raised = camp.amountRaised || camp.amount_raised || 0;
              const goal = camp.fundingGoal || camp.funding_goal || 1;
              const percent = camp.percentFunded ?? Math.round((raised / goal) * 100);

              return (
                <TouchableOpacity
                  key={camp.id}
                  style={styles.createdCard}
                  onPress={() => router.push(`/campaign/${camp.id}`)}
                  activeOpacity={0.88}
                >
                  <View style={styles.cardTopRow}>
                    <Text style={[styles.campTitle, typography.uiH3]} numberOfLines={1}>
                      {camp.title}
                    </Text>
                    <StatusBadge status={camp.status} />
                  </View>
                  <Text style={[styles.campSummary, typography.body]} numberOfLines={2}>
                    {camp.summary}
                  </Text>
                  <View style={styles.cardStatsRow}>
                    <Text style={[styles.statsMoney, typography.caption]}>
                      ${raised.toLocaleString()} raised of ${goal.toLocaleString()}
                    </Text>
                    <Text style={[styles.statsPercent, typography.micro]}>{percent}%</Text>
                  </View>
                  <ProgressBar progress={percent} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* TAB 2: BACKED CAMPAIGNS WITH OFFICIAL RECEIPT ACTION */}
        {activeTab === "backed" && (
          <View style={styles.tabContent}>
            <View style={styles.backedSummaryBox}>
              <View style={styles.backedStat}>
                <Text style={[styles.backedStatNumber, typography.h2]}>
                  ${backedList.reduce((acc, b) => acc + (b.amount || 0), 0).toFixed(2)}
                </Text>
                <Text style={[styles.backedStatLabel, typography.micro]}>TOTAL ALLOCATED</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.backedStat}>
                <Text style={[styles.backedStatNumber, typography.h2]}>
                  ~{(backedList.reduce((acc, b) => acc + (b.amount || 0), 0) * 114).toLocaleString()}
                </Text>
                <Text style={[styles.backedStatLabel, typography.micro]}>EST. PEOPLE REACHED</Text>
              </View>
            </View>

            {backedList.map((item) => (
              <View key={item.id} style={styles.backedItemCard}>
                <View style={styles.backedHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.backedCampaignTitle, typography.uiH3]}>
                      {item.campaignTitle || item.campaign_title || "Public Interest Campaign"}
                    </Text>
                    <Text style={[styles.backedDate, typography.micro]}>
                      {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={[styles.backedAmount, typography.uiH2]}>${item.amount.toFixed(2)}</Text>
                </View>

                <View style={styles.privacyTagRow}>
                  <View style={styles.privacyTag}>
                    <Ionicons name={item.isPublic ? "eye" : "lock-closed"} size={12} color={colors.slate600} />
                    <Text style={[styles.privacyTagText, typography.micro]}>
                      {item.isPublic ? "Public Backer" : "Private Backer"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.viewReceiptBtn}
                    onPress={() => setSelectedReceipt(item)}
                  >
                    <Ionicons name="receipt-outline" size={14} color={colors.primary} />
                    <Text style={[styles.viewReceiptText, typography.micro]}>View Official Receipt</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TAB 3: SAVED CAMPAIGNS */}
        {activeTab === "saved" && (
          <View style={styles.tabContent}>
            {savedCampaigns.map((camp) => (
              <TouchableOpacity
                key={camp.id}
                style={styles.savedCard}
                onPress={() => router.push(`/campaign/${camp.id}`)}
                activeOpacity={0.88}
              >
                <Image
                  source={{ uri: camp.coverImageUrl || camp.cover_image_url || "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800" }}
                  style={styles.savedCover}
                  resizeMode="cover"
                />
                <View style={styles.savedContent}>
                  <Text style={[styles.savedCategory, typography.micro]}>{camp.category}</Text>
                  <Text style={[styles.savedTitle, typography.uiH3]} numberOfLines={2}>
                    {camp.title}
                  </Text>
                  <View style={styles.savedActionRow}>
                    <Text style={[styles.savedCreator, typography.caption]}>By {camp.creatorName || camp.creator_name}</Text>
                    <TouchableOpacity
                      style={styles.backNowBtn}
                      onPress={() => router.push(`/back/${camp.id}`)}
                    >
                      <Text style={[styles.backNowText, typography.micro]}>Back Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* TAB 4: PAYMENT HISTORY & ITEMIZED RECEIPTS */}
        {activeTab === "payments" && (
          <View style={styles.tabContent}>
            {backedList.map((item) => (
              <View key={item.id} style={styles.receiptCard}>
                <View style={styles.receiptTopRow}>
                  <View>
                    <Text style={[styles.receiptMerchant, typography.uiH3]}>Amplify Together Media</Text>
                    <Text style={[styles.receiptDate, typography.caption]}>
                      {new Date(item.createdAt || Date.now()).toLocaleDateString()} • Card ending 4242
                    </Text>
                  </View>
                  <Text style={[styles.receiptTotal, typography.uiH2]}>
                    ${(item.total || item.amount * 1.032).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.receiptLine}>
                  <Text style={[styles.lineLabel, typography.caption]}>Advertising distribution contribution</Text>
                  <Text style={[styles.lineVal, typography.caption]}>${item.amount.toFixed(2)}</Text>
                </View>
                <View style={styles.receiptLine}>
                  <Text style={[styles.lineLabel, typography.caption]}>Card processing (2.9% + $0.30)</Text>
                  <Text style={[styles.lineVal, typography.caption]}>
                    ${(item.processingFee || item.processing_fee || item.amount * 0.032).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.receiptStatusPill}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={[styles.receiptStatusText, typography.micro]}>
                    SUCCEEDED • RECEIPT #{item.id.toUpperCase().slice(0, 10)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TAB 5: SETTINGS & REVIEWER MODE (DEMO TOOL) */}
        {activeTab === "settings" && (
          <View style={styles.tabContent}>
            {/* Reviewer / Admin Demo Mode Toggle */}
            <View style={styles.settingsSection}>
              <Text style={[styles.settingsSectionTitle, typography.uiH2]}>Demo Controls</Text>
              <View style={styles.reviewerToggleCard}>
                <View style={styles.reviewerToggleTextWrap}>
                  <View style={styles.reviewerTitleRow}>
                    <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
                    <Text style={[styles.reviewerTitle, typography.uiH3]}>Reviewer Mode (Demo Only)</Text>
                  </View>
                  <Text style={[styles.reviewerSub, typography.caption]}>
                    Inspect review queue, approve submissions, and test lifecycle transitions between stages.
                  </Text>
                </View>
                <Switch
                  value={reviewerMode}
                  onValueChange={setReviewerMode}
                  trackColor={{ false: colors.slate300, true: colors.primary }}
                  thumbColor={colors.white}
                />
              </View>

              {reviewerMode && (
                <View style={styles.adminQueueWrap}>
                  <Text style={[styles.queueTitleText, typography.uiH3]}>Review Queue (Pending Approval)</Text>
                  {reviewQueue.length === 0 ? (
                    <Text style={[styles.queueEmptyText, typography.caption]}>No campaigns pending moderation.</Text>
                  ) : (
                    reviewQueue.map((c) => (
                      <View key={c.id} style={styles.queueItemCard}>
                        <Text style={[styles.queueCampName, typography.uiH3]}>{c.title}</Text>
                        <Text style={[styles.queueCampSub, typography.caption]}>
                          Category: {c.category} • Sources: {c.sources?.length || 0} citations
                        </Text>
                        <View style={styles.queueActionRow}>
                          <TouchableOpacity
                            style={styles.approveActionBtn}
                            onPress={() => handleApprove(c.id)}
                          >
                            <Ionicons name="checkmark" size={14} color={colors.white} />
                            <Text style={[styles.approveActionText, typography.micro]}>Approve & Open</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.advanceActionBtn}
                            onPress={() => handleAdvance(c.id)}
                          >
                            <Ionicons name="play-forward" size={14} color={colors.slate800} />
                            <Text style={[styles.advanceActionText, typography.micro]}>Advance Stage</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>

            {/* Help & Information Pages */}
            <View style={styles.settingsSection}>
              <Text style={[styles.settingsSectionTitle, typography.uiH2]}>Help & Documentation</Text>
              {[
                { key: "about", label: "About Amplify Together", icon: "information-circle-outline" },
                { key: "how-it-works", label: "How It Works (Create -> Review -> Amplify)", icon: "bulb-outline" },
                { key: "faqs", label: "Frequently Asked Questions", icon: "help-circle-outline" },
                { key: "help", label: "Help Desk & Creator Assistance", icon: "headset-outline" },
                { key: "contact", label: "Contact Us", icon: "mail-outline" },
                { key: "terms", label: "Terms of Service", icon: "document-text-outline" },
                { key: "privacy", label: "Privacy Policy", icon: "lock-closed-outline" },
                { key: "guidelines", label: "Community Guidelines", icon: "people-outline" },
                { key: "partners", label: "Publishing Partners & Media Alliance", icon: "business-outline" },
              ].map((link) => (
                <TouchableOpacity
                  key={link.key}
                  style={styles.menuRow}
                  onPress={() => router.push(`/info/${link.key}` as any)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={link.icon as any} size={20} color={colors.primary} />
                  <Text style={[styles.menuRowText, typography.uiCaption]}>{link.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.slate400} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ==================================================================== */}
      {/* AUTHENTICATION MODAL: Sign In / Register (Structured for real JWT) */}
      {/* ==================================================================== */}
      <Modal visible={showAuthModal} animationType="slide" transparent onRequestClose={() => setShowAuthModal(false)}>
        <View style={styles.authModalOverlay}>
          <View style={styles.authModalBox}>
            <View style={styles.authModalHead}>
              <Text style={[styles.authModalTitle, typography.uiH2]}>
                {authMode === "signin" ? "Sign In to Amplify" : "Create Account"}
              </Text>
              <TouchableOpacity onPress={() => setShowAuthModal(false)}>
                <Ionicons name="close" size={24} color={colors.slate600} />
              </TouchableOpacity>
            </View>

            <View style={styles.authTabs}>
              <TouchableOpacity
                style={[styles.authTab, authMode === "signin" && styles.authTabActive]}
                onPress={() => setAuthMode("signin")}
              >
                <Text style={[styles.authTabText, typography.uiCaption, authMode === "signin" && styles.authTabTextActive]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.authTab, authMode === "register" && styles.authTabActive]}
                onPress={() => setAuthMode("register")}
              >
                <Text style={[styles.authTabText, typography.uiCaption, authMode === "register" && styles.authTabTextActive]}>
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.authInput, typography.uiBody]}
              placeholder="Email address..."
              placeholderTextColor={colors.slate400}
              autoCapitalize="none"
              keyboardType="email-address"
              value={authEmail}
              onChangeText={setAuthEmail}
            />

            <TextInput
              style={[styles.authInput, typography.uiBody]}
              placeholder="Password..."
              placeholderTextColor={colors.slate400}
              secureTextEntry
              value={authPassword}
              onChangeText={setAuthPassword}
            />

            <TouchableOpacity style={styles.authSubmitBtn} onPress={handleAuthSubmit} activeOpacity={0.85}>
              <Text style={[styles.authSubmitBtnText, typography.uiH3]}>
                {authMode === "signin" ? "Continue to Account" : "Create My Account"}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.authNotice, typography.micro]}>
              Simulated authentication. Structured for JWT integration.
            </Text>
          </View>
        </View>
      </Modal>

      {/* ==================================================================== */}
      {/* OFFICIAL RECEIPT MODAL */}
      {/* ==================================================================== */}
      <Modal visible={!!selectedReceipt} animationType="fade" transparent onRequestClose={() => setSelectedReceipt(null)}>
        <View style={styles.authModalOverlay}>
          <View style={styles.receiptModalBox}>
            <View style={styles.receiptModalHead}>
              <Ionicons name="receipt" size={24} color={colors.primary} />
              <Text style={[styles.receiptModalTitle, typography.uiH2]}>Official Receipt</Text>
              <TouchableOpacity onPress={() => setSelectedReceipt(null)} style={{ marginLeft: "auto" }}>
                <Ionicons name="close" size={24} color={colors.slate600} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.receiptModalCamp, typography.uiH3]}>
              {selectedReceipt?.campaignTitle || selectedReceipt?.campaign_title || "Amplify Campaign"}
            </Text>

            <View style={styles.receiptDetailLines}>
              <View style={styles.detailLine}>
                <Text style={[styles.detailKey, typography.caption]}>Receipt ID:</Text>
                <Text style={[styles.detailVal, typography.uiCaption]}>{selectedReceipt?.id}</Text>
              </View>
              <View style={styles.detailLine}>
                <Text style={[styles.detailKey, typography.caption]}>Date:</Text>
                <Text style={[styles.detailVal, typography.uiCaption]}>
                  {new Date(selectedReceipt?.createdAt || Date.now()).toLocaleString()}
                </Text>
              </View>
              <View style={styles.detailLine}>
                <Text style={[styles.detailKey, typography.caption]}>Contribution for Ads:</Text>
                <Text style={[styles.detailVal, typography.uiCaption]}>${selectedReceipt?.amount.toFixed(2)}</Text>
              </View>
              <View style={styles.detailLine}>
                <Text style={[styles.detailKey, typography.caption]}>Card Processing Fee:</Text>
                <Text style={[styles.detailVal, typography.uiCaption]}>
                  ${(selectedReceipt?.processingFee || selectedReceipt?.processing_fee || 1.03).toFixed(2)}
                </Text>
              </View>
              <View style={styles.detailLine}>
                <Text style={[styles.detailKey, typography.caption]}>Total Charged:</Text>
                <Text style={[styles.detailVal, typography.uiH3, { color: colors.primary }]}>
                  ${(selectedReceipt?.total || (selectedReceipt?.amount || 0) * 1.032).toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.antiDonationReceiptBox}>
              <Text style={[styles.antiDonationReceiptText, typography.micro]}>
                Notice: Contributions fund advertising reach and message distribution. They are not charitable donations.
              </Text>
            </View>

            <TouchableOpacity style={styles.authSubmitBtn} onPress={() => setSelectedReceipt(null)}>
              <Text style={[styles.authSubmitBtnText, typography.uiH3]}>Done</Text>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
    gap: spacing.lg,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
    alignItems: "center",
    gap: spacing.sm,
  },
  roleBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: spacing.radiusFull,
  },
  roleBadgeText: {
    color: colors.primary,
  },
  logoutBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  logoutBtnText: {
    color: colors.slate500,
    textDecorationLine: "underline",
  },
  guestCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.md,
  },
  guestIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  guestTextWrap: {
    flex: 1,
    gap: 4,
  },
  guestTitle: {
    color: colors.slate900,
  },
  guestSub: {
    color: colors.slate600,
    marginBottom: spacing.xs,
  },
  signInBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: spacing.radiusMd,
    gap: 6,
    alignSelf: "flex-start",
  },
  signInBtnText: {
    color: colors.white,
  },
  dashboardCallout: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    gap: spacing.md,
  },
  calloutIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  calloutHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  calloutTitle: {
    color: colors.slate900,
  },
  calloutBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  calloutBadgeText: {
    color: colors.primary,
  },
  calloutSub: {
    color: colors.slate600,
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: colors.slate200,
    borderRadius: spacing.radiusFull,
    padding: 3,
    gap: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: spacing.radiusFull,
  },
  tabButtonActive: {
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    color: colors.slate600,
  },
  tabButtonTextActive: {
    color: colors.slate900,
    fontWeight: "700",
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
    gap: spacing.xs,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  campTitle: {
    color: colors.slate900,
    flex: 1,
    marginRight: spacing.sm,
  },
  campSummary: {
    color: colors.slate600,
  },
  cardStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  statsMoney: {
    color: colors.slate700,
  },
  statsPercent: {
    color: colors.primary,
    fontWeight: "bold",
  },
  backedSummaryBox: {
    flexDirection: "row",
    backgroundColor: colors.slate900,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    alignItems: "center",
  },
  backedStat: {
    flex: 1,
    alignItems: "center",
  },
  backedStatNumber: {
    color: colors.white,
  },
  backedStatLabel: {
    color: colors.slate400,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.slate700,
  },
  backedItemCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.sm,
  },
  backedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  backedCampaignTitle: {
    color: colors.slate900,
  },
  backedDate: {
    color: colors.slate400,
    marginTop: 2,
  },
  backedAmount: {
    color: colors.primary,
  },
  privacyTagRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
  },
  privacyTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  privacyTagText: {
    color: colors.slate600,
  },
  viewReceiptBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewReceiptText: {
    color: colors.primary,
    fontWeight: "bold",
  },
  savedCard: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: "hidden",
  },
  savedCover: {
    width: 100,
    height: "100%",
    backgroundColor: colors.slate200,
  },
  savedContent: {
    flex: 1,
    padding: spacing.md,
    gap: 4,
  },
  savedCategory: {
    color: colors.primary,
  },
  savedTitle: {
    color: colors.slate900,
  },
  savedActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  savedCreator: {
    color: colors.slate500,
  },
  backNowBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: spacing.radiusFull,
  },
  backNowText: {
    color: colors.white,
  },
  receiptCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.xs,
  },
  receiptTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xs,
  },
  receiptMerchant: {
    color: colors.slate900,
  },
  receiptDate: {
    color: colors.slate500,
  },
  receiptTotal: {
    color: colors.primary,
  },
  receiptLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  lineLabel: {
    color: colors.slate600,
  },
  lineVal: {
    color: colors.slate900,
  },
  receiptStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
  },
  receiptStatusText: {
    color: colors.successDark,
  },
  settingsSection: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.md,
  },
  settingsSectionTitle: {
    color: colors.slate900,
  },
  reviewerToggleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.slate50,
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
    gap: spacing.md,
  },
  reviewerToggleTextWrap: {
    flex: 1,
    gap: 2,
  },
  reviewerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reviewerTitle: {
    color: colors.slate900,
  },
  reviewerSub: {
    color: colors.slate600,
  },
  adminQueueWrap: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.slate200,
  },
  queueTitleText: {
    color: colors.slate900,
  },
  queueEmptyText: {
    color: colors.slate500,
    fontStyle: "italic",
  },
  queueItemCard: {
    backgroundColor: colors.slate50,
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
    gap: 4,
  },
  queueCampName: {
    color: colors.slate900,
  },
  queueCampSub: {
    color: colors.slate600,
  },
  queueActionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: 4,
  },
  approveActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.success,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: spacing.radiusMd,
    gap: 4,
  },
  approveActionText: {
    color: colors.white,
  },
  advanceActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate300,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: spacing.radiusMd,
    gap: 4,
  },
  advanceActionText: {
    color: colors.slate800,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
    gap: spacing.md,
  },
  menuRowText: {
    flex: 1,
    color: colors.slate800,
  },
  authModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  authModalBox: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: spacing.radiusXl,
    gap: spacing.md,
  },
  authModalHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  authModalTitle: {
    color: colors.slate900,
  },
  authTabs: {
    flexDirection: "row",
    backgroundColor: colors.slate100,
    borderRadius: spacing.radiusFull,
    padding: 3,
    gap: 4,
  },
  authTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: spacing.radiusFull,
  },
  authTabActive: {
    backgroundColor: colors.white,
    elevation: 2,
  },
  authTabText: {
    color: colors.slate600,
  },
  authTabTextActive: {
    color: colors.primary,
    fontWeight: "bold",
  },
  authInput: {
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.slate300,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.slate900,
  },
  authSubmitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: spacing.radiusMd,
    alignItems: "center",
    marginTop: spacing.xs,
    minHeight: 48,
    justifyContent: "center",
  },
  authSubmitBtnText: {
    color: colors.white,
  },
  authNotice: {
    color: colors.slate400,
    textAlign: "center",
  },
  receiptModalBox: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: spacing.radiusXl,
    gap: spacing.sm,
  },
  receiptModalHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  receiptModalTitle: {
    color: colors.slate900,
  },
  receiptModalCamp: {
    color: colors.slate800,
    marginBottom: spacing.xs,
  },
  receiptDetailLines: {
    backgroundColor: colors.slate50,
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
    gap: 6,
  },
  detailLine: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailKey: {
    color: colors.slate600,
  },
  detailVal: {
    color: colors.slate900,
  },
  antiDonationReceiptBox: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
    marginVertical: spacing.xs,
  },
  antiDonationReceiptText: {
    color: colors.slate800,
    textAlign: "center",
  },
});
