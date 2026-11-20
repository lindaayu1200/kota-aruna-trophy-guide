// Roadmap rail, missables watchlist and the full numbered platinum route.
import { esc, mini, gradeBadge } from './util.js';
import { visibleName } from './spoiler.js';

export function renderRoadmapSummary(host, options) {
  const { roadmap, trophies, earned, onStage, onOpenView } = options;
  const counts = new Map();
  for (const trophy of trophies) counts.set(trophy.roadmap_stage, (counts.get(trophy.roadmap_stage) ?? 0) + 1);
  const totalHours = roadmap.stages.reduce((sum, s) => sum + s.est_hours, 0);

  host.innerHTML = `<h3>Roadmap to platinum <span>~${totalHours} h</span></h3>
    <ul class="rail-list">${roadmap.stages.map((stage) => {
      const done = stage.trophies.filter((id) => earned.has(trophies.find((t) => t.id === id)?.name)).length;
      return `<li><button type="button" data-stage="${esc(stage.stage)}">${esc(stage.stage)}</button>
        <span class="rail-num">${done}/${stage.trophies.length} · ${stage.est_hours}h</span></li>`;
    }).join('')}</ul>
    <p class="rail-note">${esc(roadmap.intro)}</p>
    <button class="rel-btn" type="button" data-open-roadmap style="margin-top:8px">Open full numbered route →</button>`;

  for (const button of host.querySelectorAll('[data-stage]')) {
    button.addEventListener('click', () => onStage(button.dataset.stage));
  }
  host.querySelector('[data-open-roadmap]').addEventListener('click', onOpenView);
}

export function renderWatchlist(host, options) {
  const { trophies, earned, spoilerOn, onOpen, onToggle, heading = 'Missables watchlist' } = options;
  const pending = trophies.filter((t) => t.missable && !earned.has(t.name));
  host.innerHTML = `<h3>${esc(heading)} <span>${pending.length} left</span></h3>
    ${pending.length ? `<ul class="rail-list">${pending.map((t) => `<li>
      <button type="button" data-open="${esc(t.name)}">${esc(visibleName(t, earned, spoilerOn))}</button>
      ${mini(t.roadmap_stage, 'm-time')}
      <input type="checkbox" data-toggle="${esc(t.name)}" title="Mark as earned" ${earned.has(t.name) ? 'checked' : ''}>
    </li>`).join('')}</ul>` : '<p class="rail-note">Every missable trophy is ticked. Nice work.</p>'}
    <p class="rail-note">A missable is locked when its chapter or partner window ends. Check these before the finale.</p>`;

  for (const button of host.querySelectorAll('[data-open]')) {
    button.addEventListener('click', () => onOpen(button.dataset.open));
  }
  for (const box of host.querySelectorAll('[data-toggle]')) {
    box.addEventListener('change', () => onToggle(box.dataset.toggle));
  }
}

export function renderRoadmapView(host, options) {
  const { roadmap, trophies, earned, spoilerOn, onOpen, onToggle } = options;
  const byId = new Map(trophies.map((t) => [t.id, t]));
  let number = 0;
  const stages = roadmap.stages.map((stage) => {
    const warnings = stage.missable_warnings.map((w) => `<div class="stage-warn">! ${esc(w)}</div>`).join('');
    const rows = stage.trophies.map((id) => {
      const trophy = byId.get(id);
      if (!trophy) return '';
      number += 1;
      const done = earned.has(trophy.name);
      return `<div class="route-row">
        <span class="num">${String(number).padStart(2, '0')}</span>
        <button class="rel-btn rn" type="button" data-open="${esc(trophy.name)}" style="border:0;background:none;padding:0;text-align:left">${esc(visibleName(trophy, earned, spoilerOn))}</button>
        ${gradeBadge(trophy.grade)}
        <span class="rmiss">${trophy.missable ? 'MISSABLE' : ''}</span>
        <input type="checkbox" data-toggle="${esc(trophy.name)}" aria-label="Mark ${esc(visibleName(trophy, earned, spoilerOn))} earned" ${done ? 'checked' : ''}>
      </div>`;
    }).join('');
    return `<div class="route-stage">
      <div class="stage-bar"><strong>${esc(stage.stage)}</strong><span class="goal">${esc(stage.goal)}</span><span class="hours">~${stage.est_hours} h · ${stage.trophies.length} trophies</span></div>
      ${warnings}${rows}
    </div>`;
  }).join('');

  host.innerHTML = `<div class="view-intro">
    <h2>Roadmap to the platinum</h2>
    <p>${esc(roadmap.intro)} The route is missable-safe: clear each chapter block before its window closes. Tick a row here and the ledger updates too.</p>
  </div>${stages}
  <div class="view-intro" style="border-bottom:0;border-top:1px solid var(--line)">
    <p>Route compiled from the official descriptions and community trackers: ${roadmap.sources.map((s) => esc(s.name)).join(' · ')}.</p>
  </div>`;

  for (const button of host.querySelectorAll('[data-open]')) {
    button.addEventListener('click', () => onOpen(button.dataset.open));
  }
  for (const box of host.querySelectorAll('[data-toggle]')) {
    box.addEventListener('change', () => onToggle(box.dataset.toggle));
  }
}
