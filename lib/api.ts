import {
  Campaign,
  Contribution,
  ContributionQuote,
  Draft,
  NotificationItem,
  CampaignReport,
  CampaignStatus,
} from "../types";
import { MOCK_CAMPAIGNS, MOCK_REPORT_SOLAR } from "../mocks/campaigns";
import { calculateFees } from "./fees";
import { estimateReach } from "./reach";
import { API_BASE_URL, USE_REAL_BACKEND } from "./config";

// IN-MEMORY MOCK STATE (Initialized from seeded data)
let mockCampaigns: Campaign[] = [...MOCK_CAMPAIGNS];
let mockContributions: Contribution[] = [
  {
    id: "contrib-mock-1",
    campaignId: "camp-01-water",
    campaignTitle: "Clean drinking water in every public school",
    amount: 100,
    platformFee: 5,
    processingFee: 3.2,
    total: 103.2,
    status: "succeeded",
    isPublic: false,
    displayName: undefined,
    reachEstimateMid: 11400,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    message: "Simulated payment succeeded.",
  },
  {
    id: "contrib-mock-2",
    campaignId: "camp-02-transit",
    campaignTitle: "Redraw the bus network around where people work",
    amount: 50,
    platformFee: 2.5,
    processingFee: 1.75,
    total: 51.75,
    status: "succeeded",
    isPublic: true,
    displayName: "Commuter for Clean Transit",
    reachEstimateMid: 5700,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    message: "Simulated payment succeeded.",
  },
];

let mockNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    type: "milestone",
    title: "90% Funded: School Water Safety",
    body: "Your backed campaign 'Clean drinking water in every public school' reached 90% of its distribution goal!",
    campaignId: "camp-01-water",
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: "notif-2",
    type: "promotion",
    title: "Ad Distribution Live: Watershed Protection",
    body: "Approved message ads for 'Protect the Old Growth Watershed' launched across regional channels.",
    campaignId: "camp-08-forest",
    isRead: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "notif-3",
    type: "report",
    title: "Distribution Report Published: Rooftop Solar",
    body: "371,800 people reached across the state with utility fee facts! View verified transparency metrics.",
    campaignId: "camp-10-solar",
    isRead: false,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

let mockDraft: Draft = {
  id: "draft-user-active",
  currentStep: 1,
  data: {
    title: "",
    category: "Environment",
    creatorName: "",
    summary: "",
    story: [
      { type: "heading", text: "The Challenge We Face" },
      { type: "paragraph", text: "" },
      { type: "heading", text: "Why Amplification Matters" },
      { type: "paragraph", text: "" },
    ],
    sources: [{ title: "", url: "" }],
    adHeadline: "",
    adDescription: "",
    ctaText: "Learn More",
    targetLocations: ["National"],
    targetInterests: ["Public Interest"],
    targetChannels: ["Social Media Feeds", "Independent Digital News"],
    durationDays: 30,
    fundingGoal: 0,
  },
  updatedAt: new Date().toISOString(),
};

// Artificial delay helper for realistic network behavior
const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  async getCampaigns(params: {
    category?: string;
    search?: string;
    sort?: string;
    status?: string;
  } = {}): Promise<Campaign[]> {
    if (USE_REAL_BACKEND) {
      const query = new URLSearchParams();
      if (params.category && params.category !== "All") query.append("category", params.category);
      if (params.search) query.append("search", params.search);
      if (params.sort) query.append("sort", params.sort);
      if (params.status) query.append("status", params.status);
      const res = await fetch(`${API_BASE_URL}/campaigns?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch campaigns from backend");
      return res.json();
    }

    await delay(300);
    let list = [...mockCampaigns];

    if (params.status) {
      list = list.filter((c) => c.status === params.status);
    }

    if (params.category && params.category !== "All") {
      list = list.filter((c) => c.category.toLowerCase() === params.category!.toLowerCase());
    }

    if (params.search && params.search.trim().length > 0) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.summary.toLowerCase().includes(q) ||
          c.creatorName.toLowerCase().includes(q)
      );
    }

    if (params.sort === "funded") {
      list.sort((a, b) => b.amountRaised - a.amountRaised);
    } else if (params.sort === "recent") {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      // Trending default
      list.sort((a, b) => b.percentFunded - a.percentFunded);
    }

    return list;
  },

  async getFeaturedCampaigns(): Promise<Campaign[]> {
    if (USE_REAL_BACKEND) {
      const res = await fetch(`${API_BASE_URL}/campaigns/featured`);
      if (!res.ok) throw new Error("Failed to fetch featured campaigns");
      return res.json();
    }

    await delay(200);
    return mockCampaigns.filter((c) => c.status === "available_for_funding" || c.status === "promoting").slice(0, 4);
  },

  async getCampaign(id: string): Promise<Campaign> {
    if (USE_REAL_BACKEND) {
      const res = await fetch(`${API_BASE_URL}/campaigns/${id}`);
      if (!res.ok) throw new Error("Campaign not found");
      return res.json();
    }

    await delay(200);
    const item = mockCampaigns.find((c) => c.id === id);
    if (!item) {
      throw new Error(`Campaign with ID '${id}' not found`);
    }
    return item;
  },

  async getQuote(campaignId: string, amount: number): Promise<ContributionQuote> {
    const fees = calculateFees(amount);
    const reach = estimateReach(fees.availableForAds);
    return {
      ...fees,
      reachEstimate: reach,
    };
  },

  async contribute(
    campaignId: string,
    data: {
      amount: number;
      guestEmail?: string;
      isPublic?: boolean;
      displayName?: string;
      cardNumber?: string;
      action?: string;
    }
  ): Promise<Contribution> {
    if (USE_REAL_BACKEND) {
      const res = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Contribution failed");
      return res.json();
    }

    await delay(450);
    const campaign = mockCampaigns.find((c) => c.id === campaignId);
    if (!campaign) throw new Error("Campaign not found");

    if (campaign.status !== "available_for_funding") {
      throw new Error(`Campaign is in '${campaign.status}' state and not accepting contributions.`);
    }

    const fees = calculateFees(data.amount);
    const reach = estimateReach(fees.availableForAds);

    let status: Contribution["status"] = "succeeded";
    let message = "Simulated payment succeeded. Funds allocated to campaign ad distribution.";

    const card = (data.cardNumber || "4242").replace(/\s/g, "");
    if (data.action === "cancel") {
      status = "cancelled";
      message = "Contribution checkout was cancelled by the user.";
    } else if (card.endsWith("0002")) {
      status = "failed";
      message = "Payment simulation failed: Card declined by issuing bank.";
    } else if (card.endsWith("0001")) {
      status = "pending";
      message = "Payment authorization is pending bank settlement.";
    }

    const newContrib: Contribution = {
      id: `contrib-${Date.now()}`,
      campaignId,
      campaignTitle: campaign.title,
      amount: fees.amount,
      platformFee: fees.platformFee,
      processingFee: fees.processingFee,
      total: fees.totalCharged,
      status,
      isPublic: Boolean(data.isPublic),
      displayName: data.isPublic ? data.displayName || "Public Backer" : undefined,
      reachEstimateMid: reach.mid,
      createdAt: new Date().toISOString(),
      message,
    };

    mockContributions.unshift(newContrib);

    if (status === "succeeded") {
      campaign.amountRaised += fees.amount;
      campaign.percentFunded = Math.round((campaign.amountRaised / campaign.fundingGoal) * 100);

      // Transition to goal_reached if goal reached
      if (campaign.amountRaised >= campaign.fundingGoal && campaign.status === "available_for_funding") {
        campaign.status = "goal_reached";
      }
    }

    return newContrib;
  },

  async getMyContributions(): Promise<Contribution[]> {
    await delay(200);
    return [...mockContributions];
  },

  async getDraft(): Promise<Draft> {
    await delay(150);
    return { ...mockDraft };
  },

  async saveDraft(updatedData: Partial<Draft>): Promise<Draft> {
    await delay(150);
    mockDraft = {
      ...mockDraft,
      ...updatedData,
      updatedAt: new Date().toISOString(),
    };
    return { ...mockDraft };
  },

  async submitDraft(draftId: string): Promise<{
    status: string;
    campaignId: string;
    message: string;
    timeline: { step: string; status: "completed" | "active" | "pending"; desc: string }[];
  }> {
    await delay(400);
    const d = mockDraft.data;
    if (!d.title || d.title.trim().length === 0) {
      throw new Error("Campaign title is required.");
    }
    if (!d.fundingGoal || d.fundingGoal <= 0) {
      throw new Error("A funding goal greater than $0 must be manually set in Step 5.");
    }

    const newCamp: Campaign = {
      id: `camp-${Date.now()}`,
      title: d.title,
      category: d.category || "Environment",
      creatorName: d.creatorName || "Anonymous Creator",
      creatorType: d.creatorType || "individual",
      summary: d.summary || "",
      coverImageUrl: d.coverImageUrl || "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800",
      story: d.story || [],
      status: "submitted",
      fundingGoal: d.fundingGoal,
      amountRaised: 0,
      percentFunded: 0,
      estimatedReachMid: estimateReach(d.fundingGoal * 0.95).mid,
      estimatedReachRange: estimateReach(d.fundingGoal * 0.95).formattedRange,
      adHeadline: d.adHeadline || d.title,
      adDescription: d.adDescription || d.summary,
      ctaText: d.ctaText || "Learn More",
      adImageUrl: d.adImageUrl || d.coverImageUrl,
      targetLocations: d.targetLocations || ["National"],
      targetInterests: d.targetInterests || [],
      targetChannels: d.targetChannels || ["Social Media Feeds"],
      durationDays: d.durationDays || 30,
      sources: d.sources || [],
      createdAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
    };

    mockCampaigns.unshift(newCamp);

    // Reset draft
    mockDraft.currentStep = 1;
    mockDraft.data = {
      title: "",
      category: "Environment",
      fundingGoal: 0,
    };

    return {
      status: "success",
      campaignId: newCamp.id,
      message: "Campaign submitted for review. Fact-checkers and reviewers verify sources before opening funding.",
      timeline: [
        { step: "Submitted", status: "completed", desc: "Draft verified and received." },
        { step: "Content & Source Review", status: "active", desc: "Verifying supporting sources and claims." },
        { step: "Ad Creative Approval", status: "pending", desc: "Ad copy and targeting validated." },
        { step: "Public Backing Open", status: "pending", desc: "Community pools funds toward ad distribution." },
        { step: "Promotion Launch", status: "pending", desc: "Message amplified to new audiences." },
      ],
    };
  },

  async getActivity(): Promise<NotificationItem[]> {
    await delay(200);
    return [...mockNotifications];
  },

  async markActivityRead(id: string): Promise<void> {
    await delay(100);
    const n = mockNotifications.find((x) => x.id === id);
    if (n) n.isRead = true;
  },

  async getReport(campaignId: string): Promise<CampaignReport> {
    await delay(200);
    if (campaignId === "camp-10-solar") {
      return MOCK_REPORT_SOLAR;
    }

    const campaign = mockCampaigns.find((c) => c.id === campaignId);
    const fundsRaised = campaign ? campaign.amountRaised : 2500;
    const adSpend = Math.round(fundsRaised * 0.95);
    const impressions = adSpend * 240;
    const clicks = Math.round(impressions * 0.024);
    const estimatedReach = adSpend * 120;
    const measuredReach = Math.round(estimatedReach * 1.08);

    return {
      id: `rep-${campaignId}`,
      campaignId,
      campaignTitle: campaign?.title || "Campaign Message",
      fundsRaised,
      adSpend,
      impressions,
      clicks,
      estimatedReach,
      measuredReach,
      ctr: 2.4,
      cpm: 4.16,
      channelBreakdown: {
        "Social Feeds (Meta/Instagram/X)": 60,
        "Independent News Placements": 25,
        "Targeted Search Keyword Placements": 15,
      },
      createdAt: new Date().toISOString(),
    };
  },
};
