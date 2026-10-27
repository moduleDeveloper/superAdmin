import { CAMPAIGNS } from './sampleData';

/** The settings form keeps what the user typed as text; these turn saved targets into text boxes and back. */
export function toDraft(targets) {
  return {
    overall: String(targets.overall),
    campaigns: Object.fromEntries(
      CAMPAIGNS.map(({ id, adSets = [] }) => {
        const saved = targets.campaigns[id];
        return [id, {
          target: String(saved.target), dailyBudget: String(saved.dailyBudget), minApps: String(saved.minApps), alerts: saved.alerts,
          adSets: Object.fromEntries(adSets.map(({ id: adSetId }) => { const value = saved.adSets[adSetId]; return [adSetId, { target: String(value.target), dailyBudget: String(value.dailyBudget), minApps: String(value.minApps), alerts: value.alerts }]; })),
        }];
      })
    ),
  };
}

export function fromDraft(draft) {
  return {
    overall: Number(draft.overall),
    campaigns: Object.fromEntries(
      CAMPAIGNS.map(({ id, adSets = [] }) => {
        const values = draft.campaigns[id];
        return [id, {
          target: Number(values.target), dailyBudget: Number(values.dailyBudget), minApps: Number(values.minApps), alerts: values.alerts,
          adSets: Object.fromEntries(adSets.map(({ id: adSetId }) => { const value = values.adSets[adSetId]; return [adSetId, { target: Number(value.target), dailyBudget: Number(value.dailyBudget), minApps: Number(value.minApps), alerts: value.alerts }]; })),
        }];
      })
    ),
  };
}

const isNumber = (text) => text.trim() !== '' && Number.isFinite(Number(text));

/** Short messages for wrong boxes: { overall?, campaigns: { [id]: { target?, dailyBudget?, minApps? } } }. */
export function validate(draft) {
  const errors = { campaigns: {} };
  if (!isNumber(draft.overall) || Number(draft.overall) <= 0) errors.overall = 'Enter an amount above ₹0.';

  CAMPAIGNS.forEach(({ id }) => {
    const values = draft.campaigns[id];
    const found = {};
    if (!isNumber(values.target) || Number(values.target) <= 0) found.target = 'Enter an amount above ₹0.';
    if (!isNumber(values.dailyBudget) || Number(values.dailyBudget) < 0 || Number(values.dailyBudget) > 1000) found.dailyBudget = 'Enter an amount from ₹0 to ₹1,000.';
    if (!isNumber(values.minApps) || !Number.isInteger(Number(values.minApps)) || Number(values.minApps) < 1) found.minApps = 'Enter a whole number, 1 or more.';
    Object.entries(values.adSets ?? {}).forEach(([adSetId, adSet]) => {
      const adSetErrors = {};
      if (!isNumber(adSet.target) || Number(adSet.target) <= 0) adSetErrors.target = 'Enter an amount above ₹0.';
      if (!isNumber(adSet.dailyBudget) || Number(adSet.dailyBudget) < 0 || Number(adSet.dailyBudget) > 1000) adSetErrors.dailyBudget = 'Enter an amount from ₹0 to ₹1,000.';
      if (!isNumber(adSet.minApps) || !Number.isInteger(Number(adSet.minApps)) || Number(adSet.minApps) < 1) adSetErrors.minApps = 'Enter a whole number, 1 or more.';
      if (Object.keys(adSetErrors).length) found.adSets = { ...(found.adSets ?? {}), [adSetId]: adSetErrors };
    });
    if (Object.keys(found).length > 0) errors.campaigns[id] = found;
  });

  errors.any = Boolean(errors.overall) || Object.keys(errors.campaigns).length > 0;
  return errors;
}
