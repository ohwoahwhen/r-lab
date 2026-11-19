/**
 * The level registry.
 *
 * LEVELS is free to change: reorder missions, insert one into the middle of an
 * early level, rename a level. What must NOT change is MISSION_SLOTS below,
 * which is the frozen, append-only list that save codes are encoded against.
 * Decoupling the two means editing the course never invalidates a save code.
 */

import l1 from './level01.js';
import l2 from './level02.js';
import l3 from './level03.js';
import l4 from './level04.js';
import l5 from './level05.js';
import l6 from './level06.js';
import l7 from './level07.js';
import l8 from './level08.js';
import l9 from './level09.js';
import l10 from './level10.js';
import l11 from './level11.js';
import l12 from './level12.js';
import l13 from './level13.js';

export const LEVELS = [l1, l2, l3, l4, l5, l6, l7, l8, l9, l10, l11, l12, l13];

/** Levels that are planned but not written yet, shown greyed on the map. */
export const COMING_SOON = [];

/**
 * Save-code slots, in encoding order. APPEND ONLY.
 *
 * Every mission gets a permanent slot here the first time it ships. Add new
 * ids at the END, whatever level they belong to, and never reorder or remove
 * one — an existing save code's bits are matched to this list by position.
 * `npm test` fails if a mission is missing a slot.
 */
export const MISSION_SLOTS = Object.freeze([
  'l1m1', 'l1m2', 'l1m3', 'l1m4', 'l1m5', 'l1boss',
  'l2m1', 'l2m2', 'l2m3', 'l2m4', 'l2m5', 'l2boss',
  'l3m1', 'l3m2', 'l3m3', 'l3m4', 'l3m5', 'l3boss',
  'l4m1', 'l4m2', 'l4m3', 'l4m4', 'l4m5', 'l4m6',
  'l4boss', 'l5m1', 'l5m2', 'l5m3', 'l5m4', 'l5m5',
  'l5m6', 'l5boss', 'l6m1', 'l6m2', 'l6m3', 'l6m4',
  'l6m5', 'l6m6', 'l6boss', 'l7m1', 'l7m2', 'l7m3',
  'l7m4', 'l7m5', 'l7m6', 'l7boss', 'l8m1', 'l8m2',
  'l8m3', 'l8m4', 'l8m5', 'l8m6', 'l8boss', 'l9m1',
  'l9m2', 'l9m3', 'l9m4', 'l9m5', 'l9m6', 'l9m7',
  'l9boss', 'l10m1', 'l10m2', 'l10m3', 'l10m4', 'l10m5',
  'l10m6', 'l10boss',
  'l11m1', 'l11m2', 'l11m3', 'l11m4', 'l11m5', 'l11m6',
  'l11m7', 'l11boss',
  'l12m1', 'l12m2', 'l12m3', 'l12m4', 'l12m5', 'l12m6',
  'l12boss',
  'l13m1', 'l13m2', 'l13m3', 'l13m4', 'l13m5', 'l13m6',
  'l13boss',
]);

export function missionOrder() {
  return MISSION_SLOTS;
}

/** Mission ids that have no save-code slot yet. Should always be empty. */
export function missionsMissingSlots() {
  const slots = new Set(MISSION_SLOTS);
  return LEVELS.flatMap((l) => l.missions.map((m) => m.id)).filter((id) => !slots.has(id));
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
