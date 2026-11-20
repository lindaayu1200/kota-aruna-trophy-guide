// Collectibles: compact rail summary and the full tables with counts and in-game labels.
import { esc, countLabel } from './util.js';

function statusFor(trophies, earned, entry) {
  return entry.trophies.every((name) => earned.has(name)) ? 'Earned' : 'Pending';
}

export function renderCollectiblesSummary(host, options) {
  const { collectibles, trophies, earned, onOpenView } = options;
  const earnedCount = collectibles.filter((c) => statusFor(trophies, earned, c) === 'Earned').length;
  host.innerHTML = `<h3>Collectibles tables <span>${earnedCount}/${collectibles.length} done</span></h3>
    <ul class="rail-list">${collectibles.slice(0, 6).map((c) => `<li>
      <span>${esc(c.type)}</span><span class="rail-num">${countLabel(c.required)}</span>
    </li>`).join('')}</ul>
    <button class="rel-btn" type="button" data-open-collectibles style="margin-top:8px">View all ${collectibles.length} tables →</button>`;
  host.querySelector('[data-open-collectibles]').addEventListener('click', onOpenView);
}

export function renderCollectiblesView(host, options) {
  const { collectibles, trophies, earned, onOpen } = options;
  const rows = collectibles.map((entry) => {
    const status = statusFor(trophies, earned, entry);
    const links = entry.trophies.map((name) =>
      `<button class="rel-btn" type="button" data-open="${esc(name)}" style="padding:2px 6px;font-size:10px">${esc(name)}</button>`).join(' ');
    return `<tr>
      <td><strong>${esc(entry.type)}</strong></td>
      <td class="num">${countLabel(entry.required)}</td>
      <td>${esc(entry.in_game_name)}</td>
      <td>${links}</td>
      <td class="tiny">${esc(entry.note)}</td>
      <td class="tiny">[${esc(entry.source)}]</td>
      <td class="${status === 'Earned' ? 'status-yes' : 'status-no'}">${status}</td>
    </tr>`;
  }).join('');

  host.innerHTML = `<div class="view-intro">
    <h2>Collectibles &amp; counts</h2>
    <p>Every count PlayStation tracks, the label the game uses for it, and the trophy it feeds. Cite chips name the community tracker the count is drawn from.</p>
  </div>
  <table class="table">
    <thead><tr><th>Collectible type</th><th>Required</th><th>In-game name</th><th>Trophy</th><th>How a count advances</th><th>Source</th><th>Status</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;

  for (const button of host.querySelectorAll('[data-open]')) {
    button.addEventListener('click', () => onOpen(button.dataset.open));
  }
}
