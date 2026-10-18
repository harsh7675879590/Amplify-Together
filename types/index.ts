export type CampaignCategory =
  | "Environment"
  | "Health"
  | "Science"
  | "Education"
  | "Public Policy"
  | "Economic Policy"
  | "Community"
  | "Arts & Culture"
  | "Business"
  | "Other";

export type CreatorType =
  | "nonprofit"
  | "individual"
  | "business"
  | "community_group";

export type CampaignStatus =
  | "draft"
  | "submitted"
  | "changes_requested"
  | "approved"
  | "available_for_funding"
  | "goal_reached"
  | "distribution_prep"
  | "promoting"
  | "completed"
  | "cancelled";

export interface Source {
  id?: string;
  title: string;
  url: string;
}

export type StoryBlockType = "heading" | "paragraph" | "image" | "stat" | "quote";

export interface StoryBlock {
  type: StoryBlockType;
  text?: string;
  url?: string;
  caption?: string;
  credit?: string;
  value?: string;
  label?: string;
}

export interface ReachEstimate {
  low: number;
  mid: number;
  high: number;
  formattedRange: string;
  disclaimer: string;
}

export interface FeeCalculation {
  amount: number;
  platformFee: number;
  platformFeePercent: string;
  processingFee: number;
  processingFeeFormula: string;
  totalCharged: number;
  availableForAds: number;
  disclaimer: string;
}

export interface Campaign {
  id: string;
  creatorId?: string;
  creator_id?: string;
  title: string;
  category: CampaignCategory | string;
  creatorName: string;
  creator_name?: string;
  creatorType?: CreatorType;
  creator_type?: CreatorType;
  summary: string;
  coverImageUrl?: string;
  cover_image_url?: string;
  story: StoryBlock[];
  status: CampaignStatus;
  fundingGoal: number;
  funding_goal?: number;
  amountRaised: number;
  amount_raised?: number;
  percentFunded: number;
  percent_funded?: number;
  estimatedReachMid: number;
  estimated_reach_mid?: number;
  estimatedReachRange: string;
  estimated_reach_range?: string;
  deadline?: string;
  adHeadline?: string;
  ad_headline?: string;
  adDescription?: string;
  ad_description?: string;
  ctaText?: string;
  cta_text?: string;
  adImageUrl?: string;
  ad_image_url?: string;
  targetLocations?: string[];
  targetInterests?: string[];
  targetChannels?: string[];
  durationDays?: number;
  duration_days?: number;
  sources?: Source[];
  createdAt: string;
  created_at?: string;
  submittedAt?: string;
  submitted_at?: string;
  approvedAt?: string;
  approved_at?: string;
}

export interface Contribution {
  id: string;
  campaignId: string;
  campaign_id?: string;
  campaignTitle?: string;
  campaign_title?: string;
  amount: number;
  platformFee: number;
  platform_fee?: number;
  processingFee: number;
  processing_fee?: number;
  total: number;
  status: "pending" | "succeeded" | "failed" | "cancelled" | "refunded";
  isPublic: boolean;
  is_public?: boolean;
  displayName?: string;
  display_name?: string;
  reachEstimateMid: number;
  reach_estimate_mid?: number;
  createdAt: string;
  created_at?: string;
  message?: string;
}

export interface ContributionQuote extends FeeCalculation {
  reachEstimate: ReachEstimate;
  reach_estimate?: {
    low: number;
    mid: number;
    high: number;
    formatted_range: string;
  };
}

export interface DraftData {
  title?: string;
  category?: CampaignCategory | string;
  creatorName?: string;
  creator_name?: string;
  creatorType?: CreatorType;
  creator_type?: CreatorType;
  summary?: string;
  coverImageUrl?: string;
  cover_image_url?: string;
  story?: StoryBlock[];
  sources?: Source[];
  adHeadline?: string;
  ad_headline?: string;
  adDescription?: string;
  ad_description?: string;
  ctaText?: string;
  cta_text?: string;
  adImageUrl?: string;
  ad_image_url?: string;
  targetLocations?: string[];
  targetInterests?: string[];
  targetChannels?: string[];
  durationDays?: number;
  fundingGoal?: number;
  funding_goal?: number;
}

export interface Draft {
  id: string;
  userId?: string;
  user_id?: string;
  currentStep: number;
  current_step?: number;
  data: DraftData;
  updatedAt: string;
  updated_at?: string;
}

export type NotificationType =
  | "submission"
  | "approval"
  | "changes_requested"
  | "milestone"
  | "contribution"
  | "promotion"
  | "report"
  | "completed";

export interface NotificationItem {
  id: string;
  userId?: string;
  user_id?: string;
  type: NotificationType | string;
  title: string;
  body: string;
  campaignId?: string;
  campaign_id?: string;
  isRead: boolean;
  is_read?: boolean;
  createdAt: string;
  created_at?: string;
}

export interface CampaignReport {
  id: string;
  campaignId: string;
  campaign_id?: string;
  campaignTitle: string;
  campaign_title?: string;
  fundsRaised: number;
  funds_raised?: number;
  adSpend: number;
  ad_spend?: number;
  impressions: number;
  clicks: number;
  estimatedReach: number;
  estimated_reach?: number;
  measuredReach: number;
  measured_reach?: number;
  ctr: number;
  cpm: number;
  channelBreakdown: Record<string, number>;
  channel_breakdown?: Record<string, number>;
  createdAt: string;
  created_at?: string;
}

