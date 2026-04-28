import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  theme: 'light', 
  isSidebarHidden: false,
  isSidebarCollapsed: false,
  setSidebarHidden: (hidden) => set({ isSidebarHidden: hidden }),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  setTheme: () => set({ theme: 'light' }),
  toggleTheme: () => set({ theme: 'light' })
}));
