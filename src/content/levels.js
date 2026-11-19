/**
 * The level registry.
 *
 * IMPORTANT: missionOrder() is what save codes are encoded against, so it
 * must stay APPEND-ONLY. New missions go at the end of a level's list and new
 * levels at the end of this array. Never reorder or delete an existing id.
 */

import l1 from './level01.js';
import l2 from './level02.js';
import l3 from './level03.js';
import l4 from './level04.js';
import l5 from './level05.js';

export const LEVELS = [l1, l2, l3, l4, l5];

/** Levels that are planned but not written yet, shown greyed on the map. */
export const COMING_SOON = [
  { n: 6, title: 'Polish', blurb: 'Facets, themes, scales, colour and annotation.' },
  { n: 7, title: 'Numbers That Mean Something', blurb: 'Descriptives, t-tests, correlations, effect sizes, APA reporting.' },
  { n: 8, title: 'The Analysis', blurb: 'ANOVA, assumptions, emmeans and interactions.' },
];

export function missionOrder() {
  return LEVELS.flatMap((l) => l.missions.map((m) => m.id));
}

export function findMission(id) {
  for (const level of LEVELS) {
    const m = level.missions.find((x) => x.id === id);
    if (m) return { level, mission: m };
  }
  return null;
}

export function nextMission(id) {
  const order = missionOrder();
  const i = order.indexOf(id);
  return i >= 0 && i + 1 < order.length ? order[i + 1] : null;
}

export function allDatasets() {
  const s = new Set();
  for (const l of LEVELS) for (const m of l.missions) (m.datasets || []).forEach((d) => s.add(d));
  return [...s];
}
