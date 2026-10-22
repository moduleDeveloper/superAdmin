import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { useStoredToggle } from '../hooks/useStoredToggle';
import Sidebar from '../components/sidebar/Sidebar';
import TopBar from './TopBar';

// The header is 4rem tall (h-16 in TopBar); pages that fit the screen account for it in their height maths.
function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  // On large screens the sidebar can shrink to an icon strip so the page gets the room.
  const [collapsed, toggleCollapsed] = useStoredToggle('sidebar-collapsed');

  return (
    <div className="min-h-screen overflow-x-clip bg-(--c-page) text-(--c-text)">
      <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} collapsed={collapsed} onToggle={toggleCollapsed} />

      <div className={`transition-[padding] duration-200 ${collapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        <TopBar onOpenMenu={() => setMobileOpen(true)} />

        <main className="min-w-0 p-4 sm:p-6 lg:p-10">
          {/* Re-keyed per page so every page fades up when opened */}
          <div key={pathname} className="animate-page">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
