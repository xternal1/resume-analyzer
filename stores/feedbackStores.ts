// src/stores/feedbackStore.ts
import { create } from "zustand";

export type Tip = { type: "good" | "improve"; tip: string; explanation: string };
export type Category = { score: number; tips: Tip[] };

export type Feedback = {
  overallScore: number;
  toneAndStyle: Category;
  content: Category;
  structure: Category;
  skills: Category;
  ATS?: { score: number; tips?: Tip[] }; // optional ATS block
};

// state shape for zustand
type FeedbackState = {
  // core data
  feedback: Feedback | null;

  // object URLs for preview (managed here to centralize revoke)
  imageUrl: string | null;
  resumeUrl: string | null;

  // setters / actions
  setFeedback: (f: Feedback | null) => void;
  setImageUrl: (u: string | null) => void;
  setResumeUrl: (u: string | null) => void;

  // convenience
  clearAll: () => void; // revoke urls and set feedback null
  resetToDefault: () => void;

  // updates
  updateCategoryScore: (category: keyof Omit<Feedback, "overallScore">, score: number) => void;
  updateOverallScore: (score: number) => void;

  // new: load/persist helpers
  loadFromKV: (id: string, kv: any, fs: any) => Promise<void>;
  persistToKV: (id: string, kv: any) => Promise<void>;
};

const defaultFeedback: Feedback = {
  overallScore: 72,
  toneAndStyle: { score: 75, tips: [] },
  content: { score: 68, tips: [] },
  structure: { score: 55, tips: [] },
  skills: { score: 45, tips: [] },
};

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  feedback: null, // start null to indicate "not loaded"
  imageUrl: null,
  resumeUrl: null,

  setFeedback: (f) => set(() => ({ feedback: f })),

  setImageUrl: (u) => {
    const prev = get().imageUrl;
    // revoke previous object URL if different
    if (prev && prev !== u) {
      try {
        URL.revokeObjectURL(prev);
      } catch (e) {
        // ignore
      }
    }
    set(() => ({ imageUrl: u }));
  },

  setResumeUrl: (u) => {
    const prev = get().resumeUrl;
    if (prev && prev !== u) {
      try {
        URL.revokeObjectURL(prev);
      } catch (e) {
        // ignore
      }
    }
    set(() => ({ resumeUrl: u }));
  },

  clearAll: () => {
    const s = get();
    try { if (s.imageUrl) URL.revokeObjectURL(s.imageUrl); } catch {}
    try { if (s.resumeUrl) URL.revokeObjectURL(s.resumeUrl); } catch {}
    set({ feedback: null, imageUrl: null, resumeUrl: null });
  },

  resetToDefault: () => {
    // revoke urls but keep defaults for feedback
    const s = get();
    try { if (s.imageUrl) URL.revokeObjectURL(s.imageUrl); } catch {}
    try { if (s.resumeUrl) URL.revokeObjectURL(s.resumeUrl); } catch {}
    set({ feedback: defaultFeedback, imageUrl: null, resumeUrl: null });
  },

  updateCategoryScore: (category, score) =>
    set((state) => {
      if (!state.feedback) return state;
      return {
        feedback: {
          ...state.feedback,
          [category]: { ...(state.feedback as any)[category], score },
        } as Feedback,
      };
    }),

  updateOverallScore: (score) =>
    set((state) => ({
      feedback: state.feedback ? { ...state.feedback, overallScore: score } : state.feedback,
    })),

  // --- NEW: async helpers (won't break existing usage) ---
  loadFromKV: async (id: string, kv: any, fs: any) => {
    if (!id) return;
    try {
      const resumeStr = await kv.get(`resume:${id}`);
      if (!resumeStr) return;
      const data = JSON.parse(resumeStr);

      // read resume PDF blob (if provided)
      if (data.resumePath && fs) {
        try {
          const resumeBlob = await fs.read(data.resumePath);
          if (resumeBlob) {
            const pdfBlob = new Blob([resumeBlob], { type: "application/pdf" });
            const url = URL.createObjectURL(pdfBlob);
            // use setter which revokes previous automatically
            get().setResumeUrl(url);
          }
        } catch (e) {
          // swallow; continue loading other parts
          console.warn("failed to read resume blob", e);
        }
      }

      // read image blob (if provided)
      if (data.imagePath && fs) {
        try {
          const imageBlob = await fs.read(data.imagePath);
          if (imageBlob) {
            const imgUrl = URL.createObjectURL(imageBlob);
            get().setImageUrl(imgUrl);
          }
        } catch (e) {
          console.warn("failed to read image blob", e);
        }
      }

      // set feedback (if present)
      if (data.feedback) {
        get().setFeedback(data.feedback as Feedback);
      }
    } catch (e) {
      console.error("loadFromKV failed", e);
      return;
    }
  },

  persistToKV: async (id: string, kv: any) => {
    if (!id) throw new Error("persistToKV requires id");
    const s = get();
    const payload = {
      feedback: s.feedback,
      // we don't store object URLs; they are ephemeral,
      // storage should still reference original paths if needed.
    };
    try {
      // FIXED: Changed from kv.put() to kv.set()
      await kv.set(`resume:${id}`, JSON.stringify(payload));
    } catch (e) {
      console.error("persistToKV failed", e);
      throw e;
    }
  },
}));

export default useFeedbackStore;