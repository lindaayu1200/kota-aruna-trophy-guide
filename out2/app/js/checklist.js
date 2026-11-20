// Left-pane checklist: groups trophies by roadmap stage and renders each row.
import { esc, mini, gradeBadge } from './util.js';
import { visibleName, visibleDescription } from './spoiler.js';

export const STAGE_ORDER = [
  'Prologue', 'Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4',
  'Finale', 'Misc & Activities', 'Endgame',
];

function rowMarkup(trophy, earned, spoilerOn, selected) {
  const name = visibleName(trophy, earned, spoilerOn);
  const description = visibleDescription(trophy, earned, spoilerOn);
  const done = earned.has(trophy.name);
  const flags = [
    trophy.missable ? mini('MISSABLE', 'm-miss') : '',
    trophy.hidden ? mini('HIDDEN', 'm-hidden') : '',
  ].join('');
  return `<div class="trophy-row${selected ? ' is-selected' : ''}${done ? ' is-earned' : ''}" data-name="${esc(trophy.name)}">
    <input type="checkbox" ${done ? 'checked' : ''} aria-label="Mark ${esc(name)} earned">
    <div class="row-body">
      <div class="row-name">${esc(name)}</div>
      <div class="row-desc">${esc(description)}</div>
      <div class="row-tags">${flags}</div>
    </div>
    <div class="row-side">
      ${gradeBadge(trophy.grade)}
      ${mini(`D${trophy.difficulty}`, 'm-diff')}
      ${mini(trophy.est_time, 'm-time')}
    </div>
  </div>`;
}

export function renderChecklist(host, options) {
  const { trophies, earned, spoilerOn, selected, onToggle, onSelect } = options;
  const previousScroll = host.scrollTop;
  const groups = new Map();
  for (const trophy of trophies) {
    if (!groups.has(trophy.roadmap_stage)) groups.set(trophy.roadmap_stage, []);
    groups.get(trophy.roadmap_stage).push(trophy);
  }

  let html = '';
  if (!trophies.length) {
    html = '<div class="empty">Nothing matches this filter. Try All or clear the search.</div>';
  } else {
    for (const stage of STAGE_ORDER) {
      const rows = groups.get(stage);
      if (!rows?.length) continue;
      html += `<div class="stage-head"><strong>${esc(stage)}</strong><span>${rows.length} trophy${rows.length === 1 ? '' : 'ies'}</span></div>`;
      html += rows.map((trophy) => rowMarkup(trophy, earned, spoilerOn, selected === trophy.name)).join('');
    }
  }
  host.innerHTML = html;
  host.scrollTop = previousScroll;

  for (const row of host.querySelectorAll('.trophy-row')) {
    const name = row.dataset.name;
    row.querySelector('input').addEventListener('change', () => onToggle(name));
    row.querySelector('.row-body').addEventListener('click', () => onSelect(name));
  }
}
