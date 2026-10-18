import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useDraftStore } from "../../store/draftStore";
import { api } from "../../lib/api";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing } from "../../theme/spacing";

export default function CreateTabScreen() {
  const router = useRouter();
  const draft = useDraftStore();

  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    draft.loadFromServer();
  }, []);

  const handleStartManual = () => {
    router.push("/create/step");
  };

  const handleResumeDraft = () => {
    router.push("/create/step");
  };

  const handleSimulateVoice = () => {
    setIsRecording(true);
    // Simulate speech-to-text recording
    setTimeout(() => {
      setVoiceText(
        "Our county is building an industrial chemical warehouse next to a protected river delta that supplies clean water to 40,000 residents. We want to amplify scientific flood-risk studies directly to affected homeowners and town council members before next month's zoning hearing."
      );
      setIsRecording(false);
    }, 1800);
  };

  const handleGenerateAIDraft = async () => {
    if (!voiceText.trim()) return;
    try {
      setAiLoading(true);
      const res = await api.generateAIDraft(voiceText);
      draft.populateFromAI(res);
      setVoiceModalVisible(false);
      setVoiceText("");
      // Navigate to step 1 with pre-filled editable draft
      router.push("/create/step");
    } catch (e) {
      console.warn("AI generation failed", e);
    } finally {
      setAiLoading(false);
    }
  };

  const hasDraftContent = draft.title.length > 0 || (draft.summary && draft.summary.length > 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, typography.h1]}>Start a Campaign</Text>
          <Text style={[styles.subtitle, typography.body]}>
            Give your message community-funded reach beyond traditional algorithms.
          </Text>
        </View>

        {/* Resume Saved Draft (if exists) */}
        {hasDraftContent && (
          <View style={styles.resumeCard}>
            <View style={styles.resumeHeader}>
              <View style={styles.resumeBadge}>
                <Ionicons name="document-text" size={14} color={colors.primary} />
                <Text style={[styles.resumeBadgeText, typography.micro]}>SAVED DRAFT</Text>
              </View>
              <Text style={[styles.savedAtText, typography.micro]}>
                Step {draft.currentStep} of 5
              </Text>
            </View>

            <Text style={[styles.resumeTitle, typography.h3]} numberOfLines={1}>
              {draft.title || "Untitled Campaign Draft"}
            </Text>
            <Text style={[styles.resumeSub, typography.caption]} numberOfLines={2}>
              {draft.summary || "Click continue to pick up right where you left off."}
            </Text>

            <TouchableOpacity
              style={styles.resumeButton}
              onPress={handleResumeDraft}
              activeOpacity={0.8}
            >
              <Text style={[styles.resumeButtonText, typography.h3]}>Continue Draft</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        )}

        {/* Creation Modes */}
        <Text style={[styles.sectionHeading, typography.h2]}>How would you like to begin?</Text>

        {/* Option 1: Manual Step-by-Step */}
        <TouchableOpacity
          style={styles.modeCard}
          onPress={handleStartManual}
          activeOpacity={0.88}
        >
          <View style={[styles.modeIconBox, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="create-outline" size={26} color={colors.primary} />
          </View>
          <View style={styles.modeTextWrap}>
            <Text style={[styles.modeTitle, typography.h2]}>Create Manually</Text>
            <Text style={[styles.modeDesc, typography.body]}>
              A structured 5-step guided composer: Basics, Story & Sources, Ad Creatives, Reach, and Submit.
            </Text>
            <View style={styles.stepsPillRow}>
              <Text style={[styles.stepsPill, typography.micro]}>5 STEPS</Text>
              <Text style={[styles.stepsPill, typography.micro]}>AUTO-SAVED DRAFTS</Text>
              <Text style={[styles.stepsPill, typography.micro]}>LIVE PREVIEW</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.slate400} />
        </TouchableOpacity>

        {/* Option 2: Voice & AI Assisted */}
        <TouchableOpacity
          style={styles.modeCard}
          onPress={() => setVoiceModalVisible(true)}
          activeOpacity={0.88}
        >
          <View style={[styles.modeIconBox, { backgroundColor: colors.amberLight }]}>
            <Ionicons name="mic-outline" size={26} color={colors.amberDark} />
          </View>
          <View style={styles.modeTextWrap}>
            <Text style={[styles.modeTitle, typography.h2]}>Describe with Voice / AI</Text>
            <Text style={[styles.modeDesc, typography.body]}>
              Speak aloud or type your idea. AI will propose a title, category, and story outline for your review.
            </Text>
            <View style={styles.stepsPillRow}>
              <Text style={[styles.stepsPill, typography.micro]}>SPEECH-TO-TEXT</Text>
              <Text style={[styles.stepsPill, typography.micro]}>100% EDITABLE</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.slate400} />
        </TouchableOpacity>

        {/* Platform Integrity Note */}
        <View style={styles.trustBanner}>
          <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
          <View style={styles.trustTextWrap}>
            <Text style={[styles.trustTitle, typography.h3]}>Review & Fact-Checking</Text>
            <Text style={[styles.trustDesc, typography.caption]}>
              Every submitted campaign is reviewed by platform moderators. Backing only opens once supporting sources and ad claims are verified.
            </Text>
          </View>
        </View>

        {/* Voice Modal */}
        <Modal
          visible={voiceModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setVoiceModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, typography.h2]}>Voice / AI Draft Assistant</Text>
                <TouchableOpacity onPress={() => setVoiceModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.slate500} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalSub, typography.body]}>
                Describe your message, why it matters, who should see it, and what evidence supports it.
              </Text>

              {/* Mic Demo Button */}
              <TouchableOpacity
                style={[styles.micButton, isRecording && styles.micButtonRecording]}
                onPress={handleSimulateVoice}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isRecording ? "radio" : "mic"}
                  size={32}
                  color={isRecording ? colors.error : colors.white}
                />
                <Text style={[styles.micButtonText, typography.h3]}>
                  {isRecording ? "Listening to your description..." : "Tap to Speak (Demo Voice)"}
                </Text>
              </TouchableOpacity>

              {/* Text area fallback */}
              <Text style={[styles.orLabel, typography.caption]}>or type your description below:</Text>
              <TextInput
                style={[styles.voiceInput, typography.body]}
                placeholder="Example: Our town needs clean drinking water in all 42 public schools. Testing found elevated lead in 340 fountains..."
                placeholderTextColor={colors.slate400}
                multiline
                numberOfLines={4}
                value={voiceText}
                onChangeText={setVoiceText}
              />

              <TouchableOpacity
                style={[styles.generateBtn, !voiceText && styles.generateBtnDisabled]}
                onPress={handleGenerateAIDraft}
                disabled={!voiceText || aiLoading}
                activeOpacity={0.8}
              >
                {aiLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color={colors.white} />
                    <Text style={[styles.generateBtnText, typography.h3]}>Generate Editable Draft</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.slate900,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.slate600,
  },
  resumeCard: {
    backgroundColor: colors.white,
    borderRadius: spacing.radiusLg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  resumeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  resumeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  resumeBadgeText: {
    color: colors.primary,
    fontWeight: "700",
  },
  savedAtText: {
    color: colors.slate500,
  },
  resumeTitle: {
    color: colors.slate900,
    marginBottom: spacing.xs,
  },
  resumeSub: {
    color: colors.slate500,
    marginBottom: spacing.md,
  },
  resumeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: spacing.radiusMd,
    gap: 6,
  },
  resumeButtonText: {
    color: colors.white,
  },
  sectionHeading: {
    color: colors.slate900,
    marginBottom: spacing.md,
  },
  modeCard: {
    backgroundColor: colors.white,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: colors.slate900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  modeIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  modeTextWrap: {
    flex: 1,
    marginRight: spacing.sm,
  },
  modeTitle: {
    color: colors.slate900,
    marginBottom: 4,
  },
  modeDesc: {
    color: colors.slate600,
    marginBottom: spacing.sm,
  },
  stepsPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  stepsPill: {
    backgroundColor: colors.slate100,
    color: colors.slate600,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trustBanner: {
    flexDirection: "row",
    backgroundColor: colors.primaryLight,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    marginTop: spacing.md,
    alignItems: "flex-start",
  },
  trustTextWrap: {
    marginLeft: spacing.md,
    flex: 1,
  },
  trustTitle: {
    color: colors.primaryDark,
    marginBottom: 2,
  },
  trustDesc: {
    color: colors.slate700,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: spacing.radiusXl,
    borderTopRightRadius: spacing.radiusXl,
    padding: spacing.xl,
    paddingBottom: spacing.huge,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  modalTitle: {
    color: colors.slate900,
  },
  modalSub: {
    color: colors.slate600,
    marginBottom: spacing.lg,
  },
  micButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    borderRadius: spacing.radiusLg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  micButtonRecording: {
    backgroundColor: colors.errorLight,
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  micButtonText: {
    color: colors.white,
  },
  orLabel: {
    color: colors.slate500,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  voiceInput: {
    backgroundColor: colors.slate100,
    borderRadius: spacing.radiusMd,
    padding: spacing.md,
    color: colors.slate900,
    textAlignVertical: "top",
    minHeight: 90,
    marginBottom: spacing.lg,
  },
  generateBtn: {
    backgroundColor: colors.amberDark,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: spacing.radiusMd,
    gap: spacing.sm,
  },
  generateBtnDisabled: {
    opacity: 0.5,
  },
  generateBtnText: {
    color: colors.white,
  },
});
