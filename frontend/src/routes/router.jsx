import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import NotFoundPage from '../features/errors/pages/NotFoundPage';
import RouteErrorPage from '../features/errors/pages/RouteErrorPage';

const LoginPage = lazy(() =>
  import('../features/auth/pages/LoginPage')
);

const DashboardPage = lazy(() =>
  import('../features/dashboard/pages/DashboardPage')
);

const TrustInsightsPage = lazy(() =>
  import('../features/trust-insights/pages/TrustInsightsPage')
);

const TrustActivityPage = lazy(() =>
  import('../features/trust-insights/pages/TrustActivityPage')
);

const TrustMemberLoginsPage = lazy(() =>
  import('../features/trust-insights/pages/TrustMemberLoginsPage')
);

const MemberInsightsPage = lazy(() =>
  import('../features/member-insights/pages/MemberInsightsPage')
);

const MemberTrustsPage = lazy(() =>
  import('../features/member-insights/pages/MemberTrustsPage')
);

const MemberActivityPage = lazy(() =>
  import('../features/member-insights/pages/MemberActivityPage')
);

const MemberAppsPage = lazy(() =>
  import('../features/member-insights/pages/MemberAppsPage')
);

const CampaignLeadsPage = lazy(() =>
  import('../features/dashboard/pages/CampaignLeadsPage')
);

const AppLoginsPage = lazy(() =>
  import('../features/dashboard/pages/AppLoginsPage')
);

const MarketingPage = lazy(() =>
  import('../features/marketing/pages/MarketingPage')
);

const TrustMemberActionsPage = lazy(() =>
  import('../features/trust-insights/pages/TrustMemberActionsPage')
);

const lazyPage = (Component) => (
  <Suspense fallback={<div>Loading...</div>}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorPage />,
    children: [
  {
    element: <PublicRoute />,
    children: [
      {
        path: '/login',
        element: lazyPage(LoginPage),
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: '/',
            element: lazyPage(DashboardPage),
          },
          {
            path: '/campaign-leads',
            element: lazyPage(CampaignLeadsPage),
          },
          {
            path: '/app-logins/:trustId',
            element: lazyPage(AppLoginsPage),
          },
          {
            path: '/organization-insights',
            element: lazyPage(TrustInsightsPage),
          },
          {
            path: '/trust-insights/:trustId',
            element: lazyPage(TrustActivityPage),
          },
          {
            path: '/trust-insights/:trustId/member-actions',
            element: lazyPage(TrustMemberActionsPage),
          },
          {
            path: '/trust-insights/:trustId/members',
            element: lazyPage(TrustMemberLoginsPage),
          },
          {
            path: '/marketing',
            element: lazyPage(MarketingPage),
          },
          {
            path: '/member-insights',
            element: lazyPage(MemberInsightsPage),
          },
          {
            path: '/member-insights/:memberId/apps/:trustId/members',
            element: lazyPage(TrustMemberLoginsPage),
          },
          {
            path: '/member-insights/:memberId/apps/:trustId/activity',
            element: lazyPage(TrustActivityPage),
          },
          {
            path: '/member-insights/:memberId/apps',
            element: lazyPage(MemberAppsPage),
          },
          {
            path: '/member-insights/:memberId/activity',
            element: lazyPage(MemberActivityPage),
          },
          {
            path: '/member-insights/:memberId/trusts',
            element: lazyPage(MemberTrustsPage),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
    ],
  },
]);
