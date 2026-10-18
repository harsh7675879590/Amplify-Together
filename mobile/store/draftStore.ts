import { create } from "zustand";
import { api } from "../lib/api";

import { StoryBlock, Source as SourceItem } from "../types";


export interface DraftState {
  draftId: string | null;
  currentStep: number;
  isSaving: boolean;
  lastSavedAt: string | null;
  lastSavedIndicator: string;
  isVoiceGenerated: boolean;

  // Step 1: Basics
  title: string;
  category: string;
  creatorName: string;
  summary: string;
  coverImageUrl: string;

  // Step 2: Story & Sources
  story: StoryBlock[];
  sources: SourceItem[];
  audienceActions: string[];

  // Step 3: Visuals & Ad Creative
  adHeadline: string;
  adDescription: string;
  ctaText: string;
  adImageUrl: string;

  // Step 4: Reach & Distribution
  locations: string[];
  interests: string[];
  channels: string[];
  durationDays: number;

  // Step 5: Submit (funding goal explicitly entered manually by creator)
  fundingGoal: string;
  agreedToTerms: boolean;

  // Actions
  setDraftId: (id: string) => void;
  setCurrentStep: (step: number) => void;
  setIsVoiceGenerated: (val: boolean) => void;
  updateBasics: (fields: Partial<Pick<DraftState, "title" | "category" | "creatorName" | "summary" | "coverImageUrl">>) => void;
  updateStory: (story: StoryBlock[]) => void;
  updateSources: (sources: SourceItem[]) => void;
  updateAudienceActions: (actions: string[]) => void;
  updateVisuals: (fields: Partial<Pick<DraftState, "adHeadline" | "adDescription" | "ctaText" | "adImageUrl">>) => void;
  updateReach: (fields: Partial<Pick<DraftState, "locations" | "interests" | "channels" | "durationDays">>) => void;
  setFundingGoal: (goal: string) => void;
  setAgreedToTerms: (agreed: boolean) => void;
  populateFromAI: (data: any) => void;
  saveToServer: () => Promise<void>;
  debounceSave: () => void;
  loadFromServer: () => Promise<void>;
  resetDraft: () => void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export const useDraftStore = create<DraftState>((set, get) => ({
  draftId: null,
  currentStep: 1,
  isSaving: false,
  lastSavedAt: null,
  lastSavedIndicator: "Saved just now",
  isVoiceGenerated: false,

  title: "",
  category: "Environment",
  creatorName: "",
  summary: "",
  coverImageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80",

  story: [
    { type: "heading", text: "The Challenge We Face" },
    { type: "paragraph", text: "" },
    { type: "heading", text: "Why Amplification Matters" },
    { type: "paragraph", text: "" },
  ],
  sources: [{ title: "", url: "" }],
  audienceActions: [
    "Sign the regional petition",
    "Attend the upcoming public hearing",
    "Contact your municipal representative",
  ],

  adHeadline: "",
  adDescription: "",
  ctaText: "Learn More",
  adImageUrl: "",

  locations: ["National (US)"],
  interests: ["Public Policy", "Community Action"],
  channels: ["Social Media Feeds", "Independent Digital News"],
  durationDays: 30,

  fundingGoal: "", // Must be entered by creator in Step 5 (starts empty)
  agreedToTerms: false,

  setDraftId: (id) => set({ draftId: id }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setIsVoiceGenerated: (val) => set({ isVoiceGenerated: val }),

  debounceSave: () => {
    set({ isSaving: true, lastSavedIndicator: "Saving..." });
    if (saveTimer) {
      clearTimeout(saveTimer);
    }
    saveTimer = setTimeout(() => {
      get().saveToServer();
    }, 800);
  },

  updateBasics: (fields) => {
    set((state) => ({ ...state, ...fields }));
    get().debounceSave();
  },

  updateStory: (story) => {
    set({ story });
    get().debounceSave();
  },

  updateSources: (sources) => {
    set({ sources });
    get().debounceSave();
  },

  updateAudienceActions: (audienceActions) => {
    set({ audienceActions });
    get().debounceSave();
  },

  updateVisuals: (fields) => {
    set((state) => ({ ...state, ...fields }));
    get().debounceSave();
  },

  updateReach: (fields) => {
    set((state) => ({ ...state, ...fields }));
    get().debounceSave();
  },

  setFundingGoal: (fundingGoal) => {
    set({ fundingGoal });
    get().debounceSave();
  },

  setAgreedToTerms: (agreedToTerms) => set({ agreedToTerms }),

  populateFromAI: (aiData) => {
    set((state) => ({
      title: aiData.title || state.title,
      category: aiData.category || state.category,
      summary: aiData.summary || state.summary,
      story: aiData.story || state.story,
      adHeadline: aiData.ad_headline || state.adHeadline,
      adDescription: aiData.ad_description || state.adDescription,
      ctaText: aiData.cta_text || state.ctaText,
      isVoiceGenerated: true,
      // FUNDING GOAL IS STRICTLY NEVER POPULATED BY AI
      currentStep: 1,
    }));
    get().debounceSave();
  },

  saveToServer: async () => {
    const s = get();
    if (!s.draftId) return;
    try {
      set({ isSaving: true, lastSavedIndicator: "Saving..." });
      const payload = {
        title: s.title,
        category: s.category,
        creator_name: s.creatorName,
        summary: s.summary,
        cover_image_url: s.coverImageUrl,
        story: s.story,
        sources: s.sources.filter((x) => x.title && x.url),
        audience_actions: s.audienceActions,
        ad_headline: s.adHeadline,
        ad_description: s.adDescription,
        cta_text: s.ctaText,
        ad_image_url: s.adImageUrl,
        reach_settings: {
          locations: s.locations,
          interests: s.interests,
          channels: s.channels,
          duration_days: s.durationDays,
        },
        funding_goal: parseFloat(s.fundingGoal) || 0,
      };
      await api.saveDraft(s.draftId, s.currentStep, payload);
      set({
        isSaving: false,
        lastSavedIndicator: "Saved just now",
        lastSavedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    } catch {
      set({ isSaving: false, lastSavedIndicator: "Saved offline" });
    }
  },

  loadFromServer: async () => {
    try {
      const draft = await api.getDraft();
      if (draft && draft.id) {
        const d = draft.data || {};
        set({
          draftId: draft.id,
          currentStep: draft.current_step || draft.currentStep || 1,
          title: d.title || "",
          category: d.category || "Environment",
          creatorName: d.creator_name || d.creatorName || "",
          summary: d.summary || "",
          coverImageUrl: d.cover_image_url || d.coverImageUrl || "",
          story: d.story && d.story.length > 0 ? (d.story as StoryBlock[]) : get().story,
          sources: d.sources && d.sources.length > 0 ? d.sources : [{ title: "", url: "" }],
          audienceActions: d.audience_actions || get().audienceActions,
          adHeadline: d.ad_headline || d.adHeadline || "",
          adDescription: d.ad_description || d.adDescription || "",
          ctaText: d.cta_text || d.ctaText || "Learn More",
          adImageUrl: d.ad_image_url || d.adImageUrl || "",
          fundingGoal: d.funding_goal ? String(d.funding_goal) : d.fundingGoal ? String(d.fundingGoal) : "",
          lastSavedIndicator: "Saved just now",
          lastSavedAt: "Loaded from cloud",
        });
      }
    } catch (e) {
      console.warn("Failed to load draft from server", e);
    }
  },

  resetDraft: () => {
    set({
      currentStep: 1,
      title: "",
      category: "Environment",
      creatorName: "",
      summary: "",
      isVoiceGenerated: false,
      lastSavedIndicator: "Saved just now",
      story: [
        { type: "heading", text: "The Challenge We Face" },
        { type: "paragraph", text: "" },
        { type: "heading", text: "Why Amplification Matters" },
        { type: "paragraph", text: "" },
      ],
      sources: [{ title: "", url: "" }],
      audienceActions: [
        "Sign the regional petition",
        "Attend the upcoming public hearing",
        "Contact your municipal representative",
      ],
      adHeadline: "",
      adDescription: "",
      fundingGoal: "",
      agreedToTerms: false,
    });
  },
}));
