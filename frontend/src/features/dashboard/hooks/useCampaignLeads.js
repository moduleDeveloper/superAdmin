import { useApiQuery } from '../../../hooks/useApiQuery';
import { fetchCampaignLeads } from '../services/dashboardService';

/** One page of a campaign's leads. The previous page stays on screen while the next one loads. */
export function useCampaignLeads({ range, from, to }, { campaign, source, platform, adSet, stage }, { search, page, pageSize, sort }) {
  return useApiQuery(
    ['dashboard-campaign-leads', range, from ?? '', to ?? '', campaign, source ?? '', platform ?? '', adSet ?? '', stage ?? '', search, page, pageSize, sort],
    () => fetchCampaignLeads({ range, from, to, campaign, source, platform, adSet, stage, search, page, pageSize, sort }),
    { keepPrevious: true, enabled: Boolean(campaign) }
  );
}
