import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { spacing } from "../theme/spacing";
import { CATEGORIES } from "../lib/config";

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  minProgress: number;
  onSelectMinProgress: (pct: number) => void;
  onReset: () => void;
  onApply: () => void;
  activeFilterCount?: number;
}

const ALL_CATEGORIES = ["All", ...CATEGORIES];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "available_for_funding", label: "Available for Funding" },
  { value: "promoting", label: "Promoting (Live Ads)" },
  { value: "completed", label: "Completed (Reports)" },
];

const PROGRESS_OPTIONS = [
  { value: 0, label: "Any (0%)" },
  { value: 25, label: "25%+" },
  { value: 50, label: "50%+" },
  { value: 75, label: "75%+" },
  { value: 90, label: "90%+" },
];

export const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  visible,
  onClose,
  selectedCategory,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
  minProgress,
  onSelectMinProgress,
  onReset,
  onApply,
  activeFilterCount = 0,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              <SafeAreaView>
                {/* Drag Handle Indicator */}
                <View style={styles.dragHandle} />

                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.title, typography.uiH2]}>Filter Campaigns</Text>
                    {activeFilterCount > 0 && (
                      <View style={styles.filterCountBadge}>
                        <Text style={[styles.filterCountText, typography.uiMicro]}>
                          {activeFilterCount} ACTIVE
                        </Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={onClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.closeBtn}
                  >
                    <Ionicons name="close" size={22} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Scrollable Filters */}
                <ScrollView
                  style={styles.scrollArea}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Category Filter */}
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, typography.uiH3]}>Category</Text>
                    <View style={styles.chipGrid}>
                      {ALL_CATEGORIES.map((cat) => {
                        const isSelected = selectedCategory === cat;
                        return (
                          <TouchableOpacity
                            key={cat}
                            style={[
                              styles.chip,
                              isSelected && styles.chipSelected,
                            ]}
                            onPress={() => onSelectCategory(cat)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                typography.uiCaption,
                                isSelected && styles.chipTextSelected,
                              ]}
                            >
                              {cat}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Funding Status Filter */}
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, typography.uiH3]}>Funding Status</Text>
                    <View style={styles.chipGrid}>
                      {STATUS_OPTIONS.map((opt) => {
                        const isSelected = selectedStatus === opt.value;
                        return (
                          <TouchableOpacity
                            key={opt.value}
                            style={[
                              styles.chip,
                              isSelected && styles.chipSelected,
                            ]}
                            onPress={() => onSelectStatus(opt.value)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                typography.uiCaption,
                                isSelected && styles.chipTextSelected,
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Minimum Progress Filter */}
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, typography.uiH3]}>Minimum Funding Progress</Text>
                    <View style={styles.chipGrid}>
                      {PROGRESS_OPTIONS.map((opt) => {
                        const isSelected = minProgress === opt.value;
                        return (
                          <TouchableOpacity
                            key={opt.value}
                            style={[
                              styles.chip,
                              isSelected && styles.chipSelected,
                            ]}
                            onPress={() => onSelectMinProgress(opt.value)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                typography.uiCaption,
                                isSelected && styles.chipTextSelected,
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </ScrollView>

                {/* Bottom Actions Bar */}
                <View style={styles.footerRow}>
                  <TouchableOpacity
                    style={styles.resetButton}
                    onPress={onReset}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.resetText, typography.uiH3]}>Reset All</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.applyButton}
                    onPress={onApply}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.applyText, typography.uiH3]}>Apply Filters</Text>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: spacing.radiusCard,
    borderTopRightRadius: spacing.radiusCard,
    paddingTop: spacing.s12,
    paddingBottom: spacing.s20,
    maxHeight: "85%",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.slate300,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing.s12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.s20,
    paddingBottom: spacing.s12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s8,
  },
  title: {
    color: colors.textPrimary,
  },
  filterCountBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.s8,
    paddingVertical: 2,
    borderRadius: spacing.radiusFull,
  },
  filterCountText: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
  closeBtn: {
    padding: spacing.s4,
  },
  scrollArea: {
    maxHeight: 420,
  },
  scrollContent: {
    paddingHorizontal: spacing.s20,
    paddingVertical: spacing.s16,
    gap: spacing.s20,
  },
  section: {
    gap: spacing.s10,
  },
  sectionTitle: {
    color: colors.textPrimary,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.s8,
  },
  chip: {
    paddingHorizontal: spacing.s12,
    paddingVertical: spacing.s8,
    borderRadius: spacing.radiusFull,
    backgroundColor: colors.surfaceNeutral,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    minHeight: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontWeight: "500",
  },
  chipTextSelected: {
    color: colors.white,
    fontWeight: "700",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s12,
    paddingHorizontal: spacing.s20,
    paddingTop: spacing.s16,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  resetButton: {
    flex: 1,
    paddingVertical: spacing.s12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: spacing.radiusInput,
    borderWidth: 1,
    borderColor: colors.slate300,
    minHeight: spacing.minTouchTarget,
  },
  resetText: {
    color: colors.textSecondary,
  },
  applyButton: {
    flex: 2,
    paddingVertical: spacing.s12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: spacing.radiusInput,
    minHeight: spacing.minTouchTarget,
  },
  applyText: {
    color: colors.white,
  },
});
