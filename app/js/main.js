// Wires the ledger together: state, header, views and cross-pane navigation.
import { loadAppData } from './data.js';
import { loadEarned, saveEarned, toggleName, loadSpoiler, saveSpoiler, exportProgress, importProgress, clearProgress } from './store.js';
import { renderFilterChips, applyFilters } from './filters.js';
import { visibleName } from './spoiler.js';
import { renderChecklist } from './checklist.js';
import { renderDetail } from './detail.js';
import { renderRoadmapSummary, renderWatchlist, renderRoadmapView } from './roadmap.js';
import { renderCollectiblesSummary, renderCollectiblesView } from './collectibles.js';
import { showToast } from './util.js';

const data = await loadAppData();
const trophies = data.trophies;
const byName = new Map(trophies.map((t) => [t.name, t]));
const names = trophies.map((t) => t.name);
const gradeCount = (grade) => trophies.filter((t) => t.grade === grade).length;

const state = {
  earned: new Set(loadEarned()),
  spoilerOn: loadSpoiler(),
  filter: 'all',
  stage: null,
  search: '',
  view: 'ledger',
  selected: byName.has('Just Like Paradise') ? 'Just Like Paradise' : names[0],
};

const dom = {
  progressCount: document.getElementById('progress-count'),
  progressPct: document.getElementById('progress-pct'),
  progressFill: document.getElementById('progress-fill'),
  stats: document.getElementById('stats'),
  listCount: document.getElementById('list-count'),
  chips: document.getElementById('filter-chips'),
  search: document.getElementById('search'),
  list: document.getElementById('trophy-list'),
  detail: document.getElementById('detail'),
  roadmapSummary: document.getElementById('roadmap-summary'),
  watchlist: document.getElementById('watchlist'),
  collectiblesSummary: document.getElementById('collectibles-summary'),
  roadmapView: document.getElementById('roadmap-view'),
  roadmapWatchlist: document.getElementById('roadmap-watchlist'),
  collectiblesView: document.getElementById('collectibles-view'),
  spoilerButton: document.getElementById('btn-spoiler'),
};

function renderProgress() {
  const earned = state.earned.size;
  const total = trophies.length;
  dom.progressCount.textContent = `${earned} / ${total} earned`;
  dom.progressPct.textContent = `${Math.round((earned / total) * 100)}%`;
  dom.progressFill.style.width = `${(earned / total) * 100}%`;
}

function renderStats() {
  const cells = [
    [trophies.length, 'official'],
    [gradeCount('platinum'), 'platinum'],
    [gradeCount('gold'), 'gold'],
    [gradeCount('silver'), 'silver'],
    [gradeCount('bronze'), 'bronze'],
    [trophies.filter((t) => t.hidden).length, 'hidden until earned'],
    [trophies.filter((t) => t.missable).length, 'missable'],
    [trophies.length, 'single-player'],
    [trophies.filter((t) => t.kind === 'collectibles').length, 'collectible-tied'],
  ];
  dom.stats.innerHTML = cells.map(([n, label]) => `<span><b>${n}</b> ${label}</span>`).join('');
}

function setView(view) {
  state.view = view;
  for (const tab of document.querySelectorAll('.tab')) tab.classList.toggle('is-active', tab.dataset.view === view);
  for (const section of document.querySelectorAll('.view')) section.classList.toggle('is-active', section.id === `view-${view}`);
}

function openTrophy(name) {
  if (!byName.has(name)) return;
  state.selected = name;
  if (state.view !== 'ledger') setView('ledger');
  renderAll();
}

function toggleEarned(name) {
  state.earned = toggleName(state.earned, name);
  saveEarned(state.earned);
  renderAll();
}

function stageFilter(stage) {
  state.stage = stage;
  state.filter = 'all';
  state.search = '';
  dom.search.value = '';
  setView('ledger');
  renderAll();
}

function renderAll() {
  renderProgress();
  renderStats();
  renderFilterChips(dom.chips, state.filter, (id) => {
    state.filter = id;
    state.stage = null;
    renderAll();
  });

  const shown = applyFilters(trophies, state, state.earned, visibleName);
  dom.listCount.textContent = `${shown.length} shown${state.stage ? ` · ${state.stage}` : ''}`;
  renderChecklist(dom.list, {
    trophies: shown,
    earned: state.earned,
    spoilerOn: state.spoilerOn,
    selected: state.selected,
    onToggle: toggleEarned,
    onSelect: openTrophy,
  });

  renderDetail(dom.detail, byName.get(state.selected), {
    all: trophies,
    earned: state.earned,
    spoilerOn: state.spoilerOn,
    onOpen: openTrophy,
  });

  renderRoadmapSummary(dom.roadmapSummary, {
    roadmap: data.roadmap,
    trophies,
    earned: state.earned,
    onStage: stageFilter,
    onOpenView: () => { setView('roadmap'); renderAll(); },
  });
  renderWatchlist(dom.watchlist, {
    trophies, earned: state.earned, spoilerOn: state.spoilerOn, onOpen: openTrophy, onToggle: toggleEarned,
  });
  renderCollectiblesSummary(dom.collectiblesSummary, {
    collectibles: data.collectibles, trophies, earned: state.earned,
    onOpenView: () => { setView('collectibles'); renderAll(); },
  });
  renderRoadmapView(dom.roadmapView, {
    roadmap: data.roadmap, trophies, earned: state.earned, spoilerOn: state.spoilerOn,
    onOpen: openTrophy, onToggle: toggleEarned,
  });
  renderWatchlist(dom.roadmapWatchlist, {
    trophies, earned: state.earned, spoilerOn: state.spoilerOn, onOpen: openTrophy, onToggle: toggleEarned,
    heading: 'Missables watchlist',
  });
  renderCollectiblesView(dom.collectiblesView, {
    collectibles: data.collectibles, trophies, earned: state.earned, onOpen: openTrophy,
  });

  dom.spoilerButton.textContent = `Spoilers: ${state.spoilerOn ? 'ON' : 'OFF'}`;
  dom.spoilerButton.setAttribute('aria-pressed', String(state.spoilerOn));
}

for (const tab of document.querySelectorAll('.tab')) {
  tab.addEventListener('click', () => { setView(tab.dataset.view); renderAll(); });
}
dom.search.addEventListener('input', () => { state.search = dom.search.value; renderAll(); });

document.getElementById('btn-export').addEventListener('click', () => {
  exportProgress(state.earned);
  showToast('Progress exported as JSON');
});
document.getElementById('file-import').addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    state.earned = await importProgress(file, names);
    saveEarned(state.earned);
    renderAll();
    showToast(`Imported ${state.earned.size} earned trophies`);
  } catch (error) {
    showToast(`Import failed: ${error.message}`);
  }
  event.target.value = '';
});
dom.spoilerButton.addEventListener('click', () => {
  state.spoilerOn = !state.spoilerOn;
  saveSpoiler(state.spoilerOn);
  renderAll();
});
document.getElementById('btn-reset').addEventListener('click', () => {
  clearProgress();
  state.earned = new Set();
  renderAll();
  showToast('Saved progress cleared');
});

renderAll();
