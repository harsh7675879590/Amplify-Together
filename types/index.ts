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
  title: string;
  category: CampaignCategory;
  creatorName: string;
  creatorType: CreatorType;
  summary: string;
  coverImageUrl?: string;
  story: StoryBlock[];
  status: CampaignStatus;
  fundingGoal: number;
  amountRaised: number;
  percentFunded: number;
  estimatedReachMid: number;
  estimatedReachRange: string;
  deadline?: string;
  adHeadline?: string;
  adDescription?: string;
  ctaText?: string;
  adImageUrl?: string;
  targetLocations?: string[];
  targetInterests?: string[];
  targetChannels?: string[];
  durationDays?: number;
  sources?: Source[];
  createdAt: string;
  submittedAt?: string;
  approvedAt?: string;
}

export interface Contribution {
  id: string;
  campaignId: string;
  campaignTitle?: string;
  amount: number;
  platformFee: number;
  processingFee: number;
  total: number;
  status: "pending" | "succeeded" | "failed" | "cancelled" | "refunded";
  isPublic: boolean;
  displayName?: string;
  reachEstimateMid: number;
  createdAt: string;
  message?: string;
}

export interface ContributionQuote extends FeeCalculation {
  reachEstimate: ReachEstimate;
}

export interface DraftData {
  title?: string;
  category?: CampaignCategory;
  creatorName?: string;
  creatorType?: CreatorType;
  summary?: string;
  coverImageUrl?: string;
  story?: StoryBlock[];
  sources?: Source[];
  adHeadline?: string;
  adDescription?: string;
  ctaText?: string;
  adImageUrl?: string;
  targetLocations?: string[];
  targetInterests?: string[];
  targetChannels?: string[];
  durationDays?: number;
  fundingGoal?: number;
}

export interface Draft {
  id: string;
  userId?: string;
  currentStep: number;
  data: DraftData;
  updatedAt: string;
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
  type: NotificationType;
  title: string;
  body: string;
  campaignId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface CampaignReport {
  id: string;
  campaignId: string;
  campaignTitle: string;
  fundsRaised: number;
  adSpend: number;
  impressions: number;
  clicks: number;
  estimatedReach: number;
  measuredReach: number;
  ctr: number;
  cpm: number;
  channelBreakdown: Record<string, number>;
  createdAt: string;
}
