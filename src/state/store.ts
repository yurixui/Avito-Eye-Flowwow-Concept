import { create } from "zustand";

interface AppState {
  capturedPhoto: string | null;
  setCapturedPhoto: (photo: string | null) => void;
  favouriteIds: Set<string>;
  toggleFavourite: (id: string) => void;
}

// Global state kept intentionally small: only what's shared across screens
// (the photo captured on the Camera screen, favourites toggled on the Home grid).
export const useAppStore = create<AppState>((set) => ({
  capturedPhoto: null,
  setCapturedPhoto: (photo) => set({ capturedPhoto: photo }),
  favouriteIds: new Set(),
  toggleFavourite: (id) =>
    set((s) => {
      const next = new Set(s.favouriteIds);
      next.has(id) ? next.delete(id) : next.add(id);
      return { favouriteIds: next };
    }),
}));
