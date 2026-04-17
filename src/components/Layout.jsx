import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { useThemeStore } from '../store/themeStore';

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { isSidebarHidden } = useThemeStore();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex bg-background font-sans selection:bg-primary/30 overflow-hidden min-h-screen">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} isMobile={isMobile} />
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-500 ease-in-out ${
          isSidebarHidden 
            ? 'ml-0' 
            : (isMobile ? 'ml-0' : (collapsed ? 'ml-20' : 'ml-64'))
        } relative z-10`}
      >
         {children}
      </div>
    </div>
  );
}
