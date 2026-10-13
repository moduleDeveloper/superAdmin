import { Link, useLocation, useNavigate } from 'react-router-dom';

import { logout } from '../../features/auth/services/authService';
import Logo from '../Logo';
import { DashboardIcon, InsightsIcon, LogoutIcon, MarketingIcon, MembersIcon } from './icons';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon, end: true },
  { to: '/organization-insights', also: ['/trust-insights'], label: 'Organization Insights', icon: InsightsIcon },
  { to: '/member-insights', label: 'Member Insights', icon: MembersIcon },
  { to: '/marketing', label: 'Marketing', icon: MarketingIcon },
];

/**
 * Which menu item a page belongs to. A page can say so itself (a link passes state={{ section: '/organization-insights' }}),
 * e.g. a member's page opened from Organization Insights stays under Organization Insights; otherwise the address decides.
 */
const isActiveItem = ({ to, end, also = [] }, pathname, section) => {
  if (section) return section === to;
  if (end) return pathname === to;
  return [to, ...also].some((base) => pathname === base || pathname.startsWith(`${base}/`));
};

const linkClass = (collapsed, isActive) =>
  `flex items-center gap-3 rounded-full px-5 py-3 text-[0.95rem] font-medium transition ${collapsed ? 'lg:justify-center lg:px-0' : ''} ${
    isActive
      ? 'bg-gradient-to-r from-[#ee7b3e] via-[#b04a4f] to-[#5b2650] text-white shadow-[0_8px_18px_rgba(120,40,70,0.3)]'
      : 'text-[#3a3f55] hover:bg-[#fde6d6]'
  }`;

/** `collapsed` only applies on large screens (an icon strip); the phone drawer is always the full menu. */
function Sidebar({ open, onClose, collapsed = false }) {
  const navigate = useNavigate();
  const { pathname, state } = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-white px-5 py-8 shadow-[0_20px_60px_rgba(80,40,60,0.12)] transition-[transform,width] duration-200 lg:translate-x-0 ${collapsed ? 'lg:w-20 lg:px-3' : ''} ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className={`flex items-center gap-3 px-2 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
          <Logo className={collapsed ? 'h-14 w-14 lg:h-11 lg:w-11' : 'h-14 w-14'} />
          <div className={collapsed ? 'lg:hidden' : ''}>
            <p className="text-sm font-semibold leading-tight">SETU AI</p>
            <p className="mt-1 text-[0.6rem] font-medium uppercase tracking-[0.35em] text-[#3a3f55]">
              Investors
            </p>
          </div>
        </div>
        <div className={`mx-2 mt-4 h-0.5 w-11 bg-[#e8793f] ${collapsed ? 'lg:mx-auto lg:w-8' : ''}`} />

        <nav className="mt-10 flex flex-col gap-2">
          {NAV_ITEMS.map((item) => {
            const { to, label, icon: Icon } = item;
            const active = isActiveItem(item, pathname, state?.section);
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? 'page' : undefined}
                className={linkClass(collapsed, active)}
                onClick={onClose}
                title={collapsed ? label : undefined}
              >
                <Icon />
                <span className={collapsed ? 'lg:sr-only' : ''}>{label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? 'Log out' : undefined}
          className={`mt-auto flex cursor-pointer items-center gap-3 rounded-full px-5 py-3 text-[0.95rem] font-medium text-[#3a3f55] transition hover:bg-[#fde6d6] ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
        >
          <LogoutIcon />
          <span className={collapsed ? 'lg:sr-only' : ''}>Log out</span>
        </button>
      </aside>
    </>
  );
}

export default Sidebar;
