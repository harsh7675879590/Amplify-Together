import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useDraftStore } from "../../store/draftStore";
import { api } from "../../lib/api";
import { StepIndicator } from "../../components/StepIndicator";
import { Header } from "../../components/Header";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing } from "../../theme/spacing";

const CATEGORIES = [
  "Environment",
  "Health",
  "Public Policy",
  "Economic Policy",
  "Education",
  "Community",
  "Science",
  "Arts & Culture",
];

const CHANNELS = [
  "Social Media Feeds (Meta/Instagram/X)",
  "Independent News Outlets & Journalism",
  "Targeted Search Query Placements",
  "Community Forum Billboards",
];

export default function CreateWizardScreen() {
  const router = useRouter();
  const draft = useDraftStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<any>(null);

  // STEP 1 HANDLERS
  const handleTitleChange = (text: string) => {
    if (text.length <= 60) {
      draft.updateBasics({ title: text });
    }
  };

  // STEP 2 STORY BLOCK HANDLERS
  const addStoryBlock = (type: "heading" | "paragraph" | "stat") => {
    const newBlock =
      type === "heading"
        ? { type, text: "New Section Heading" }
        : type === "paragraph"
        ? { type, text: "" }
        : { type, value: "100%", label: "Impact Metric Description" };
    draft.updateStory([...draft.story, newBlock]);
  };

  const updateBlockText = (idx: number, text: string) => {
    const updated = [...draft.story];
    updated[idx] = { ...updated[idx], text };
    draft.updateStory(updated);
  };

  const removeBlock = (idx: number) => {
    const updated = draft.story.filter((_, i) => i !== idx);
    draft.updateStory(updated);
  };

  // SOURCE HANDLERS
  const addSource = () => {
    draft.updateSources([...draft.sources, { title: "", url: "" }]);
  };

  const updateSourceField = (idx: number, field: "title" | "url", val: string) => {
    const updated = [...draft.sources];
    updated[idx] = { ...updated[idx], [field]: val };
    draft.updateSources(updated);
  };

  const removeSource = (idx: number) => {
    draft.updateSources(draft.sources.filter((_, i) => i !== idx));
  };

  // VALIDATION & NAVIGATION
  const validateCurrentStep = () => {
    if (draft.currentStep === 1) {
      if (!draft.title.trim()) {
        Alert.alert("Required Field", "Please enter a campaign title (up to 60 characters).");
        return false;
      }
      if (!draft.creatorName.trim()) {
        Alert.alert("Required Field", "Please enter the creator or organization name.");
        return false;
      }
      if (!draft.summary.trim()) {
        Alert.alert("Required Field", "Please provide a short summary of the message.");
        return false;
      }
    } else if (draft.currentStep === 2) {
      const hasContent = draft.story.some((b) => b.text && b.text.trim().length > 0);
      if (!hasContent) {
        Alert.alert("Story Required", "Please write at least one story paragraph explaining your message.");
        return false;
      }
    } else if (draft.currentStep === 5) {
      const goal = parseFloat(draft.fundingGoal);
      if (!goal || goal <= 0) {
        Alert.alert(
          "Funding Goal Required",
          "You must enter your campaign funding goal in dollars. This is set manually by you, not by AI."
        );
        return false;
      }
      if (!draft.agreedToTerms) {
        Alert.alert(
          "Terms Required",
          "Please confirm that this campaign message is supported by factual evidence and complies with advertising rules."
        );
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    if (draft.currentStep < 5) {
      draft.setCurrentStep(draft.currentStep + 1);
      draft.saveToServer();
    }
  };

  const handleBack = () => {
    if (draft.currentStep > 1) {
      draft.setCurrentStep(draft.currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleSubmitForReview = async () => {
    if (!validateCurrentStep()) return;
    if (!draft.draftId) return;

    try {
      setIsSubmitting(true);
      const res = await api.submitDraft(draft.draftId);
      setSubmissionSuccess(res);
      draft.resetDraft();
    } catch (e: any) {
      Alert.alert("Submission Error", e.message || "Failed to submit draft.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // POST SUBMISSION CONFIRMATION TIMELINE
  if (submissionSuccess) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Campaign Submitted" />
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <View style={styles.successBadge}>
            <Ionicons name="checkmark-circle" size={56} color={colors.success} />
          </View>
          <Text style={[styles.successTitle, typography.hero]}>Submitted for Review!</Text>
          <Text style={[styles.successDesc, typography.body]}>
            {submissionSuccess.message}
          </Text>

          <View style={styles.timelineCard}>
            <Text style={[styles.timelineHeading, typography.h3]}>Review & Distribution Timeline</Text>
            {(submissionSuccess.timeline || []).map((t: any, idx: number) => (
              <View key={idx} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View
                    style={[
                      styles.timelineDot,
                      t.status === "completed" && styles.dotCompleted,
                      t.status === "active" && styles.dotActive,
                    ]}
                  >
                    {t.status === "completed" && <Ionicons name="checkmark" size={10} color={colors.white} />}
                  </View>
                  {idx < submissionSuccess.timeline.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineTextWrap}>
                  <Text style={[styles.timelineStepName, typography.h3, t.status === "active" && styles.stepActive]}>
                    {t.step}
                  </Text>
                  <Text style={[styles.timelineStepDesc, typography.caption]}>{t.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => router.push("/(tabs)/explore")}
            activeOpacity={0.8}
          >
            <Text style={[styles.doneBtnText, typography.h3]}>Return to Explore</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Create Campaign"
        showBack
        rightAction={
          <View style={styles.autoSavePill}>
            <Ionicons
              name={draft.isSaving ? "sync" : "cloud-done"}
              size={14}
              color={draft.isSaving ? colors.primary : colors.success}
            />
            <Text style={[styles.autoSaveText, typography.micro]}>
              {draft.isSaving ? "Saving..." : "Auto-saved"}
            </Text>
          </View>
        }
      />

      {/* Persistent 5-Step Progress Indicator */}
      <StepIndicator currentStep={draft.currentStep} />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* STEP 1: BASICS */}
        {draft.currentStep === 1 && (
          <View style={styles.formSection}>
            <Text style={[styles.stepTitle, typography.h1]}>Step 1 — Campaign Basics</Text>
            <Text style={[styles.stepDesc, typography.body]}>
              Define the central message you want to amplify beyond your existing network.
            </Text>

            {/* Campaign Title */}
            <View style={styles.fieldBox}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, typography.h3]}>Campaign Title *</Text>
                <Text style={[styles.counter, typography.micro]}>
                  {draft.title.length}/60 chars
                </Text>
              </View>
              <TextInput
                style={[styles.input, typography.body]}
                placeholder="e.g. Clean drinking water in every public school"
                placeholderTextColor={colors.slate400}
                value={draft.title}
                onChangeText={handleTitleChange}
                maxLength={60}
              />
              <Text style={[styles.fieldHint, typography.caption]}>
                The beginning of your title may be used as the advertising headline if none is provided.
              </Text>
            </View>

            {/* Category Selection */}
            <View style={styles.fieldBox}>
              <Text style={[styles.label, typography.h3]}>Category *</Text>
              <View style={styles.categoryPillsWrap}>
                {CATEGORIES.map((cat) => {
                  const isSelected = draft.category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catPill, isSelected && styles.catPillSelected]}
                      onPress={() => draft.updateBasics({ category: cat })}
                    >
                      <Text
                        style={[
                          styles.catPillText,
                          typography.caption,
                          isSelected && styles.catPillTextSelected,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Creator / Organization Name */}
            <View style={styles.fieldBox}>
              <Text style={[styles.label, typography.h3]}>Creator or Organization Name *</Text>
              <TextInput
                style={[styles.input, typography.body]}
                placeholder="e.g. Maya Lin / Safe Schools Coalition"
                placeholderTextColor={colors.slate400}
                value={draft.creatorName}
                onChangeText={(text) => draft.updateBasics({ creatorName: text })}
              />
            </View>

            {/* Short Summary */}
            <View style={styles.fieldBox}>
              <Text style={[styles.label, typography.h3]}>Short Summary *</Text>
              <TextInput
                style={[styles.textArea, typography.body]}
                placeholder="Provide a concise editorial summary explaining what this campaign is about and why it matters."
                placeholderTextColor={colors.slate400}
                multiline
                numberOfLines={3}
                value={draft.summary}
                onChangeText={(text) => draft.updateBasics({ summary: text })}
              />
            </View>

            {/* Cover Image URL */}
            <View style={styles.fieldBox}>
              <Text style={[styles.label, typography.h3]}>Cover Image URL (Optional)</Text>
              <TextInput
                style={[styles.input, typography.body]}
                placeholder="https://..."
                placeholderTextColor={colors.slate400}
                value={draft.coverImageUrl}
                onChangeText={(text) => draft.updateBasics({ coverImageUrl: text })}
              />
            </View>
          </View>
        )}

        {/* STEP 2: STORY & SOURCES */}
        {draft.currentStep === 2 && (
          <View style={styles.formSection}>
            <Text style={[styles.stepTitle, typography.h1]}>Step 2 — Story & Supporting Sources</Text>
            <Text style={[styles.stepDesc, typography.body]}>
              Write an editorial article with evidence, statistics, and verifiable public sources.
            </Text>

            {/* Story Blocks Composer */}
            <View style={styles.blocksComposer}>
              {draft.story.map((block, idx) => (
                <View key={idx} style={styles.blockItem}>
                  <View style={styles.blockHeader}>
                    <Text style={[styles.blockTypeLabel, typography.micro]}>
                      {block.type.toUpperCase()} BLOCK
                    </Text>
                    {draft.story.length > 1 && (
                      <TouchableOpacity onPress={() => removeBlock(idx)}>
                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {block.type === "heading" && (
                    <TextInput
                      style={[styles.headingInput, typography.h2]}
                      placeholder="Section Heading..."
                      placeholderTextColor={colors.slate400}
                      value={block.text}
                      onChangeText={(t) => updateBlockText(idx, t)}
                    />
                  )}

                  {block.type === "paragraph" && (
                    <TextInput
                      style={[styles.textArea, typography.body]}
                      placeholder="Write your story paragraph..."
                      placeholderTextColor={colors.slate400}
                      multiline
                      numberOfLines={4}
                      value={block.text}
                      onChangeText={(t) => updateBlockText(idx, t)}
                    />
                  )}

                  {block.type === "stat" && (
                    <View style={styles.statInputsRow}>
                      <TextInput
                        style={[styles.statValInput, typography.h2]}
                        placeholder="e.g. 15 ppb"
                        placeholderTextColor={colors.slate400}
                        value={block.value}
                        onChangeText={(v) => {
                          const updated = [...draft.story];
                          updated[idx] = { ...updated[idx], value: v };
                          draft.updateStory(updated);
                        }}
                      />
                      <TextInput
                        style={[styles.statLabelInput, typography.caption]}
                        placeholder="Label description..."
                        placeholderTextColor={colors.slate400}
                        value={block.label}
                        onChangeText={(l) => {
                          const updated = [...draft.story];
                          updated[idx] = { ...updated[idx], label: l };
                          draft.updateStory(updated);
                        }}
                      />
                    </View>
                  )}
                </View>
              ))}

              {/* Add Story Block Buttons */}
              <View style={styles.addBlockRow}>
                <TouchableOpacity style={styles.addBlockBtn} onPress={() => addStoryBlock("heading")}>
                  <Ionicons name="text" size={14} color={colors.primary} />
                  <Text style={[styles.addBlockText, typography.caption]}>+ Heading</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addBlockBtn} onPress={() => addStoryBlock("paragraph")}>
                  <Ionicons name="reorder-four" size={14} color={colors.primary} />
                  <Text style={[styles.addBlockText, typography.caption]}>+ Paragraph</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addBlockBtn} onPress={() => addStoryBlock("stat")}>
                  <Ionicons name="stats-chart" size={14} color={colors.primary} />
                  <Text style={[styles.addBlockText, typography.caption]}>+ Statistic</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Mandatory Supporting Sources */}
            <View style={styles.sourcesBox}>
              <View style={styles.sourcesHeadRow}>
                <View>
                  <Text style={[styles.label, typography.h2]}>Supporting Sources & Evidence *</Text>
                  <Text style={[styles.fieldHint, typography.caption]}>
                    Sources remain visible to the public. Add report URLs, news studies, or gov data.
                  </Text>
                </View>
                <TouchableOpacity style={styles.addSourceBtn} onPress={addSource}>
                  <Ionicons name="add" size={16} color={colors.primary} />
                  <Text style={[styles.addSourceText, typography.caption]}>Add Source</Text>
                </TouchableOpacity>
              </View>

              {draft.sources.map((src, idx) => (
                <View key={idx} style={styles.sourceInputRow}>
                  <TextInput
                    style={[styles.sourceTitleInput, typography.body]}
                    placeholder="Source Title (e.g. EPA Water Standards Report)"
                    placeholderTextColor={colors.slate400}
                    value={src.title}
                    onChangeText={(t) => updateSourceField(idx, "title", t)}
                  />
                  <TextInput
                    style={[styles.sourceUrlInput, typography.body]}
                    placeholder="URL (https://...)"
                    placeholderTextColor={colors.slate400}
                    value={src.url}
                    onChangeText={(u) => updateSourceField(idx, "url", u)}
                  />
                  {draft.sources.length > 1 && (
                    <TouchableOpacity onPress={() => removeSource(idx)}>
                      <Ionicons name="close-circle" size={18} color={colors.slate400} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* STEP 3: CAMPAIGN & AD VISUALS */}
        {draft.currentStep === 3 && (
          <View style={styles.formSection}>
            <Text style={[styles.stepTitle, typography.h1]}>Step 3 — Advertising Assets</Text>
            <Text style={[styles.stepDesc, typography.body]}>
              Keep the main editorial story separate from the creative assets used to advertise it.
            </Text>

            <View style={styles.fieldBox}>
              <Text style={[styles.label, typography.h3]}>Ad Headline</Text>
              <TextInput
                style={[styles.input, typography.body]}
                placeholder={draft.title || "Custom ad headline..."}
                placeholderTextColor={colors.slate400}
                value={draft.adHeadline}
                onChangeText={(t) => draft.updateVisuals({ adHeadline: t })}
              />
              <Text style={[styles.fieldHint, typography.caption]}>
                Defaults to your campaign title if not specified.
              </Text>
            </View>

            <View style={styles.fieldBox}>
              <Text style={[styles.label, typography.h3]}>Ad Description / Punchy Copy</Text>
              <TextInput
                style={[styles.textArea, typography.body]}
                placeholder="Short teaser shown in feed ad cards..."
                placeholderTextColor={colors.slate400}
                multiline
                numberOfLines={2}
                value={draft.adDescription}
                onChangeText={(t) => draft.updateVisuals({ adDescription: t })}
              />
            </View>

            <View style={styles.fieldBox}>
              <Text style={[styles.label, typography.h3]}>Call-To-Action (CTA) Text</Text>
              <TextInput
                style={[styles.input, typography.body]}
                placeholder="Learn More"
                placeholderTextColor={colors.slate400}
                value={draft.ctaText}
                onChangeText={(t) => draft.updateVisuals({ ctaText: t })}
              />
            </View>

            {/* Placement Preview Mockup */}
            <View style={styles.adPreviewMock}>
              <Text style={[styles.mockupHeader, typography.micro]}>DIGITAL AD PREVIEW (SOCIAL / SEARCH PLACEMENT)</Text>
              <View style={styles.adCardPreview}>
                <View style={styles.sponsorRow}>
                  <Ionicons name="megaphone" size={14} color={colors.primary} />
                  <Text style={[styles.sponsorText, typography.micro]}>Sponsored Public Message • Amplify Together</Text>
                </View>
                <Text style={[styles.mockHeadline, typography.h3]}>
                  {draft.adHeadline || draft.title || "Your Compelling Headline Here"}
                </Text>
                <Text style={[styles.mockDescription, typography.caption]}>
                  {draft.adDescription || draft.summary || "Ad description summary will appear here."}
                </Text>
                <View style={styles.mockCtaRow}>
                  <Text style={[styles.mockCtaText, typography.caption]}>{draft.ctaText || "Learn More"}</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* STEP 4: REACH & AUDIENCE */}
        {draft.currentStep === 4 && (
          <View style={styles.formSection}>
            <Text style={[styles.stepTitle, typography.h1]}>Step 4 — Reach & Targeting</Text>
            <Text style={[styles.stepDesc, typography.body]}>
              Explain how your message will find an audience beyond your personal network.
            </Text>

            <View style={styles.fieldBox}>
              <Text style={[styles.label, typography.h3]}>Distribution Channels</Text>
              {CHANNELS.map((ch) => {
                const isSelected = draft.channels.includes(ch);
                return (
                  <TouchableOpacity
                    key={ch}
                    style={styles.checkboxRow}
                    onPress={() => {
                      const updated = isSelected
                        ? draft.channels.filter((c) => c !== ch)
                        : [...draft.channels, ch];
                      draft.updateReach({ channels: updated });
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isSelected ? "checkbox" : "square-outline"}
                      size={20}
                      color={isSelected ? colors.primary : colors.slate400}
                    />
                    <Text style={[styles.checkboxText, typography.body]}>{ch}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.fieldBox}>
              <Text style={[styles.label, typography.h3]}>Target Geographic Locations</Text>
              <TextInput
                style={[styles.input, typography.body]}
                placeholder="e.g. National, Tri-County School District, City Metros"
                placeholderTextColor={colors.slate400}
                value={draft.locations.join(", ")}
                onChangeText={(t) =>
                  draft.updateReach({
                    locations: t.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
            </View>

            <View style={styles.reachDisclaimerCard}>
              <Ionicons name="information-circle" size={18} color={colors.primary} />
              <Text style={[styles.reachDisclaimerText, typography.caption]}>
                Never promised fixed numbers. Actual audience reach depends on auction bids, seasonal inventory, and creative engagement. Settings will be finalized with platform moderators during review.
              </Text>
            </View>
          </View>
        )}

        {/* STEP 5: SUBMIT & MANUAL FUNDING GOAL */}
        {draft.currentStep === 5 && (
          <View style={styles.formSection}>
            <Text style={[styles.stepTitle, typography.h1]}>Step 5 — Funding Goal & Submission</Text>
            <Text style={[styles.stepDesc, typography.body]}>
              Review your campaign and manually set your message amplification funding goal.
            </Text>

            {/* MANDATORY: Manual Funding Goal Input */}
            <View style={styles.goalInputCard}>
              <Text style={[styles.goalLabel, typography.h2]}>Set Funding Goal ($) *</Text>
              <Text style={[styles.goalNotice, typography.caption]}>
                You set the funding goal here. It cannot be generated by AI or automatically overwritten.
              </Text>
              <View style={styles.goalInputWrap}>
                <Text style={[styles.goalDollarSign, typography.hero]}>$</Text>
                <TextInput
                  style={[styles.goalInputField, typography.hero]}
                  placeholder="3000"
                  placeholderTextColor={colors.slate400}
                  keyboardType="numeric"
                  value={draft.fundingGoal}
                  onChangeText={draft.setFundingGoal}
                />
              </View>

              {parseFloat(draft.fundingGoal) > 0 && (
                <View style={styles.goalReachPreview}>
                  <Ionicons name="people" size={16} color={colors.primary} />
                  <Text style={[styles.goalReachText, typography.caption]}>
                    At 100% funding, delivers an estimated{" "}
                    <Text style={styles.boldText}>
                      ~{(parseFloat(draft.fundingGoal) * 120).toLocaleString()} impressions
                    </Text>{" "}
                    outside your network.
                  </Text>
                </View>
              )}
            </View>

            {/* Campaign Summary Review Box */}
            <View style={styles.summaryReviewBox}>
              <Text style={[styles.summaryReviewTitle, typography.h3]}>Campaign Preview Summary</Text>
              <Text style={[styles.reviewItem, typography.body]}>
                <Text style={styles.boldText}>Title:</Text> {draft.title}
              </Text>
              <Text style={[styles.reviewItem, typography.body]}>
                <Text style={styles.boldText}>Category:</Text> {draft.category}
              </Text>
              <Text style={[styles.reviewItem, typography.body]}>
                <Text style={styles.boldText}>Creator:</Text> {draft.creatorName}
              </Text>
              <Text style={[styles.reviewItem, typography.body]}>
                <Text style={styles.boldText}>Sources Verified:</Text> {draft.sources.length} citations
              </Text>
            </View>

            {/* Compliance Checkbox */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => draft.setAgreedToTerms(!draft.agreedToTerms)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={draft.agreedToTerms ? "checkbox" : "square-outline"}
                size={22}
                color={draft.agreedToTerms ? colors.primary : colors.slate400}
              />
              <Text style={[styles.termsText, typography.caption]}>
                I certify that all story claims are backed by verifiable evidence, supporting sources are genuine, and pooled contributions will exclusively be used for ad distribution.
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <Text style={[styles.backBtnText, typography.h3]}>
              {draft.currentStep === 1 ? "Exit" : "Back"}
            </Text>
          </TouchableOpacity>

          {draft.currentStep < 5 ? (
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={[styles.nextBtnText, typography.h3]}>Continue</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.btnDisabled]}
              onPress={handleSubmitForReview}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="send" size={16} color={colors.white} />
                  <Text style={[styles.submitBtnText, typography.h3]}>Submit for Review</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
  },
  autoSavePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.slate100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: spacing.radiusFull,
    gap: 4,
  },
  autoSaveText: {
    color: colors.slate600,
  },
  formSection: {
    gap: spacing.lg,
  },
  stepTitle: {
    color: colors.slate900,
  },
  stepDesc: {
    color: colors.slate600,
  },
  fieldBox: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: colors.slate900,
  },
  counter: {
    color: colors.slate400,
  },
  input: {
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.slate300,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.slate900,
  },
  textArea: {
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.slate300,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.slate900,
    textAlignVertical: "top",
    minHeight: 80,
  },
  fieldHint: {
    color: colors.slate500,
    marginTop: 2,
  },
  categoryPillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: spacing.radiusFull,
    backgroundColor: colors.slate100,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  catPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catPillText: {
    color: colors.slate700,
  },
  catPillTextSelected: {
    color: colors.white,
    fontWeight: "700",
  },
  blocksComposer: {
    gap: spacing.md,
  },
  blockItem: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  blockHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  blockTypeLabel: {
    color: colors.primary,
    fontWeight: "700",
  },
  headingInput: {
    borderBottomWidth: 1,
    borderBottomColor: colors.slate300,
    paddingVertical: 6,
    color: colors.slate900,
  },
  statInputsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statValInput: {
    width: "35%",
    borderBottomWidth: 1,
    borderBottomColor: colors.slate300,
    color: colors.primary,
    fontWeight: "800",
  },
  statLabelInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate300,
    color: colors.slate800,
  },
  addBlockRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  addBlockBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
    paddingVertical: 10,
    borderRadius: spacing.radiusMd,
    gap: 4,
  },
  addBlockText: {
    color: colors.primary,
    fontWeight: "700",
  },
  sourcesBox: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.sm,
  },
  sourcesHeadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  addSourceBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: spacing.radiusSm,
    gap: 2,
  },
  addSourceText: {
    color: colors.primary,
    fontWeight: "700",
  },
  sourceInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.slate50,
    padding: spacing.sm,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  sourceTitleInput: {
    flex: 1,
    color: colors.slate900,
  },
  sourceUrlInput: {
    flex: 1,
    color: colors.slate900,
  },
  adPreviewMock: {
    backgroundColor: colors.slate100,
    padding: spacing.md,
    borderRadius: spacing.radiusLg,
  },
  mockupHeader: {
    color: colors.slate500,
    marginBottom: spacing.xs,
  },
  adCardPreview: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.slate300,
  },
  sponsorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  sponsorText: {
    color: colors.primary,
  },
  mockHeadline: {
    color: colors.slate900,
    marginBottom: 4,
  },
  mockDescription: {
    color: colors.slate600,
    marginBottom: spacing.sm,
  },
  mockCtaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  mockCtaText: {
    color: colors.primary,
    fontWeight: "700",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 4,
  },
  checkboxText: {
    color: colors.slate800,
    flex: 1,
  },
  reachDisclaimerCard: {
    flexDirection: "row",
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
    gap: spacing.sm,
  },
  reachDisclaimerText: {
    color: colors.slate800,
    flex: 1,
  },
  goalInputCard: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: spacing.radiusLg,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  goalLabel: {
    color: colors.slate900,
  },
  goalNotice: {
    color: colors.slate600,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  goalInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: 6,
  },
  goalDollarSign: {
    color: colors.primary,
    marginRight: 6,
  },
  goalInputField: {
    flex: 1,
    color: colors.slate900,
    padding: 0,
  },
  goalReachPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.md,
    backgroundColor: colors.primaryLight,
    padding: spacing.sm,
    borderRadius: spacing.radiusSm,
  },
  goalReachText: {
    color: colors.primaryDark,
    flex: 1,
  },
  boldText: {
    fontWeight: "700",
    color: colors.slate900,
  },
  summaryReviewBox: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 4,
  },
  summaryReviewTitle: {
    color: colors.slate900,
    marginBottom: 4,
  },
  reviewItem: {
    color: colors.slate700,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.slate300,
  },
  termsText: {
    color: colors.slate700,
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  backBtn: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate300,
    paddingVertical: 14,
    borderRadius: spacing.radiusMd,
    alignItems: "center",
  },
  backBtnText: {
    color: colors.slate800,
  },
  nextBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: spacing.radiusMd,
    gap: 6,
  },
  nextBtnText: {
    color: colors.white,
  },
  submitBtn: {
    flex: 2,
    backgroundColor: colors.success,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: spacing.radiusMd,
    gap: 6,
  },
  submitBtnText: {
    color: colors.white,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  successBadge: {
    alignItems: "center",
    marginVertical: spacing.lg,
  },
  successTitle: {
    color: colors.slate900,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  successDesc: {
    color: colors.slate600,
    textAlign: "center",
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  timelineCard: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.xl,
  },
  timelineHeading: {
    color: colors.slate900,
    marginBottom: spacing.lg,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  timelineLeft: {
    alignItems: "center",
    marginRight: spacing.md,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.slate200,
    alignItems: "center",
    justifyContent: "center",
  },
  dotCompleted: {
    backgroundColor: colors.success,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  timelineLine: {
    width: 2,
    height: 38,
    backgroundColor: colors.slate200,
  },
  timelineTextWrap: {
    flex: 1,
    paddingBottom: spacing.lg,
  },
  timelineStepName: {
    color: colors.slate700,
  },
  stepActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  timelineStepDesc: {
    color: colors.slate500,
    marginTop: 2,
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
