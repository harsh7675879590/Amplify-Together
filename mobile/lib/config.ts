import { CampaignCategory, CreatorType } from "../types";

export const PLATFORM_FEE_PCT = 0.05;
export const PROCESSING_FEE_PCT = 0.029;
export const PROCESSING_FEE_FIXED = 0.30;

export const REACH_PER_DOLLAR = 120;
export const REACH_LOW = 0.7;
export const REACH_HIGH = 1.3;

export const CATEGORIES: CampaignCategory[] = [
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

export const CREATOR_TYPES: { type: CreatorType; label: string }[] = [
  { type: "nonprofit", label: "Nonprofit Organization" },
  { type: "individual", label: "Individual Creator" },
  { type: "community_group", label: "Community Group" },
  { type: "business", label: "Independent Business" },
];

export const DEFAULT_CHANNELS = [
  "Social Media Feeds (Meta/Instagram/X)",
  "Independent News Outlets & Journalism",
  "Targeted Search Query Placements",
  "Regional Digital Billboards",
];

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "";
export const USE_REAL_BACKEND = Boolean(API_BASE_URL && API_BASE_URL.length > 0);
