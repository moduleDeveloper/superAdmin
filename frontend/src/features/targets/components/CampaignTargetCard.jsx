import { ALERT_OPTIONS } from '../hooks/useTargets';
import { money } from '../utils/targetMath';
import TargetField from './TargetField';
import { PlatformTile } from './PlatformCard';

/** The settings of one campaign: editable boxes, the numbers worked out from its data, and a live preview of the colour. */
function CampaignTargetCard({ campaign, history, values, errors, highlighted, onChange, targetRef }) {
  const target = Number(values.target);
  const valid = values.target !== '' && target > 0;
  const suggested = history.costPerApp ? Math.max(1, Math.round(history.costPerApp * 0.85)) : null;
  const id = campaign.id;

  return (
    <section
      id={id}
      className={`scroll-mt-24 rounded-2xl border bg-white p-5 shadow-[0_1px_3px_rgba(20,33,61,0.06)] ${
        highlighted ? 'border-2 border-(--c-accent) shadow-[0_8px_24px_color-mix(in_srgb,var(--c-accent)_25%,transparent)]' : 'border-gray-200'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">
          <PlatformTile platform={campaign.platform} className="mr-2 inline-flex h-7 w-7 rounded-lg align-middle [&_svg]:h-4 [&_svg]:w-4" />
          {campaign.name}
          {campaign.test && <span className="ml-2 rounded-full bg-(--c-accent-soft) px-2 py-0.5 text-[0.65rem] font-bold uppercase text-(--c-link)">Test</span>}
        </h2>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
        <TargetField id={`last14-${id}`} label="Last 14 days cost per app" value={money(history.costPerApp)} auto="from data" />
        <TargetField
          id={`target-${id}`}
          inputRef={targetRef}
          label="★ Target cost per app"
          prefix="₹"
          value={values.target}
          onChange={(value) => onChange('target', value)}
          error={errors.target}
          hint={
            suggested && (
              <p className="text-xs text-(--c-muted)">
                Suggested {money(suggested)} (15% below last 14 days) ·{' '}
                <button type="button" onClick={() => onChange('target', String(suggested))} className="cursor-pointer rounded font-semibold text-(--c-link) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--c-accent)">
                  Use it
                </button>
              </p>
            )
          }
        />
        <TargetField id={`red-${id}`} label="Red line (2x target)" value={valid ? money(target * 2) : '—'} auto="auto" />
        <TargetField id={`cpl-${id}`} label="Cost per login" value={money(history.costPerLogin)} auto="from data" />

        <TargetField id={`budget-${id}`} label="Daily budget" prefix="₹" value={values.dailyBudget} onChange={(value) => onChange('dailyBudget', value === '' ? '' : String(Math.min(Number(value), 1000)))} error={errors.dailyBudget} type="number" min="0" max="1000" />
        <TargetField id={`minapps-${id}`} label="Min. apps created before deciding" value={values.minApps} onChange={(value) => onChange('minApps', value)} error={errors.minApps} />
        <TargetField id={`alerts-${id}`} label="Send alerts to" value={values.alerts} onChange={(value) => onChange('alerts', value)} options={ALERT_OPTIONS} />
      </div>
    </section>
  );
}

export default CampaignTargetCard;
