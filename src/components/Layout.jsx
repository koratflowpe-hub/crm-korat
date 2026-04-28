import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { useThemeStore } from '../store/themeStore';

export default function Layout({ children }) {
  const { isSidebarHidden, isSidebarCollapsed, setSidebarCollapsed } = useThemeStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      className="flex bg-background font-sans selection:bg-primary/30 h-dvh overflow-hidden"
      style={{ overscrollBehaviorX: 'none' }}
    >
      <Sidebar collapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} isMobile={isMobile} />
      <div 
        className={`flex-1 flex flex-col h-dvh overflow-y-auto overflow-x-hidden transition-all duration-500 ease-in-out ${
          isSidebarHidden 
            ? 'ml-0' 
            : (isMobile ? 'ml-0' : (isSidebarCollapsed ? 'ml-20' : 'ml-64'))
        } relative`}
        style={{ touchAction: 'pan-y', overscrollBehaviorX: 'none' }}
      >
         {children}
      </div>
    </div>
  );
}
