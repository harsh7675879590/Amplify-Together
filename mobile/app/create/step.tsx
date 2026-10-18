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
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useDraftStore } from "../../store/draftStore";
import { api } from "../../lib/api";
import { StepIndicator } from "../../components/StepIndicator";
import { Header } from "../../components/Header";
import { StoryRenderer } from "../../components/StoryRenderer";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing } from "../../theme/spacing";
import { calculateReach } from "../../lib/reach";
import { calculateFees } from "../../lib/fees";
import { StoryBlock, CampaignCategory } from "../../types";

const CATEGORIES: CampaignCategory[] = [
  "Environment",
  "Health",
  "Science",
  "Education",
  "Public Policy",
  "Economic Policy",
  "Community",
  "Arts & Culture",
  "Business",
  "Other",
];

const CHANNELS = [
  "Social Media Feeds (Meta/Instagram/X)",
  "Independent Journalism & Local News",
  "Search Query Sponsored Placements",
  "Community Forum Billboards",
];

const INTERESTS_LIST = [
  "Public Health & Safety",
  "Environmental Protection",
  "Local Governance & Education",
  "Civil Rights & Consumer Protection",
  "Science & Scientific Literacy",
];

export default function CreateWizardScreen() {
  const router = useRouter();
  const draft = useDraftStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<any>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Step 1 Touch/Error state
  const [step1Touched, setStep1Touched] = useState(false);

  // Step 2 State
  const [livePreviewActive, setLivePreviewActive] = useState(false);
  const [activeStoryIdx, setActiveStoryIdx] = useState<number>(1);
  const [newActionInput, setNewActionInput] = useState("");

  // Step 3 State
  const [adPlacementTab, setAdPlacementTab] = useState<"feed" | "story" | "banner">("feed");
  const [showCreativeTips, setShowCreativeTips] = useState(false);

  // Step 4 State
  const [budgetSocialPercent, setBudgetSocialPercent] = useState<number>(70);

  // Step 5 State
  const [showFullPreviewModal, setShowFullPreviewModal] = useState(false);

  // Auto-save manual trigger feedback
  const handleSaveDraftManually = async () => {
    try {
      await draft.saveToServer();
      setSaveNotice("Draft saved to cloud");
      setTimeout(() => setSaveNotice(null), 2500);
    } catch {
      setSaveNotice("Saved offline");
      setTimeout(() => setSaveNotice(null), 2500);
    }
  };

  // STEP 1 HANDLERS
  const handleTitleChange = (text: string) => {
    if (text.length <= 60) {
      draft.updateBasics({ title: text });
    }
  };

  // STEP 2 STORY BLOCK HANDLERS
  const addStoryBlock = (type: StoryBlock["type"]) => {
    let newBlock: StoryBlock;
    if (type === "heading") {
      newBlock = { type, text: "New Section Heading" };
    } else if (type === "paragraph") {
      newBlock = { type, text: "" };
    } else if (type === "image") {
      newBlock = {
        type,
        url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80",
        caption: "Field testing verified elevated particulate levels.",
        credit: "Public Health Safety Lab (2024)",
      };
    } else if (type === "stat") {
      newBlock = { type, value: "85%", label: "Residents unaware of policy hearing" };
    } else {
      newBlock = { type: "paragraph", text: "" };
    }
    const updated = [...draft.story, newBlock];
    draft.updateStory(updated);
    setActiveStoryIdx(updated.length - 1);
  };

  const updateBlockField = (idx: number, fields: Partial<StoryBlock>) => {
    const updated = [...draft.story];
    updated[idx] = { ...updated[idx], ...fields };
    draft.updateStory(updated);
  };

  const removeBlock = (idx: number) => {
    if (draft.story.length <= 1) {
      Alert.alert("Notice", "Your campaign message must contain at least one story block.");
      return;
    }
    const updated = draft.story.filter((_, i) => i !== idx);
    draft.updateStory(updated);
    setActiveStoryIdx(Math.max(0, idx - 1));
  };

  const moveBlock = (idx: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= draft.story.length) return;
    const updated = [...draft.story];
    const [moved] = updated.splice(idx, 1);
    updated.splice(newIdx, 0, moved);
    draft.updateStory(updated);
    setActiveStoryIdx(newIdx);
  };

  // Formatting Toolbar Helper
  const applyFormatting = (prefix: string, suffix: string) => {
    if (activeStoryIdx < 0 || activeStoryIdx >= draft.story.length) return;
    const currentBlock = draft.story[activeStoryIdx];
    if (currentBlock.type === "paragraph" || currentBlock.type === "heading") {
      const prevText = currentBlock.text || "";
      const newText = prevText ? `${prevText} ${prefix}highlighted${suffix}` : `${prefix}highlighted${suffix}`;
      updateBlockField(activeStoryIdx, { text: newText });
    }
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

  // AUDIENCE ACTIONS HANDLERS
  const handleAddAudienceAction = () => {
    if (!newActionInput.trim()) return;
    const current = draft.audienceActions || [];
    draft.updateAudienceActions([...current, newActionInput.trim()]);
    setNewActionInput("");
  };

  const handleRemoveAudienceAction = (index: number) => {
    const current = draft.audienceActions || [];
    draft.updateAudienceActions(current.filter((_, i) => i !== index));
  };

  // VALIDATION & NAVIGATION
  const validateCurrentStep = () => {
    if (draft.currentStep === 1) {
      setStep1Touched(true);
      if (!draft.title.trim()) {
        Alert.alert("Title Required", "Please enter a campaign title (1 to 60 characters).");
        return false;
      }
      if (!draft.creatorName.trim()) {
        Alert.alert("Creator Required", "Please enter your name or organization name.");
        return false;
      }
      if (!draft.summary.trim()) {
        Alert.alert("Summary Required", "Please provide a short summary of the message.");
        return false;
      }
    } else if (draft.currentStep === 2) {
      const hasContent = draft.story.some(
        (b) => (b.text && b.text.trim().length > 0) || (b.value && b.value.trim().length > 0)
      );
      if (!hasContent) {
        Alert.alert("Story Required", "Please write at least one story block explaining your message.");
        return false;
      }
      // Check that sources if entered have valid URLs
      for (const s of draft.sources) {
        if (s.url && !s.url.startsWith("http://") && !s.url.startsWith("https://")) {
          Alert.alert("Invalid Source URL", `Source "${s.title || "Untitled"}" must have a valid URL starting with https://`);
          return false;
        }
      }
    } else if (draft.currentStep === 5) {
      const goal = parseFloat(draft.fundingGoal);
      if (!goal || isNaN(goal) || goal < 25) {
        Alert.alert(
          "Funding Goal Required",
          "Please enter your campaign amplification funding goal (minimum $25.00). This field starts empty and must be specified by you."
        );
        return false;
      }
      if (!draft.agreedToTerms) {
        Alert.alert(
          "Rules Acknowledgment Required",
          "Please confirm that this message is supported by factual evidence and contributions strictly fund ad distribution."
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

  // Calculations for Step 4 & 5
  const parsedGoal = parseFloat(draft.fundingGoal) || 2500;
  const reachCalc = calculateReach(parsedGoal);
  const feeCalc = calculateFees(parsedGoal);

  // POST-SUBMIT TIMELINE SCREEN
  if (submissionSuccess) {
    const timelineStages = [
      { id: "submitted", title: "1. Submitted", desc: "Your draft message has been received.", completed: true, active: false },
      { id: "review", title: "2. In Review", desc: "Moderators are verifying factual citations and ad copy.", completed: false, active: true },
      { id: "approved", title: "3. Approved", desc: "Campaign approved for community amplification.", completed: false, active: false },
      { id: "funding", title: "4. Available for Funding", desc: "Backers contribute to pool ad distribution budget.", completed: false, active: false },
      { id: "promoting", title: "5. Promoting", desc: "Ads run across targeted digital channels.", completed: false, active: false },
      { id: "completed", title: "6. Completed", desc: "Final impact report & delivery analytics published.", completed: false, active: false },
    ];

    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Submission Confirmed" />
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark-done" size={48} color={colors.success} />
          </View>
          <Text style={[styles.successTitle, typography.storyHero]}>Campaign Submitted for Review!</Text>
          <Text style={[styles.successSubtitle, typography.body]}>
            Thank you for bringing your message to the community. Our editorial team reviews every claim against public evidence before opening backing.
          </Text>

          {/* Status Timeline */}
          <View style={styles.timelineCard}>
            <Text style={[styles.timelineHeader, typography.uiH2]}>Campaign Lifecycle Timeline</Text>
            <Text style={[styles.timelineSub, typography.uiCaption]}>
              Current Stage: <Text style={styles.activeStageText}>In Review (Stage 2 of 6)</Text>
            </Text>

            <View style={styles.timelineList}>
              {timelineStages.map((stage, idx) => (
                <View key={stage.id} style={styles.stageRow}>
                  <View style={styles.stageIndicatorCol}>
                    <View
                      style={[
                        styles.stageDot,
                        stage.completed && styles.dotDone,
                        stage.active && styles.dotInProgress,
                      ]}
                    >
                      {stage.completed && <Ionicons name="checkmark" size={12} color={colors.white} />}
                      {stage.active && <View style={styles.dotInnerPulse} />}
                    </View>
                    {idx < timelineStages.length - 1 && (
                      <View style={[styles.stageConnector, stage.completed && styles.connectorDone]} />
                    )}
                  </View>
                  <View style={styles.stageContent}>
                    <Text
                      style={[
                        styles.stageName,
                        typography.uiH3,
                        stage.active && styles.stageNameActive,
                        stage.completed && styles.stageNameCompleted,
                      ]}
                    >
                      {stage.title}
                    </Text>
                    <Text style={[styles.stageDesc, typography.caption]}>{stage.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.timelineActionRow}>
            <TouchableOpacity
              style={styles.primaryTimelineBtn}
              onPress={() => router.push("/(tabs)/explore")}
              activeOpacity={0.85}
            >
              <Text style={[styles.primaryTimelineBtnText, typography.uiH3]}>Return to Explore</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryTimelineBtn}
              onPress={() => router.push("/(tabs)/profile")}
              activeOpacity={0.85}
            >
              <Text style={[styles.secondaryTimelineBtnText, typography.uiH3]}>View in Creator Dashboard</Text>
            </TouchableOpacity>
          </View>
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
          <View style={styles.headerRightRow}>
            {saveNotice && (
              <View style={styles.noticePill}>
                <Text style={[styles.noticeText, typography.micro]}>{saveNotice}</Text>
              </View>
            )}
            <View style={styles.autoSavePill}>
              <Ionicons
                name={draft.isSaving ? "sync" : "cloud-done"}
                size={13}
                color={draft.isSaving ? colors.primary : colors.success}
              />
              <Text style={[styles.autoSaveText, typography.micro]}>
                {draft.lastSavedIndicator || "Auto-saved"}
              </Text>
            </View>
          </View>
        }
      />

      {/* Persistent 5-step StepIndicator visible on every step */}
      <StepIndicator currentStep={draft.currentStep} />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* ==================================================================== */}
        {/* STEP 1: BASICS */}
        {/* ==================================================================== */}
        {draft.currentStep === 1 && (
          <View style={styles.stepSection}>
            {/* Banner for Voice / AI generation */}
            {draft.isVoiceGenerated && (
              <View style={styles.voiceBanner}>
                <Ionicons name="sparkles" size={20} color={colors.amberDark} />
                <View style={styles.voiceBannerTextWrap}>
                  <Text style={[styles.voiceBannerTitle, typography.uiH3]}>
                    Draft generated from your description.
                  </Text>
                  <Text style={[styles.voiceBannerSubtitle, typography.caption]}>
                    Please review and edit. All fields below are fully editable.
                  </Text>
                </View>
                <TouchableOpacity onPress={() => draft.setIsVoiceGenerated(false)}>
                  <Ionicons name="close" size={18} color={colors.slate400} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.stepHeader}>
              <Text style={[styles.stepTitle, typography.storyH1]}>Step 1 — Campaign Basics</Text>
              <Text style={[styles.stepDesc, typography.body]}>
                Define the core message you want to fund and amplify into targeted public feeds.
              </Text>
            </View>

            {/* Campaign Title (required, max 60 with live counter) */}
            <View style={styles.cardBox}>
              <View style={styles.labelCounterRow}>
                <Text style={[styles.fieldLabel, typography.uiH3]}>Campaign Title *</Text>
                <Text
                  style={[
                    styles.counterLabel,
                    typography.micro,
                    draft.title.length >= 60 && styles.counterMax,
                  ]}
                >
                  {draft.title.length}/60
                </Text>
              </View>
              <TextInput
                style={[
                  styles.textInput,
                  typography.uiBody,
                  step1Touched && !draft.title.trim() && styles.inputErrorBorder,
                ]}
                placeholder="e.g. Clean drinking water in every public school"
                placeholderTextColor={colors.slate400}
                value={draft.title}
                onChangeText={handleTitleChange}
                maxLength={60}
              />
              <Text style={[styles.helperNote, typography.caption]}>
                The beginning of your title may be used as the advertising headline if none is provided.
              </Text>
              {step1Touched && !draft.title.trim() && (
                <Text style={[styles.inlineError, typography.micro]}>⚠️ Title is required (up to 60 characters).</Text>
              )}
            </View>

            {/* Category (required) */}
            <View style={styles.cardBox}>
              <Text style={[styles.fieldLabel, typography.uiH3]}>Category *</Text>
              <Text style={[styles.helperNote, typography.caption]}>
                Select the primary topic domain for public categorization and reviewer routing.
              </Text>
              <View style={styles.categoryWrap}>
                {CATEGORIES.map((cat) => {
                  const isSelected = draft.category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryPill, isSelected && styles.categoryPillSelected]}
                      onPress={() => draft.updateBasics({ category: cat })}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.categoryPillText,
                          typography.uiCaption,
                          isSelected && styles.categoryPillTextSelected,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Creator / Organization Name (required) */}
            <View style={styles.cardBox}>
              <Text style={[styles.fieldLabel, typography.uiH3]}>Creator or Organization Name *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  typography.uiBody,
                  step1Touched && !draft.creatorName.trim() && styles.inputErrorBorder,
                ]}
                placeholder="e.g. Safe Schools Coalition / Maya Lin"
                placeholderTextColor={colors.slate400}
                value={draft.creatorName}
                onChangeText={(text) => draft.updateBasics({ creatorName: text })}
              />
              {step1Touched && !draft.creatorName.trim() && (
                <Text style={[styles.inlineError, typography.micro]}>⚠️ Creator or organization name is required.</Text>
              )}
            </View>

            {/* Short Summary (required) */}
            <View style={styles.cardBox}>
              <Text style={[styles.fieldLabel, typography.uiH3]}>Short Summary *</Text>
              <TextInput
                style={[
                  styles.textAreaInput,
                  typography.uiBody,
                  step1Touched && !draft.summary.trim() && styles.inputErrorBorder,
                ]}
                placeholder="Brief 1-2 sentence overview shown in feed cards and search results..."
                placeholderTextColor={colors.slate400}
                multiline
                numberOfLines={3}
                value={draft.summary}
                onChangeText={(text) => draft.updateBasics({ summary: text })}
              />
              {step1Touched && !draft.summary.trim() && (
                <Text style={[styles.inlineError, typography.micro]}>⚠️ Short summary is required.</Text>
              )}
            </View>

            {/* Optional Cover Image */}
            <View style={styles.cardBox}>
              <Text style={[styles.fieldLabel, typography.uiH3]}>Cover Image URL (Optional)</Text>
              <TextInput
                style={[styles.textInput, typography.uiBody]}
                placeholder="https://images.unsplash.com/..."
                placeholderTextColor={colors.slate400}
                value={draft.coverImageUrl}
                onChangeText={(text) => draft.updateBasics({ coverImageUrl: text })}
              />
              {draft.coverImageUrl ? (
                <View style={styles.coverPreviewBox}>
                  <Image source={{ uri: draft.coverImageUrl }} style={styles.coverThumbnail} resizeMode="cover" />
                  <Text style={[styles.coverPreviewCaption, typography.micro]}>Preview of campaign header banner</Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {/* ==================================================================== */}
        {/* STEP 2: STORY (EDITORIAL COMPOSER) */}
        {/* ==================================================================== */}
        {draft.currentStep === 2 && (
          <View style={styles.stepSection}>
            <View style={styles.stepHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, typography.storyH1]}>Step 2 — Story & Citations</Text>
                <Text style={[styles.stepDesc, typography.body]}>
                  Craft your editorial case with facts, block reordering, and verifiable public sources.
                </Text>
              </View>

              {/* Live Preview Toggle */}
              <TouchableOpacity
                style={[styles.previewToggleBtn, livePreviewActive && styles.previewToggleBtnActive]}
                onPress={() => setLivePreviewActive(!livePreviewActive)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={livePreviewActive ? "create-outline" : "eye-outline"}
                  size={16}
                  color={livePreviewActive ? colors.white : colors.primary}
                />
                <Text
                  style={[
                    styles.previewToggleText,
                    typography.uiCaption,
                    livePreviewActive && styles.previewToggleTextActive,
                  ]}
                >
                  {livePreviewActive ? "Edit Story" : "Live Preview"}
                </Text>
              </TouchableOpacity>
            </View>

            {livePreviewActive ? (
              /* LIVE PREVIEW USING REAL StoryRenderer */
              <View style={styles.livePreviewCard}>
                <View style={styles.previewNoticeBar}>
                  <Ionicons name="sparkles" size={14} color={colors.primary} />
                  <Text style={[styles.previewNoticeText, typography.micro]}>
                    LIVE READER VIEW • EXACT RENDERING
                  </Text>
                </View>
                <StoryRenderer blocks={draft.story} />

                {/* Sources list preview */}
                <View style={styles.previewSourcesSection}>
                  <Text style={[styles.sourcesPreviewHeading, typography.uiH3]}>Verified Supporting Sources</Text>
                  {draft.sources.map((s, i) => (
                    <View key={i} style={styles.sourcePreviewItem}>
                      <Ionicons name="link" size={14} color={colors.primary} />
                      <Text style={[styles.sourcePreviewTitle, typography.uiCaption]}>
                        {s.title || "Untitled source"}:{" "}
                        <Text style={styles.sourcePreviewUrl}>{s.url || "https://..."}</Text>
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              /* EDIT BLOCKS COMPOSER */
              <>
                {/* Simple Formatting Toolbar */}
                <View style={styles.formattingToolbar}>
                  <Text style={[styles.toolbarLabel, typography.micro]}>FORMAT ACTIVE BLOCK:</Text>
                  <TouchableOpacity style={styles.toolbarBtn} onPress={() => applyFormatting("**", "**")}>
                    <Text style={styles.toolbarBoldText}>B</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.toolbarBtn} onPress={() => applyFormatting("*", "*")}>
                    <Text style={styles.toolbarItalicText}>I</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.toolbarBtn} onPress={() => applyFormatting("[", "](https://)")}>
                    <Ionicons name="link" size={14} color={colors.slate700} />
                  </TouchableOpacity>
                </View>

                {/* Blocks List */}
                <View style={styles.blocksList}>
                  {draft.story.map((block, idx) => {
                    const isSelected = activeStoryIdx === idx;
                    return (
                      <View
                        key={idx}
                        style={[styles.blockCard, isSelected && styles.blockCardSelected]}
                        onTouchStart={() => setActiveStoryIdx(idx)}
                      >
                        <View style={styles.blockTopBar}>
                          <View style={styles.blockBadgeWrap}>
                            <Text style={[styles.blockTypeBadge, typography.micro]}>
                              {block.type.toUpperCase()} #{idx + 1}
                            </Text>
                          </View>

                          {/* Reorder with Up/Down buttons */}
                          <View style={styles.blockActionsRow}>
                            <TouchableOpacity
                              style={[styles.moveBtn, idx === 0 && styles.moveBtnDisabled]}
                              onPress={() => moveBlock(idx, "up")}
                              disabled={idx === 0}
                            >
                              <Ionicons
                                name="chevron-up"
                                size={18}
                                color={idx === 0 ? colors.slate300 : colors.slate700}
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.moveBtn, idx === draft.story.length - 1 && styles.moveBtnDisabled]}
                              onPress={() => moveBlock(idx, "down")}
                              disabled={idx === draft.story.length - 1}
                            >
                              <Ionicons
                                name="chevron-down"
                                size={18}
                                color={idx === draft.story.length - 1 ? colors.slate300 : colors.slate700}
                              />
                            </TouchableOpacity>

                            {/* Remove button */}
                            <TouchableOpacity style={styles.removeBtn} onPress={() => removeBlock(idx)}>
                              <Ionicons name="trash-outline" size={16} color={colors.error} />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Heading Block */}
                        {block.type === "heading" && (
                          <TextInput
                            style={[styles.headingInput, typography.storyH2]}
                            placeholder="Section Heading..."
                            placeholderTextColor={colors.slate400}
                            value={block.text}
                            onChangeText={(t) => updateBlockField(idx, { text: t })}
                          />
                        )}

                        {/* Paragraph Block */}
                        {block.type === "paragraph" && (
                          <TextInput
                            style={[styles.textAreaInput, typography.storyBody]}
                            placeholder="Write your editorial paragraph..."
                            placeholderTextColor={colors.slate400}
                            multiline
                            numberOfLines={4}
                            value={block.text}
                            onChangeText={(t) => updateBlockField(idx, { text: t })}
                          />
                        )}

                        {/* Statistic Block */}
                        {block.type === "stat" && (
                          <View style={styles.statInputsRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.subFieldLabel, typography.micro]}>STAT VALUE</Text>
                              <TextInput
                                style={[styles.statValueInput, typography.storyHero]}
                                placeholder="85%"
                                placeholderTextColor={colors.slate400}
                                value={block.value}
                                onChangeText={(v) => updateBlockField(idx, { value: v })}
                              />
                            </View>
                            <View style={{ flex: 2 }}>
                              <Text style={[styles.subFieldLabel, typography.micro]}>METRIC DESCRIPTION</Text>
                              <TextInput
                                style={[styles.textInput, typography.uiBody]}
                                placeholder="e.g. Unaware of regional zoning board hearing"
                                placeholderTextColor={colors.slate400}
                                value={block.label}
                                onChangeText={(l) => updateBlockField(idx, { label: l })}
                              />
                            </View>
                          </View>
                        )}

                        {/* Image Block with Caption and Credit */}
                        {block.type === "image" && (
                          <View style={styles.imageBlockForm}>
                            <Text style={[styles.subFieldLabel, typography.micro]}>IMAGE URL</Text>
                            <TextInput
                              style={[styles.textInput, typography.uiBody]}
                              placeholder="https://..."
                              placeholderTextColor={colors.slate400}
                              value={block.url}
                              onChangeText={(u) => updateBlockField(idx, { url: u })}
                            />
                            {block.url ? (
                              <Image source={{ uri: block.url }} style={styles.blockImagePreview} resizeMode="cover" />
                            ) : null}
                            <Text style={[styles.subFieldLabel, typography.micro]}>CAPTION</Text>
                            <TextInput
                              style={[styles.textInput, typography.uiCaption]}
                              placeholder="Describe what is seen in the image..."
                              placeholderTextColor={colors.slate400}
                              value={block.caption}
                              onChangeText={(c) => updateBlockField(idx, { caption: c })}
                            />
                            <Text style={[styles.subFieldLabel, typography.micro]}>PHOTO CREDIT / SOURCE</Text>
                            <TextInput
                              style={[styles.textInput, typography.uiMicro]}
                              placeholder="e.g. State Environmental Department (2024)"
                              placeholderTextColor={colors.slate400}
                              value={block.credit}
                              onChangeText={(cr) => updateBlockField(idx, { credit: cr })}
                            />
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Add Story Blocks Toolbar */}
                <View style={styles.addBlocksToolbar}>
                  <Text style={[styles.addBlocksLabel, typography.micro]}>ADD BLOCK:</Text>
                  <View style={styles.addBlocksRow}>
                    <TouchableOpacity style={styles.addBlockChip} onPress={() => addStoryBlock("heading")}>
                      <Ionicons name="text" size={14} color={colors.primary} />
                      <Text style={[styles.addBlockChipText, typography.uiCaption]}>Heading</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addBlockChip} onPress={() => addStoryBlock("paragraph")}>
                      <Ionicons name="reorder-four" size={14} color={colors.primary} />
                      <Text style={[styles.addBlockChipText, typography.uiCaption]}>Paragraph</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addBlockChip} onPress={() => addStoryBlock("stat")}>
                      <Ionicons name="stats-chart" size={14} color={colors.primary} />
                      <Text style={[styles.addBlockChipText, typography.uiCaption]}>Statistic</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addBlockChip} onPress={() => addStoryBlock("image")}>
                      <Ionicons name="image" size={14} color={colors.primary} />
                      <Text style={[styles.addBlockChipText, typography.uiCaption]}>Image</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Supporting Sources Manager */}
                <View style={styles.cardBox}>
                  <View style={styles.labelCounterRow}>
                    <View>
                      <Text style={[styles.fieldLabel, typography.uiH3]}>Sources Manager *</Text>
                      <Text style={[styles.helperNote, typography.caption]}>
                        All citations remain public and are reviewed by moderators.
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.smallAddBtn} onPress={addSource}>
                      <Ionicons name="add" size={16} color={colors.primary} />
                      <Text style={[styles.smallAddBtnText, typography.uiCaption]}>Add Source</Text>
                    </TouchableOpacity>
                  </View>

                  {draft.sources.map((src, i) => {
                    const hasInvalidUrl =
                      src.url && !src.url.startsWith("http://") && !src.url.startsWith("https://");
                    return (
                      <View key={i} style={styles.sourceRowItem}>
                        <View style={styles.sourceInputsCol}>
                          <TextInput
                            style={[styles.textInput, typography.uiBody]}
                            placeholder="Source Title (e.g. Municipal Water Quality Board)"
                            placeholderTextColor={colors.slate400}
                            value={src.title}
                            onChangeText={(t) => updateSourceField(i, "title", t)}
                          />
                          <TextInput
                            style={[styles.textInput, typography.uiCaption, hasInvalidUrl && styles.inputErrorBorder]}
                            placeholder="URL (https://...)"
                            placeholderTextColor={colors.slate400}
                            value={src.url}
                            onChangeText={(u) => updateSourceField(i, "url", u)}
                          />
                          {hasInvalidUrl && (
                            <Text style={[styles.inlineError, typography.micro]}>
                              ⚠️ URL must begin with https:// or http://
                            </Text>
                          )}
                        </View>
                        {draft.sources.length > 1 && (
                          <TouchableOpacity onPress={() => removeSource(i)} style={styles.removeSourceIcon}>
                            <Ionicons name="close-circle" size={20} color={colors.slate400} />
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Suggested Audience Actions */}
                <View style={styles.cardBox}>
                  <Text style={[styles.fieldLabel, typography.uiH3]}>Suggested Audience Actions</Text>
                  <Text style={[styles.helperNote, typography.caption]}>
                    Actions readers can take when your ad directs them to this campaign page.
                  </Text>
                  <View style={styles.actionsList}>
                    {(draft.audienceActions || []).map((act, idx) => (
                      <View key={idx} style={styles.actionChipItem}>
                        <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
                        <Text style={[styles.actionChipText, typography.uiCaption]}>{act}</Text>
                        <TouchableOpacity onPress={() => handleRemoveAudienceAction(idx)}>
                          <Ionicons name="close" size={16} color={colors.slate500} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>

                  <View style={styles.addActionInputRow}>
                    <TextInput
                      style={[styles.textInput, { flex: 1 }, typography.uiCaption]}
                      placeholder="e.g. Sign the regional petition..."
                      placeholderTextColor={colors.slate400}
                      value={newActionInput}
                      onChangeText={setNewActionInput}
                    />
                    <TouchableOpacity style={styles.addActionBtn} onPress={handleAddAudienceAction}>
                      <Text style={[styles.addActionBtnText, typography.uiCaption]}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        )}

        {/* ==================================================================== */}
        {/* STEP 3: CAMPAIGN & AD VISUALS */}
        {/* ==================================================================== */}
        {draft.currentStep === 3 && (
          <View style={styles.stepSection}>
            <View style={styles.stepHeader}>
              <Text style={[styles.stepTitle, typography.storyH1]}>Step 3 — Campaign & Ad Visuals</Text>
              <Text style={[styles.stepDesc, typography.body]}>
                Configure the creative elements used in external advertising feeds to draw readers to your message.
              </Text>
            </View>

            {/* Asset Validation Warnings */}
            {!draft.adImageUrl && (
              <View style={styles.warningBox}>
                <Ionicons name="alert-circle" size={18} color={colors.amberDark} />
                <Text style={[styles.warningText, typography.caption]}>
                  Notice: No custom ad image provided. A high-resolution category graphic will be used by default.
                </Text>
              </View>
            )}

            {/* Ad Headline */}
            <View style={styles.cardBox}>
              <Text style={[styles.fieldLabel, typography.uiH3]}>Ad Headline</Text>
              <TextInput
                style={[styles.textInput, typography.uiBody]}
                placeholder={draft.title || "Custom ad headline..."}
                placeholderTextColor={colors.slate400}
                value={draft.adHeadline}
                onChangeText={(t) => draft.updateVisuals({ adHeadline: t })}
              />
              <Text style={[styles.helperNote, typography.caption]}>
                Defaults to your campaign title if not custom-specified.
              </Text>
            </View>

            {/* Ad Description */}
            <View style={styles.cardBox}>
              <Text style={[styles.fieldLabel, typography.uiH3]}>Ad Description / Punchy Teaser</Text>
              <TextInput
                style={[styles.textAreaInput, typography.uiBody]}
                placeholder="Short teaser shown in feed ad cards..."
                placeholderTextColor={colors.slate400}
                multiline
                numberOfLines={2}
                value={draft.adDescription}
                onChangeText={(t) => draft.updateVisuals({ adDescription: t })}
              />
            </View>

            {/* Ad Call To Action Text */}
            <View style={styles.cardBox}>
              <Text style={[styles.fieldLabel, typography.uiH3]}>Call-To-Action (CTA) Text</Text>
              <TextInput
                style={[styles.textInput, typography.uiBody]}
                placeholder="Learn More"
                placeholderTextColor={colors.slate400}
                value={draft.ctaText}
                onChangeText={(t) => draft.updateVisuals({ ctaText: t })}
              />
            </View>

            {/* Ad Image URL */}
            <View style={styles.cardBox}>
              <Text style={[styles.fieldLabel, typography.uiH3]}>Ad Graphic URL (1:1 or 16:9)</Text>
              <TextInput
                style={[styles.textInput, typography.uiBody]}
                placeholder="https://..."
                placeholderTextColor={colors.slate400}
                value={draft.adImageUrl}
                onChangeText={(t) => draft.updateVisuals({ adImageUrl: t })}
              />
            </View>

            {/* Creative Feedback Prompt */}
            <TouchableOpacity
              style={styles.creativeFeedbackPrompt}
              onPress={() => setShowCreativeTips(!showCreativeTips)}
              activeOpacity={0.8}
            >
              <Ionicons name="bulb-outline" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.creativeFeedbackTitle, typography.uiH3]}>Creative Feedback & Guidelines</Text>
                <Text style={[styles.creativeFeedbackSub, typography.caption]}>
                  Tap to view editorial suggestions to maximize public engagement.
                </Text>
              </View>
              <Ionicons name={showCreativeTips ? "chevron-up" : "chevron-down"} size={18} color={colors.slate400} />
            </TouchableOpacity>

            {showCreativeTips && (
              <View style={styles.creativeTipsCard}>
                <Text style={[styles.tipTitle, typography.uiH3]}>3 Rules for High Impact Amplification:</Text>
                <Text style={[styles.tipItem, typography.body]}>
                  • <Text style={styles.boldText}>Specific stakes:</Text> Ads with clear local or scientific stakes (e.g. "40,000 residents affected") get 2.4x more clicks.
                </Text>
                <Text style={[styles.tipItem, typography.body]}>
                  • <Text style={styles.boldText}>Direct verbs:</Text> Use action-focused CTA buttons like "Read Investigation" or "View Evidence" rather than vague phrases.
                </Text>
                <Text style={[styles.tipItem, typography.body]}>
                  • <Text style={styles.boldText}>No sensationalism:</Text> Claims must strictly match the citations in Step 2 to pass reviewer approval.
                </Text>
              </View>
            )}

            {/* Placement Previews (Feed Post, Story, Banner) */}
            <View style={styles.placementCard}>
              <Text style={[styles.placementHeader, typography.uiH3]}>Placement Previews (2-3 Formats)</Text>
              <View style={styles.placementTabsRow}>
                <TouchableOpacity
                  style={[styles.placementTab, adPlacementTab === "feed" && styles.placementTabActive]}
                  onPress={() => setAdPlacementTab("feed")}
                >
                  <Text
                    style={[
                      styles.placementTabText,
                      typography.uiCaption,
                      adPlacementTab === "feed" && styles.placementTabTextActive,
                    ]}
                  >
                    Feed Post
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.placementTab, adPlacementTab === "story" && styles.placementTabActive]}
                  onPress={() => setAdPlacementTab("story")}
                >
                  <Text
                    style={[
                      styles.placementTabText,
                      typography.uiCaption,
                      adPlacementTab === "story" && styles.placementTabTextActive,
                    ]}
                  >
                    Story / Vertical
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.placementTab, adPlacementTab === "banner" && styles.placementTabActive]}
                  onPress={() => setAdPlacementTab("banner")}
                >
                  <Text
                    style={[
                      styles.placementTabText,
                      typography.uiCaption,
                      adPlacementTab === "banner" && styles.placementTabTextActive,
                    ]}
                  >
                    Billboard Banner
                  </Text>
                </TouchableOpacity>
              </View>

              {/* FEED POST PREVIEW */}
              {adPlacementTab === "feed" && (
                <View style={styles.mockFeedCard}>
                  <View style={styles.mockFeedTop}>
                    <View style={styles.mockAvatar}>
                      <Ionicons name="megaphone" size={16} color={colors.white} />
                    </View>
                    <View>
                      <Text style={[styles.mockPublisher, typography.uiCaption]}>Amplify Together Sponsored</Text>
                      <Text style={[styles.mockCategory, typography.uiMicro]}>{draft.category}</Text>
                    </View>
                  </View>
                  <Text style={[styles.mockFeedHeadline, typography.uiH3]}>
                    {draft.adHeadline || draft.title || "Your Campaign Headline"}
                  </Text>
                  <Text style={[styles.mockFeedDesc, typography.caption]} numberOfLines={2}>
                    {draft.adDescription || draft.summary || "Summary description of the campaign issue."}
                  </Text>
                  {draft.coverImageUrl ? (
                    <Image source={{ uri: draft.coverImageUrl }} style={styles.mockFeedImg} resizeMode="cover" />
                  ) : null}
                  <View style={styles.mockFeedCtaBar}>
                    <Text style={[styles.mockFeedCtaText, typography.uiCaption]}>{draft.ctaText || "Learn More"}</Text>
                    <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                  </View>
                </View>
              )}

              {/* STORY VERTICAL PREVIEW */}
              {adPlacementTab === "story" && (
                <View style={styles.mockStoryCard}>
                  <View style={styles.mockStoryHeader}>
                    <Text style={[styles.mockStorySponsored, typography.micro]}>SPONSORED PUBLIC STORY</Text>
                  </View>
                  <Text style={[styles.mockStoryTitle, typography.storyH2]}>
                    {draft.adHeadline || draft.title || "Headline Here"}
                  </Text>
                  <Text style={[styles.mockStoryBody, typography.storyBody]}>
                    {draft.adDescription || draft.summary || "Story ad copy teaser."}
                  </Text>
                  <View style={styles.mockStorySwipeUp}>
                    <Ionicons name="chevron-up" size={18} color={colors.white} />
                    <Text style={[styles.mockStorySwipeText, typography.uiCaption]}>
                      Swipe up to {draft.ctaText || "Learn More"}
                    </Text>
                  </View>
                </View>
              )}

              {/* BANNER BILLBOARD PREVIEW */}
              {adPlacementTab === "banner" && (
                <View style={styles.mockBannerCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.mockBannerTag, typography.micro]}>PUBLIC INTEREST CAMPAIGN</Text>
                    <Text style={[styles.mockBannerTitle, typography.uiH3]} numberOfLines={2}>
                      {draft.adHeadline || draft.title || "Your Campaign Headline"}
                    </Text>
                  </View>
                  <View style={styles.mockBannerBtn}>
                    <Text style={[styles.mockBannerBtnText, typography.micro]}>{draft.ctaText || "Read More"}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ==================================================================== */}
        {/* STEP 4: REACH & AUDIENCE */}
        {/* ==================================================================== */}
        {draft.currentStep === 4 && (
          <View style={styles.stepSection}>
            <View style={styles.stepHeader}>
              <Text style={[styles.stepTitle, typography.storyH1]}>Step 4 — Reach & Distribution</Text>
              <Text style={[styles.stepDesc, typography.body]}>
                Configure audience targeting. Platform media planners will review and finalize placements upon approval.
              </Text>
            </View>

            {/* VISUAL SEPARATION: CARD A - YOUR CHOICES */}
            <View style={styles.choicesCard}>
              <View style={styles.sectionBadgeRow}>
                <Ionicons name="options" size={16} color={colors.primary} />
                <Text style={[styles.sectionBadgeText, typography.uiH3]}>Your Targeting Choices</Text>
              </View>

              {/* Distribution Channels */}
              <View style={styles.fieldBoxInner}>
                <Text style={[styles.fieldLabel, typography.uiH3]}>Distribution Channels</Text>
                {CHANNELS.map((ch) => {
                  const isSelected = draft.channels.includes(ch);
                  return (
                    <TouchableOpacity
                      key={ch}
                      style={styles.checkboxOptionRow}
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
                      <Text style={[styles.checkboxOptionText, typography.uiBody]}>{ch}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Target Locations */}
              <View style={styles.fieldBoxInner}>
                <Text style={[styles.fieldLabel, typography.uiH3]}>Target Geographic Locations</Text>
                <TextInput
                  style={[styles.textInput, typography.uiBody]}
                  placeholder="e.g. Cook County, IL, Chicago Metro, or National"
                  placeholderTextColor={colors.slate400}
                  value={draft.locations.join(", ")}
                  onChangeText={(t) =>
                    draft.updateReach({
                      locations: t.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                />
              </View>

              {/* Target Interests */}
              <View style={styles.fieldBoxInner}>
                <Text style={[styles.fieldLabel, typography.uiH3]}>Target Audience Interests</Text>
                <View style={styles.categoryWrap}>
                  {INTERESTS_LIST.map((int) => {
                    const isSelected = draft.interests.includes(int);
                    return (
                      <TouchableOpacity
                        key={int}
                        style={[styles.categoryPill, isSelected && styles.categoryPillSelected]}
                        onPress={() => {
                          const updated = isSelected
                            ? draft.interests.filter((i) => i !== int)
                            : [...draft.interests, int];
                          draft.updateReach({ interests: updated });
                        }}
                      >
                        <Text
                          style={[
                            styles.categoryPillText,
                            typography.uiCaption,
                            isSelected && styles.categoryPillTextSelected,
                          ]}
                        >
                          {int}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Campaign Duration */}
              <View style={styles.fieldBoxInner}>
                <Text style={[styles.fieldLabel, typography.uiH3]}>Campaign Duration</Text>
                <View style={styles.durationPillsRow}>
                  {[14, 30, 45, 60].map((days) => (
                    <TouchableOpacity
                      key={days}
                      style={[styles.durationPill, draft.durationDays === days && styles.durationPillActive]}
                      onPress={() => draft.updateReach({ durationDays: days })}
                    >
                      <Text
                        style={[
                          styles.durationPillText,
                          typography.uiCaption,
                          draft.durationDays === days && styles.durationPillTextActive,
                        ]}
                      >
                        {days} Days
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* VISUAL SEPARATION: CARD B - FINALIZED DURING REVIEW */}
            <View style={styles.finalizedCard}>
              <View style={styles.sectionBadgeRow}>
                <Ionicons name="lock-closed" size={16} color={colors.slate500} />
                <Text style={[styles.sectionBadgeText, typography.uiH3]}>Finalized During Review</Text>
              </View>
              <Text style={[styles.finalizedSub, typography.caption]}>
                Configured and optimized by platform media specialists during approval to guarantee fair auction pricing:
              </Text>
              <View style={styles.finalizedParamsList}>
                <Text style={[styles.paramItem, typography.uiCaption]}>
                  🔒 <Text style={styles.boldText}>Bidding Strategy:</Text> Target CPA with automated CPM auction cap
                </Text>
                <Text style={[styles.paramItem, typography.uiCaption]}>
                  🔒 <Text style={styles.boldText}>Audience Lookalike Weights:</Text> Tuned to high-civic engagement
                </Text>
                <Text style={[styles.paramItem, typography.uiCaption]}>
                  🔒 <Text style={styles.boldText}>Brand Safety Filters:</Text> Negative keyword exclusions applied
                </Text>
              </View>
            </View>

            {/* Live Reach Estimate Range (Never Promise Fixed Audience) */}
            <View style={styles.reachEstimateCard}>
              <View style={styles.reachEstimateTop}>
                <Ionicons name="people" size={24} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.reachRangeTitle, typography.uiH2]}>{reachCalc.formattedRange}</Text>
                  <Text style={[styles.reachDisclaimerLabel, typography.micro]}>
                    ESTIMATED REACH RANGE • NOT A GUARANTEE
                  </Text>
                </View>
              </View>
              <Text style={[styles.reachNoticeText, typography.caption]}>
                Audience delivery is variable based on real-time ad network auction demand, season, and reader CTR. We never promise a fixed audience size.
              </Text>
            </View>
          </View>
        )}

        {/* ==================================================================== */}
        {/* STEP 5: SUBMIT & MANUAL FUNDING GOAL */}
        {/* ==================================================================== */}
        {draft.currentStep === 5 && (
          <View style={styles.stepSection}>
            <View style={styles.stepHeader}>
              <Text style={[styles.stepTitle, typography.storyH1]}>Step 5 — Funding Goal & Submit</Text>
              <Text style={[styles.stepDesc, typography.body]}>
                Enter your amplification funding goal, verify your campaign details, and submit for editorial review.
              </Text>
            </View>

            {/* MANDATORY: Manual Funding Goal Input (STARTS STRICTLY EMPTY) */}
            <View style={styles.goalCard}>
              <View style={styles.goalLabelRow}>
                <Text style={[styles.goalTitle, typography.uiH2]}>Amplification Funding Goal ($USD) *</Text>
                <View style={styles.manualEntryBadge}>
                  <Text style={[styles.manualEntryText, typography.micro]}>ENTERED MANUALLY</Text>
                </View>
              </View>
              <Text style={[styles.goalNotice, typography.caption]}>
                This field starts empty. You decide how much advertising budget to pool. AI or automated wizards cannot fill this in.
              </Text>

              <View style={[styles.goalInputBox, !draft.fundingGoal && styles.goalInputEmpty]}>
                <Text style={[styles.goalCurrency, typography.uiH1]}>$</Text>
                <TextInput
                  style={[styles.goalTextInput, typography.uiH1]}
                  placeholder="e.g. 2500"
                  placeholderTextColor={colors.slate400}
                  keyboardType="numeric"
                  value={draft.fundingGoal}
                  onChangeText={draft.setFundingGoal}
                />
              </View>

              {parseFloat(draft.fundingGoal) > 0 ? (
                <View style={styles.goalEstimateRow}>
                  <Ionicons name="trending-up" size={16} color={colors.primary} />
                  <Text style={[styles.goalEstimateText, typography.caption]}>
                    At 100% funding (${parseFloat(draft.fundingGoal).toLocaleString()}): estimated reach of{" "}
                    <Text style={styles.boldText}>{calculateReach(parseFloat(draft.fundingGoal)).formattedRange}</Text> people.
                  </Text>
                </View>
              ) : (
                <Text style={[styles.goalRequiredHint, typography.micro]}>
                  ⚠️ Please enter your amplification goal in dollars.
                </Text>
              )}
            </View>

            {/* FULL CAMPAIGN PREVIEW ACCORDION / BOX */}
            <View style={styles.cardBox}>
              <View style={styles.previewHeaderRow}>
                <Text style={[styles.fieldLabel, typography.uiH3]}>Full Campaign Summary</Text>
                <TouchableOpacity
                  style={styles.toggleFullPreviewBtn}
                  onPress={() => setShowFullPreviewModal(!showFullPreviewModal)}
                >
                  <Text style={[styles.toggleFullPreviewText, typography.uiCaption]}>
                    {showFullPreviewModal ? "Collapse Details" : "Preview Detail View"}
                  </Text>
                  <Ionicons name={showFullPreviewModal ? "chevron-up" : "chevron-down"} size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.summaryTable}>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableKey, typography.caption]}>Title:</Text>
                  <Text style={[styles.tableVal, typography.uiCaption]}>{draft.title || "Untitled"}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableKey, typography.caption]}>Category:</Text>
                  <Text style={[styles.tableVal, typography.uiCaption]}>{draft.category}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableKey, typography.caption]}>Creator / Org:</Text>
                  <Text style={[styles.tableVal, typography.uiCaption]}>{draft.creatorName || "Not specified"}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableKey, typography.caption]}>Verified Sources:</Text>
                  <Text style={[styles.tableVal, typography.uiCaption]}>{draft.sources.length} public citations</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableKey, typography.caption]}>Target Channels:</Text>
                  <Text style={[styles.tableVal, typography.uiCaption]}>{draft.channels.join(", ") || "None"}</Text>
                </View>
              </View>

              {showFullPreviewModal && (
                <View style={styles.inlineDetailPreview}>
                  <Text style={[styles.inlineDetailHeading, typography.uiH3]}>Story Rendered Preview:</Text>
                  <StoryRenderer blocks={draft.story} />
                </View>
              )}
            </View>

            {/* Fees and Transparent Funding Policies */}
            <View style={styles.policiesCard}>
              <Text style={[styles.policiesTitle, typography.uiH3]}>Fees & Funding Transparency</Text>
              <Text style={[styles.policiesItem, typography.caption]}>
                • <Text style={styles.boldText}>Advertising Reach Pool (92.1%):</Text> Allocated strictly to media auctions and placements.
              </Text>
              <Text style={[styles.policiesItem, typography.caption]}>
                • <Text style={styles.boldText}>Platform & Review Fee (5.0%):</Text> Sustains moderation, fact-checking, and reporting.
              </Text>
              <Text style={[styles.policiesItem, typography.caption]}>
                • <Text style={styles.boldText}>Payment Processing (2.9% + $0.30):</Text> Standard card network processing.
              </Text>
              <View style={styles.antiDonationBanner}>
                <Ionicons name="information-circle" size={18} color={colors.primary} />
                <Text style={[styles.antiDonationText, typography.caption]}>
                  <Text style={styles.boldText}>Crucial Rule:</Text> Contributions pay for advertising distribution. This is not a personal donation to the creator or cause.
                </Text>
              </View>
            </View>

            {/* Required Rules Acknowledgment Checkbox */}
            <TouchableOpacity
              style={styles.rulesCheckboxRow}
              onPress={() => draft.setAgreedToTerms(!draft.agreedToTerms)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={draft.agreedToTerms ? "checkbox" : "square-outline"}
                size={22}
                color={draft.agreedToTerms ? colors.primary : colors.slate400}
              />
              <Text style={[styles.rulesCheckboxText, typography.caption]}>
                I certify that all claims are backed by verifiable evidence, supporting sources are genuine, and all pooled contributions will strictly be used for ad amplification.
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ==================================================================== */}
        {/* BOTTOM ACTION BUTTONS PER STEP: Back, Save as Draft, Continue/Submit */}
        {/* ==================================================================== */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.8}>
            <Text style={[styles.backButtonText, typography.uiH3]}>
              {draft.currentStep === 1 ? "Cancel" : "Back"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveDraftButton} onPress={handleSaveDraftManually} activeOpacity={0.8}>
            <Ionicons name="bookmark-outline" size={16} color={colors.slate700} />
            <Text style={[styles.saveDraftButtonText, typography.uiH3]}>Save as Draft</Text>
          </TouchableOpacity>

          {draft.currentStep < 5 ? (
            <TouchableOpacity style={styles.continueButton} onPress={handleNext} activeOpacity={0.85}>
              <Text style={[styles.continueButtonText, typography.uiH3]}>Continue</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmitForReview}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="send" size={16} color={colors.white} />
                  <Text style={[styles.submitButtonText, typography.uiH3]}>Submit for Review</Text>
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
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
  },
  headerRightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noticePill: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: spacing.radiusFull,
  },
  noticeText: {
    color: colors.successDark,
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
  stepSection: {
    gap: spacing.lg,
  },
  voiceBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.amberLight,
    borderWidth: 1,
    borderColor: colors.amberDark,
    borderRadius: spacing.radiusLg,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  voiceBannerTextWrap: {
    flex: 1,
  },
  voiceBannerTitle: {
    color: colors.amberDark,
  },
  voiceBannerSubtitle: {
    color: colors.slate800,
    marginTop: 2,
  },
  stepHeader: {
    gap: 4,
  },
  stepHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  stepTitle: {
    color: colors.slate900,
  },
  stepDesc: {
    color: colors.slate600,
  },
  cardBox: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.sm,
  },
  labelCounterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fieldLabel: {
    color: colors.slate900,
  },
  counterLabel: {
    color: colors.slate500,
  },
  counterMax: {
    color: colors.error,
  },
  textInput: {
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.slate300,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.slate900,
  },
  textAreaInput: {
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
  inputErrorBorder: {
    borderColor: colors.error,
  },
  inlineError: {
    color: colors.error,
    marginTop: 2,
  },
  helperNote: {
    color: colors.slate500,
  },
  coverPreviewBox: {
    marginTop: spacing.sm,
    gap: 4,
  },
  coverThumbnail: {
    width: "100%",
    height: 120,
    borderRadius: spacing.radiusMd,
  },
  coverPreviewCaption: {
    color: colors.slate500,
    textAlign: "center",
  },
  categoryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  categoryPill: {
    backgroundColor: colors.slate100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.radiusFull,
  },
  categoryPillSelected: {
    backgroundColor: colors.primary,
  },
  categoryPillText: {
    color: colors.slate700,
  },
  categoryPillTextSelected: {
    color: colors.white,
  },
  previewToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.radiusFull,
    gap: 4,
  },
  previewToggleBtnActive: {
    backgroundColor: colors.primary,
  },
  previewToggleText: {
    color: colors.primary,
  },
  previewToggleTextActive: {
    color: colors.white,
  },
  livePreviewCard: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  previewNoticeBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
    marginBottom: spacing.md,
  },
  previewNoticeText: {
    color: colors.primary,
  },
  previewSourcesSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.slate200,
    gap: spacing.sm,
  },
  sourcesPreviewHeading: {
    color: colors.slate900,
  },
  sourcePreviewItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sourcePreviewTitle: {
    color: colors.slate700,
  },
  sourcePreviewUrl: {
    color: colors.primary,
    textDecorationLine: "underline",
  },
  formattingToolbar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.slate200,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: spacing.radiusMd,
    gap: spacing.sm,
  },
  toolbarLabel: {
    color: colors.slate600,
    marginRight: 4,
  },
  toolbarBtn: {
    backgroundColor: colors.white,
    width: 28,
    height: 28,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  toolbarBoldText: {
    fontWeight: "bold",
    color: colors.slate900,
  },
  toolbarItalicText: {
    fontStyle: "italic",
    color: colors.slate900,
  },
  blocksList: {
    gap: spacing.md,
  },
  blockCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.sm,
  },
  blockCardSelected: {
    borderColor: colors.primary,
  },
  blockTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  blockBadgeWrap: {
    backgroundColor: colors.slate100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  blockTypeBadge: {
    color: colors.slate600,
  },
  blockActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  moveBtn: {
    padding: 4,
  },
  moveBtnDisabled: {
    opacity: 0.3,
  },
  removeBtn: {
    padding: 4,
    marginLeft: 6,
  },
  headingInput: {
    color: colors.slate900,
    paddingVertical: 4,
  },
  statInputsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  subFieldLabel: {
    color: colors.slate500,
    marginBottom: 2,
  },
  statValueInput: {
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.slate300,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    color: colors.primary,
  },
  imageBlockForm: {
    gap: spacing.xs,
  },
  blockImagePreview: {
    width: "100%",
    height: 120,
    borderRadius: spacing.radiusMd,
    marginVertical: spacing.xs,
  },
  addBlocksToolbar: {
    backgroundColor: colors.slate100,
    padding: spacing.md,
    borderRadius: spacing.radiusLg,
    gap: spacing.xs,
  },
  addBlocksLabel: {
    color: colors.slate600,
  },
  addBlocksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  addBlockChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.radiusFull,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 4,
  },
  addBlockChipText: {
    color: colors.primary,
  },
  smallAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  smallAddBtnText: {
    color: colors.primary,
  },
  sourceRowItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sourceInputsCol: {
    flex: 1,
    gap: 6,
  },
  removeSourceIcon: {
    padding: 4,
  },
  actionsList: {
    gap: 6,
  },
  actionChipItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.slate50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.radiusMd,
    gap: spacing.sm,
  },
  actionChipText: {
    flex: 1,
    color: colors.slate800,
  },
  addActionInputRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  addActionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
    borderRadius: spacing.radiusMd,
  },
  addActionBtnText: {
    color: colors.white,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.amberLight,
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
    gap: spacing.sm,
  },
  warningText: {
    flex: 1,
    color: colors.amberDark,
  },
  creativeFeedbackPrompt: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    gap: spacing.md,
  },
  creativeFeedbackTitle: {
    color: colors.primary,
  },
  creativeFeedbackSub: {
    color: colors.slate700,
  },
  creativeTipsCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.xs,
  },
  tipTitle: {
    color: colors.slate900,
  },
  tipItem: {
    color: colors.slate700,
  },
  boldText: {
    fontWeight: "bold",
    color: colors.slate900,
  },
  placementCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.md,
  },
  placementHeader: {
    color: colors.slate900,
  },
  placementTabsRow: {
    flexDirection: "row",
    backgroundColor: colors.slate100,
    borderRadius: spacing.radiusFull,
    padding: 4,
    gap: 4,
  },
  placementTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    borderRadius: spacing.radiusFull,
  },
  placementTabActive: {
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  placementTabText: {
    color: colors.slate600,
  },
  placementTabTextActive: {
    color: colors.primary,
  },
  mockFeedCard: {
    backgroundColor: colors.slate50,
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.slate200,
    gap: spacing.sm,
  },
  mockFeedTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  mockAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  mockPublisher: {
    color: colors.slate900,
  },
  mockCategory: {
    color: colors.slate500,
  },
  mockFeedHeadline: {
    color: colors.slate900,
  },
  mockFeedDesc: {
    color: colors.slate600,
  },
  mockFeedImg: {
    width: "100%",
    height: 120,
    borderRadius: spacing.radiusMd,
  },
  mockFeedCtaBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    paddingTop: 4,
  },
  mockFeedCtaText: {
    color: colors.primary,
  },
  mockStoryCard: {
    backgroundColor: colors.slate900,
    padding: spacing.xl,
    borderRadius: spacing.radiusLg,
    minHeight: 220,
    justifyContent: "space-between",
  },
  mockStoryHeader: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  mockStorySponsored: {
    color: colors.white,
  },
  mockStoryTitle: {
    color: colors.white,
    marginVertical: spacing.sm,
  },
  mockStoryBody: {
    color: colors.slate200,
  },
  mockStorySwipeUp: {
    alignItems: "center",
    marginTop: spacing.lg,
  },
  mockStorySwipeText: {
    color: colors.white,
  },
  mockBannerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.slate900,
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
    gap: spacing.md,
  },
  mockBannerTag: {
    color: colors.amberLight,
  },
  mockBannerTitle: {
    color: colors.white,
  },
  mockBannerBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: spacing.radiusFull,
  },
  mockBannerBtnText: {
    color: colors.white,
  },
  choicesCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.lg,
  },
  fieldBoxInner: {
    gap: spacing.xs,
  },
  sectionBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
  },
  sectionBadgeText: {
    color: colors.slate900,
  },
  checkboxOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 4,
  },
  checkboxOptionText: {
    color: colors.slate800,
  },
  durationPillsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  durationPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: spacing.radiusMd,
    backgroundColor: colors.slate100,
    alignItems: "center",
  },
  durationPillActive: {
    backgroundColor: colors.primary,
  },
  durationPillText: {
    color: colors.slate700,
  },
  durationPillTextActive: {
    color: colors.white,
  },
  finalizedCard: {
    backgroundColor: colors.slate100,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.slate300,
    gap: spacing.sm,
  },
  finalizedSub: {
    color: colors.slate600,
  },
  finalizedParamsList: {
    gap: 6,
    marginTop: 4,
  },
  paramItem: {
    color: colors.slate700,
  },
  reachEstimateCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.sm,
  },
  reachEstimateTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  reachRangeTitle: {
    color: colors.primary,
  },
  reachDisclaimerLabel: {
    color: colors.slate500,
  },
  reachNoticeText: {
    color: colors.slate600,
  },
  goalCard: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: spacing.radiusLg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    gap: spacing.sm,
  },
  goalLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalTitle: {
    color: colors.slate900,
  },
  manualEntryBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  manualEntryText: {
    color: colors.primary,
  },
  goalNotice: {
    color: colors.slate600,
  },
  goalInputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.slate300,
    borderRadius: spacing.radiusLg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    gap: spacing.xs,
  },
  goalInputEmpty: {
    borderColor: colors.slate400,
  },
  goalCurrency: {
    color: colors.slate900,
  },
  goalTextInput: {
    flex: 1,
    color: colors.slate900,
    paddingVertical: 0,
  },
  goalEstimateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  goalEstimateText: {
    color: colors.slate700,
  },
  goalRequiredHint: {
    color: colors.amberDark,
    marginTop: 4,
  },
  previewHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleFullPreviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  toggleFullPreviewText: {
    color: colors.primary,
  },
  summaryTable: {
    gap: 6,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tableKey: {
    color: colors.slate500,
  },
  tableVal: {
    color: colors.slate900,
  },
  inlineDetailPreview: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.slate200,
    gap: spacing.sm,
  },
  inlineDetailHeading: {
    color: colors.slate900,
  },
  policiesCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.xs,
  },
  policiesTitle: {
    color: colors.slate900,
  },
  policiesItem: {
    color: colors.slate700,
  },
  antiDonationBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.slate100,
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  antiDonationText: {
    flex: 1,
    color: colors.slate800,
  },
  rulesCheckboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.md,
  },
  rulesCheckboxText: {
    flex: 1,
    color: colors.slate700,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.slate200,
  },
  backButton: {
    backgroundColor: colors.slate200,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: spacing.radiusMd,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  backButtonText: {
    color: colors.slate800,
  },
  saveDraftButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate300,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: spacing.radiusMd,
    gap: 4,
    minHeight: 48,
    justifyContent: "center",
  },
  saveDraftButtonText: {
    color: colors.slate800,
  },
  continueButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: spacing.radiusMd,
    gap: spacing.xs,
    minHeight: 48,
  },
  continueButtonText: {
    color: colors.white,
  },
  submitButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: spacing.radiusMd,
    gap: spacing.xs,
    minHeight: 48,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.successLight,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginVertical: spacing.lg,
  },
  successTitle: {
    color: colors.slate900,
    textAlign: "center",
  },
  successSubtitle: {
    color: colors.slate600,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  timelineCard: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  timelineHeader: {
    color: colors.slate900,
  },
  timelineSub: {
    color: colors.slate500,
    marginBottom: spacing.md,
  },
  activeStageText: {
    color: colors.primary,
    fontWeight: "bold",
  },
  timelineList: {
    gap: 0,
  },
  stageRow: {
    flexDirection: "row",
    minHeight: 56,
  },
  stageIndicatorCol: {
    alignItems: "center",
    width: 24,
    marginRight: spacing.md,
  },
  stageDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.slate300,
    alignItems: "center",
    justifyContent: "center",
  },
  dotDone: {
    backgroundColor: colors.success,
  },
  dotInProgress: {
    backgroundColor: colors.primary,
  },
  dotInnerPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  stageConnector: {
    width: 2,
    flex: 1,
    backgroundColor: colors.slate200,
    marginVertical: 2,
  },
  connectorDone: {
    backgroundColor: colors.success,
  },
  stageContent: {
    flex: 1,
    paddingBottom: spacing.md,
  },
  stageName: {
    color: colors.slate600,
  },
  stageNameActive: {
    color: colors.primary,
  },
  stageNameCompleted: {
    color: colors.slate900,
  },
  stageDesc: {
    color: colors.slate500,
  },
  timelineActionRow: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  primaryTimelineBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: spacing.radiusMd,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  primaryTimelineBtnText: {
    color: colors.white,
  },
  secondaryTimelineBtn: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate300,
    paddingVertical: 14,
    borderRadius: spacing.radiusMd,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  secondaryTimelineBtnText: {
    color: colors.slate800,
  },
});
