import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { useStoredToggle } from '../hooks/useStoredToggle';
import Sidebar from '../components/sidebar/Sidebar';
import TopBar from './TopBar';

// The header is 4rem tall (h-16 in TopBar); pages that fit the screen account for it in their height maths.
function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  // On large screens the sidebar can shrink to an icon strip so the page gets the room.
  const [collapsed, toggleCollapsed] = useStoredToggle('sidebar-collapsed');

  return (
    <div className="min-h-screen bg-[#fbf6f3] text-[#14213d]">
      <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} collapsed={collapsed} />

      <div className={`transition-[padding] duration-200 ${collapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        <TopBar onOpenMenu={() => setMobileOpen(true)} collapsed={collapsed} onToggleSidebar={toggleCollapsed} />

        <main className="p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
