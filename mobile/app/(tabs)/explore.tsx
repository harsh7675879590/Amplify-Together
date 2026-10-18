import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Campaign } from "../../types";
import { api } from "../../lib/api";
import { CATEGORIES } from "../../lib/config";
import { CampaignCard } from "../../components/CampaignCard";
import { SkeletonCard } from "../../components/SkeletonCard";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { FilterBottomSheet } from "../../components/FilterBottomSheet";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing } from "../../theme/spacing";

const ALL_CATEGORIES = ["All", ...CATEGORIES];

const SORT_OPTIONS: { key: "funded" | "ending_soon" | "newest" | "closest_to_goal"; label: string }[] = [
  { key: "funded", label: "Most funded" },
  { key: "ending_soon", label: "Ending soon" },
  { key: "newest", label: "Newest" },
  { key: "closest_to_goal", label: "Closest to goal" },
];

export default function ExploreScreen() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSort, setSelectedSort] = useState<"funded" | "ending_soon" | "newest" | "closest_to_goal">("funded");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [minProgress, setMinProgress] = useState(0);

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Compute active filters count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== "All") count++;
    if (selectedStatus !== "all") count++;
    if (minProgress > 0) count++;
    return count;
  }, [selectedCategory, selectedStatus, minProgress]);

  // Fetch campaigns from API adapter
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await api.getCampaigns({
        category: selectedCategory === "All" ? undefined : selectedCategory,
        search: debouncedSearch.length > 0 ? debouncedSearch : undefined,
        sort: selectedSort,
        status: selectedStatus === "all" ? undefined : selectedStatus,
        minProgress: minProgress > 0 ? minProgress : undefined,
      });
      setCampaigns(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load campaigns";
      console.warn("Failed to fetch campaigns", err);
      setErrorMessage(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [debouncedSearch, selectedCategory, selectedSort, selectedStatus, minProgress]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCampaigns();
  };

  const handleResetAll = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setSelectedCategory("All");
    setSelectedSort("funded");
    setSelectedStatus("all");
    setMinProgress(0);
  };

  const handleResetFiltersOnly = () => {
    setSelectedCategory("All");
    setSelectedStatus("all");
    setMinProgress(0);
    setIsFilterSheetOpen(false);
  };

  const isFiltering =
    debouncedSearch.length > 0 ||
    selectedCategory !== "All" ||
    selectedStatus !== "all" ||
    minProgress > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header & Search Bar */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View>
              <Text style={[styles.title, typography.h1]}>Explore Campaigns</Text>
              <Text style={[styles.subtitle, typography.uiCaption]}>
                Evidence-backed messages seeking community amplification
              </Text>
            </View>
          </View>

          {/* Search Box & Filter Button */}
          <View style={styles.searchRow}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, typography.uiBody]}
                placeholder="Search issues, topics, or creators..."
                placeholderTextColor={colors.textMuted}
                value={searchInput}
                onChangeText={setSearchInput}
                returnKeyType="search"
                autoCapitalize="none"
              />
              {searchInput.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchInput("")}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Toggle Button */}
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilterCount > 0 && styles.filterButtonActive,
              ]}
              onPress={() => setIsFilterSheetOpen(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="options-outline"
                size={20}
                color={activeFilterCount > 0 ? colors.white : colors.textPrimary}
              />
              {activeFilterCount > 0 && (
                <View style={styles.activeBadge}>
                  <Text style={[styles.activeBadgeText, typography.uiMicro]}>
                    {activeFilterCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Horizontally Scrollable Category Chips */}
        <View style={styles.categoriesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {ALL_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      typography.uiCaption,
                      isActive && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Sort Controls Row */}
        <View style={styles.sortSection}>
          <View style={styles.countRow}>
            <Text style={[styles.countText, typography.uiCaption]}>
              {loading
                ? "Searching..."
                : `${campaigns.length} ${campaigns.length === 1 ? "campaign" : "campaigns"} found`}
            </Text>
            {isFiltering && (
              <TouchableOpacity onPress={handleResetAll} activeOpacity={0.7}>
                <Text style={[styles.clearLink, typography.uiMicro]}>Reset All</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Sort Buttons */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortScroll}
          >
            {SORT_OPTIONS.map((opt) => {
              const isActive = selectedSort === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.sortBtn, isActive && styles.sortBtnActive]}
                  onPress={() => setSelectedSort(opt.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.sortBtnText,
                      typography.uiMicro,
                      isActive && styles.sortBtnTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Results List */}
        <ScrollView
          style={styles.resultsScroll}
          contentContainerStyle={styles.resultsContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : errorMessage ? (
            <ErrorState
              title="Unable to load campaigns"
              message={errorMessage}
              onRetry={fetchCampaigns}
              retryLabel="Try Again"
            />
          ) : campaigns.length === 0 ? (
            isFiltering ? (
              <EmptyState
                icon="search-outline"
                title="No campaigns match your criteria"
                message={`No campaigns found matching your search "${debouncedSearch || selectedCategory}". Try adjusting your filters or search terms.`}
                actionLabel="Reset All Filters"
                onAction={handleResetAll}
              />
            ) : (
              <EmptyState
                icon="megaphone-outline"
                title="No campaigns found"
                message="There are currently no active campaigns available."
                actionLabel="Refresh List"
                onAction={fetchCampaigns}
              />
            )
          ) : (
            campaigns.map((camp) => (
              <CampaignCard key={camp.id} campaign={camp} />
            ))
          )}
        </ScrollView>

        {/* Filter Bottom Sheet */}
        <FilterBottomSheet
          visible={isFilterSheetOpen}
          onClose={() => setIsFilterSheetOpen(false)}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedStatus={selectedStatus}
          onSelectStatus={setSelectedStatus}
          minProgress={minProgress}
          onSelectMinProgress={setMinProgress}
          onReset={handleResetFiltersOnly}
          onApply={() => setIsFilterSheetOpen(false)}
          activeFilterCount={activeFilterCount}
        />
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
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.s20,
    paddingTop: spacing.s16,
    paddingBottom: spacing.s12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  titleRow: {
    marginBottom: spacing.s12,
  },
  title: {
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s8,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceNeutral,
    borderRadius: spacing.radiusInput,
    paddingHorizontal: spacing.s12,
    height: 44,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.s8,
    color: colors.textPrimary,
    fontSize: 15,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: spacing.radiusInput,
    backgroundColor: colors.surfaceNeutral,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  activeBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: colors.amberDark,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  activeBadgeText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 10,
  },
  categoriesSection: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    paddingVertical: spacing.s8,
  },
  categoryScroll: {
    paddingHorizontal: spacing.s20,
    gap: spacing.s8,
  },
  categoryChip: {
    paddingHorizontal: spacing.s12,
    paddingVertical: 6,
    borderRadius: spacing.radiusFull,
    backgroundColor: colors.surfaceNeutral,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    minHeight: 34,
    justifyContent: "center",
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  categoryChipTextActive: {
    color: colors.white,
    fontWeight: "700",
  },
  sortSection: {
    paddingHorizontal: spacing.s20,
    paddingTop: spacing.s12,
    paddingBottom: spacing.s8,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.s8,
  },
  countText: {
    color: colors.textMuted,
    fontWeight: "500",
  },
  clearLink: {
    color: colors.primary,
    fontWeight: "700",
  },
  sortScroll: {
    gap: spacing.s8,
  },
  sortBtn: {
    paddingHorizontal: spacing.s12,
    paddingVertical: 6,
    borderRadius: spacing.radiusSm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 32,
  },
  sortBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sortBtnText: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  sortBtnTextActive: {
    color: colors.white,
    fontWeight: "700",
  },
  resultsScroll: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: spacing.s20,
    paddingTop: spacing.s8,
    paddingBottom: spacing.s48,
  },
});
