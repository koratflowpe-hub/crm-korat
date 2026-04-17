import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  theme: 'light', 
  isSidebarHidden: false,
  setSidebarHidden: (hidden) => set({ isSidebarHidden: hidden }),
  setTheme: () => set({ theme: 'light' }),
  toggleTheme: () => set({ theme: 'light' })
}));
