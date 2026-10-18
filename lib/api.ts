import { Platform } from "react-native";
import { Campaign, ContributionQuote, Contribution, NotificationItem, CampaignReport } from "./types";

// Determine default host based on runtime platform
const getDefaultBaseUrl = () => {
  if (Platform.OS === "android") {
    // 10.0.2.2 is the special Android emulator alias for host loopback
    return "http://10.0.2.2:8000/api";
  }
  // iOS simulator or web
  return "http://127.0.0.1:8000/api";
};

export const API_BASE_URL = getDefaultBaseUrl();

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Request failed with status ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    console.warn(`[API] Error on ${endpoint}:`, err.message);
    throw err;
  }
}

export const api = {
  // Campaigns
  getCampaigns: (params: { category?: string; search?: string; sort?: string; status?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.category && params.category !== "All") query.append("category", params.category);
    if (params.search) query.append("search", params.search);
    if (params.sort) query.append("sort", params.sort);
    if (params.status) query.append("status", params.status);
    const qs = query.toString();
    return request<Campaign[]>(`/campaigns${qs ? `?${qs}` : ""}`);
  },

  getFeaturedCampaigns: () => request<Campaign[]>("/campaigns/featured"),

  getCampaignDetail: (id: string) => request<Campaign>(`/campaigns/${id}`),

  submitFeedback: (id: string, data: { encouraged_to_continue?: string; changed_mind?: string }) =>
    request<{ status: string; message: string }>(`/campaigns/${id}/feedback`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Contributions & Quotes
  getQuote: (campaignId: string, amount: number) =>
    request<ContributionQuote>(`/campaigns/${campaignId}/quote`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),

  contribute: (campaignId: string, payload: {
    amount: number;
    guest_email?: string;
    is_public?: boolean;
    display_name?: string;
    card_number?: string;
    action?: string;
  }) =>
    request<Contribution>(`/campaigns/${campaignId}/contribute`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getReceipt: (contributionId: string) =>
    request<Contribution>(`/contributions/${contributionId}`),

  getMyContributions: () =>
    request<Contribution[]>("/me/contributions"),

  // Drafts
  getDraft: () => request<any>("/drafts"),

  saveDraft: (draftId: string, currentStep: number, data: any) =>
    request<any>(`/drafts/${draftId}`, {
      method: "PUT",
      body: JSON.stringify({ current_step: currentStep, data }),
    }),

  submitDraft: (draftId: string) =>
    request<any>(`/drafts/${draftId}/submit`, {
      method: "POST",
    }),

  generateAIDraft: (prompt: string) =>
    request<any>("/drafts/ai-assist", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),

  // Activity & Notifications
  getActivity: () => request<NotificationItem[]>("/activity"),

  markActivityRead: (id: string) =>
    request<any>(`/activity/${id}/read`, { method: "POST" }),

  // Reports
  getReport: (campaignId: string) =>
    request<CampaignReport>(`/reports/campaigns/${campaignId}`),

  // Admin / Reviewer
  getReviewQueue: () => request<Campaign[]>("/admin/review-queue"),

  approveCampaign: (id: string, note?: string) =>
    request<any>(`/admin/campaigns/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(note ? { note } : {}),
    }),

  requestChanges: (id: string, note: string) =>
    request<any>(`/admin/campaigns/${id}/request-changes`, {
      method: "POST",
      body: JSON.stringify({ note }),
    }),

  startPromotion: (id: string) =>
    request<any>(`/admin/campaigns/${id}/start-promotion`, {
      method: "POST",
    }),

  advanceDemoStage: (id: string) =>
    request<any>(`/admin/demo/advance/${id}`, {
      method: "POST",
    }),
};
