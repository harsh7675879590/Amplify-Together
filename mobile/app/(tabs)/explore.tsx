import React, { useEffect, useState } from "react";
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
import { Campaign } from "../../lib/types";
import { api } from "../../lib/api";
import { CampaignCard } from "../../components/CampaignCard";
import { SkeletonCard } from "../../components/SkeletonCard";
import { EmptyState } from "../../components/EmptyState";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing } from "../../theme/spacing";

const CATEGORIES = [
  "All",
  "Environment",
  "Health",
  "Public Policy",
  "Economic Policy",
  "Education",
  "Community",
  "Science",
];

const SORT_OPTIONS = [
  { key: "trending", label: "Trending" },
  { key: "funded", label: "Most Funded" },
  { key: "recent", label: "Newest" },
];

export default function ExploreScreen() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSort, setSelectedSort] = useState("trending");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await api.getCampaigns({
        category: selectedCategory === "All" ? undefined : selectedCategory,
        search: search.trim() || undefined,
        sort: selectedSort,
      });
      setCampaigns(data);
    } catch (err) {
      console.warn("Failed to fetch campaigns", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCampaigns();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, selectedSort]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCampaigns();
  };

  const handleClear = () => {
    setSearch("");
    setSelectedCategory("All");
    setSelectedSort("trending");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header & Search */}
        <View style={styles.header}>
          <Text style={[styles.title, typography.h1]}>Explore Campaigns</Text>
          <Text style={[styles.subtitle, typography.caption]}>
            Find messages backed by real evidence and research
          </Text>

          {/* Search Box */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={colors.slate400} />
            <TextInput
              style={[styles.searchInput, typography.body]}
              placeholder="Search campaigns, issues, or creators..."
              placeholderTextColor={colors.slate400}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={18} color={colors.slate400} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Filter Chips */}
        <View style={styles.categoriesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map((cat) => {
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
                      typography.caption,
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

        {/* Sort & Count Row */}
        <View style={styles.sortRow}>
          <Text style={[styles.countText, typography.caption]}>
            {loading ? "Searching..." : `${campaigns.length} campaigns found`}
          </Text>

          <View style={styles.sortPills}>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.sortBtn, selectedSort === opt.key && styles.sortBtnActive]}
                onPress={() => setSelectedSort(opt.key)}
              >
                <Text
                  style={[
                    styles.sortBtnText,
                    typography.micro,
                    selectedSort === opt.key && styles.sortBtnTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
            </>
          ) : campaigns.length === 0 ? (
            <EmptyState
              icon="search-outline"
              title="No campaigns match your search"
              message={`We couldn't find any campaigns matching "${search || selectedCategory}". Try another search term or reset filters.`}
              actionLabel="Reset All Filters"
              onAction={handleClear}
            />
          ) : (
            campaigns.map((camp) => <CampaignCard key={camp.id} campaign={camp} />)
          )}
        </ScrollView>
      </View>
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
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    color: colors.slate900,
  },
  subtitle: {
    color: colors.slate500,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.slate100,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    color: colors.slate900,
  },
  categoriesSection: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
    paddingVertical: spacing.sm,
  },
  categoryScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: spacing.radiusFull,
    backgroundColor: colors.slate100,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    color: colors.slate700,
    fontWeight: "600",
  },
  categoryChipTextActive: {
    color: colors.white,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.slate50,
  },
  countText: {
    color: colors.slate500,
  },
  sortPills: {
    flexDirection: "row",
    gap: 4,
  },
  sortBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: spacing.radiusSm,
  },
  sortBtnActive: {
    backgroundColor: colors.slate200,
  },
  sortBtnText: {
    color: colors.slate500,
  },
  sortBtnTextActive: {
    color: colors.slate900,
    fontWeight: "700",
  },
  resultsScroll: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
  },
});
