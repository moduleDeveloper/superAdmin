import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useBlocker, useParams } from 'react-router-dom';

import CampaignTargetCard from '../components/CampaignTargetCard';
import TargetField from '../components/TargetField';
import { ALERT_OPTIONS, DEFAULT_TARGETS, useTargets } from '../hooks/useTargets';
import { fromDraft, toDraft, validate } from '../utils/draft';
import { CAMPAIGNS } from '../utils/sampleData';
import { buildRows, money } from '../utils/targetMath';
import { PlatformTile } from '../components/PlatformCard';

const buttonBase = 'h-10 cursor-pointer whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--c-accent) disabled:cursor-not-allowed disabled:opacity-50';
const primary = `${buttonBase} bg-gradient-to-r from-(--c-grad-from) via-(--c-grad-via) to-(--c-grad-to) text-white shadow-[0_2px_8px_rgba(15,120,110,0.35)] hover:brightness-110`;
const secondary = `${buttonBase} border border-gray-300 bg-white text-(--c-text-2) hover:bg-gray-50`;

/** A small confirmation box over the page. */
function Dialog({ title, text, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="presentation" onMouseDown={onCancel}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="dialog-title" className="animate-pop w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)]" onMouseDown={(event) => event.stopPropagation()}>
        <h2 id="dialog-title" className="text-lg font-bold">{title}</h2>
        <p className="mt-1 text-sm text-(--c-text-3)">{text}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className={secondary} autoFocus>{cancelLabel}</button>
          <button type="button" onClick={onConfirm} className={primary}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/** Set Targets: one target per campaign (and one overall). Everything on the scorecard takes its colour from these. */
function TargetSettingsPage() {
  const { targets, saveTargets, resetTargets } = useTargets();
  const { campaignId, adSetId } = useParams(); // campaign and optional ad set scope
  const [draft, setDraft] = useState(() => toDraft(targets));
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const targetRefs = useRef({});
  const highlightedId = CAMPAIGNS.some(({ id }) => id === campaignId) ? campaignId : null;
  const visible = highlightedId ? CAMPAIGNS.filter(({ id }) => id === highlightedId) : CAMPAIGNS;
  const selectedAdSet = visible[0]?.adSets?.find(({ id }) => id === adSetId);

  const errors = useMemo(() => validate(draft), [draft]);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(toDraft(targets)), [draft, targets]);

  // the last 14 days of every campaign: what the targets are measured against
  const history = useMemo(() => Object.fromEntries(buildRows('14d', targets).rows.map((row) => [row.id, row])), [targets]);

  // opened from "Edit target": scroll to that campaign and put the cursor in its target box
  useEffect(() => {
    if (!highlightedId) return;
    document.getElementById(highlightedId)?.scrollIntoView({ block: 'center' });
    targetRefs.current[highlightedId]?.focus({ preventScroll: true });
  }, [highlightedId]);

  // leaving with unsaved changes asks first (links inside the app, and closing the tab)
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const change = (id, field, value) => {
    setSaved(false);
    setDraft((current) => ({ ...current, campaigns: { ...current.campaigns, [id]: { ...current.campaigns[id], [field]: value } } }));
  };

  const save = () => {
    if (errors.any) return;
    const next = fromDraft(draft);
    saveTargets(next);
    setDraft(toDraft(next)); // show the saved values as they are stored (e.g. 40.0 becomes 40)
    setSaved(true);
  };

  const discard = () => setDraft(toDraft(targets));

  const renderCampaign = (campaign) => (
    <div key={campaign.id} className="flex flex-col gap-4">
      {!selectedAdSet && <CampaignTargetCard
        campaign={campaign}
        history={history[campaign.id]}
        values={draft.campaigns[campaign.id]}
        errors={errors.campaigns[campaign.id] ?? {}}
        highlighted={highlightedId === campaign.id}
        onChange={(field, value) => change(campaign.id, field, value)}
        targetRef={(element) => {
          targetRefs.current[campaign.id] = element;
        }}
      />}
      {campaign.adSets?.filter((adSet) => !adSetId || adSet.id === adSetId).map((adSet) => {
        const historyAdSet = history[campaign.id]?.adSets?.find((item) => item.id === adSet.id);
        const values = draft.campaigns[campaign.id].adSets[adSet.id];
        const adSetErrors = errors.campaigns[campaign.id]?.adSets?.[adSet.id] ?? {};
        const update = (field, value) => {
          setSaved(false);
          setDraft((current) => ({ ...current, campaigns: { ...current.campaigns, [campaign.id]: { ...current.campaigns[campaign.id], adSets: { ...current.campaigns[campaign.id].adSets, [adSet.id]: { ...current.campaigns[campaign.id].adSets[adSet.id], [field]: value } } } } }));
        };
        return (
          <section key={adSet.id} className="ml-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(20,33,61,0.06)] sm:ml-8">
            <h3 className="text-base font-bold">{adSet.name}</h3>
            {historyAdSet && <p className="mt-1 text-xs text-(--c-muted)">Last 14 days · Spend ₹{historyAdSet.spend.toLocaleString('en-IN')} · {historyAdSet.installs} installs · {historyAdSet.registrations} registrations · {historyAdSet.logins} logins · {money(historyAdSet.costPerLogin)} per login · {historyAdSet.apps} apps · {money(historyAdSet.costPerApp)} per app</p>}
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <TargetField id={`adset-target-${adSet.id}`} label="★ Target cost per app" prefix="₹" value={values.target} onChange={(value) => update('target', value)} error={adSetErrors.target} />
              <TargetField id={`adset-budget-${adSet.id}`} label="Daily budget" prefix="₹" type="number" min="0" max="1000" value={values.dailyBudget} onChange={(value) => update('dailyBudget', value === '' ? '' : String(Math.min(Number(value), 1000)))} error={adSetErrors.dailyBudget} />
              <TargetField id={`adset-min-${adSet.id}`} label="Min. apps before deciding" value={values.minApps} onChange={(value) => update('minApps', value)} error={adSetErrors.minApps} />
              <TargetField id={`adset-alerts-${adSet.id}`} label="Send alerts to" value={values.alerts} onChange={(value) => update('alerts', value)} options={ALERT_OPTIONS} />
            </div>
          </section>
        );
      })}
    </div>
  );

  if ((campaignId && !highlightedId) || (adSetId && !selectedAdSet)) return <Navigate to="/targets/set-target" replace />;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">{selectedAdSet ? <><PlatformTile platform={visible[0].platform} className="h-10 w-10 rounded-xl" />{visible[0].name}</> : highlightedId ? <><PlatformTile platform={visible[0].platform} className="h-10 w-10 rounded-xl" />{visible[0].name}</> : 'Set Targets'}</h1>
            <span className="rounded-full bg-(--c-accent-soft) px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-(--c-link)">Sample data</span>
          </div>
          <p className="mt-1 text-sm text-(--c-text-3)">
            {selectedAdSet ? (
              <>
                Ad set: {selectedAdSet.name}.{' '}
                <Link to="/targets/set-target" className="font-semibold text-(--c-link) hover:underline">Show all targets</Link>
              </>
            ) : highlightedId ? (
              <>
                Only this campaign is shown.{' '}
                <Link to="/targets/set-target" className="font-semibold text-(--c-link) hover:underline">Show all targets</Link>
              </>
            ) : (
              'A separate target for each platform. Review them every 2 weeks.'
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setConfirmReset(true)} className={secondary}>Reset to defaults</button>
          <button type="button" onClick={save} disabled={errors.any || !dirty} className={primary}>Save targets</button>
        </div>
      </header>

      {saved && (
        <p role="status" className="rounded-xl border border-(--c-good)/30 bg-(--c-good-bg) px-4 py-3 text-sm font-medium text-(--c-good-text)">
          Targets saved. The scorecard now uses them.{' '}
          <Link to="/targets" className="font-bold underline">View scorecard →</Link>
        </p>
      )}

      {!highlightedId && (
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(20,33,61,0.06)]">
        <h2 className="text-lg font-bold">Overall target</h2>
        <p className="mt-1 text-sm text-(--c-text-3)">Cost per app for all campaigns together. The main card on the scorecard uses it.</p>
        <div className="mt-4 max-w-xs">
          <TargetField
            id="overall-target"
            label="★ Target cost per app"
            prefix="₹"
            value={draft.overall}
            onChange={(value) => {
              setSaved(false);
              setDraft((current) => ({ ...current, overall: value }));
            }}
            error={errors.overall}
          />
        </div>
      </section>
      )}

      {highlightedId ? visible.map(renderCampaign) : ['Meta', 'Google'].map((platform) => {
        const campaigns = visible.filter((campaign) => campaign.platform === platform);
        if (campaigns.length === 0) return null;
        return (
          <section key={platform} className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-(--c-page)/60 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <PlatformTile platform={platform} className="h-8 w-8 rounded-lg" />
              <h2 className="text-lg font-bold">{platform}</h2>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-(--c-text-3)">{campaigns.length} {campaigns.length === 1 ? 'campaign' : 'campaigns'}</span>
            </div>
            {campaigns.map(renderCampaign)}
          </section>
        );
      })}

      <p className="text-xs text-(--c-muted)">All numbers are examples only.</p>

      {dirty && (
        <div className="animate-pop sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border border-(--c-accent)/40 bg-white px-5 py-3 shadow-[0_12px_32px_rgba(20,33,61,0.2)] sm:flex-row sm:items-center sm:justify-between" role="region" aria-label="Unsaved changes">
          <p className="text-sm font-semibold">
            You have unsaved changes
            {errors.any && <span className="ml-2 font-medium text-(--c-bad-text)">· fix the red boxes to save</span>}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={discard} className={secondary}>Discard</button>
            <button type="button" onClick={save} disabled={errors.any} className={primary}>Save targets</button>
          </div>
        </div>
      )}

      {confirmReset && (
        <Dialog
          title="Reset to defaults?"
          text="Every target goes back to its starting value (overall ₹60, Google App · India ₹40, the others ₹140). This is saved straight away."
          confirmLabel="Reset"
          cancelLabel="Cancel"
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            resetTargets();
            setDraft(toDraft(DEFAULT_TARGETS));
            setConfirmReset(false);
            setSaved(true);
          }}
        />
      )}

      {blocker.state === 'blocked' && (
        <Dialog
          title="Leave without saving?"
          text="You have changes that are not saved yet. If you leave now they will be lost."
          confirmLabel="Leave"
          cancelLabel="Stay"
          onCancel={() => blocker.reset()}
          onConfirm={() => blocker.proceed()}
        />
      )}
    </div>
  );
}

export default TargetSettingsPage;
