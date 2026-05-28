import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LayoutState {
  isSidebarExpanded: boolean;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      isSidebarExpanded: true, // Start expanded by default as requested
      toggleSidebar: () => set((state) => ({ isSidebarExpanded: !state.isSidebarExpanded })),
      setSidebarExpanded: (expanded) => set({ isSidebarExpanded: expanded }),
    }),
    {
      name: 'vyora-layout-storage', // name of the item in the storage (must be unique)
    },
  ),
);
