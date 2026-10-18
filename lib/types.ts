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

export interface StoryBlock {
  type: "heading" | "paragraph" | "image" | "stat" | "quote";
  text?: string;
  url?: string;
  caption?: string;
  credit?: string;
  value?: string;
  label?: string;
}

export interface ReachSettings {
  locations?: string[];
  interests?: string[];
  channels?: string[];
  duration_days?: number;
}

export interface Campaign {
  id: string;
  creator_id?: string;
  title: string;
  category: string;
  creator_name: string;
  summary: string;
  cover_image_url?: string;
  story: StoryBlock[];
  status: CampaignStatus;
  funding_goal: number;
  amount_raised: number;
  percent_funded: number;
  estimated_reach_mid: number;
  estimated_reach_range: string;
  deadline?: string;
  ad_headline?: string;
  ad_description?: string;
  cta_text?: string;
  ad_image_url?: string;
  reach_settings?: ReachSettings;
  created_at?: string;
  submitted_at?: string;
  approved_at?: string;
  sources?: Source[];
}

export interface ContributionQuote {
  amount: number;
  platform_fee: number;
  platform_fee_percent: string;
  processing_fee: number;
  processing_fee_formula: string;
  total_charged: number;
  available_for_ads: number;
  reach_estimate: {
    low: number;
    mid: number;
    high: number;
    formatted_range: string;
  };
  disclaimer: string;
}

export interface Contribution {
  id: string;
  campaign_id: string;
  campaign_title?: string;
  amount: number;
  platform_fee: number;
  processing_fee: number;
  total: number;
  status: "pending" | "succeeded" | "failed" | "cancelled" | "refunded";
  is_public: boolean;
  display_name?: string;
  reach_estimate_mid: number;
  created_at: string;
  message?: string;
}

export interface NotificationItem {
  id: string;
  user_id?: string;
  type: string;
  title: string;
  body: string;
  campaign_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface CampaignReport {
  id: string;
  campaign_id: string;
  campaign_title: string;
  funds_raised: number;
  ad_spend: number;
  impressions: number;
  clicks: number;
  estimated_reach: number;
  measured_reach: number;
  ctr: number;
  cpm: number;
  channel_breakdown: Record<string, number>;
  created_at: string;
}
