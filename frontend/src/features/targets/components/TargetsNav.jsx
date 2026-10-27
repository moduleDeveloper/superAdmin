import { Link, useLocation, useParams } from 'react-router-dom';

import { CampaignIcon, InsightsIcon, MembersIcon, TargetIcon } from '../../../components/sidebar/icons';
import { useTargetsView } from '../hooks/useTargetsView';
import { CAMPAIGNS, PERIODS } from '../utils/sampleData';
import { STATUS } from '../utils/targetMath';
import NavDropdown from './NavDropdown';
import { PlatformTile } from './PlatformCard';

const item = (active) =>
  `flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition ${active ? 'bg-(--c-accent-soft) font-semibold text-(--c-link)' : 'text-(--c-text-3) hover:bg-(--c-accent-soft)'}`;

const linkTrigger =
  'flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-(--c-text-2) transition hover:bg-(--c-accent-soft) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--c-accent)';

const heading = 'px-3 pb-1 pt-2 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-(--c-muted)';

/** Platform filter + colour filter: both open the page at the "Platform vs Target" section. */
function PlatformLinks({ onPick }) {
  const [view, setView] = useTargetsView();
  const pick = (patch) => {
    setView(patch);
    onPick();
  };
  return (
    <>
      <p className={heading}>Platform</p>
      {[null, 'Meta', 'Google'].map((platform) => (
        <Link key={platform ?? 'all'} to="/targets#platform-vs-target" onClick={() => pick({ platform })} className={item(view.platform === platform)}>
          {platform ? <PlatformTile platform={platform} className="h-5 w-5 rounded-md [&_svg]:h-3.5 [&_svg]:w-3.5" /> : <span className="h-5 w-5" />}
          {platform ?? 'All platforms'}
        </Link>
      ))}
      <p className={heading}>Colour</p>
      {[null, ...Object.keys(STATUS)].map((status) => (
        <Link key={status ?? 'all'} to="/targets#platform-vs-target" onClick={() => pick({ status })} className={item(view.status === status)}>
          <span className="ml-1 mr-0.5 h-2.5 w-2.5 rounded-full" style={{ background: status ? STATUS[status].color : 'var(--c-accent)' }} aria-hidden="true" />
          {status ? STATUS[status].short : 'All colours'}
        </Link>
      ))}
    </>
  );
}

/** Every campaign, each opening its own place: a scorecard row, or its target form. */
function CampaignLinks({ base, allLabel, allTo, onPick }) {
  const { campaignId } = useParams();
  const { pathname } = useLocation();
  const inSettings = pathname.startsWith('/targets/set-target');
  const onThisSection = base === '/targets' ? !inSettings : inSettings;
  return (
    <>
      <Link to={allTo} onClick={onPick} className={item(onThisSection && !campaignId)}>
        <span className="h-5 w-5" />
        {allLabel}
      </Link>
      {CAMPAIGNS.map((campaign) => (
        <Link key={campaign.id} to={`${base}/${campaign.id}`} onClick={onPick} className={item(onThisSection && campaignId === campaign.id)}>
          <PlatformTile platform={campaign.platform} className="h-5 w-5 rounded-md [&_svg]:h-3.5 [&_svg]:w-3.5" />
          <span className="truncate">{campaign.name}</span>
        </Link>
      ))}
    </>
  );
}

const SECTIONS = [
  { id: 'platform', label: 'Platform vs Target', icon: InsightsIcon, render: (close) => <PlatformLinks onPick={close} /> },
  { id: 'scorecard', label: 'Scorecard', icon: CampaignIcon, render: (close) => <CampaignLinks base="/targets" allLabel="All campaigns" allTo="/targets#scorecard" onPick={close} /> },
  { id: 'set', label: 'Set Targets', icon: TargetIcon, render: (close) => <CampaignLinks base="/targets/set-target" allLabel="All targets" allTo="/targets/set-target" onPick={close} /> },
];

/** "User Actions": opens the Registrations page (who registered, and what each person did), for the period chosen in the top bar. */
function UserActionsLink({ onPick }) {
  const [view] = useTargetsView();
  const range = { today: 'today', month: '30d', '7d': '7d' }[view.period] ?? '7d';
  return (
    <Link to={`/registrations?range=${range}`} state={{ backLabel: 'Targets' }} onClick={onPick} className={`${linkTrigger}`}>
      <MembersIcon />
      <span className="whitespace-nowrap">User Actions</span>
    </Link>
  );
}

/** The top bar of the Targets pages: three dropdowns on wide screens, one "Targets menu" with all of them on smaller ones. */
function TargetsNav({ variant }) {
  if (variant === 'wide') {
    return (
      <nav className="flex items-center gap-2" aria-label="Targets">
        {SECTIONS.map(({ id, label, icon, render }) => (
          <NavDropdown key={id} label={label} icon={icon}>
            {render}
          </NavDropdown>
        ))}
        <UserActionsLink />
      </nav>
    );
  }
  return (
    <NavDropdown label="Menu" align="right">
      {(close) =>
        SECTIONS.map(({ id, label, render }) => (
          <div key={id} className="border-b border-gray-200 pb-1 last:border-0">
            <p className="px-3 pb-0.5 pt-2 text-xs font-bold text-(--c-text-2)">{label}</p>
            {render(close)}
          </div>
        )).concat(
          <div key="user-actions" className="pb-1 pt-1">
            <UserActionsLink onPick={close} />
          </div>
        )
      }
    </NavDropdown>
  );
}

/** The period dropdown (right side of the top bar). */
export function TargetsPeriod() {
  const [view, setView] = useTargetsView();
  const current = PERIODS.find(({ value }) => value === view.period) ?? PERIODS[1];
  return (
    <NavDropdown label={current.label} align="right" width="sm:w-48" bordered>
      {(close) =>
        PERIODS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setView({ period: value });
              close();
            }}
            className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
              view.period === value ? 'bg-(--c-accent-soft) font-semibold text-(--c-link)' : 'text-(--c-text-2) hover:bg-(--c-accent-soft)'
            }`}
          >
            {label}
            {view.period === value && <span aria-hidden="true">✓</span>}
          </button>
        ))
      }
    </NavDropdown>
  );
}

export default TargetsNav;
