/**
 * webR lifecycle: boot, package install, evaluation, plot capture, grading.
 *
 * GitHub Pages cannot send Cross-Origin-Opener-Policy / Embedder-Policy, so
 * SharedArrayBuffer is unavailable and webR falls back to its PostMessage
 * channel. We ask for PostMessage explicitly so local dev behaves identically.
 * Consequence: no interrupt, and no readline()/menu()/browser() in missions.
 */

import bootR from './boot.R?raw';
import datasetsR from './datasets.R?raw';
import gradeR from './grade.R?raw';

const WEBR_VERSION = '0.6.1';
const WEBR_URL = `https://webr.r-wasm.org/v${WEBR_VERSION}/webr.mjs`;

export const CORE_PACKAGES = ['dplyr', 'tidyr', 'ggplot2', 'readr', 'stringr', 'forcats'];
export const STATS_PACKAGES = ['effectsize', 'psych', 'car', 'afex', 'emmeans', 'lme4', 'lmerTest'];

const PLOT = { width: 680, height: 440 };

let webR = null;
let shelter = null;
let ready = false;
const installed = new Set();

/** @type {(stage: string, pct: number, detail?: string) => void} */
let onProgress = () => {};

export function setProgressHandler(fn) { onProgress = fn; }

export const engineState = () => ({ ready, installed: [...installed] });

/** True once the levels 7-8 statistics packages are installed and loaded. */
export function statsReady() {
  return STATS_PACKAGES.every((p) => installed.has(p)) && statsLoaded;
}

let statsLoaded = false;

export async function bootEngine() {
  const t0 = performance.now();
  onProgress('fetch', 4, `Fetching webR ${WEBR_VERSION}`);
  const { WebR, ChannelType } = await import(/* @vite-ignore */ WEBR_URL);

  onProgress('start', 12, 'Starting R');
  webR = new WebR({
    baseUrl: `https://webr.r-wasm.org/v${WEBR_VERSION}/`,
    channelType: ChannelType.PostMessage,
    interactive: false,
  });
  await webR.init();

  onProgress('packages', 24, 'Downloading tidyverse packages');
  await installPackages(CORE_PACKAGES, 24, 74);

  onProgress('library', 76, 'Loading packages into R');
  const bad = await evalStrings(`rlab_load(c(${CORE_PACKAGES.map(q).join(', ')}))`, bootR);
  if (bad.length && bad[0] !== 'OK') {
    throw new Error(`These packages would not load: ${bad.join(', ')}`);
  }

  onProgress('data', 86, 'Building the lab datasets');
  await webR.evalRVoid(datasetsR);
  await webR.evalRVoid(gradeR);
  await webR.evalRVoid('rlab_build_data()');

  onProgress('selftest', 94, 'Checking dplyr, tidyr and ggplot2 really work');
  const tests = await evalStrings('rlab_selftest()');
  const failed = tests.filter((t) => !/ ok$/.test(t));
  if (failed.length) throw new Error(failed.join(' · '));

  shelter = await new webR.Shelter();
  ready = true;
  onProgress('ready', 100, `Ready in ${((performance.now() - t0) / 1000).toFixed(1)}s`);
  return { version: await evalString('rlab_version_report()') };
}

async function installPackages(pkgs, from, to) {
  const span = to - from;
  for (let i = 0; i < pkgs.length; i++) {
    const p = pkgs[i];
    if (installed.has(p)) continue;
    onProgress('packages', from + (span * i) / pkgs.length, `Installing ${p}`);
    await webR.installPackages([p]);
    installed.add(p);
  }
  onProgress('packages', to, 'Packages installed');
}

/**
 * Install and load the statistics packages on demand, the first time a
 * level 7 or 8 mission is opened. They are ~20 MB that levels 1-6 never need.
 * Runs at most once; concurrent callers share the same promise.
 */
let statsPromise = null;

export function ensureStatsPackages(report = () => {}) {
  if (statsReady()) return Promise.resolve({ ok: true, failed: [], loadFailed: [] });
  if (statsPromise) return statsPromise;
  statsPromise = (async () => {
    const failed = [];
    for (let i = 0; i < STATS_PACKAGES.length; i++) {
      const pkg = STATS_PACKAGES[i];
      report(pkg, i / STATS_PACKAGES.length);
      if (installed.has(pkg)) continue;
      try {
        await webR.installPackages([pkg]);
        installed.add(pkg);
      } catch (err) {
        failed.push(pkg);
      }
    }
    const have = STATS_PACKAGES.filter((p) => installed.has(p));
    const bad = have.length
      ? await evalStrings(`rlab_load(c(${have.map(q).join(', ')}))`)
      : ['none installed'];
    const loadFailed = bad[0] === 'OK' ? [] : bad;
    statsLoaded = failed.length === 0 && loadFailed.length === 0;
    report(null, 1);
    if (!statsLoaded) statsPromise = null;   // let the user retry
    return { ok: statsLoaded, failed, loadFailed };
  })();
  return statsPromise;
}

/* ───────── low level helpers ───────── */

const q = (s) => JSON.stringify(String(s));

async function evalStrings(code, prelude) {
  if (prelude) await webR.evalRVoid(prelude);
  const res = await webR.evalR(code);
  try {
    const js = await res.toJs();
    return (js.values || []).map((v) => (v == null ? '' : String(v)));
  } finally {
    webR.destroy(res);
  }
}

async function evalString(code) {
  const v = await evalStrings(code);
  return v[0] ?? '';
}

export async function bindCode(name, text) {
  await webR.objs.globalEnv.bind(name, String(text));
}

/**
 * Run the student's code. Returns console text, any error, and plot images.
 * @param {string} code
 */
export async function runCode(code, { plot = true } = {}) {
  if (!ready) throw new Error('R is not ready yet.');
  await bindCode('.rlab_code', code);
  const opts = plot ? { captureGraphics: { width: PLOT.width, height: PLOT.height } } : { captureGraphics: false };
  let cap;
  try {
    cap = await shelter.captureR('rlab_eval(.rlab_code)', opts);
  } catch (err) {
    await shelter.purge();
    return { status: 'fatal', message: String(err && err.message ? err.message : err), text: '', images: [] };
  }
  const text = (cap.output || [])
    .filter((o) => o.type === 'stdout' || o.type === 'stderr')
    .map((o) => o.data)
    .join('\n');
  let status = 'ok';
  let message = '';
  try {
    const js = await cap.result.toJs();
    status = String((js.values || ['ok'])[0] || 'ok');
    message = String((js.values || ['', ''])[1] || '');
  } catch { /* keep defaults */ }
  const images = cap.images || [];
  // Keep images alive for drawing; purge the rest of the shelter.
  const bitmaps = images.map((img) => img);
  await shelter.purge();
  return { status, message, text, images: bitmaps };
}

/**
 * Grade the last answer with a mission checker.
 * @param {string} checker R code returning a character vector of problems
 */
export async function gradeAnswer(checker) {
  await bindCode('.rlab_checker', checker);
  const out = await evalStrings('rlab_check(.rlab_checker)');
  if (out[0] === 'PASS') return { pass: true, problems: [] };
  return { pass: false, problems: out.slice(1) };
}

/** Render a plot from arbitrary R code (used for target charts). */
export async function renderPlot(code) {
  if (!ready) return { images: [], text: '' };
  await bindCode('.rlab_target', code);
  let cap;
  try {
    cap = await shelter.captureR('rlab_eval(.rlab_target)', {
      captureGraphics: { width: PLOT.width, height: PLOT.height },
    });
  } catch (err) {
    await shelter.purge();
    return { images: [], text: String(err) };
  }
  const images = (cap.images || []).map((i) => i);
  const text = (cap.output || []).map((o) => o.data).join('\n');
  await shelter.purge();
  return { images, text };
}

export async function peekData(name, n = 6) {
  const s = await evalString(`rlab_peek(${q(name)}, ${Number(n)})`);
  return s;
}

export async function shapeData(name) {
  return evalString(`rlab_shape(${q(name)})`);
}

export async function resetDatasets() {
  await webR.evalRVoid('rlab_build_data()');
}

export async function evalRaw(code) {
  return evalStrings(code);
}
