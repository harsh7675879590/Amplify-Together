import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "../components/ScreenContainer";
import { PrimaryButton } from "../components/PrimaryButton";
import { SecondaryButton } from "../components/SecondaryButton";
import { TextField } from "../components/TextField";
import { Chip } from "../components/Chip";
import { SectionHeader } from "../components/SectionHeader";
import { ProgressBar } from "../components/ProgressBar";
import { StatusBadge } from "../components/StatusBadge";
import { CampaignCard } from "../components/CampaignCard";
import { Accordion } from "../components/Accordion";
import { StepIndicator } from "../components/StepIndicator";
import { SkeletonCard } from "../components/SkeletonCard";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { Toast } from "../components/Toast";
import { StickyBottomBar } from "../components/StickyBottomBar";
import { StoryRenderer } from "../components/StoryRenderer";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { spacing } from "../theme/spacing";
import { MOCK_CAMPAIGNS } from "../mocks/campaigns";
import { StoryBlock } from "../types";

export default function DesignPreviewScreen() {
  const router = useRouter();
  const [inputText, setInputText] = useState("Water contamination in public schools");
  const [selectedCategory, setSelectedCategory] = useState("Health");
  const [toastVisible, setToastVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(2);

  const sampleBlocks: StoryBlock[] = [
    { type: "heading", text: "The Water Crisis in Regional Classrooms" },
    {
      type: "paragraph",
      text: "Independent water testing across 42 regional public schools uncovered lead levels three times above the federal safety threshold. Long-term lead exposure poses irreversible neurological risks to developing children.",
    },
    { type: "stat", value: "3x", label: "Above federal lead action levels in classroom taps" },
    {
      type: "image",
      url: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=800",
      caption: "Certified water sample bottles collected from elementary school fountains.",
      credit: "Tri-County Clean Water Coalition",
    },
    {
      type: "quote",
      text: "Every family deserves to know the verified facts before sending their children into classrooms.",
      label: "Dr. Elena Rostova, Epidemiologist",
    },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: "Amplify Design System",
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
        }}
      />

      <ScreenContainer scrollable>
        {/* Banner */}
        <View style={styles.banner}>
          <Ionicons name="sparkles" size={20} color={colors.primary} />
          <View style={styles.bannerTextWrap}>
            <Text style={[styles.bannerTitle, typography.uiH3]}>
              Amplify Design System & Tokens
            </Text>
            <Text style={[styles.bannerSubtitle, typography.uiCaption]}>
              Editorial newsroom aesthetic paired with modern fintech trust.
            </Text>
          </View>
        </View>

        {/* 1. TYPOGRAPHY */}
        <SectionHeader title="1. Editorial Typography" subtitle="Serif for stories & clean sans for controls" />
        <View style={styles.card}>
          <Text style={[typography.storyHero, styles.typeRow]}>Story Hero (Georgia 28/36)</Text>
          <Text style={[typography.storyH1, styles.typeRow]}>Story H1 (Georgia 22/30)</Text>
          <Text style={[typography.storyH2, styles.typeRow]}>Story H2 (Georgia 18/26)</Text>
          <Text style={[typography.storyBody, styles.typeRow]}>
            Story Body (Georgia 16/26): "Community backing funds verified distribution of important messages across regional channels."
          </Text>
          <Text style={[typography.uiTitle, styles.typeRow]}>UI Title (Sans 20/26)</Text>
          <Text style={[typography.uiH2, styles.typeRow]}>UI H2 (Sans 17/24)</Text>
          <Text style={[typography.uiH3, styles.typeRow]}>UI H3 (Sans 15/22)</Text>
          <Text style={[typography.uiBody, styles.typeRow]}>UI Body (Sans 16/24)</Text>
          <Text style={[typography.uiCaption, styles.typeRow]}>UI Caption (Sans 14/20)</Text>
          <Text style={[typography.uiMicro, styles.typeRow]}>UI MICRO (Sans 12/16 Uppercase)</Text>
        </View>

        {/* 2. COLOR PALETTE */}
        <SectionHeader title="2. Color Tokens" subtitle="Deep slate, warm amber, and WCAG AA neutrals" />
        <View style={styles.card}>
          <View style={styles.colorGrid}>
            <ColorSwatch label="Primary Navy" hex={colors.primary} color={colors.primary} />
            <ColorSwatch label="Warm Amber" hex={colors.accent} color={colors.accent} />
            <ColorSwatch label="Canvas Off-White" hex={colors.background} color={colors.background} darkBorder />
            <ColorSwatch label="Surface White" hex={colors.surface} color={colors.surface} darkBorder />
            <ColorSwatch label="Success Green" hex={colors.success} color={colors.success} />
            <ColorSwatch label="Error Crimson" hex={colors.error} color={colors.error} />
          </View>
        </View>

        {/* 3. BUTTONS */}
        <SectionHeader title="3. Buttons" subtitle="Primary, Accent, Outlined, Ghost, Loading, Disabled" />
        <View style={styles.card}>
          <View style={styles.btnRow}>
            <PrimaryButton label="Primary Button" onPress={() => {}} icon="arrow-forward" />
          </View>
          <View style={styles.btnRow}>
            <PrimaryButton label="Accent CTA Button" onPress={() => {}} variant="accent" icon="megaphone-outline" />
          </View>
          <View style={styles.btnRow}>
            <SecondaryButton label="Secondary Outlined" onPress={() => {}} icon="newspaper-outline" />
          </View>
          <View style={styles.btnRow}>
            <SecondaryButton label="Ghost Button" onPress={() => {}} variant="ghost" icon="share-social-outline" />
          </View>
          <View style={styles.btnRow}>
            <PrimaryButton label="Loading Button" onPress={() => {}} loading />
          </View>
          <View style={styles.btnRow}>
            <PrimaryButton label="Disabled Button" onPress={() => {}} disabled />
          </View>
        </View>

        {/* 4. TEXT FIELDS */}
        <SectionHeader title="4. Form Inputs" subtitle="Labels, character counts, focus, errors" />
        <View style={styles.card}>
          <TextField
            label="Campaign Headline"
            value={inputText}
            onChangeText={setInputText}
            maxLength={60}
            showCharCount
            helperText="Clear statement under 60 characters for advertising feeds."
          />
          <TextField
            label="Input With Error"
            value="Invalid URL"
            errorMessage="Please enter a valid https:// source URL."
          />
          <TextField
            label="Longform Summary"
            multiline
            numberOfLines={3}
            placeholder="Describe what this message amplifies..."
            helperText="1-2 sentences summarizing the core issue."
          />
        </View>

        {/* 5. CHIPS & PILLS */}
        <SectionHeader title="5. Chips & Category Pills" subtitle="Selected & unselected states" />
        <View style={[styles.card, styles.wrapRow]}>
          {["Environment", "Health", "Science", "Education", "Public Policy"].map((cat) => (
            <Chip
              key={cat}
              label={cat}
              selected={selectedCategory === cat}
              onPress={() => setSelectedCategory(cat)}
              count={cat === "Health" ? 3 : 1}
            />
          ))}
        </View>

        {/* 6. STATUS BADGES */}
        <SectionHeader title="6. Status Badges" subtitle="All campaign lifecycle states" />
        <View style={[styles.card, styles.wrapRow]}>
          <StatusBadge status="available_for_funding" />
          <StatusBadge status="goal_reached" />
          <StatusBadge status="distribution_prep" />
          <StatusBadge status="promoting" />
          <StatusBadge status="completed" />
          <StatusBadge status="submitted" />
          <StatusBadge status="changes_requested" />
        </View>

        {/* 7. PROGRESS BARS */}
        <SectionHeader title="7. Progress Indicators" subtitle="0%, 30%, 62%, 90%, 100%" />
        <View style={styles.card}>
          <Text style={[typography.uiCaption, styles.progressLabel]}>Early Stage: 15%</Text>
          <ProgressBar percent={15} />

          <Text style={[typography.uiCaption, styles.progressLabel]}>Momentum: 62%</Text>
          <ProgressBar percent={62} />

          <Text style={[typography.uiCaption, styles.progressLabel]}>Near Goal: 90%</Text>
          <ProgressBar percent={90} />

          <Text style={[typography.uiCaption, styles.progressLabel]}>Fully Funded: 100%</Text>
          <ProgressBar percent={100} />
        </View>

        {/* 8. STEP INDICATOR */}
        <SectionHeader title="8. Wizard Step Indicator" subtitle="5-step creation progress" />
        <View style={styles.card}>
          <StepIndicator currentStep={activeStep} />
          <View style={styles.stepBtnRow}>
            <SecondaryButton
              label="Prev Step"
              onPress={() => setActiveStep((s) => Math.max(1, s - 1))}
              style={{ flex: 1, marginRight: spacing.s8 }}
            />
            <SecondaryButton
              label="Next Step"
              onPress={() => setActiveStep((s) => Math.min(5, s + 1))}
              style={{ flex: 1 }}
            />
          </View>
        </View>

        {/* 9. CAMPAIGN CARDS */}
        <SectionHeader title="9. Campaign Cards" subtitle="Feed variant & compact variant" />
        <Text style={[typography.uiH3, { marginBottom: spacing.s8 }]}>Feed Variant:</Text>
        <CampaignCard campaign={MOCK_CAMPAIGNS[0]} />

        <Text style={[typography.uiH3, { marginTop: spacing.s16, marginBottom: spacing.s8 }]}>Compact Variant:</Text>
        <CampaignCard campaign={MOCK_CAMPAIGNS[1]} variant="compact" />

        {/* 10. ACCORDION */}
        <SectionHeader title="10. Expandable Disclosures" subtitle="Clean accordion for trust & fee breakdown" />
        <Accordion title="How We Calculate Advertising Reach">
          <Text style={[typography.uiBody, { color: colors.textSecondary }]}>
            Reach projections assume standard Meta and independent news feed CPM rates ($8-$12 per 1,000 impressions). 100% of advertising contributions after the 5% platform fee go directly toward distribution.
          </Text>
        </Accordion>
        <Accordion title="Source Verification & Fact Checking" initialExpanded>
          <Text style={[typography.uiBody, { color: colors.textSecondary }]}>
            Before any campaign opens for community funding, fact-checkers verify that cited sources are reputable, primary data repositories or peer-reviewed journals.
          </Text>
        </Accordion>

        {/* 11. STORY RENDERER */}
        <SectionHeader title="11. Editorial Story Renderer" subtitle="Headings, paragraphs, stats, images, quotes" />
        <View style={styles.card}>
          <StoryRenderer blocks={sampleBlocks} />
        </View>

        {/* 12. SKELETON LOADING */}
        <SectionHeader title="12. Skeleton Loading" subtitle="Content loading shimmers" />
        <SkeletonCard />

        {/* 13. FEEDBACK STATES */}
        <SectionHeader title="13. Empty & Error States" subtitle="User guidance components" />
        <EmptyState
          title="No campaigns found"
          description="Try adjusting your category filter or search keywords."
          actionLabel="Clear Filters"
          onAction={() => {}}
        />
        <ErrorState
          title="Network Connection Issue"
          message="Could not reach the campaign indexing service."
          onRetry={() => {}}
        />

        {/* 14. TOAST */}
        <SectionHeader title="14. Toast Notification" subtitle="Interactive banner snackbar" />
        <PrimaryButton
          label="Trigger Toast Notification"
          onPress={() => setToastVisible(true)}
          icon="notifications-outline"
        />

        {/* 15. STICKY BOTTOM BAR */}
        <SectionHeader title="15. Sticky Bottom Bar" subtitle="Accessible docked action bar" />
        <View style={{ marginHorizontal: -spacing.s16, marginTop: spacing.s12 }}>
          <StickyBottomBar
            primaryLabel="Amplify Message"
            onPrimaryPress={() => {}}
            statLabel="Total Raised"
            statValue="$2,700"
            subStat="90% of $3,000 goal"
          />
        </View>

        <Toast
          visible={toastVisible}
          message="Simulated payment confirmed! Funds allocated to ad reach."
          type="success"
          onDismiss={() => setToastVisible(false)}
        />
      </ScreenContainer>
    </>
  );
}

function ColorSwatch({
  label,
  hex,
  color,
  darkBorder,
}: {
  label: string;
  hex: string;
  color: string;
  darkBorder?: boolean;
}) {
  return (
    <View style={styles.swatch}>
      <View
        style={[
          styles.swatchColor,
          { backgroundColor: color },
          darkBorder && styles.swatchBorder,
        ]}
      />
      <Text style={[styles.swatchLabel, typography.uiMicro]}>{label}</Text>
      <Text style={[styles.swatchHex, typography.uiMicro]}>{hex}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    padding: spacing.s16,
    borderRadius: spacing.radiusInput,
    marginBottom: spacing.s16,
    borderWidth: 1,
    borderColor: "rgba(30, 58, 95, 0.15)",
    gap: spacing.s12,
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerTitle: {
    color: colors.primary,
  },
  bannerSubtitle: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.s16,
    borderRadius: spacing.radiusCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.s16,
  },
  typeRow: {
    marginBottom: spacing.s12,
    color: colors.textPrimary,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.s12,
  },
  swatch: {
    width: "30%",
    alignItems: "center",
  },
  swatchColor: {
    width: "100%",
    height: 44,
    borderRadius: spacing.radiusSm,
    marginBottom: spacing.s4,
  },
  swatchBorder: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  swatchLabel: {
    color: colors.textPrimary,
    textAlign: "center",
  },
  swatchHex: {
    color: colors.textMuted,
    fontSize: 10,
  },
  btnRow: {
    marginBottom: spacing.s12,
  },
  wrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.s8,
  },
  progressLabel: {
    color: colors.textSecondary,
    marginBottom: spacing.s4,
    marginTop: spacing.s8,
  },
  stepBtnRow: {
    flexDirection: "row",
    marginTop: spacing.s16,
  },
});
